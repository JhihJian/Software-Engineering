# Architecture Module

## 模块定位与边界

`se.architecture` 负责把项目上下文编译成稳定架构基线。它关注跨需求版本稳定存在的结构，包括核心实体、模块边界、流程、不变量、术语和决策来源。

本模块不替代 PRD、接口文档、测试规范或运行日志。它只沉淀可作为后续 Agent 判断依据的稳定架构事实。

## 对外提供能力

- 生成和维护 `.se/project/architecture/ARCHITECTURE.md`。
- 生成和维护 `.se/project/architecture/modules/*.md`。
- 维护术语表 `.se/project/architecture/glossary.md`。
- 维护架构结论来源 `.se/project/architecture/source-map.md`。
- 记录关键架构取舍到 `.se/project/architecture/decisions/*.md`。
- 通过 `npm run architecture:check` 检查框架结构和项目态架构基线。

## 对外依赖

- 读取项目 README、AGENTS、源码、配置、测试资产和历史决策作为输入。
- 读取 `.se/framework/architecture/framework/guides/workflow.md` 作为运行流程入口。
- 在维护框架本体或长期契约时读取 `framework/meta/`。

## 核心实体

- Architecture Baseline：顶层架构基线。
- Module Document：模块级设计文档。
- Glossary：统一术语表。
- Source Map：架构结论到来源的映射。
- Architecture Decision：关键取舍记录。

## 功能清单

- 新建架构基线。
- 从现有项目资料反向提取架构事实。
- 维护已有架构文档。
- 检查架构文档结构和链接。
- 标记事实、推断和待确认问题。

## 业务规则

- 顶层 `ARCHITECTURE.md` 只保存稳定架构基线。
- 模块细节写入 `modules/*.md`，不堆叠在顶层文档。
- 每个架构结论应能在 `source-map.md` 中找到来源或明确标记为待确认。
- 未确认推断不得写成已确认事实。
- 修改模块边界时，应检查是否需要新增或更新架构决策。

## 权限规则

本模块没有业务权限模型。写入权限由仓库工作规则约束：变更必须发生在任务 worktree 中，不直接修改 `main/`。

## 状态或流程规则

架构维护流程：

1. 判断任务类型。
2. 读取当前任务所需输入和已有项目态架构文件。
3. 按需维护顶层文档、模块文档、术语表和来源映射。
4. 运行 `npm run architecture:check`。
5. 报告已确认事实、合理推断、待确认问题和验证覆盖范围。

## 数据一致性要求

- 顶层文档引用的模块文档必须存在。
- `glossary.md` 中术语应与顶层文档和模块文档一致。
- `source-map.md` 应覆盖新增或修改的关键结论。

## 用户交互流程

人或 Agent 提出架构建设目标后，架构 Agent 先读取稳定入口和 workflow，再按任务类型懒加载 build、maintenance 或 checklist 指南。需要人工判断时，只输出精简决策项和影响范围，不把长日志直接放入架构文档。

## 不实现范围

- 不执行测试实现。
- 不执行质量修复。
- 不调度持续改进循环。
- 不保存临时命令输出或完整源码摘录。
