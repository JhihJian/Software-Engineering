# Repository Guidelines

## 项目结构与模块组织

本仓库是面向 AI Agent 的软件工程框架仓库，包含四个可复用子框架：

- `se.architecture/`：架构基线生成、维护和检查。
- `se.testing/`：测试意图、执行层和测试知识分离。
- `se.quality/`：基于证据的质量检查和报告。
- `se.evolution/`：基于问题台账的持续改进闭环。

每个子框架应保持统一结构：

```text
se.xxx/
  README.md
  framework/
    meta/
    prompts/
    guides/
    tools/
    templates/
  project.template/
```

业务项目运行时统一使用 `.se/` 三目录模型：

```text
.se/framework/{capability}/  # 当前项目安装的框架副本
.se/project/{capability}/    # 当前项目可提交的稳定工程状态
.se/runtime/{task}/          # Agent 运行产物，不提交
```

文档中写到什么路径，Agent 就使用什么路径；不要引入 `.se/paths.md`、绝对路径注册表、环境变量或运行时路径推导。

## 构建、测试与开发命令

本仓库没有统一根构建命令。按子框架运行检查：

```bash
npx ts-node se.architecture/framework/tools/lint-architecture.ts
```

检查 `se.architecture` 的框架结构；接入业务项目后，项目架构产物位于 `.se/project/architecture/`。

```bash
bash se.evolution/framework/tools/check-registry-budget.sh
```

在初始化演进项目后，检查问题台账是否超过预算。

测试框架接入具体项目后，再使用项目自己的 npm scripts，例如 `npm run test:all`、`npm run test:intentions`。

## 编码风格与命名约定

文档优先使用简洁 Markdown。`README.md` 只作为稳定入口，不承载长流程、复杂规则或历史状态。

长期设计原则放入 `framework/meta/`；运行时流程和规则放入 `framework/guides/`；稳定 Agent 入口放入 `framework/prompts/`。

文件命名优先使用小写 kebab-case，例如 `workflow.md`、`project-config.md`、`stop-report.template.md`。

## 测试与验证要求

修改目录契约后，应至少验证每个子框架仍包含：

- `README.md`
- `framework/meta/`
- `framework/prompts/`
- `framework/guides/workflow.md`
- `project.template/`

测试资产属于初始化后的 `.se/project/testing/`，除非是跨项目复用的工具、模板或规范，否则不要放入框架本体。

## 提交与 Pull Request 要求

当前目录没有可用 Git 历史，因此无法推断既有提交规范。建议使用简短祈使句提交信息，例如：

```text
Align testing framework layout
Add evolution workflow guide
```

PR 应说明影响了哪些 `se.*` 子框架，列出已运行的验证命令，并明确是否修改了 prompt、workflow 或 `project.template/` 初始化行为。

## Agent 使用说明

Agent 应先读取子框架 `README.md`，接入业务项目后再读取其中指向的 `.se/framework/{capability}/framework/prompts/*.md` 和 `.se/framework/{capability}/framework/guides/workflow.md`。

普通运行任务不要默认读取 `framework/meta/`；只有维护框架本身、调整目录模型或修改长期契约时才读取。
