# se.testing

`se.testing` 把测试意图、执行层和测试知识分离，帮助 Agent 构建可追溯、可复用、可执行的自动化验证体系。它当前以 Playwright + TypeScript 为默认执行栈，同时保留接口测试、契约测试和 Web E2E 测试的分层约束。

## 运行过程

1. Agent 读取稳定入口 `.se/framework/testing/framework/prompts/testing.md`。
2. Agent 按入口指向读取 `.se/framework/testing/framework/guides/workflow.md`。
3. Agent 根据任务懒加载 `framework/guides/execution.md`、`framework/docs/*.md` 和项目测试文档。
4. Agent 在 `.se/project/testing/intentions/` 维护测试意图，在 `.se/project/testing/specs/` 维护可执行测试。
5. Agent 用工具校验测试意图与执行层绑定关系。

## 标准目录

```text
se.testing/
  README.md
  framework/
    meta/
    prompts/
    guides/
    docs/
    tools/
  project.template/
```

## Agent 入口

```text
.se/framework/testing/framework/prompts/testing.md
```

运行时主流程：

```text
.se/framework/testing/framework/guides/workflow.md
```

## 最小初始化

```bash
mkdir -p .se/framework .se/project .se/runtime
cp -r se.testing .se/framework/testing
cp -r .se/framework/testing/project.template .se/project/testing
npm install
npm run test:intentions
```

接入具体项目后，应先更新 `.se/project/testing/docs/test-strategy.md`、`.se/project/testing/docs/business-rules.md` 和 `playwright.config.ts`。运行产物写入 `.se/runtime/{task}/`。
