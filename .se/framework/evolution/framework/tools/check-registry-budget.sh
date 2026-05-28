#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${1:-se.evolution/project/registry/PROBLEM_REGISTRY.md}"

MAX_TOTAL_LINES="${MAX_TOTAL_LINES:-200}"
MAX_TOTAL_BYTES="${MAX_TOTAL_BYTES:-35000}"
MAX_SECTION_LINES="${MAX_SECTION_LINES:-40}"
MAX_RESOLVED_ROWS="${MAX_RESOLVED_ROWS:-10}"
MAX_VERIFICATION_ROWS="${MAX_VERIFICATION_ROWS:-8}"
MAX_ARCHIVE_ROWS="${MAX_ARCHIVE_ROWS:-10}"
MAX_CHANGE_ROWS="${MAX_CHANGE_ROWS:-8}"

FAILED=0

fail() {
  echo "FAIL: $*"
  FAILED=1
}

section_lines() {
  local file="$1"
  local section="$2"

  awk -v section="$section" '
    $0 == section {in_section=1; next}
    in_section && /^## / {exit}
    in_section {count++}
    END {print count+0}
  ' "$file"
}

table_rows() {
  local file="$1"
  local section="$2"

  awk -v section="$section" '
    $0 == section {in_section=1; next}
    in_section && /^## / {exit}
    in_section && /^\|/ && $0 !~ /^\|[- |]+\|$/ && $0 !~ /^\| *[^|]+ *\| *[^|]+ *\|/ {next}
    in_section && /^\|/ && $0 !~ /^\|[- |]+\|$/ {rows++}
    END {print rows+0}
  ' "$file"
}

require_text() {
  local text="$1"
  if ! grep -Fq "$text" "$REGISTRY"; then
    fail "missing required text: $text"
  fi
}

check_section_budget() {
  local section="$1"
  local max="$2"
  local lines
  lines="$(section_lines "$REGISTRY" "$section")"

  if [ "$lines" -gt "$max" ]; then
    fail "$section has $lines lines, max is $max; move history to archive/evidence"
  fi
}

check_table_rows() {
  local section="$1"
  local max="$2"
  local rows
  rows="$(table_rows "$REGISTRY" "$section")"

  if [ "$rows" -gt "$max" ]; then
    fail "$section has $rows table rows, max is $max; keep only current/recent rows"
  fi
}

if [ ! -f "$REGISTRY" ]; then
  fail "registry not found: $REGISTRY"
  exit "$FAILED"
fi

total_lines="$(wc -l < "$REGISTRY")"
total_bytes="$(wc -c < "$REGISTRY")"

[ "$total_lines" -le "$MAX_TOTAL_LINES" ] || fail "total lines $total_lines > $MAX_TOTAL_LINES"
[ "$total_bytes" -le "$MAX_TOTAL_BYTES" ] || fail "total bytes $total_bytes > $MAX_TOTAL_BYTES"

require_text "## 运行上下文"
require_text "## 当前待处理问题"
require_text "## 最近验证摘要"
require_text "## 归档索引"
require_text "当前全局状态"
require_text "当前阻塞条件"
require_text "下一轮优先处理"
require_text "下一个新问题 ID"
require_text "se.evolution/project/archive/"
require_text "se.evolution/project/evidence/"

check_section_budget "## 本轮已解决问题" "$MAX_SECTION_LINES"
check_section_budget "## 最近验证摘要" "$MAX_SECTION_LINES"
check_section_budget "## 归档索引" "$MAX_SECTION_LINES"
check_section_budget "## 最近变更" "$MAX_SECTION_LINES"

check_table_rows "## 本轮已解决问题" "$MAX_RESOLVED_ROWS"
check_table_rows "## 最近验证摘要" "$MAX_VERIFICATION_ROWS"
check_table_rows "## 归档索引" "$MAX_ARCHIVE_ROWS"
check_table_rows "## 最近变更" "$MAX_CHANGE_ROWS"

if [ "$FAILED" -eq 0 ]; then
  echo "OK: registry budget check passed ($total_lines lines, $total_bytes bytes)"
else
  echo "Registry budget check failed. Compress PROBLEM_REGISTRY.md before continuing."
fi

exit "$FAILED"

