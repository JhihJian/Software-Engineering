# Source Map

记录架构结论与输入资料的对应关系。

| 结论 | 来源 | 状态 |
|---|---|---|
| 当前仓库是面向 AI Agent 的软件工程实践框架集合。 | `README.md` | 已确认 |
| 仓库包含 `se.architecture`、`se.testing`、`se.quality`、`se.evolution` 四个可复用子框架。 | `README.md`, `AGENTS.md` | 已确认 |
| 业务项目运行时使用 `.se/framework`、`.se/project`、`.se/runtime` 三目录模型。 | `README.md`, `AGENTS.md` | 已确认 |
| `se.architecture` 负责生成和维护架构基线。 | `se.architecture/README.md` | 已确认 |
| `se.testing` 负责分离测试意图、执行层和测试知识。 | `se.testing/README.md` | 已确认 |
| `se.quality` 负责基于证据执行质量检查和报告。 | `se.quality/README.md` | 已确认 |
| `se.evolution` 负责基于问题台账推进持续改进闭环。 | `se.evolution/README.md` | 已确认 |
| 当前自举已安装四个框架副本到 `.se/framework/`。 | 本次 `feature/self-bootstrap` 文件树 | 已确认 |
| 当前自举已从 `se.architecture/project.template` 初始化 `.se/project/architecture/`。 | 本次 `feature/self-bootstrap` 文件树 | 已确认 |
| `se.testing` 和 `se.quality` 已补齐可复制的 `project.template/`。 | 本次 `feature/self-bootstrap` 文件树 | 已确认 |
| 当前仓库通过根 `package.json` 暴露 architecture、testing 和 quality 三个验证入口。 | `package.json` | 已确认 |
| 架构基线由顶层文档和四个能力模块文档组成。 | `.se/project/architecture/ARCHITECTURE.md`, `.se/project/architecture/modules/*.md` | 已确认 |
| 框架本体变更按 `se.{capability}/` 到 `.se/framework/{capability}/` 的方向同步，`.se/framework/{capability}/` 是可替换安装快照。 | `README.md`, `AGENTS.md`, `.se/project/architecture/ARCHITECTURE.md` | 已确认 |
| `.se/project/{capability}/` 的当前项目状态不反向同步到框架本体或安装快照。 | `README.md`, `.se/project/architecture/ARCHITECTURE.md` | 已确认 |
| `se.architecture` 项目态模块文档描述架构基线、模块文档、术语、来源和决策记录。 | `.se/project/architecture/modules/architecture.md`, `se.architecture/README.md` | 已确认 |
| `se.testing` 项目态模块文档描述测试策略、测试意图、执行层和共享测试支撑。 | `.se/project/architecture/modules/testing.md`, `se.testing/README.md` | 已确认 |
| `se.quality` 项目态模块文档描述质量配置、发现项、证据、报告和历史产物。 | `.se/project/architecture/modules/quality.md`, `se.quality/README.md` | 已确认 |
| `se.evolution` 项目态模块文档描述问题台账、决策、运行状态、证据和归档。 | `.se/project/architecture/modules/evolution.md`, `se.evolution/README.md` | 已确认 |
