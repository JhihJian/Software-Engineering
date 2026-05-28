# 并行检查

本文档定义质量检查中的并发协作方式。并行检查是默认运行模型。

## 角色

主 Agent 负责：

1. 读取入口提示词和运行流程。
2. 读取 `project/STATUS.md`。
3. 将检查范围拆分给子 Agent，或运行统一脚本获得基础结果。
4. 汇总脚本结果和分片证据。
5. 写入主报告。

子 Agent 负责：

1. 只检查被分配的规则 ID 或源码范围。
2. 将发现的问题写成自包含证据。
3. 将分片证据写入 `project/evidence/subagents/`。
4. 不覆盖主报告，除非被明确指定为报告负责人。

## 并发写入约束

- `project/reports/QUALITY_REPORT.md` 同一时间只能有一个写入者。
- `project/evidence/latest.md` 和 `latest.json` 由主 Agent 或报告负责人写入。
- 子 Agent 只能写自己的分片证据文件。
- 分片证据文件名应包含规则 ID、范围或时间戳，避免冲突。
- `project/STATUS.md` 是共享进度视图，更新时应保持简洁。

## 分片证据位置

```text
.se/project/quality/evidence/subagents/
```

建议文件名：

```text
QR001-dependency-YYYYMMDDTHHMMSSZ.md
QR003-test-isolation-YYYYMMDDTHHMMSSZ.md
```

