# 自动化测试工程规范

> 版本：2.0 · 日期：2026-05-19

本文档是测试工程的宪法级规范，与业务 `ARCHITECTURE.md` 平级，定义工程**如何运作**。任何实践与本规范冲突时，以本规范为准。

覆盖范围：接口自动化测试、Web E2E 自动化测试，以及二者共享的测试意图、测试数据、知识沉淀和失败处理机制。

---

## 规范性语言

本文档及所有子文档使用 RFC 2119 风格的动词表达约束强度：

| 动词 | 含义 |
|---|---|
| **MUST** | 硬性要求，不接受例外 |
| **MUST NOT** | 硬性禁止 |
| **SHOULD** | 强烈建议，偏离须记录原因 |
| **MAY** | 可选行为 |

---

## 核心架构

```
┌──────────────────────────────────────────┐
│  意图层  project/intentions/*.yaml        │
│  定义"测什么"，不绑定接口或 UI 实现方式       │
├──────────────────────────────────────────┤
│  执行层                                  │
│  project/specs/api/*.spec.ts       接口测试 │
│  project/specs/e2e/*.spec.ts       Web E2E │
│  project/specs/contract/*.spec.ts  契约测试 │
├──────────────────────────────────────────┤
│  支撑层                                  │
│  project/support/clients/  API Client     │
│  project/support/pages/    Page Object    │
│  project/support/fixtures/ 测试数据        │
│  project/support/utils/    项目通用工具     │
├──────────────────────────────────────────┤
│  知识层  framework/docs + project/docs     │
│  约束执行行为，沉淀工程经验                  │
└──────────────────────────────────────────┘
```

核心原则：**意图不因执行困难而妥协，执行不因知识缺失而随意发挥。**

同一测试意图 **MAY** 同时拥有接口 spec 和 Web E2E spec：接口 spec 验证系统行为和副作用，Web E2E spec 验证用户路径和页面交互。

---

## 目录结构

```
业务项目根目录/
├── ARCHITECTURE.md
├── src/
└── test-engineering/
    ├── TEST_ARCHITECTURE.md     # 本文档
    ├── TEST.md                  # 执行手册
    ├── playwright.config.ts
    ├── framework/               # 跨项目通用测试工程资产
    │   ├── docs/                # 通用规范
    │   └── tools/               # 通用校验工具
    └── project/                 # 当前项目测试资产
        ├── docs/                # 项目测试策略、业务规则、已知问题
        ├── intentions/          # 测试意图（*.yaml）
        ├── cases/               # 设计级用例库
        ├── specs/               # API / Contract / Web E2E spec
        ├── setup/               # 运行生命周期
        └── support/             # clients、fixtures、pages、utils
```

---

## 子文档索引

| 子文档 | 覆盖内容 |
|---|---|
| [framework/docs/intention-spec.md](framework/docs/intention-spec.md) | 意图 Schema、生命周期状态机、数据引用约定 |
| [framework/docs/execution-spec.md](framework/docs/execution-spec.md) | Spec 编写规范、与意图的绑定机制、执行产出要求 |
| [framework/docs/knowledge-spec.md](framework/docs/knowledge-spec.md) | docs/ 文档规范、skills/ 格式、memory/ 沉淀规范 |
| [framework/docs/ai-spec.md](framework/docs/ai-spec.md) | AI 辅助场景、prompt 模板格式、禁止行为 |
| [framework/docs/failure-spec.md](framework/docs/failure-spec.md) | 失败分类、退回机制、处理路径 |
| [framework/docs/coding-spec.md](framework/docs/coding-spec.md) | 命名规范、选择器优先级、Page Object 规范 |

---

## 测试类型

| 类型 | 目录 | 目标 | 主要断言 |
|---|---|---|---|
| API 测试 | `project/specs/api/` | 验证后端接口、权限、数据落库、对象存储、副作用 | HTTP 响应、数据库状态、对象存储状态、审计日志 |
| Web E2E 测试 | `project/specs/e2e/` | 验证用户通过浏览器完成业务流程 | 页面状态、跳转、可见内容、用户交互结果 |
| Contract 测试 | `project/specs/contract/` | 验证接口契约稳定性 | OpenAPI schema、字段类型、错误码、兼容性 |

---

## 不变量

以下规则在任何情况下 **MUST** 成立：

1. `project/specs/api`、`project/specs/e2e`、`project/specs/contract` **MUST NOT** 依赖任何运行时 AI 调用
2. AI 产出未经 review **MUST NOT** 进入 `project/specs/` 执行层或 `framework/docs/`、`project/docs/` 知识库
3. 测试 pass/fail **MUST** 由测试框架断言结果决定，不得由人工豁免或 AI 推断替代
4. 测试数据 **MUST** 只来自 `project/support/fixtures/` 或 API 造数接口，**MUST NOT** 在用例中硬编码
5. 新增用例 **MUST** 检查是否已有可复用的 API Client、Page Object 和 Fixture，重复实现视为不合规
6. 意图文件内容 **MUST NOT** 因实现困难而修改，只有业务需求变化才是合法的修改理由
7. Spec 文件头部的 intention version **MUST** 与意图文件的 `version` 字段保持一致

---

## 设计取舍

**本规范当前覆盖**：接口自动化测试、Web E2E 自动化测试、可选接口契约测试、测试意图管理、测试数据与知识沉淀、失败分类与处理路径。

**本规范暂不覆盖**：性能测试、安全扫描、混沌测试、大规模并发压测、跨浏览器矩阵策略、CI/CD 集成（后续迭代）、多环境切换。

**已知局限**：意图 version 与 spec 对齐当前依赖手工维护；CI 集成阶段 **SHOULD** 加入 lint 自动检查。

---

## 范围与技术栈

- 框架：Playwright + TypeScript
- API 测试：Playwright `request` fixture / `APIRequestContext`
- Web E2E 测试：Playwright browser/page
- 旁路校验：MySQL client、MinIO SDK 或测试工具封装
- AI 辅助：不绑定工具，规范通用于任何 LLM 工具
- CI：第一版不做，后续迭代加入
