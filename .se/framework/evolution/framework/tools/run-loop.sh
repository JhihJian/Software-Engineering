#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PROMPT_FILE="${PROMPT_FILE:-$ROOT_DIR/se.evolution/framework/prompts/improvement-run.prompt.md}"
RUNS_DIR="${RUNS_DIR:-$ROOT_DIR/se.evolution/project/runs/inner}"
ROUNDS="${1:-1}"

if ! command -v codex >/dev/null 2>&1; then
  echo "ERROR: codex command not found" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq command not found" >&2
  exit 1
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "ERROR: prompt file not found: $PROMPT_FILE" >&2
  exit 1
fi

if ! [[ "$ROUNDS" =~ ^[0-9]+$ ]] || [[ "$ROUNDS" -lt 1 ]]; then
  echo "ERROR: rounds must be a positive integer" >&2
  exit 1
fi

RUN_ID="$(date '+%Y%m%d-%H%M%S')"
RUN_DIR="$RUNS_DIR/$RUN_ID"
mkdir -p "$RUN_DIR"

echo "Improvement loop run: $RUN_ID"
echo "Root: $ROOT_DIR"
echo "Prompt: $PROMPT_FILE"
echo "Rounds: $ROUNDS"
echo "Logs: $RUN_DIR"
echo

for round in $(seq 1 "$ROUNDS"); do
  ROUND_ID="$(printf 'round-%03d' "$round")"
  LOG_FILE="$RUN_DIR/$ROUND_ID.log"
  FINAL_FILE="$RUN_DIR/$ROUND_ID.final.md"
  STATUS_FILE="$RUN_DIR/$ROUND_ID.status.json"

  echo "==> Starting $ROUND_ID"

  IMPROVEMENT_STATUS_FILE="$STATUS_FILE" codex --ask-for-approval never exec \
    --cd "$ROOT_DIR" \
    --sandbox danger-full-access \
    --output-last-message "$FINAL_FILE" \
    < "$PROMPT_FILE" \
    > "$LOG_FILE" 2>&1

  echo "==> Finished $ROUND_ID"
  echo "    log:   $LOG_FILE"
  echo "    final: $FINAL_FILE"
  echo "    status: $STATUS_FILE"

  if [[ ! -f "$STATUS_FILE" ]]; then
    echo "ERROR: status file was not written: $STATUS_FILE" >&2
    exit 1
  fi

  RESULT="$(jq -r '.result // empty' "$STATUS_FILE")"
  REASON="$(jq -r '.reason // ""' "$STATUS_FILE")"

  case "$RESULT" in
    continue)
      echo "==> Status: continue"
      ;;
    needs_guidance|pause|blocked|failed|done)
      echo "==> Status: $RESULT"
      if [[ -n "$REASON" ]]; then
        echo "    reason: $REASON"
      fi
      break
      ;;
    *)
      echo "ERROR: invalid status result '$RESULT' in $STATUS_FILE" >&2
      exit 1
      ;;
  esac

  echo
done

echo "Improvement loop run finished: $RUN_ID"

