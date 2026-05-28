# 报告产物

本文档定义质量检查报告如何生成和存储。它是运行时指南，准备写入报告前读取。

## 三级产物

质量结果分三级存储：

| 层级 | 位置 | 用途 |
|---|---|---|
| 主报告 | `se.quality/project/reports/QUALITY_REPORT.md` | 摘要优先，方便快速判断本轮状态。 |
| 详细证据 | `se.quality/project/evidence/latest.md` 和 `latest.json` | 当前详细证据，包含上下文和建议动作。 |
| 历史产物 | `se.quality/project/history/YYYYMMDDTHHMMSSZ.json` | 每轮不可变的原始产物，方便追溯。 |

并发子 Agent 的分片证据放在：

```text
se.quality/project/evidence/subagents/
```

## 主报告要求

主报告应包含：

- 生成时间
- 检查状态
- 问题总数
- `must_fix` 数量
- `should_fix` 数量
- 主要问题摘要
- 详细证据和历史产物路径

主报告不应包含长日志、完整命令输出或大段源码。

## 详细证据要求

每个问题应包含：

- 稳定问题 ID
- 规则 ID
- 问题等级
- 文件和行号，如果可以获得
- 问题说明
- 上下文
- 证据
- 建议动作

## 历史产物要求

历史产物应保留机器可读原始结果。每轮检查生成新文件，不覆盖旧文件。
