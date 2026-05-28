#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$TMP_DIR/se.evolution/framework/tools" "$TMP_DIR/se.evolution/project/runs/inner" "$TMP_DIR/runs"
cp "$REPO_ROOT/se.evolution/framework/tools/supervise-loop.sh" "$TMP_DIR/se.evolution/framework/tools/supervise-loop.sh"

cat > "$TMP_DIR/se.evolution/framework/tools/run-loop.sh" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail

RUN_ID="20260101-000000"
RUN_DIR="${RUNS_DIR:-$PWD/se.evolution/project/runs/inner}/$RUN_ID"
mkdir -p "$RUN_DIR"

echo "Improvement loop run: $RUN_ID"
echo "Logs: $RUN_DIR"
echo "==> Starting round-001"
cat > "$RUN_DIR/round-001.status.json" <<'JSON'
{"result":"continue","reason":"previous round requested continue","handled":["OLD"],"next_action":"continue","issue_id":""}
JSON
echo "==> Finished round-001"
echo "==> Status: continue"
echo "==> Starting round-002"
echo "ERROR: Reconnecting... 1/5" > "$RUN_DIR/round-002.log"
echo "ERROR: request timed out" >> "$RUN_DIR/round-002.log"
exit 1
STUB
chmod +x "$TMP_DIR/se.evolution/framework/tools/run-loop.sh"

set +e
OPERATOR_RUNS_DIR="$TMP_DIR/operator-runs" RUNS_DIR="$TMP_DIR/runs" \
  bash "$TMP_DIR/se.evolution/framework/tools/supervise-loop.sh" --rounds 2 --stall-timeout 60 --check-interval 1 --quiet \
  > "$TMP_DIR/supervisor.out" 2>&1
exit_code="$?"
set -e

if [[ "$exit_code" -eq 0 ]]; then
  echo "expected supervisor to exit non-zero for failed runner" >&2
  exit 1
fi

status_file="$(find "$TMP_DIR/operator-runs" -name supervisor.status.json -print -quit)"
if [[ -z "$status_file" ]]; then
  echo "missing supervisor.status.json" >&2
  exit 1
fi

last_round="$(jq -r '.last_round' "$status_file")"
reason="$(jq -r '.reason' "$status_file")"

if [[ "$last_round" != "round-002" ]]; then
  echo "expected last_round=round-002, got $last_round" >&2
  cat "$status_file" >&2
  exit 1
fi

if [[ "$reason" == "previous round requested continue" ]]; then
  echo "supervisor reused stale round status reason" >&2
  cat "$status_file" >&2
  exit 1
fi

if [[ "$reason" != *"runner exited with code 1 before round-002 wrote a status file"* ]]; then
  echo "unexpected reason: $reason" >&2
  cat "$status_file" >&2
  exit 1
fi

