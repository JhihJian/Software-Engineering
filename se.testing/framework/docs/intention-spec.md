# 意图层规范

> 归属：[TEST_ARCHITECTURE.md](../meta/TEST_ARCHITECTURE.md) · 意图层

---

## Schema

每条意图是一个独立的 YAML 文件，字段规范如下：

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `name` | string | **MUST** | 全局唯一，与文件名（去掉 .yaml）语义一致 |
| `version` | integer | **MUST** | 初始为 1，每次内容变更递增 |
| `priority` | enum | **MUST** | 仅接受 `P0` / `P1` / `P2` |
| `status` | enum | **MUST** | 见生命周期一节，有效值：`draft` / `reviewed` / `active` / `needs_update` / `deprecated` |
| `precondition` | string | **MUST** | 描述前置状态和数据来源，不得为空 |
| `steps` | string[] | **MUST** | 至少 1 条；具体数据须使用 `{{}}` 占位引用 fixtures |
| `assertions` | string[] | **MUST** | 至少 1 条，描述业务结果，不得描述技术实现细节 |
| `edge_cases` | string[] | **SHOULD** | 暂无时写 `[]` 并注明原因 |
| `tags` | string[] | **MAY** | 用于按维度筛选，如 `[smoke, checkout]` |

### 完整示例

```yaml
name: 用户登录成功
version: 1
priority: P0
status: reviewed
precondition: 已有注册账号，数据来自 fixtures/users.ts 的 validUser
steps:
  - 打开登录页
  - 输入手机号 {{users.validUser.phone}}
  - 输入密码 {{users.validUser.password}}
  - 点击登录按钮
assertions:
  - 页面跳转到首页
  - 右上角显示用户昵称
edge_cases:
  - 网络慢时登录按钮应禁用，防止重复提交
  - 密码错误超过 5 次时账号应被锁定
tags: [smoke, auth]
```

---

## 数据引用约定

steps 中的具体数据值 **MUST** 使用 `{{fixtures路径}}` 格式引用，指向 `project/support/fixtures/` 下的具体字段。意图文件 **MUST NOT** 硬编码账号、密码、手机号等具体数据，以保证意图在测试数据变化时无需修改。

---

## 生命周期

```
                  ┌──────────────────────────────────────┐
                  │ 业务变更 / 断言偏差                    │
                  ▼                                      │
draft ──────► reviewed ──────► active ──────► needs_update
                  │                │
                  │ 功能下线        │ 功能下线
                  └────────────────┴──────────► deprecated
```

| 状态 | 含义 | 进入条件 | 允许的操作 |
|---|---|---|---|
| `draft` | 草稿，未经确认 | 新建或 AI 生成 | 修改所有字段 |
| `reviewed` | 已确认，可触发 spec 生成 | 内容经过 review，业务意图无误 | 触发 spec 生成；发现问题可退回 `draft` |
| `active` | 对应 spec 存在且稳定运行 | spec 已生成并通过首次执行 | 执行；记录失败；业务变更置为 `needs_update` |
| `needs_update` | 意图已过期，需要修订 | 业务变更、断言失效、功能重构 | 修订内容，递增 `version`，重新 review |
| `deprecated` | 已废弃，不再执行 | 对应功能下线 | 归档，**MUST NOT** 删除（保留变更历史） |

### 关键约束

- 意图内容 **MUST NOT** 因执行困难而修改；只有业务需求变化才是合法的修改理由
- `draft` 状态的意图 **MUST NOT** 触发 spec 生成
- 意图进入 `active` 后，`version` **MUST** 与对应 spec 头部注释的版本号一致

