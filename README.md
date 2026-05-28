# AI Agent 软件工程实践框架

本目录沉淀一组主要由 AI Agent 运行的软件工程实践框架。所有子项目都应优先服务于
Agent 的稳定执行、低上下文恢复、可审计产出和跨项目复用。

## 总目标

每个实践项目都应把一类软件工程能力封装成可迁移框架：

- `se.architecture`：把项目上下文编译成可维护的架构基线。
- `se.testing`：把测试意图、执行层和测试知识分离，保证验证可追溯。
- `se.quality`：对项目做可证据化的质量检查和报告。
- `se.evolution`：围绕问题台账驱动持续改进闭环。

这些项目可以独立使用，也可以组合为一条链路：

```text
architecture 定义设计基准
  -> testing 定义验证体系
  -> quality 发现结构和工程质量问题
  -> evolution 调度修复、验证、归档和人工决策
```

## 统一目录契约

本仓库中的 `se.*` 目录是框架本体，只保存可复用、可升级、可跨项目共享的能力定义：

```text
se.xxx/
  README.md
  framework/
    meta/
    prompts/
    guides/
    tools/              # 可选：机器检查、脚本入口
    templates/          # 可选：报告、决策、配置模板
  project.template/
    ...
```

接入具体业务项目时，所有 SE 运行内容都放在该业务项目的 `.se/` 下，不使用外部路径映射文件、环境变量或绝对路径约定：

```text
.se/
  framework/            # 当前项目安装的 SE 框架副本
    architecture/
    testing/
    quality/
    evolution/
  project/              # 当前项目可提交的稳定工程状态
    architecture/
    testing/
    quality/
    evolution/
  runtime/              # Agent 运行产物和临时文件，不提交
    {task}/
```

路径语义固定为：

```text
.se/framework/{capability}/ = 框架副本
.se/project/{capability}/   = 项目稳定状态
.se/runtime/{task}/         = 当前任务运行产物
```

文档中写到什么路径，Agent 就使用什么路径。不要再引入 `.se/paths.md`、路径变量、绝对路径注册表或运行时路径推导。

### `README.md`

面向人和 Agent 的稳定入口，第一优先级是确保文档精炼，只说明：

- 这个框架解决什么问题。
- 简要描述运行过程
- 运行中的标准目录结构。
- Agent 应从哪个 prompt 或 guide 开始。
- 最小运行或初始化命令。

`README.md` 不应承载长流程、复杂规则或历史状态。

### `framework/meta/`

用于框架演化，不是运行时必读内容，由人和Agent共同维护，需要确保文档精炼。适合放：

- 框架设计原则。
- 文档模型。
- 扩展规则。
- 不变量。
- 维护者说明。

Agent 正常执行任务时不应默认读取 `meta/`。只有维护框架本身、调整目录模型或修改长期契约时才读取。

### `framework/prompts/`

放长期稳定、少变动的 AI 提示词。prompt 应只承担入口约束和角色边界：

- 角色是什么。
- 工作目标是什么
- 运行时权威指南在哪里。
- 最终需要汇报输出哪些内容。

易变流程、格式细节、规则表和项目适配内容不应放在 prompt 中。

### `framework/guides/`

放运行时可演进的流程和规则。至少包含：

```text
framework/guides/workflow.md
```

`workflow.md` 是 prompt 指向的运行入口，负责说明本轮 Agent 应按什么步骤执行，执行过程可以考虑使用伪代码描述，并在需要时懒加载其他文档。

推荐按主题拆分：

- `workflow.md`：主流程。
- `rules.md`：判定规则和分级。
- `reporting.md`：报告与证据格式。
- `parallel.md`：并发拆分和写入边界。
- `project-config.md`：项目配置维护。

### `project.template/`

放最小可初始化项目实例。模板应只包含必要结构和占位配置，不包含当前仓库运行历史。

推荐最小内容：

```text
project.template/
  project.config.*
  README.md             # 可选：初始化说明
  registry/             # 若框架需要台账
  reports/              # 若框架需要报告
  evidence/             # 若框架需要证据
```

### `.se/project/{capability}/`

业务项目中的项目实例。它只保存接入当前项目所需的配置、状态、证据和产物，由对应框架的 `project.template/` 初始化得到。

`.se/project/{capability}/` 应避免无限增长。长日志、历史流水和大段证据应归档到 `archive/` 或 `evidence/`，主状态文件必须能让新 Agent 在 1-2 分钟内恢复上下文。

### `.se/runtime/{task}/`

Agent 运行过程中的草稿、长日志、命令输出、中间 JSON 和不可合并产物都写入 `.se/runtime/{task}/`。该目录必须被业务项目忽略，不应提交。

## Agent 运行原则

### 1. 意图可达

目录结构本身必须让 Agent 找得到下一步：

```text
README.md
  -> .se/framework/{capability}/framework/prompts/{entry}.md
  -> .se/framework/{capability}/framework/guides/workflow.md
  -> .se/project/{capability}/{config,status,registry}
  -> evidence/report/archive
```

不要让 Agent 依赖口头约定、隐藏路径或一次性上下文。

### 2. 懒加载

Agent 每轮只读取完成当前动作所需的文件。入口 prompt 不应要求一次性读完整个框架。

推荐模式：

```text
先读稳定入口 prompt
再读 workflow.md
按步骤读取 rules/reporting/parallel/project-config
只在需要维护框架时读取 meta/
```

### 3. 状态短小

需要跨轮恢复的状态必须写入明确文件，例如：

- 问题台账。
- 当前状态。
- 最新报告。
- 证据索引。
- 人工决策文件。

主状态文件只保留当前事实、下一步、阻塞原因和证据链接，不保留完整历史。

### 4. 人工审核最小化

需要人审核的内容必须精简、自解释、自描述。每个审核项应包含：

- 背景：为什么需要人判断。
- 选项：可执行的 2-3 个选择。
- 影响：每个选择会改变什么。
- 建议：Agent 基于证据的默认建议。
- 生效范围：哪些文件、规则或流程会受影响。

不得把长日志、完整 diff 或大段推理直接丢给人审核。它们应放在证据文件中，通过链接引用。

### 5. 事实、推断、待确认分离

所有框架都应区分：

- 已确认事实：来自源码、文档、测试、配置或命令输出。
- 合理推断：由证据归纳，但需要说明依据。
- 待确认问题：无法独立判断，必须进入人工决策或暂停。

Agent 不得把推断伪装成事实，也不得用执行困难修改业务意图。


## 统一改进标准

后续改造每个子项目时，按以下标准检查：

1. 是否具备 `README.md + framework/ + project.template/`。
2. `framework/` 下是否至少有 `meta/`、`prompts/`、`guides/`。
3. `prompts/` 是否只保留长期稳定约束。
4. `guides/workflow.md` 是否是运行流程入口。
5. `meta/` 是否不被普通运行流程读取。
6. `project.template/` 是否能初始化最小实例。
7. 业务项目是否只把可合并的稳定状态写入 `.se/project/{capability}/`。
8. 人工审核内容是否精简、自解释、有选项和影响说明。
9. 长证据、历史流水和执行输出是否只通过链接引用。
10. Agent 是否能从目录结构和入口文件独立找到下一步。
11. `.se/runtime/` 是否被忽略，且没有运行产物进入稳定状态。
