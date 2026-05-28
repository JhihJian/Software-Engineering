# 子任务执行

本文档定义质量子 Agent 的运行方式。它是运行时指南，子 Agent 每轮都应该读取。

## 任务边界

子 Agent 只检查被分配的规则 ID、源码范围或文档范围。不要扩大检查范围，也不要修改业务代码。

## 必读输入

1. `se.quality/framework/guides/rules.md`
2. `se.quality/framework/guides/parallel.md`
3. `se.quality/framework/guides/reporting.md`
4. `se.quality/project/project.config.md`
5. `se.quality/project/STATUS.md`
6. 与被分配范围直接相关的源码、配置或文档

## 输出要求

发现问题时，输出必须自包含，并包含：

- 规则 ID
- 等级：`must_fix` 或 `should_fix`
- 文件和行号，如果可以获得
- 局部上下文
- 证据
- 建议动作
- 置信度

## 写入位置

如果需要写入文件，将子 Agent 证据放到：

```text
se.quality/project/evidence/subagents/
```

文件名应包含规则 ID、检查范围或时间戳，避免和其他子 Agent 冲突。

## 禁止事项

- 不覆盖 `se.quality/project/reports/QUALITY_REPORT.md`。
- 不覆盖 `se.quality/project/evidence/latest.md`。
- 不覆盖 `se.quality/project/evidence/latest.json`。
- 不修改业务代码。

只有在被明确指定为报告负责人或修复执行者时，才可以突破对应限制。
