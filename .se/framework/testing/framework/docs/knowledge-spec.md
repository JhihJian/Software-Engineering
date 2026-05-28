# 知识层规范

> 归属：[TEST_ARCHITECTURE.md](../meta/TEST_ARCHITECTURE.md) · 知识层

---

## docs/ 文档规范

| 文件 | 内容 | 更新时机 |
|---|---|---|
| `test-strategy.md` | 覆盖范围、优先级矩阵、排除项 | 需求变更时 |
| `business-rules.md` | 业务逻辑约束，断言的依据来源 | 业务规则变化时 |
| `known-issues.md` | 已知问题：描述 + 影响范围 + 临时规避方案 | 发现时即时更新 |
| `flaky-cases.md` | 不稳定用例：用例名 + 失败频率 + 可疑原因 + 状态 | 稳定性分析后更新 |

`docs/` 下的文件 **MUST NOT** 在未经 review 的情况下写入；草稿在 review 前不得视为知识库的一部分。

---

## skills/ 操作指引规范

`skills/` 存放跨用例可复用的操作知识，如登录流程、文件上传、弹窗处理等。skills 是知识层，不是代码层——Page Object 是 skills 的代码实现，两者通过 `related_page_object` 字段互相关联，不互相替代。

每个 skill 文件 **MUST** 包含以下结构：

```markdown
---
skill: {操作名称}
version: 1
related_page_object: pages/{XxxPage}.ts
---

## 适用场景
描述什么时候应当使用这个 skill。

## 操作步骤
1. ...
2. ...

## 已知注意事项
- 列出操作过程中的已知问题和规避方式。
```

---

## docs/memory/ 经验沉淀规范

### 触发条件

以下情况发生时，**SHOULD** 在 `docs/memory/` 新增一条记录：

- 一次失败分析完成，根因已确认
- 新增了一个非显而易见的 skill 或 Page Object 用法
- 发现一类共性的选择器失效模式或测试稳定性规律

### 格式

文件命名 **MUST** 遵循：`{YYYY-MM-DD}-{主题}.md`

每条记录 **MUST** 包含以下结构：

```markdown
---
date: YYYY-MM-DD
topic: {主题}
status: draft | reviewed
---

## 背景
这次遇到了什么问题，在什么上下文中发现的。

## 根因
最终确认的原因，区分根因和表象。

## 处理方式
怎么解决的，或者决定接受并记录的理由。

## 影响范围
哪些用例、哪些页面受影响，是否需要更新 known-issues.md。
```

`status: reviewed` 的记录 **MUST** 进入 git。`status: draft` 的记录 **SHOULD** 尽快完成 review，不得长期停留在草稿状态。

