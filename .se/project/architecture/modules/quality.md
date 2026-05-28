# Quality Module

## 模块定位与边界

`se.quality` 负责基于项目配置和仓库证据执行质量检查，输出可审计报告。它发现问题、分级问题并保存证据，但默认不修复业务代码或框架代码。

本模块关注可维护性、路径一致性、入口完整性、文件规模、禁用词等可由证据支持的问题。

## 对外提供能力

- 维护质量项目配置 `.se/project/quality/project.config.md`。
- 维护机器配置 `.se/project/quality/quality.config.json`。
- 执行 `npm run quality:check`。
- 生成 `.se/project/quality/reports/QUALITY_REPORT.md`。
- 生成 `.se/project/quality/evidence/latest.md` 和 `latest.json`。
- 保存历史产物到 `.se/project/quality/history/`。

## 对外依赖

- 读取 `.se/project/quality/quality.config.json`。
- 读取配置声明的 source roots。
- 读取根 `package.json` 检查必需脚本。
- 可消费 architecture 和 testing 产物来形成更高阶检查，但不直接接管它们的状态。

## 核心实体

- Quality Config：机器可读检查配置。
- Project Config：人类可读项目质量约定。
- Finding：带规则 ID、等级、位置、上下文和建议动作的问题。
- Evidence：支撑 Finding 的文件、行号、配置或命令结果。
- Quality Report：摘要优先的质量结果。

## 功能清单

- 检查质量项目态是否初始化。
- 检查必需 npm scripts 是否存在。
- 检查配置的 source roots 是否存在。
- 检查文件规模阈值。
- 检查禁用词。
- 写入主报告、详细证据和历史 JSON。

## 业务规则

- 只有有文件、配置或命令证据支持的问题才能列为事实性问题。
- 检查阶段不修改业务代码或框架代码。
- 主报告保存摘要，详细证据保存完整问题上下文。
- 历史产物每轮新增，不覆盖旧记录。
- 质量配置不应把当前项目事实写回 framework。

## 权限规则

质量 Agent 默认只读业务代码和框架代码，只写 `.se/project/quality/` 下的报告、证据、历史和状态文件。维护质量配置需要用户明确要求或任务目标明确包含配置维护。

## 状态或流程规则

质量检查流程：

1. 读取 `.se/project/quality/STATUS.md` 和项目配置。
2. 读取 `.se/project/quality/quality.config.json`。
3. 执行配置驱动的检查。
4. 将问题分为 `must_fix` 和 `should_fix`。
5. 写入报告、证据和历史产物。
6. 汇报验证结果和产物路径。

## 数据一致性要求

- `project.config.md` 的解释应与 `quality.config.json` 的机器配置一致。
- 报告中的证据路径必须指向真实文件。
- `latest.md`、`latest.json` 和 `QUALITY_REPORT.md` 应来自同一轮检查。

## 用户交互流程

用户要求质量检查时，质量 Agent 先运行检查并报告发现，只产出 report 和 evidence。演进问题由 `se.evolution` 从 quality report 和 evidence 导入或登记；只有用户明确要求时，质量 Agent 才执行问题登记动作。需要设计判断的问题应标记为评审判断，不直接作为必须修复事实。

## 不实现范围

- 不直接修改业务代码。
- 不替代测试执行结果。
- 不维护架构结论。
- 不调度长期演进循环。
