# Problem Registry

This registry is the only cross-round state source for the improvement loop.
Keep it short enough that a new agent can recover current state quickly.

## 运行上下文

- 当前全局状态: active
- 当前阻塞条件: none
- 下一轮优先处理:
- 下一个新问题 ID: SE-002
- 证据目录: `.se/project/evolution/evidence/`
- 归档目录: `.se/project/evolution/archive/`
- Legacy tool paths: `se.evolution/project/evidence/`, `se.evolution/project/archive/`

## 当前待处理问题

| ID | Type | Priority | Status | Summary | Evidence | Next |
|----|------|----------|--------|---------|----------|------|

## 本轮已解决问题

| ID | Result | Summary | Evidence |
|----|--------|---------|----------|
| SE-001 | resolved | Defined snapshot synchronization policy for `se.*` and `.se/framework/*`. | `.se/project/architecture/ARCHITECTURE.md`, `.se/project/architecture/source-map.md` |

## 最近验证摘要

| Time | Command | Result | Evidence |
|------|---------|--------|----------|
| 2026-05-28 | `npm run architecture:check` | Passed | Local command output |
| 2026-05-28 | `"C:\Program Files\Git\bin\bash.exe" se.evolution/framework/tools/check-registry-budget.sh .se/project/evolution/registry/PROBLEM_REGISTRY.md` | Passed with BOM warning | Local command output |

## 归档索引

| Item | Location |
|------|----------|
| SE-001 | Commit hash recorded in final run summary |

## 最近变更

| Time | Change | Scope |
|------|--------|-------|
| 2026-05-28 | Added framework snapshot synchronization policy. | architecture baseline, glossary, source map |
