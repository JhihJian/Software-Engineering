# status-file-spec.md
# 内层状态文件契约

每轮内层执行结束（`se.evolution/framework/prompts/loop.md` STEP 5.1）必须向 `IMPROVEMENT_STATUS_FILE` 环境变量指定路径写入合法 JSON。该文件是外层控制器（`se.evolution/framework/prompts/operator.md`）读取下一步动作的唯一来源。

---

## Schema

```json
{
  "result": "continue | needs_guidance | pause | blocked | failed | done",
  "reason": "本轮裁决依据（自由文本，仅用于人类阅读和日志）",
  "handled": ["问题ID列表"],
  "next_action": "continue | decide | stop",
  "issue_id": "若裁决与单一问题相关，否则留空字符串"
}
```

---

## 字段语义

| 字段 | 取值 | 用途 |
|------|------|------|
| `next_action` | `continue` / `decide` / `stop` | **外层控制器唯一权威字段**。按 `se.evolution/framework/prompts/loop.md` "动作裁决表"裁决；supervisor 可在连续扩大扫描无新增达到阈值时兜底改写为 `decide` |
| `result` | `continue` / `needs_guidance` / `pause` / `blocked` / `failed` / `done` | 本轮内层执行状态描述。`continue` 让 runner 直接进入下一轮；`needs_guidance` 让 runner 暂停本批次并把指引请求交给外层，但 `next_action` 仍可为 `continue`，外层完成指引后继续循环；其余值跳出 |
| `reason` | 自由文本 | 本轮裁决依据，供日志和报告使用 |
| `handled` | 字符串数组 | 本轮处理的问题 ID 列表 |
| `issue_id` | 字符串或空 | 若 `next_action` 与单一问题相关则填入，否则留空字符串 |

`issue_id=EXPANDED_SCAN_STREAK` 是 supervisor 运行方向门控，表示连续扩大扫描未发现新的高/中优先级问题已达到阈值；它不是架构、需求或产品口径问题，不要求写正式 decision 文件。

---

## 失败处理

若无法写入状态文件，必须在最终回复中明确说明。supervisor 会兜底注入 `next_action=stop`。

## needs_guidance

`needs_guidance` 用于内层需要外层介入调度指引，但不需要真实用户决策的场景，例如同一验证失败连续出现、归档策略需要收敛、测试数据需要重置或验证范围需要拆分。

要求：

- `next_action` 通常写 `continue`，不得因为同一阻塞条件 streak 本身写 `stop`。
- `reason` 必须包含阻塞类型、两轮对比、已尝试动作和建议外层指引。
- 若同时命中安全风险、明确人工门控、架构/产品口径不明、无法归属改动等更高优先级规则，仍按 `se.evolution/framework/prompts/loop.md` 动作裁决表处理。

