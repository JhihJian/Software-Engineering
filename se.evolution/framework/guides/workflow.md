# Evolution Workflow

本文件是持续改进 Agent 的运行入口。运行时按本文进入 `framework/prompts/loop.md`，普通循环不读取 `framework/meta/`。

## 主流程

1. 读取 `.se/project/evolution/registry/PROBLEM_REGISTRY.md`，恢复当前问题台账。
2. 检查工作区改动，区分用户已有改动、上轮遗留改动和本轮预计改动。
3. 如存在等待确认或 `[ARCH_ISSUE]`，读取对应 `.se/project/evolution/decisions/*.md`。
4. 如无待处理问题，扫描设计基准并追加新问题。
5. 选择本轮处理项，按写入范围拆分并行或串行任务。
6. 按 `framework/prompts/agent-dev.md` 调度开发任务。
7. 按 `framework/prompts/agent-verify.md` 调度验证任务。
8. 更新台账、归档证据和历史，并写入状态文件。
9. 按裁决表输出 `next_action`。

## 运行时权威

详细步骤、裁决表和状态写入规则以以下文件为准：

```text
.se/framework/evolution/framework/prompts/loop.md
```

## 懒加载规则

- 开发子代理：读取 `framework/prompts/agent-dev.md`。
- 验证子代理：读取 `framework/prompts/agent-verify.md`。
- 台账和归档：读取 `framework/docs/registry-spec.md`。
- 状态文件：读取 `framework/docs/status-file-spec.md`。
- 外层决策：读取 `.se/project/evolution/decisions/{问题ID}.md`。
- 运行产物：写入 `.se/runtime/{task}/`。
- 框架设计背景：仅维护框架时读取 `framework/meta/IMPROVEMENT_DESIGN.md`。
