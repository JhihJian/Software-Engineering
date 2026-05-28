# 质量检查运行流程

本文档定义主 Agent 每轮质量检查要做什么。每一步只读取完成该动作所需的文档；详细格式和规则在对应指南中查阅。

## 运行目标

质量检查的目标是发现可由仓库证据支持的可维护性问题，并产出自包含报告。检查阶段不修改业务代码，除非用户明确要求进入修复阶段。

## 运行步骤

### 1. 建立当前项目上下文

确认本轮检查的项目范围、当前状态、是否已有并发任务、报告负责人和质量检查入口。

读取输入：

```text
.se/project/quality/STATUS.md
.se/project/quality/project.config.md
```

其中 `STATUS.md` 是质量检查状态文件，用于确认当前运行状态、并发任务和报告负责人；`project.config.md` 是项目适配文件，用于确认本项目纳入检查的范围和人工约定。

### 2. 运行基础检查

执行项目配置中的质量检查入口，获得基础机器结果。

当需要读取机器配置或直接运行检查工具时，读取：

```text
.se/project/quality/quality.config.json
```

优先使用项目封装入口：

```bash
npm run quality:check
```

如果没有封装入口，使用直接命令：

```bash
npx ts-node .se/framework/quality/framework/tools/check.ts
```

### 3. 判定问题

解释脚本结果，补充有证据支持的人工发现，并将问题分为 `must_fix` 或 `should_fix`。

详细规则、问题等级和事实性问题边界见：

```text
.se/framework/quality/framework/guides/rules.md
```

### 4. 需要并发时拆分任务

如果本轮需要多个 Agent 并行检查，将检查范围拆分给子 Agent，并汇总子 Agent 的分片证据。

并发协作、写入边界和子 Agent 输出格式见：

```text
.se/framework/quality/framework/guides/parallel.md
.se/framework/quality/framework/guides/subtask.md
```

如果本轮只由单 Agent 执行，可以跳过 `subtask.md`。

### 5. 写入报告

写入主报告、详细证据和历史产物，确保本轮检查结果可追溯。

报告格式、证据字段和三级产物位置见：

```text
.se/framework/quality/framework/guides/reporting.md
```

## 检查边界

- 只将有脚本结果、文件证据或明确项目级上下文支持的问题列为事实性问题。
- 需要设计判断的问题标记为“评审判断”。
- 不在检查阶段修改业务代码。
- 不把 `framework/meta/` 作为每轮运行时必读内容。
- 如果发现 `project.config.md` 或 `quality.config.json` 与仓库事实不一致，先在质量报告中记录；只有用户明确要求维护项目配置时，才进入 `.se/framework/quality/framework/guides/project-config.md` 定义的配置维护流程。
- 运行产物写入 `.se/runtime/{task}/`。
