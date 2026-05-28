# 质量框架维护说明

本文档用于维护和演化 `se.quality` 框架。它不是质量检查 Agent 每轮运行时的必读文档。

运行时规则位于：

- `framework/guides/workflow.md`
- `framework/guides/subtask.md`
- `framework/guides/project-config.md`
- `framework/guides/rules.md`
- `framework/guides/parallel.md`
- `framework/guides/reporting.md`

## 维护目标

`se.quality` 的维护目标是让质量检查保持：

1. 可迁移：跨项目能力放在 `framework/`。
2. 可适配：项目事实放在 `project/`。
3. 可并行：多个 Agent 可以同时检查不同规则领域。
4. 可追溯：每轮检查留下摘要、证据和历史产物。

## 目录职责

```text
framework/
  prompts/  # Agent 启动入口
  guides/   # Agent 运行时指南
  meta/     # 框架维护和演化说明
  tools/    # 可复用检查工具

project/
  project.config.md
  quality.config.json
  STATUS.md
  reports/
  evidence/
  history/
```

`meta/` 只放维护者文档，不放运行时必须遵守的规则。

## 扩展规则

- 当 `framework/tools/check.ts` 超过约 400 行，或规则数量超过 10 条时，再拆分 `rules/`。
- 当多个报告格式需要独立逻辑时，新增 `reporters/`。
- 当历史违规需要被容忍、同时阻断新增违规时，新增 `baseline/`。
- 当某类子 Agent 任务稳定复用时，在 `framework/prompts/` 中新增专用提示词。
- 当运行时规则变多时，优先扩展 `framework/guides/`，不要把运行规则写进 `meta/`。

## 修改边界

修改框架时保持两个边界：

1. 通用规则、运行协议和工具能力进入 `framework/`。
2. 项目事实、状态、阈值、例外和检查产物进入 `project/`。
