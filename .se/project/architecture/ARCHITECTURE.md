# Software Engineering Framework Architecture

本文件是当前仓库的稳定架构基线。它描述这个仓库如何把 AI Agent 可执行的软件工程实践沉淀为可复用框架，并如何用 `.se/` 项目态反过来建设当前仓库自身。

## Project Overview

本仓库的目标是提供一组面向 AI Agent 的软件工程框架，使 Agent 能在低上下文、可恢复、可审计的条件下执行架构维护、测试建设、质量检查和持续演进。

当前系统有两个层次：

- Framework Layer：仓库根目录下的 `se.*` 目录，保存可跨项目复制和升级的框架本体。
- Project Layer：当前仓库自己的 `.se/` 目录，保存当前项目安装框架后的稳定工程状态和运行产物边界。

框架本体不保存当前仓库的运行历史；项目态不修改框架长期契约。两者通过复制安装形成快照关系。

## Scope

本架构基线覆盖：

- 四个能力框架的职责和边界。
- `.se/` 三目录运行模型。
- Agent 入口、指南、模板、工具和项目状态之间的关系。
- 当前仓库自举后的稳定状态。
- 后续演进应遵守的不变量。

本架构基线不覆盖：

- 具体业务项目如何使用这些框架后的业务架构。
- 每个工具脚本的完整实现细节。
- 每个 prompt 的完整提示词内容。
- 临时运行日志、命令输出和未归档草稿。

## Core Domain Model

核心实体如下：

| 实体 | 含义 | 主要位置 |
|---|---|---|
| Capability | 一类可复用的软件工程能力。 | `se.architecture/`, `se.testing/`, `se.quality/`, `se.evolution/` |
| Framework | Capability 的可复制定义，包括 prompt、guide、meta、tool 和 template。 | `se.{capability}/` |
| Framework Copy | 当前项目安装的框架快照。 | `.se/framework/{capability}/` |
| Project State | 当前项目可提交、可恢复、可审计的稳定状态。 | `.se/project/{capability}/` |
| Runtime Artifact | 单次 Agent 运行中的草稿、长日志和中间产物。 | `.se/runtime/{task}/` |
| Stable Entry | Agent 每轮任务的稳定入口。 | `framework/prompts/*.md` |
| Workflow Guide | Agent 执行当前能力时读取的运行流程。 | `framework/guides/workflow.md` |
| Project Template | 初始化项目态的最小模板。 | `project.template/` |
| Evidence | 检查、报告或架构结论背后的来源材料。 | `.se/project/**/evidence/`, `.se/project/architecture/source-map.md` |

实体关系：

```text
Capability
  -> Framework
  -> Project Template
  -> Framework Copy
  -> Project State
  -> Runtime Artifact
```

`Framework` 是可复用定义，`Project State` 是当前项目事实。Agent 执行任务时先读安装后的 `Framework Copy`，再读或写对应 `Project State`。

## Core Flows

### Self-bootstrap Flow

当前仓库使用自身框架建设自身时，执行以下流程：

1. 在独立 feature worktree 中工作，保持 `main/` 清洁。
2. 将 `se.architecture`、`se.testing`、`se.quality`、`se.evolution` 复制到 `.se/framework/`。
3. 将各框架的 `project.template/` 复制到 `.se/project/{capability}/`。
4. 写入当前仓库自己的架构基线、测试项目态、质量项目态和演进项目态。
5. 通过根 npm scripts 验证 architecture、testing 和 quality 的最小闭环。

### Agent Execution Flow

Agent 执行某个能力时遵守以下顺序：

1. 读取当前项目的 `AGENTS.md` 和相关用户目标。
2. 读取 `.se/framework/{capability}/framework/prompts/{entry}.md`。
3. 按 prompt 指向读取 `.se/framework/{capability}/framework/guides/workflow.md`。
4. 按 workflow 懒加载 rules、reporting、execution、project-config 或其他细分指南。
5. 读取 `.se/project/{capability}/` 中的项目状态。
6. 写入最小必要的项目态文件；长日志和中间结果写入 `.se/runtime/{task}/`。
7. 运行对应验证入口并报告覆盖范围。

### Framework Synchronization Flow

当前仓库中，`se.*` 是框架本体，`.se/framework/*` 是安装快照。当框架本体变化后，需要同步：

1. 更新 `se.{capability}/`。
2. 复制到 `.se/framework/{capability}/`。
3. 如果变化影响初始化行为，同步检查 `project.template/` 和 `.se/project/{capability}/`。
4. 运行对应验证命令。

### Quality And Evolution Flow

质量和演进形成后续建设闭环：

1. `se.quality` 基于配置和证据发现项目结构问题。
2. 问题进入 `.se/project/evolution/registry/PROBLEM_REGISTRY.md`。
3. `se.evolution` 选择问题，调度修复、验证、归档和人工裁决。
4. 架构、测试、质量文档随修复同步更新。

## Security And Permissions

本仓库不定义业务用户、权限主体或运行时访问控制。它的安全边界主要是工程操作边界：

- `main/` worktree 只用于同步、检查和基线比较，不直接实现变更。
- 每个任务使用独立 feature 或 fix worktree。
- `.se/project/{capability}/` 只能保存可提交、可审计、可跨轮恢复的稳定状态。
- `.se/runtime/{task}/` 保存不可合并的临时运行产物，不提交。
- Agent 不应通过绝对路径、外部路径注册表或环境变量重新解释 `.se/` 路径。
- 未确认的推断必须标记为待确认，不能写成已确认架构事实。

## Module Boundaries

本仓库由四个能力模块组成。它们可以独立使用，也可以形成一条工程闭环：

```text
architecture -> testing -> quality -> evolution
```

### `se.architecture`

`se.architecture` 负责把项目上下文编译成稳定架构基线。它产出的架构事实被 testing、quality 和 evolution 消费。

项目态写入边界：

- `.se/project/architecture/ARCHITECTURE.md`
- `.se/project/architecture/modules/*.md`
- `.se/project/architecture/glossary.md`
- `.se/project/architecture/source-map.md`
- `.se/project/architecture/decisions/*.md`

模块文档：[architecture.md](modules/architecture.md)

### `se.testing`

`se.testing` 负责分离测试意图、执行层和测试知识。它不定义业务架构，但消费 architecture 的事实来组织可追溯验证。

项目态写入边界：

- `.se/project/testing/docs/`
- `.se/project/testing/intentions/*.yaml`
- `.se/project/testing/specs/**`
- `.se/project/testing/support/`

模块文档：[testing.md](modules/testing.md)

### `se.quality`

`se.quality` 负责基于项目配置和可验证证据输出质量报告。它发现问题，但默认不修复业务代码或框架代码。

项目态写入边界：

- `.se/project/quality/project.config.md`
- `.se/project/quality/quality.config.json`
- `.se/project/quality/STATUS.md`
- `.se/project/quality/reports/`
- `.se/project/quality/evidence/`
- `.se/project/quality/history/`

模块文档：[quality.md](modules/quality.md)

### `se.evolution`

`se.evolution` 负责围绕问题台账推进持续改进闭环。它读取架构、测试和质量产物，但不接管这些能力的内部状态。

项目态写入边界：

- `.se/project/evolution/project.config.yaml`
- `.se/project/evolution/registry/PROBLEM_REGISTRY.md`
- `.se/project/evolution/decisions/`
- `.se/project/evolution/evidence/`
- `.se/project/evolution/archive/`

模块文档：[evolution.md](modules/evolution.md)

## Invariants

- `se.*` 目录保存框架本体，不保存当前项目运行历史。
- `.se/framework/{capability}/` 保存当前项目安装的框架副本。
- `.se/project/{capability}/` 保存当前项目稳定工程状态。
- `.se/runtime/{task}/` 保存不可合并运行产物，不提交。
- `project.template/` 必须能初始化最小项目态。
- prompt 只保存稳定入口约束；可变流程放在 `framework/guides/`。
- 普通运行任务不默认读取 `framework/meta/`。
- 文档中写到什么路径，Agent 就使用什么路径。
- 删除或改写架构结论时，同步更新 `.se/project/architecture/source-map.md`。
- 能通过命令验证的结论必须优先使用命令验证，而不是只靠文档推断。

## Related Files

- `README.md`：仓库目标、统一目录契约和 Agent 运行原则。
- `AGENTS.md`：当前 worktree 的 Agent 工作规则。
- `package.json`：根验证入口。
- `se.architecture/README.md`：架构能力框架入口。
- `se.testing/README.md`：测试能力框架入口。
- `se.quality/README.md`：质量能力框架入口。
- `se.evolution/README.md`：演进能力框架入口。
- `.se/project/architecture/glossary.md`：术语表。
- `.se/project/architecture/source-map.md`：架构结论来源映射。
