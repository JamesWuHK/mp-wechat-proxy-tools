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

### Step 2: Configure Agent Credentials

Edit `~/.mp-wechat-proxy/.env` and fill in:

```text
MP_PROXY_BASE_URL=https://mp.wanli.wiki
MP_AGENT_ID=agent_xxx
MP_AGENT_KEY=...
MP_AGENT_SIGNING_SECRET=...
```

If the customer does not have these values:

```text
请联系服务方为你的 WorkBuddy 生成 Agent 凭据。
```

Verify:

```bash
mp-proxy doctor
mp-proxy health
mp-proxy onboarding
```

If `mp-proxy onboarding` returns `invalid agent`, the credentials are placeholders or expired. Tell the customer:

```text
CLI 已安装成功，但当前 Agent 凭据没有被服务端认可。请联系服务方重新生成 Agent 凭据，拿到后填入 ~/.mp-wechat-proxy/.env。
```

### Step 3: Bind Customer WeChat Official Account

This is the core step. After Agent credentials are valid, WorkBuddy should immediately check if the customer has bound a公众号:

```bash
mp-proxy accounts
```

If no accounts are bound, WorkBuddy should guide the customer to provide their公众号 AppID and AppSecret:

```text
接下来需要绑定你的微信公众号。请由公众号管理员登录微信公众平台（mp.weixin.qq.com），进入 设置与开发 → 基本配置，复制：

1. 开发者ID（AppID）：以 wx 开头的一串字符
2. 开发者密码（AppSecret）：如果页面不显示，按微信提示启用或重置后立即复制

另外请告诉我：
- 账号简称（英文小写，如 school-a）
- 机构名称（如 某某学校）

拿到后我会帮你完成绑定。
```

When the customer provides the values, run:

```bash
mp-proxy bind-account <accountName> <appid> <appsecret> <tenant>
```

Example:

```bash
mp-proxy bind-account school-a wx1234567890abcdef appsecret_here 某某学校
```

After binding, confirm:

```bash
mp-proxy accounts
mp-proxy status
```

Tell the customer:

```text
公众号绑定成功。接下来可以查询服务状态、查看到期提醒或创建续费订单。
```

If binding returns an error about credentials:

```text
公众号 AppID 或 AppSecret 可能不正确，请重新检查微信公众平台"设置与开发 → 基本配置"中的 AppID 和 AppSecret。
```

### Step 4: Ongoing Operations

After binding, WorkBuddy can use:

```bash
mp-proxy status              # check service state
mp-proxy reminders           # check renewal reminders
mp-proxy create-order <account> <months>  # create renewal order
mp-proxy order <ORDER_ID>    # check order status
```

## CLI Limitations

- `mp-proxy agent` only supports JSON body. Multipart file uploads (e.g. uploading images/media to WeChat) are not supported through the CLI.
- For operations requiring file uploads, use the WeChat Official Account backend directly or contact the service operator.

## All Available Commands

```bash
mp-proxy setup
mp-proxy health
mp-proxy doctor
mp-proxy onboarding
mp-proxy status
mp-proxy accounts
mp-proxy bind-account NAME APPID APPSECRET [TENANT]
mp-proxy reminders
mp-proxy mark-reminder-sent REMINDER_ID
mp-proxy create-order ACCOUNT MONTHS
mp-proxy order ORDER_ID
mp-proxy agent METHOD PATH [JSON]
```

## Agent Behavior Rules

1. Follow the Main Flow steps in order. Do not skip to bind-account before onboarding succeeds.
2. Never display `MP_AGENT_KEY`, `MP_AGENT_SIGNING_SECRET`, AppSecret, or any token.
3. The customer only provides their own公众号 AppID/AppSecret. Do not ask for any other credentials.
4. Use `mp-proxy status` to check service state.
5. If credentials are invalid, tell the customer to contact the service operator.

## Troubleshooting

### `Missing MP_AGENT_ID, MP_AGENT_KEY, or MP_AGENT_SIGNING_SECRET`

Agent credentials not configured. Ask the service operator to generate them.

### `401 invalid agent` or `invalid agent key`

Agent credentials are wrong, expired, suspended, or revoked. Ask the service operator to regenerate.

### `mp-proxy: command not found`

Use the direct path:

```bash
node ~/.mp-wechat-proxy/bin/mp-proxy.js --help
```
