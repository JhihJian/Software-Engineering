# Testing Workflow

本文件是测试工程 Agent 的运行入口。普通测试任务优先读取本文件，再按需懒加载其他文档。

## 主流程

1. 判断任务类型：新增测试意图、实现测试、维护测试知识、诊断失败或更新项目测试配置。
2. 读取 `.se/project/testing/docs/test-strategy.md` 和相关业务规则。
3. 新增或修改测试前，检查 `.se/project/testing/intentions/` 是否已有对应意图。
4. 实现执行层时，按需读取 `framework/docs/execution-spec.md`、`coding-spec.md` 和 `failure-spec.md`。
5. API 测试写入 `.se/project/testing/specs/api/`，契约测试写入 `.se/project/testing/specs/contract/`，Web E2E 写入 `.se/project/testing/specs/e2e/`。
6. 共享能力写入 `.se/project/testing/support/`，不要在 spec 中重复硬编码数据、客户端或页面对象。
7. 运行意图校验和相关测试命令。
8. 汇报事实、推断、待确认问题和证据路径。

## 懒加载规则

- 意图 Schema：读取 `framework/docs/intention-spec.md`。
- 执行规范：读取 `framework/docs/execution-spec.md`。
- 失败处理：读取 `framework/docs/failure-spec.md`。
- 代码风格：读取 `framework/docs/coding-spec.md`。
- AI 辅助边界：读取 `framework/docs/ai-spec.md`。
- 长期框架规范：只有维护框架时读取 `framework/meta/TEST_ARCHITECTURE.md`。

## 写入边界

- 测试意图写入 `.se/project/testing/intentions/*.yaml`。
- 可执行测试写入 `.se/project/testing/specs/**`.
- 项目业务知识写入 `.se/project/testing/docs/`。
- 运行产物写入 `.se/runtime/{task}/`。
- 通用框架知识写入 `framework/docs/` 前必须经过人工确认。
