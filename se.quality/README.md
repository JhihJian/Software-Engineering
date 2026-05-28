# se.quality

`se.quality` 是一个由 AI Agent 执行的质量检查框架。它把跨项目通用能力放在 `framework/`，把可初始化的项目状态放在 `project.template/`；接入具体项目后，再从模板生成运行时 `.se/project/quality/`。

## 给 AI Agent 的稳定入口提示词

可以直接把下面这段提示词交给 AI Agent。它只包含长期稳定的入口约束；具体流程以 `quality-check.prompt.md` 和 `framework/guides/` 下的运行指南为准。

```text
你是当前仓库的质量检查 Agent。

你的唯一稳定入口是：
.se/framework/quality/framework/prompts/quality-check.prompt.md

请先读取该文件，并严格按其中指向的当前流程执行。
除非用户明确要求修复，否则本轮只做质量检查，不修改业务代码。
最终请报告主报告、证据文件和历史产物的位置。
```

主 Agent 提示词文件：

```text
.se/framework/quality/framework/prompts/quality-check.prompt.md
```

并发子 Agent 提示词文件：

```text
.se/framework/quality/framework/prompts/subagent-quality.prompt.md
```

项目配置维护 Agent 提示词文件：

```text
.se/framework/quality/framework/prompts/project-config.prompt.md
```

## 运行过程中会发生什么

1. Agent 先读取 `framework/prompts/` 下的稳定入口。
2. Agent 按入口指向读取 `framework/guides/workflow.md`。
3. Agent 按运行阶段逐步读取所需指南，而不是一开始读取全部文档。
4. Agent 读取初始化后的 `.se/project/quality/` 下的当前项目范围、机器配置和运行状态。
5. 检查工具根据配置扫描源码、模块依赖、测试隔离、领域词汇和工程入口。
6. 检查结果会分为 `must_fix` 和 `should_fix`。
7. 本轮结果会写入主报告、详细证据和历史产物。

## 去哪里看什么

| 目的 | 文件或目录 |
|---|---|
| 查看主 Agent 稳定入口 | `.se/framework/quality/framework/prompts/quality-check.prompt.md` |
| 查看子 Agent 稳定入口 | `.se/framework/quality/framework/prompts/subagent-quality.prompt.md` |
| 查看项目配置维护入口 | `.se/framework/quality/framework/prompts/project-config.prompt.md` |
| 查看质量检查运行流程 | `.se/framework/quality/framework/guides/workflow.md` |
| 查看子任务执行方式 | `.se/framework/quality/framework/guides/subtask.md` |
| 查看项目配置如何初始化和维护 | `.se/framework/quality/framework/guides/project-config.md` |
| 查看质量规则和分级 | `.se/framework/quality/framework/guides/rules.md` |
| 查看并行检查约束 | `.se/framework/quality/framework/guides/parallel.md` |
| 查看报告写入规则 | `.se/framework/quality/framework/guides/reporting.md` |
| 查看质量框架如何维护和演进 | `.se/framework/quality/framework/meta/QUALITY_ENGINEERING.md` |
| 查看项目配置模板 | `.se/framework/quality/project.template/project.config.md` |
| 查看机器配置模板 | `.se/framework/quality/project.template/quality.config.json` |
| 查看状态文件模板 | `.se/framework/quality/project.template/STATUS.md` |
| 查看当前项目质量范围 | `.se/project/quality/project.config.md`，初始化后存在 |
| 查看机器可读配置 | `.se/project/quality/quality.config.json`，初始化后存在 |
| 查看当前运行状态和进度 | `.se/project/quality/STATUS.md`，初始化后存在 |
| 查看当前主报告摘要 | `.se/project/quality/reports/QUALITY_REPORT.md`，初始化后存在 |
| 查看当前详细证据 | `.se/project/quality/evidence/latest.md`，初始化后存在 |

## 运行命令

优先使用项目封装入口：

```bash
npm run quality:check
```

也可以直接运行工具：

```bash
npx ts-node se.quality/framework/tools/check.ts
```

接入具体项目时，先初始化固定目录：

```bash
mkdir -p .se/framework .se/project .se/runtime
cp -r se.quality .se/framework/quality
cp -r .se/framework/quality/project.template .se/project/quality
```

运行产物写入 `.se/runtime/{task}/`。
