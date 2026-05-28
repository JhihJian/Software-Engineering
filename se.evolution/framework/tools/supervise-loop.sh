#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ROUNDS="10"
STALL_TIMEOUT="3600"
CHECK_INTERVAL="30"
QUIET="0"
TAIL_ON_ERROR="0"
EXPANDED_SCAN_DECISION_THRESHOLD="${EXPANDED_SCAN_DECISION_THRESHOLD:-5}"
OPERATOR_RUNS_DIR="${OPERATOR_RUNS_DIR:-$ROOT_DIR/se.evolution/project/runs/operator}"
RUNS_DIR="${RUNS_DIR:-$ROOT_DIR/se.evolution/project/runs/inner}"

usage() {
  cat <<'EOF'
Usage: se.evolution/framework/tools/supervise-loop.sh [options]

Options:
  --rounds N             Rounds passed to run-improvement-loop.sh (default: 10)
  --stall-timeout SEC    Mark stalled when runner log/status is unchanged for SEC (default: 3600)
  --check-interval SEC   Internal monitor interval (default: 30)
  --expanded-scan-decision-threshold N
                         Return next_action=decide after N consecutive expanded scans
                         without new high/medium issues (default: 5; env:
                         EXPANDED_SCAN_DECISION_THRESHOLD)
  --quiet                Print only start and final summary
  --tail-on-error        Print last 80 lines of runner log when result is failed/blocked/stalled
  -h, --help             Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --rounds)
      ROUNDS="${2:-}"
      shift 2
      ;;
    --stall-timeout)
      STALL_TIMEOUT="${2:-}"
      shift 2
      ;;
    --check-interval)
      CHECK_INTERVAL="${2:-}"
      shift 2
      ;;
    --expanded-scan-decision-threshold)
      EXPANDED_SCAN_DECISION_THRESHOLD="${2:-}"
      shift 2
      ;;
    --quiet)
      QUIET="1"
      shift
      ;;
    --tail-on-error)
      TAIL_ON_ERROR="1"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

for value_name in ROUNDS STALL_TIMEOUT CHECK_INTERVAL EXPANDED_SCAN_DECISION_THRESHOLD; do
  value="${!value_name}"
  if ! [[ "$value" =~ ^[0-9]+$ ]] || [[ "$value" -lt 1 ]]; then
    echo "ERROR: $value_name must be a positive integer" >&2
    exit 2
  fi
done

if [[ ! -x "$ROOT_DIR/se.evolution/framework/tools/run-loop.sh" ]]; then
  echo "ERROR: runner script is not executable: $ROOT_DIR/se.evolution/framework/tools/run-loop.sh" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq command not found" >&2
  exit 1
fi

mkdir -p "$OPERATOR_RUNS_DIR"
OPERATOR_RUN_ID="$(date '+%Y%m%d-%H%M%S')"
OPERATOR_RUN_DIR="$OPERATOR_RUNS_DIR/$OPERATOR_RUN_ID"
mkdir -p "$OPERATOR_RUN_DIR"

RUNNER_LOG="$OPERATOR_RUN_DIR/runner.log"
SUPERVISOR_STATUS="$OPERATOR_RUN_DIR/supervisor.status.json"
SUMMARY_FILE="$OPERATOR_RUN_DIR/summary.md"
START_EPOCH="$(date +%s)"

log_info() {
  if [[ "$QUIET" != "1" ]]; then
    echo "$@"
  fi
}

latest_run_dir() {
  find "$RUNS_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' 2>/dev/null \
    | sort -nr \
    | awk 'NR==1 {print $2}'
}

latest_round_file() {
  local run_dir="$1"
  local suffix="$2"
  [[ -n "$run_dir" ]] || return 0
  find "$run_dir" -maxdepth 1 -type f -name "round-*.$suffix" -printf '%f\n' 2>/dev/null \
    | sort \
    | tail -1
}

latest_round_artifact() {
  local run_dir="$1"
  [[ -n "$run_dir" ]] || return 0
  find "$run_dir" -maxdepth 1 -type f \( -name "round-*.log" -o -name "round-*.status.json" -o -name "round-*.final.md" \) -printf '%f\n' 2>/dev/null \
    | sed -E 's/\.(log|final\.md|status\.json)$//' \
    | sort \
    | tail -1
}

latest_activity_epoch() {
  local newest="$START_EPOCH"
  local file
  for file in "$RUNNER_LOG" "$RUN_DIR_CURRENT"/round-*.log "$RUN_DIR_CURRENT"/round-*.status.json "$RUN_DIR_CURRENT"/round-*.final.md; do
    if [[ -e "$file" ]]; then
      local mtime
      mtime="$(stat -c %Y "$file" 2>/dev/null || echo "$START_EPOCH")"
      if [[ "$mtime" -gt "$newest" ]]; then
        newest="$mtime"
      fi
    fi
  done
  echo "$newest"
}

all_round_status_files() {
  find "$RUNS_DIR" -mindepth 2 -maxdepth 2 -type f -name "round-*.status.json" -printf '%p\n' 2>/dev/null \
    | sort
}

is_expanded_scan_no_new_status() {
  local status_file="$1"
  [[ -f "$status_file" ]] || return 1

  local status_result status_action status_reason
  status_result="$(jq -r '.result // ""' "$status_file" 2>/dev/null || echo "")"
  status_action="$(jq -r '.next_action // ""' "$status_file" 2>/dev/null || echo "")"
  status_reason="$(jq -r '.reason // ""' "$status_file" 2>/dev/null || echo "")"

  [[ "$status_result" == "continue" && "$status_action" == "continue" ]] || return 1

  if [[ "$status_reason" == *"高/中优先级清空"* && "$status_reason" == *"扩大扫描"* ]]; then
    return 0
  fi

  if [[ "$status_reason" == *"扩大扫描"* ]] && {
    [[ "$status_reason" == *"未发现新的高/中"* ]] ||
    [[ "$status_reason" == *"未发现新增高/中"* ]] ||
    [[ "$status_reason" == *"未发现新的高优先级"* ]] ||
    [[ "$status_reason" == *"未发现新增高优先级"* ]]
  }; then
    return 0
  fi

  return 1
}

expanded_scan_no_new_streak() {
  local count="0"
  local status_file
  while IFS= read -r status_file; do
    if is_expanded_scan_no_new_status "$status_file"; then
      count="$((count + 1))"
    else
      count="0"
    fi
  done < <(all_round_status_files)
  echo "$count"
}

json_string() {
  jq -Rn --arg value "$1" '$value'
}

write_status() {
  local result="$1"
  local reason="$2"
  local run_dir="$3"
  local round_id="$4"
  local status_file="$5"
  local handled_json="$6"
  local next="$7"
  local stalled="$8"
  local exit_code="$9"
  local next_action="${10}"
  local issue_id="${11}"
  local elapsed
  elapsed="$(( $(date +%s) - START_EPOCH ))"

  jq -n \
    --arg result "$result" \
    --arg reason "$reason" \
    --arg operator_run_dir "$OPERATOR_RUN_DIR" \
    --arg run_dir "$run_dir" \
    --arg last_round "$round_id" \
    --arg status_file "$status_file" \
    --arg next "$next" \
    --arg next_action "$next_action" \
    --arg issue_id "$issue_id" \
    --argjson handled "$handled_json" \
    --argjson stall "$stalled" \
    --argjson elapsed "$elapsed" \
    --argjson exit_code "$exit_code" \
    '{
      next_action: $next_action,
      issue_id: $issue_id,
      result: $result,
      reason: $reason,
      operator_run_dir: $operator_run_dir,
      run_dir: $run_dir,
      last_round: $last_round,
      status_file: $status_file,
      handled: $handled,
      next: $next,
      stall: $stall,
      elapsed_seconds: $elapsed,
      runner_exit_code: $exit_code
    }' > "$SUPERVISOR_STATUS"
}

write_summary() {
  local result="$1"
  local reason="$2"
  local run_dir="$3"
  local round_id="$4"
  local status_file="$5"
  local handled="$6"
  local next="$7"
  local stalled="$8"
  local elapsed="$9"
  local next_action="${10}"
  local issue_id="${11}"
  cat > "$SUMMARY_FILE" <<EOF
# Improvement Supervisor Summary

- operator_run_dir: \`$OPERATOR_RUN_DIR\`
- next_action: \`$next_action\`
- issue_id: \`${issue_id:-}\`
- result: \`$result\`
- reason: $reason
- run_dir: \`${run_dir:-}\`
- last_round: \`${round_id:-}\`
- status_file: \`${status_file:-}\`
- handled: $handled
- next: $next
- stalled: \`$stalled\`
- elapsed_seconds: \`$elapsed\`
- runner_log: \`$RUNNER_LOG\`
EOF
}

echo "Improvement supervisor run: $OPERATOR_RUN_ID"
echo "Operator logs: $OPERATOR_RUN_DIR"
echo "Rounds: $ROUNDS"
echo "Stall timeout: ${STALL_TIMEOUT}s"

if [[ "$EXPANDED_SCAN_DECISION_THRESHOLD" -gt 0 ]]; then
  PRE_RUN_EXPANDED_SCAN_STREAK="$(expanded_scan_no_new_streak)"
  if [[ "$PRE_RUN_EXPANDED_SCAN_STREAK" -ge "$EXPANDED_SCAN_DECISION_THRESHOLD" ]]; then
    RUN_DIR_CURRENT="$(latest_run_dir)"
    ROUND_ID=""
    ROUND_STATUS_FILE=""
    if [[ -n "$RUN_DIR_CURRENT" ]]; then
      ROUND_ID="$(latest_round_artifact "$RUN_DIR_CURRENT")"
      if [[ -n "$ROUND_ID" && -f "$RUN_DIR_CURRENT/$ROUND_ID.status.json" ]]; then
        ROUND_STATUS_FILE="$RUN_DIR_CURRENT/$ROUND_ID.status.json"
      else
        round_status_name="$(latest_round_file "$RUN_DIR_CURRENT" "status.json")"
        if [[ -n "$round_status_name" ]]; then
          ROUND_ID="${round_status_name%.status.json}"
          ROUND_STATUS_FILE="$RUN_DIR_CURRENT/$round_status_name"
        fi
      fi
    fi

    RESULT="continue"
    REASON="supervisor detected ${PRE_RUN_EXPANDED_SCAN_STREAK} consecutive expanded-scan rounds with no new high/medium issues before starting a new runner batch (threshold=${EXPANDED_SCAN_DECISION_THRESHOLD}); routing to decide so the outer operator can stop or create a new task."
    HANDLED_JSON="[]"
    NEXT="外层选择停止改进循环，或写入下一阶段/新任务指引后继续"
    NEXT_ACTION="decide"
    ISSUE_ID="EXPANDED_SCAN_STREAK"
    elapsed="$(( $(date +%s) - START_EPOCH ))"

    write_status "$RESULT" "$REASON" "${RUN_DIR_CURRENT:-}" "$ROUND_ID" "$ROUND_STATUS_FILE" "$HANDLED_JSON" "$NEXT" "0" "0" "$NEXT_ACTION" "$ISSUE_ID"
    handled_text="$(jq -r '.handled | join(", ")' "$SUPERVISOR_STATUS")"
    write_summary "$RESULT" "$REASON" "${RUN_DIR_CURRENT:-}" "$ROUND_ID" "$ROUND_STATUS_FILE" "$handled_text" "$NEXT" "0" "$elapsed" "$NEXT_ACTION" "$ISSUE_ID"

    echo "SUPERVISOR_NEXT_ACTION=$NEXT_ACTION"
    echo "SUPERVISOR_ISSUE_ID=$ISSUE_ID"
    echo "SUPERVISOR_RESULT=$RESULT"
    echo "SUPERVISOR_REASON=$REASON"
    echo "OPERATOR_RUN_DIR=$OPERATOR_RUN_DIR"
    echo "RUN_DIR=${RUN_DIR_CURRENT:-}"
    echo "LAST_ROUND=$ROUND_ID"
    echo "STATUS_FILE=$ROUND_STATUS_FILE"
    echo "HANDLED=$handled_text"
    echo "NEXT=$NEXT"
    echo "STALLED=0"
    echo "ELAPSED_SECONDS=$elapsed"
    exit 0
  fi
fi

set +e
"$ROOT_DIR/se.evolution/framework/tools/run-loop.sh" "$ROUNDS" > "$RUNNER_LOG" 2>&1 &
RUNNER_PID="$!"
set -e

RUN_DIR_CURRENT=""
STALLED="0"
KILLED="0"
while kill -0 "$RUNNER_PID" 2>/dev/null; do
  RUN_DIR_CURRENT="$(latest_run_dir)"
  activity="$(latest_activity_epoch)"
  now="$(date +%s)"
  idle="$(( now - activity ))"
  if [[ "$idle" -ge "$STALL_TIMEOUT" ]]; then
    STALLED="1"
    KILLED="1"
    kill "$RUNNER_PID" 2>/dev/null || true
    sleep 2
    if kill -0 "$RUNNER_PID" 2>/dev/null; then
      kill -9 "$RUNNER_PID" 2>/dev/null || true
    fi
    break
  fi
  sleep "$CHECK_INTERVAL"
done

set +e
wait "$RUNNER_PID"
RUNNER_EXIT="$?"
set -e

RUN_DIR_CURRENT="$(latest_run_dir)"
ROUND_STATUS_FILE=""
ROUND_FINAL_FILE=""
ROUND_ID=""
RESULT="failed"
REASON=""
HANDLED_JSON="[]"
NEXT=""
NEXT_ACTION="stop"
ISSUE_ID=""

if [[ -n "$RUN_DIR_CURRENT" ]]; then
  latest_round_id="$(latest_round_artifact "$RUN_DIR_CURRENT")"
  round_status_name="$(latest_round_file "$RUN_DIR_CURRENT" "status.json")"
  round_final_name="$(latest_round_file "$RUN_DIR_CURRENT" "final.md")"
  if [[ -n "$latest_round_id" ]]; then
    ROUND_ID="$latest_round_id"
    if [[ -f "$RUN_DIR_CURRENT/$ROUND_ID.status.json" ]]; then
      ROUND_STATUS_FILE="$RUN_DIR_CURRENT/$ROUND_ID.status.json"
    fi
    if [[ -f "$RUN_DIR_CURRENT/$ROUND_ID.final.md" ]]; then
      ROUND_FINAL_FILE="$RUN_DIR_CURRENT/$ROUND_ID.final.md"
    fi
  elif [[ -n "$round_status_name" ]]; then
    ROUND_ID="${round_status_name%.status.json}"
    ROUND_STATUS_FILE="$RUN_DIR_CURRENT/$round_status_name"
  elif [[ -n "$round_final_name" ]]; then
    ROUND_ID="${round_final_name%.final.md}"
    ROUND_FINAL_FILE="$RUN_DIR_CURRENT/$round_final_name"
  fi
fi

if [[ "$STALLED" == "1" ]]; then
  RESULT="stalled"
  REASON="no runner log/status/final activity for ${STALL_TIMEOUT} seconds"
  NEXT="inspect runner log and process tree"
  NEXT_ACTION="stop"
elif [[ "$RUNNER_EXIT" -ne 0 && -n "$ROUND_ID" && -z "$ROUND_STATUS_FILE" ]]; then
  RESULT="failed"
  REASON="runner exited with code $RUNNER_EXIT before $ROUND_ID wrote a status file"
  NEXT="inspect $ROUND_ID log"
  NEXT_ACTION="stop"
elif [[ -n "$ROUND_STATUS_FILE" && -f "$ROUND_STATUS_FILE" ]]; then
  RESULT="$(jq -r '.result // "failed"' "$ROUND_STATUS_FILE")"
  REASON="$(jq -r '.reason // ""' "$ROUND_STATUS_FILE")"
  HANDLED_JSON="$(jq -c '.handled // []' "$ROUND_STATUS_FILE")"
  NEXT="$(jq -r '.next // ""' "$ROUND_STATUS_FILE")"
  NEXT_ACTION="$(jq -r '.next_action // ""' "$ROUND_STATUS_FILE")"
  ISSUE_ID="$(jq -r '.issue_id // ""' "$ROUND_STATUS_FILE")"
  case "$NEXT_ACTION" in
    continue|decide|stop) ;;
    *)
      REASON="${REASON:+$REASON; }invalid or missing next_action in round status file"
      NEXT_ACTION="stop"
      ;;
  esac
elif [[ "$RUNNER_EXIT" -ne 0 ]]; then
  RESULT="failed"
  REASON="runner exited with code $RUNNER_EXIT before writing a status file"
  NEXT="inspect runner log"
  NEXT_ACTION="stop"
else
  RESULT="failed"
  REASON="runner finished without a status file"
  NEXT="inspect runner log"
  NEXT_ACTION="stop"
fi

if [[ "$RUNNER_EXIT" -ne 0 && "$RESULT" != "stalled" ]]; then
  RESULT="failed"
  if [[ -z "$REASON" ]]; then
    REASON="runner exited with code $RUNNER_EXIT"
  fi
  NEXT_ACTION="stop"
fi

if [[ "$NEXT_ACTION" == "continue" && "$RESULT" == "continue" && "$EXPANDED_SCAN_DECISION_THRESHOLD" -gt 0 ]]; then
  EXPANDED_SCAN_STREAK="$(expanded_scan_no_new_streak)"
  if [[ "$EXPANDED_SCAN_STREAK" -ge "$EXPANDED_SCAN_DECISION_THRESHOLD" ]]; then
    NEXT_ACTION="decide"
    ISSUE_ID="EXPANDED_SCAN_STREAK"
    NEXT="外层选择停止改进循环，或写入下一阶段/新任务指引后继续"
    REASON="${REASON:+$REASON; }supervisor detected ${EXPANDED_SCAN_STREAK} consecutive expanded-scan rounds with no new high/medium issues (threshold=${EXPANDED_SCAN_DECISION_THRESHOLD}); routing to decide so the outer operator can stop or create a new task."
  fi
fi

elapsed="$(( $(date +%s) - START_EPOCH ))"
write_status "$RESULT" "$REASON" "${RUN_DIR_CURRENT:-}" "$ROUND_ID" "$ROUND_STATUS_FILE" "$HANDLED_JSON" "$NEXT" "$STALLED" "$RUNNER_EXIT" "$NEXT_ACTION" "$ISSUE_ID"
handled_text="$(jq -r '.handled | join(", ")' "$SUPERVISOR_STATUS")"
write_summary "$RESULT" "$REASON" "${RUN_DIR_CURRENT:-}" "$ROUND_ID" "$ROUND_STATUS_FILE" "$handled_text" "$NEXT" "$STALLED" "$elapsed" "$NEXT_ACTION" "$ISSUE_ID"

echo "SUPERVISOR_NEXT_ACTION=$NEXT_ACTION"
echo "SUPERVISOR_ISSUE_ID=$ISSUE_ID"
echo "SUPERVISOR_RESULT=$RESULT"
echo "SUPERVISOR_REASON=$REASON"
echo "OPERATOR_RUN_DIR=$OPERATOR_RUN_DIR"
echo "RUN_DIR=${RUN_DIR_CURRENT:-}"
echo "LAST_ROUND=$ROUND_ID"
echo "STATUS_FILE=$ROUND_STATUS_FILE"
echo "HANDLED=$handled_text"
echo "NEXT=$NEXT"
echo "STALLED=$STALLED"
echo "ELAPSED_SECONDS=$elapsed"

if [[ "$TAIL_ON_ERROR" == "1" ]]; then
  case "$RESULT" in
    failed|blocked|stalled)
      echo
      echo "---- runner log tail ----"
      tail -80 "$RUNNER_LOG" || true
      ;;
  esac
fi

if [[ "$RESULT" == "failed" || "$RESULT" == "stalled" ]]; then
  exit 1
fi

