按照 `se.evolution/framework/guides/workflow.md` 执行当前项目持续改进。该文件会指向完整运行时契约、动作裁决表和状态写入规则，逐节按其要求行事。

状态文件路径由环境变量 `IMPROVEMENT_STATUS_FILE` 指定；按 `se.evolution/framework/docs/status-file-spec.md` 在本轮 STEP 5.1 写入。若无法写入，必须在最终回复中明确说明。

最终回复输出本轮执行结果摘要，包含：

- 本轮是否完成闭环
- 处理的问题 ID
- 本轮裁决的 `next_action` 及裁决依据

