# Glossary

| 术语 | 含义 | 来源 |
|---|---|---|
| Capability | 可复用的软件工程能力，对应 architecture、testing、quality 或 evolution。 | README.md |
| Framework | Capability 的可复制定义，包括 prompt、guide、meta、tool 和 template。 | README.md, AGENTS.md |
| Framework Copy | 安装到当前项目的框架副本，位于 `.se/framework/{capability}/`。 | README.md |
| Framework Layer | 仓库根目录下保存框架本体的 `se.*` 层。 | README.md |
| Framework Synchronization | 将 `se.{capability}/` 的框架本体变更复制到 `.se/framework/{capability}/` 安装快照的过程。 | `.se/project/architecture/ARCHITECTURE.md` |
| Project Layer | 当前仓库自举后保存项目态工程状态的 `.se/` 层。 | README.md |
| Project State | 当前项目可提交、可恢复、可审计的稳定工程状态，位于 `.se/project/{capability}/`。 | README.md |
| Runtime Artifact | 单次 Agent 任务中的草稿、长日志和中间产物，位于 `.se/runtime/{task}/`。 | README.md |
| Stable Entry | Agent 的稳定入口文件，通常是 `framework/prompts/*.md` 和 `framework/guides/workflow.md`。 | README.md, AGENTS.md |
| Workflow Guide | Agent 执行当前能力时读取的运行流程，通常是 `framework/guides/workflow.md`。 | README.md, AGENTS.md |
| Project Template | 初始化项目态的最小模板，位于 `project.template/`。 | README.md |
| Source Map | 架构结论到输入资料的对应关系。 | se.architecture/project.template/source-map.md |
| Architecture Baseline | 当前项目稳定架构事实、模块边界、不变量和来源证据的集合。 | se.architecture/README.md |
| Finding | 质量检查中带规则、等级、位置、上下文和建议动作的问题。 | se.quality/README.md |
| Problem Registry | 演进框架用于跨轮恢复的问题台账。 | se.evolution/README.md |
