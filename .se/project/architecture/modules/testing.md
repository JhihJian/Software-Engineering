# Testing Module

## 模块定位与边界

`se.testing` 负责把测试意图、执行层和测试知识分离。它让 Agent 在编写或维护测试时先明确“为什么测”，再维护“怎么执行”，并把可复用测试知识放在稳定位置。

本模块不定义业务架构，也不保存框架长期设计原则之外的项目运行历史。

## 对外提供能力

- 维护测试策略和业务规则文档。
- 维护 `.se/project/testing/intentions/*.yaml` 测试意图。
- 维护 `.se/project/testing/specs/**` 可执行测试。
- 维护 `.se/project/testing/support/` 共享测试支撑。
- 用 `npm run test:intentions` 校验测试意图和执行层绑定关系。

## 对外依赖

- 消费 `.se/project/architecture/` 中的架构事实。
- 读取 `.se/framework/testing/framework/guides/workflow.md` 作为运行流程入口。
- 按需读取 execution、coding、failure、intention 等测试规范。
- 依赖项目自己的测试运行入口执行真实测试套件。

## 核心实体

- Test Strategy：项目测试范围、分层和入口说明。
- Business Rule：测试必须保护的项目规则。
- Test Intention：测试意图，说明目标、前置条件、步骤、断言和边界情况。
- Execution Spec：绑定某个意图版本的可执行测试。
- Test Support：测试客户端、页面对象、fixture 或共享断言。

## 功能清单

- 初始化测试项目态目录。
- 新增和维护测试意图。
- 新增和维护 API、contract、E2E 测试。
- 校验 active 意图是否有执行层绑定。
- 诊断测试失败并区分业务失败、环境失败和测试代码失败。

## 业务规则

- 新增或修改测试前，应先检查是否已有对应测试意图。
- 可执行测试必须在文件头绑定 intention 和版本。
- active 意图必须有对应执行测试。
- 测试知识写入 `.se/project/testing/docs/`，共享执行能力写入 `.se/project/testing/support/`。
- 不在 spec 中重复硬编码业务数据、客户端或页面对象。

## 权限规则

本模块没有业务权限模型。测试 Agent 默认可以维护 `.se/project/testing/`，但不应修改框架本体，除非任务明确要求维护测试框架。

## 状态或流程规则

测试建设流程：

1. 判断任务类型。
2. 读取测试策略、业务规则和相关架构事实。
3. 新增或维护测试意图。
4. 实现或更新执行层。
5. 运行 intention 校验和项目测试命令。
6. 汇报事实、推断、待确认问题和证据路径。

## 数据一致性要求

- intention 文件名应与 spec 头部引用一致。
- spec 头部版本应与 intention 的 version 一致。
- deprecated 意图不要求绑定执行层。
- 测试策略中声明的测试目录应与实际目录一致。

## 用户交互流程

用户提出测试建设目标后，测试 Agent 先确认测试意图是否存在，再决定创建意图、实现执行层或诊断失败。遇到业务规则不清晰时，应把问题标记为待确认，而不是直接把推断写入 active 意图。

## 不实现范围

- 不定义项目架构事实。
- 不替代质量报告。
- 不调度演进台账。
- 不把临时测试输出写入稳定项目态。
