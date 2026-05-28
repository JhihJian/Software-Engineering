# 编码规范

> 归属：[TEST_ARCHITECTURE.md](../meta/TEST_ARCHITECTURE.md) · 编码规范

---

## 命名规范

### 文件命名

| 类型 | 规则 | 示例 |
|---|---|---|
| 测试意图 | `{功能}-{场景}.yaml` | `login-success.yaml` |
| API 用例 | `{功能}.spec.ts` | `auth.spec.ts` |
| Web E2E 用例 | `{功能}.spec.ts` | `login.spec.ts` |
| API Client | `{模块名}Api.ts` | `AuthApi.ts` |
| Page Object | `{页面名}Page.ts` | `LoginPage.ts` |
| 测试数据 | `{用途}.ts` | `users.ts` |
| 操作技能 | `{操作}.md` | `login.md` |
| 经验记录 | `{YYYY-MM-DD}-{主题}.md` | `2026-05-19-login-flaky.md` |

### 用例命名

**MUST** 遵循格式：`{功能} - {场景描述结果}`

```typescript
test('登录 - 正确账号密码跳转首页', ...);
test('登录 - 错误密码提示密码不正确', ...);
test('登录 - 未填手机号时提交按钮不可用', ...);
test('下单 - 库存不足时提示缺货', ...);
```

---

## API Client 规范

### 示例

```typescript
export class AuthApi {
  constructor(private request: APIRequestContext) {}

  async login(account: string, password: string) {
    return this.request.post('/api/identity/auth/login', {
      data: { account, password },
    });
  }
}
```

### 规则

- API Client **MUST** 放在 `project/support/clients/`
- API Client **MUST** 只封装接口调用，**MUST NOT** 封装断言
- API Client 方法名 **MUST** 使用业务语言（`login()`、`createUser()`、`publishVulnerability()`）
- spec **MUST NOT** 直接散落裸 `request.post()` / `request.get()`；新增接口调用前先检查是否已有可复用 API Client
- API Client **SHOULD** 返回原始 response 或统一 response helper 的结果，断言留在 spec 或 `project/support/utils/assertions.ts`

---

## 选择器规范

**MUST** 按以下优先级选取，优先使用语义选择器：

```
1. page.getByTestId('xxx')                          最稳定，需前端配合加 data-testid
2. page.getByRole('button', { name: '提交' })        语义清晰，无障碍友好
3. page.getByLabel('手机号')                         表单场景首选
4. page.getByPlaceholder('请输入手机号')              label 缺失时的替代
5. page.getByText('登录')                            文本在页面中唯一时可用
6. page.locator('.submit-btn')                       最后手段
```

使用第 6 级时，**MUST** 在代码旁注释说明无法使用更高优先级选择器的原因。

以下选择器 **MUST NOT** 使用：

- 依赖节点位置的 XPath（如 `/div[3]/span[1]`）
- `nth-child`、`nth-of-type`
- 超过 3 层的 CSS 层级选择器
- 坐标点击（`page.mouse.click(x, y)`）

---

## Page Object 规范

### 示例

```typescript
export class LoginPage {
  constructor(private page: Page) {}

  private phoneInput    = () => this.page.getByTestId('phone-input');
  private passwordInput = () => this.page.getByTestId('password-input');
  private submitButton  = () => this.page.getByRole('button', { name: '登录' });

  async navigate() {
    await this.page.goto('/login');
  }

  async login(phone: string, password: string) {
    await this.phoneInput().fill(phone);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }
}
```

### 规则

- **MUST** 只封装操作，**MUST NOT** 封装断言（`expectXxx()` 不属于 Page Object）
- 选择器 **MUST** 全部声明为 `private`，外部只能调用方法
- 方法名 **MUST** 使用业务语言（`login()`、`submitOrder()`），**MUST NOT** 使用技术语言（`clickButton()`、`fillInput()`）
- **SHOULD** 对应一个页面或独立组件，**SHOULD NOT** 跨页面聚合

