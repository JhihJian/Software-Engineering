# 失败处理规范

> 归属：[TEST_ARCHITECTURE.md](../meta/TEST_ARCHITECTURE.md) · 失败处理

用例失败时，**MUST** 根据失败类型走对应的处理路径，**MUST NOT** 未经分类直接修改 spec 代码。

---

## 失败分类与处理路径

| 失败类型 | 判断特征 | 处理路径 |
|---|---|---|
| 选择器失效 | 元素找不到，页面结构变化 | 更新 Page Object → 重跑 |
| 环境 / 网络抖动 | 间歇性失败，无规律 | 记录 flaky-cases.md → 分析稳定性 |
| 业务逻辑变更 | 断言期望值与现实不符，需求已变化 | 将意图置为 `needs_update` → 修订意图 → 重新生成 spec |
| 断言设计偏差 | 意图理解有误，测了错误的点 | 将意图退回 `draft` → 修正意图 → 重新 review |
| 测试数据问题 | 数据状态异常或 fixtures 缺失 | 修复 fixtures 或造数逻辑 |

---

## 退回机制

核心原则：尽量在当前层解决，当前层无法解决时才退回上层，**MUST NOT** 跨层跳跃。

```
执行层失败
  ├─ 选择器 / PO 问题    → 修 pages/
  ├─ 数据问题            → 修 fixtures/
  ├─ 环境抖动            → 记录 flaky-cases.md
  └─ 以上都不是          → 退回意图层
       ├─ 断言设计偏差   → 意图退回 draft → 修正 → review
       └─ 业务变更       → 意图置为 needs_update → 修订 version → review
```

