# 执行层规范

> 归属：[TEST_ARCHITECTURE.md](../meta/TEST_ARCHITECTURE.md) · 执行层

---

## 与意图的绑定

每个 spec 文件头部 **MUST** 以注释标注对应意图文件的 `name` 和 `version`：

```typescript
// intention: login-success.yaml (v1)
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { validUser } from '../fixtures/users';

test('登录 - 正确账号密码跳转首页', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(validUser.phone, validUser.password);
  await expect(page).toHaveURL('/home');
  await expect(page.getByTestId('user-nickname')).toBeVisible();
});
```

当意图文件的 `version` 递增时，spec 头部的版本号 **MUST** 同步更新。版本不一致视为该 spec 处于过期状态，**MUST** 在下次修改时对齐。

> **已知技术债**：version 对齐当前依赖手工维护。CI 集成阶段 **SHOULD** 加入 lint 自动校验。

---

## 通用编写规则

- 断言 **MUST** 只写业务结果，**MUST NOT** 依赖实现细节（class 名、DOM 层级等）
- 一个 spec 文件 **SHOULD** 对应一个功能模块，不跨模块聚合
- 执行层 **MUST NOT** 在运行时调用任何外部 AI 服务
- AI 生成的 spec 草稿 **MUST** 经过 review 后才能提交，**MUST NOT** 直接合入

## API Spec 编写规则

- API spec **MUST** 放在 `project/specs/api/`
- API spec **MUST** 使用 `project/support/clients/` 中的 API Client，**MUST NOT** 在用例中散落裸 `request.post()` / `request.get()`
- API spec **MUST** 校验业务副作用，例如数据库、MinIO、审计日志
- 测试数据 **MUST** 来自 `project/support/fixtures/` 或造数 API
- API spec **SHOULD** 优先覆盖 P0 业务规则和权限边界
- API spec **MAY** 使用 `project/support/utils/` 中的 MySQL、MinIO、环境探活工具进行旁路校验

## Web E2E Spec 编写规则

- Web E2E spec **MUST** 放在 `project/specs/e2e/`
- Web E2E spec 里 **MUST NOT** 出现选择器，全部通过 Page Object 操作
- Web E2E spec **MUST** 通过 `project/support/pages/` Page Object 操作页面
- 页面断言 **MUST** 使用用户可观察结果，例如 URL、可见文本、可访问角色、业务状态

---

## 执行产出规范

每次自动化测试执行 **MUST** 产出以下证据：

- 结构化测试报告（HTML 或 JSON），包含每条用例的 pass/fail 状态
- 失败用例的执行 Trace（`.zip` 格式，用于 Playwright Trace Viewer 回放）

Web E2E 测试失败时还 **MUST** 产出失败截图（**MUST NOT** 在 playwright.config.ts 中关闭）。

以下产出 **SHOULD** 包含：

- 每次执行的用例统计汇总（总数 / 通过 / 失败 / 跳过）

以下产出 **MAY** 包含：

- 视频录制（仅调试复杂交互时开启，**SHOULD NOT** 作为常规产出）

**pass/fail 的最终判定 MUST 由 Playwright 断言结果决定**，不得由人工豁免或 AI 推断替代。

