# AI 辅助规范

> 归属：[TEST_ARCHITECTURE.md](../meta/TEST_ARCHITECTURE.md) · AI 辅助

AI 工具是测试工程的辅助手段，不是执行主体。所有 AI 产出都是草稿，**MUST** 经过 review 才能进入正式文件。本规范不预设使用什么工具——Claude Code、Cursor 或其他工具均适用，prompt 模板是通用合约。

---

## 使用场景

| 场景 | 输入 | 模板 | 产出 |
|---|---|---|---|
| PRD → 测试意图 | PRD 文档 + 业务规则 | `docs/ai/prd-to-test-cases.md` | `intentions/*.yaml` 草稿（`status: draft`）|
| 意图 → API 测试脚本 | yaml 文件 + API Client 现状 | `docs/ai/test-case-to-api-spec.md` | `api/*.spec.ts` 草稿 |
| 意图 → Web E2E 脚本 | yaml 文件 + Page Object 现状 | `docs/ai/test-case-to-e2e-spec.md` | `e2e/*.spec.ts` 草稿 |
| 失败分析 | 报错信息 + 截图 + 执行 Trace | `docs/ai/failure-analysis.md` | 失败原因分析报告 |
| Bug → 回归意图 | bug 描述 + 复现步骤 | `docs/ai/bug-to-regression.md` | `intentions/bug-*.yaml` 草稿（`status: draft`）|

---

## prompt 模板格式

每个模板文件 **MUST** 包含以下 front-matter，随工程代码一起进入版本控制：

```markdown
---
template: {模板标识}
version: 1
input_required:
  - {输入项}：{格式说明}
output_format: {期望产出的格式和结构}
constraints:
  - {不得违反的规则}
review_checklist:
  - {拿到产出后的验收项}
---

（模板正文）
```

当业务规则或意图 Schema 发生变化时，相关模板的 `version` **MUST** 同步递增。

---

## 禁止行为

以下行为 **MUST NOT** 发生，不论产出来自 AI 还是手动编写：

| 禁止行为 | 原因 |
|---|---|
| 修改 `status` 为 `reviewed` 或 `active` 的意图文件 | 意图是业务共识，不因实现困难而变更 |
| 删除或弱化断言使用例通过 | 掩盖问题，破坏测试真实性 |
| 未分析根因便跳过失败用例（skip / fixme） | 遮蔽信号，制造虚假通过率 |
| 将未经 review 的分析结果写入 `docs/` 知识库 | 草稿不等于结论 |
| 由 AI 判定测试是否通过 | pass/fail 由 Playwright 断言决定，AI 只参与根因分析 |

