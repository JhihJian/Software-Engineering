# Guidance Policy

仅当 `next_action=continue` 且 `result=needs_guidance` 时读取本文档。

## Scope

外层运行指引用于解决内层调度卡住但不需要真实用户决策的情况。外层不得实现业务、不得修改测试、不得替代内层验证结论。

允许写入：

- `se.evolution/project/operator-guidance/*.md`
- 必要时更新操作员文档或持续改进规则文档

禁止写入：

- `src/**`
- `tests/**`
- 内层运行日志
- 无正式 decision 支撑的产品、架构或测试口径

## Required Reading

- `se.evolution/project/runs/operator/{RUN_ID}/supervisor.status.json`
- `se.evolution/project/runs/operator/{RUN_ID}/summary.md`
- 对应 `se.evolution/project/runs/inner/{RUN_ID}/round-XXX.final.md`
- 必要时读取失败证据摘要，如 `test-results/api-results.json`

## Guidance Format

写入：

```text
se.evolution/project/operator-guidance/{RUN_ID}-{slug}.md
```

内容必须包含：

- 触发原因
- 阻塞类型 `blocker_kind`
- 两轮对比
- 外层指引
- 下一轮内层执行要求

## Loop Instruction

写入指引后回到外层循环顶部，由下一轮 supervisor 重新运行内层。

