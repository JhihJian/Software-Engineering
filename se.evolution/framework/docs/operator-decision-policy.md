# Decision Policy

仅当 `next_action=decide` 时读取本文档。

## Scope

只为架构、需求或产品口径问题写正式 decision。扩大扫描、验证失败、环境失败、归档失败和根因分析都不写 decision。

例外：当 supervisor 返回 `issue_id=EXPANDED_SCAN_STREAK` 时，`decide` 表示运行方向决策，不表示产品/架构口径待决。外层不得写 `se.evolution/project/decisions/*.md`；应在停止循环和写入下一阶段/新任务 `se.evolution/project/operator-guidance/*.md` 后继续之间选择。

## Required Reading

- `se.evolution/project/registry/PROBLEM_REGISTRY.md`
- 最新 `round-XXX.final.md`
- `ARCHITECTURE.md`
- 相关 `docs/modules/*.md`
- 相关需求规格说明书
- 必要时读取 `TEST_ARCHITECTURE.md` 和 `TEST.md`

## Decision Rules

- 与 `ARCHITECTURE.md` 总体设计一致。
- 符合业务流程、角色边界、安全、审计和权限最小化。
- 修改范围小、语义稳定、容易验证。
- 两个方案代价接近时，选更保守、更容易被后续 agent 正确执行的方案。

## File Format

使用 `se.evolution/framework/templates/decision.template.md` 创建：

```text
se.evolution/project/decisions/{问题ID}.md
```

正式 decision 必须满足：

- 只记录产品/架构口径，不写具体代码实现方案。
- 最后一节必须是 `## 是否正式决定`。
- 最后一节的值必须改为 `是`。

写入正式 decision 后回到外层循环顶部进入下一轮 supervisor；`next_action` 由内层在下一轮 STEP 0.1 恢复后重新裁决。若需要先同步架构/需求文档，读取 `se.evolution/framework/docs/document-sync-policy.md`。

## Expanded Scan Streak

当 `issue_id=EXPANDED_SCAN_STREAK`：

- 若外层选择停止：按 stop 报告格式向真实用户汇报停止原因、连续扫描轮数和最近 run 目录；不写 decision 文件。
- 若外层选择继续：写入 `se.evolution/project/operator-guidance/{RUN_ID}-expanded-scan-next-task.md`，明确下一阶段扫描目标、边界或新任务入口，然后回到外层循环顶部重新运行 supervisor。
- 不同步 `ARCHITECTURE.md`、`TEST_ARCHITECTURE.md` 或需求文档，除非另有正式产品/架构 decision。

