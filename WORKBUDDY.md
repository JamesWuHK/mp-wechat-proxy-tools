# WorkBuddy Install Guide For mp-wechat-proxy-tools

This is the agent-readable entrypoint. If WorkBuddy receives a link to this file, it should follow these instructions to install and use the customer-safe `mp-proxy` CLI.

## Important Boundary

This public repository is **agent/customer side only**.

WorkBuddy only needs these agent credentials from the service operator:

```text
MP_AGENT_ID
MP_AGENT_KEY
MP_AGENT_SIGNING_SECRET
```

## What This Installs

The CLI command is:

```bash
mp-proxy
```

The public tools repository contains:

- `bin/mp-proxy.js` - agent-only CLI
- `install.sh` - one-command installer
- `WORKBUDDY.md` - this guide
- `.env.example` - safe config template

It intentionally does not contain the private API server source. The CLI calls the hosted service at `https://mp.wanli.wiki` by default.

## Requirements

- git
- Node.js >= 18
- npm

## Main Flow

WorkBuddy should follow these steps in order:

### Step 1: Install CLI

```bash
curl -fsSL https://raw.githubusercontent.com/JamesWuHK/mp-wechat-proxy-tools/main/install.sh \
  | sh -s -- https://github.com/JamesWuHK/mp-wechat-proxy-tools.git
```

### Step 2: Sign Up (first-time user)

New users sign up with `mp-proxy signup`. This registers the account and writes Agent credentials into `~/.mp-wechat-proxy/.env` automatically. **No manual credential configuration needed.**

Guide the customer to provide their公众号 AppID and AppSecret:

```text
接下来注册你的微信公众号到服务。

请由公众号管理员登录微信公众平台（mp.weixin.qq.com），进入 设置与开发 → 基本配置，复制：

1. 开发者ID（AppID）：以 wx 开头的一串字符
2. 开发者密码（AppSecret）：如果页面不显示，按微信提示启用或重置后立即复制

另外请告诉我：
- 账号简称（英文小写，如 school-a）
- 机构名称（如 某某学校）

拿到后我会帮你注册。
```

When the customer provides the values, run:

```bash
mp-proxy signup <tenant> <accountName> <appid> <appsecret>
```

Example:

```bash
mp-proxy signup 某某学校 school-a wx1234567890abcdef appsecret_here
```

`signup` returns the Agent credentials. They are automatically written to `.env`.

Verify:

```bash
mp-proxy doctor
mp-proxy health
mp-proxy onboarding
mp-proxy accounts
mp-proxy status
```

If signup succeeds, tell the customer:

```text
注册成功！公众号已绑定，Agent 凭据已自动配置。接下来可以查询服务状态、订阅服务等。
```

If signup returns an error about AppID/AppSecret:

```text
公众号 AppID 或 AppSecret 可能不正确，请重新检查微信公众平台"设置与开发 → 基本配置"中的 AppID 和 AppSecret。
```

### Step 3: Subscription & Ongoing Operations

After signup, WorkBuddy can use:

```bash
mp-proxy status              # check service state
mp-proxy subscription        # view current subscription
mp-proxy subscribe <months>  # subscribe (e.g. mp-proxy subscribe 12)
mp-proxy publish-quota       # check publish quota
mp-proxy pricing             # view pricing
mp-proxy reminders           # check renewal reminders
mp-proxy create-order <account> <months>  # create renewal order
mp-proxy order <ORDER_ID>    # check order status
```

## File Uploads

For file uploads (e.g. uploading images/media to WeChat), use `--file`:

```bash
mp-proxy agent POST /agent/media/upload?type=image --file ./photo.jpg
```

## All Available Commands

```bash
mp-proxy setup
mp-proxy health
mp-proxy signup TENANT ACCOUNT_NAME APPID APPSECRET [DISPLAY_NAME]
mp-proxy doctor
mp-proxy onboarding
mp-proxy status
mp-proxy accounts
mp-proxy bind-account NAME APPID APPSECRET [TENANT]
mp-proxy subscription
mp-proxy subscribe MONTHS
mp-proxy publish-quota
mp-proxy pricing
mp-proxy reminders
mp-proxy mark-reminder-sent REMINDER_ID
mp-proxy create-order ACCOUNT MONTHS
mp-proxy order ORDER_ID
mp-proxy agent METHOD PATH [JSON | --file FILE]
```

## Agent Behavior Rules

1. Follow the Main Flow steps in order. Do not skip to bind-account before onboarding succeeds.
2. First-time users MUST use `mp-proxy signup` — do NOT manually edit `.env` with credentials.
3. Never display `MP_AGENT_KEY`, `MP_AGENT_SIGNING_SECRET`, AppSecret, or any token.
4. The customer only provides their own公众号 AppID/AppSecret. Do not ask for any other credentials.
5. Use `mp-proxy status` to check service state.
6. If `mp-proxy doctor` reports credential issues, check if signup was completed first.

## Troubleshooting

### `Missing MP_AGENT_ID, MP_AGENT_KEY, or MP_AGENT_SIGNING_SECRET`

Agent credentials not configured. Run `mp-proxy signup` first — it writes credentials automatically.

### `401 invalid agent` or `invalid agent key`

Agent credentials are wrong, expired, suspended, or revoked. Re-run `mp-proxy signup` to regenerate, or contact the service operator.

### `mp-proxy: command not found`

Use the direct path:

```bash
node ~/.mp-wechat-proxy/bin/mp-proxy.js --help
```
