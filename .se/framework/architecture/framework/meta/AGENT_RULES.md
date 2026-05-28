# AI Agent 使用规则

本文件定义 Codex 等 AI Agent 使用和维护 ARCHITECTURE 系列文档时的约束。

## 加载顺序

Agent 处理架构相关任务时 SHOULD 按以下顺序读取：

1. `se.architecture/framework/prompts/architecture.md`
2. `se.architecture/framework/guides/workflow.md`
3. `.se/project/architecture/ARCHITECTURE.md`
4. 与任务相关的 `.se/project/architecture/modules/*.md`
5. `.se/project/architecture/glossary.md`
6. 只有维护框架本身时读取 `se.architecture/framework/meta/`

## 生成原则

Agent MUST 区分以下三类内容：

- 已确认事实：来自 PRD、源码、数据库、接口或现有文档
- 合理推断：从多个来源归纳得到，但需要说明推断依据
- 待确认问题：无法从现有上下文判断，不得伪造成事实

## 禁止行为

Agent MUST NOT：

- 把测试工程文档归入业务 ARCHITECTURE 系列
- 在顶层架构中塞入大量易变页面细节
- 绕过模块边界直接改写下游实现假设
- 删除现有架构约束而不说明原因
- 用生成内容覆盖用户未要求修改的项目事实

## 维护要求

Agent 修改架构文档后 SHOULD：

- 更新相关索引
- 检查链接和模块路径
- 更新 `source-map.md`
- 运行 `npm run architecture:check`
- 在最终回复中说明修改范围和校验结果

