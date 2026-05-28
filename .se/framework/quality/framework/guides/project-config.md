# 项目配置维护

本文档定义 AI Agent 如何初始化和维护当前项目的质量检查配置。它是项目适配维护任务的运行时指南。

## 维护对象

项目适配由两个文件共同表达：

- `.se/project/quality/project.config.md`：人类可读的项目质量适配说明。
- `.se/project/quality/quality.config.json`：机器可读的检查配置。

两者必须保持语义一致。`project.config.md` 解释意图，`quality.config.json` 承载脚本可执行配置。

## 什么时候初始化

在以下场景初始化项目配置：

- 首次把 `se.quality` 接入某个项目。
- 从其他项目复制 `framework/` 后，为当前项目创建新的 `project/`。
- 当前项目缺少 `project.config.md` 或 `quality.config.json`。
- 项目已有配置明显不是当前项目的事实。

## 什么时候维护

在以下场景更新项目配置：

- 模块边界变化。
- 源码目录或测试目录变化。
- 构建、测试、质量检查入口变化。
- 领域词汇、禁用词或例外策略变化。
- 检查报告发现配置与仓库事实不一致。
- 用户明确要求同步、初始化或更新质量配置。

## 必读输入

维护前按需要读取：

```text
.se/framework/quality/framework/guides/rules.md
.se/project/quality/project.config.md
.se/project/quality/quality.config.json
.se/project/quality/STATUS.md
```

还应读取当前项目中的事实来源，例如：

- `package.json`
- `pom.xml`
- `build.gradle`
- `TEST_ARCHITECTURE.md`
- 架构说明文档
- 主要源码目录
- 模块目录

只读取和本次配置维护相关的文件，不一次性加载无关文档。

## 维护步骤

### 1. 识别项目事实

确认当前项目的：

- 生产源码根目录
- 业务模块根目录
- 模块列表和允许依赖关系
- 测试架构文档
- 必需脚本入口
- 文件规模阈值
- 领域词汇和禁用词

### 2. 更新人类可读说明

将项目事实和维护意图写入：

```text
.se/project/quality/project.config.md
```

该文件应说明“为什么这样配置”，并保持可读、简洁。

### 3. 更新机器可读配置

将脚本需要读取的配置写入：

```text
.se/project/quality/quality.config.json
```

该文件只放机器配置，不放长解释。

### 4. 校验一致性

更新后检查：

- `project.config.md` 与 `quality.config.json` 是否语义一致。
- `quality.config.json` 是否是合法 JSON。
- 必需路径和入口是否存在，或是否在文档中说明了暂缺原因。

### 5. 记录状态

如果维护动作改变了检查范围或并发任务状态，更新：

```text
.se/project/quality/STATUS.md
```

## 输出要求

维护完成后，报告：

- 修改了哪些配置项。
- 哪些项目事实是从文件中确认的。
- 哪些配置仍需要人工确认。
- 是否需要重新运行质量检查。

## 边界

- 可以修改 `project.config.md`、`quality.config.json` 和必要的 `STATUS.md`。
- 不修改业务代码。
- 不把当前项目事实写入 `framework/`。
- 如果无法确认项目事实，保留明确的“需确认”说明，不要猜测成事实。

