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

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/JamesWuHK/mp-wechat-proxy-tools/main/install.sh \
  | sh -s -- https://github.com/JamesWuHK/mp-wechat-proxy-tools.git
```

If shell piping is not allowed:

```bash
curl -fsSLo /tmp/mp-wechat-proxy-install.sh https://raw.githubusercontent.com/JamesWuHK/mp-wechat-proxy-tools/main/install.sh
sh /tmp/mp-wechat-proxy-install.sh https://github.com/JamesWuHK/mp-wechat-proxy-tools.git
```

## Configure

The installer creates:

```text
~/.mp-wechat-proxy/.env
```

Put only agent credentials in it:

```text
MP_PROXY_BASE_URL=https://mp.wanli.wiki
MP_AGENT_ID=agent_xxx
MP_AGENT_KEY=...
MP_AGENT_SIGNING_SECRET=...
```

If the user does not have these values, tell them:

```text
请联系服务方为你的 WorkBuddy 生成 Agent 凭据。
```

## Verify CLI Installation

From this file, WorkBuddy should know it can install the CLI with the command in the Install section. After installation, verify with:

```bash
mp-proxy --help
mp-proxy health
mp-proxy onboarding
```

If `mp-proxy` is not globally available:

```bash
node ~/.mp-wechat-proxy/bin/mp-proxy.js --help
node ~/.mp-wechat-proxy/bin/mp-proxy.js health
```


## Add Or Bind A WeChat Official Account

When the customer says any of the following, WorkBuddy should bind a公众号:

- “添加公众号”
- “绑定公众号”
- “接入公众号”
- “我的 AppID 是 ...”
- “这是 AppSecret ...”

WorkBuddy must collect these fields:

```text
accountName: short lowercase account name, for example school-a
tenant: customer or organization display name
appid: WeChat Official Account AppID, usually starts with wx
appsecret: WeChat Official Account AppSecret
```

If the customer does not know where to find AppID/AppSecret, say:

```text
请登录微信公众平台，进入 设置与开发 → 基本配置，复制开发者ID(AppID) 和 开发者密码(AppSecret)。AppSecret 只在当前绑定流程中使用，不要发到无关群聊。
```

Then run:

```bash
mp-proxy bind-account <accountName> <appid> <appsecret> <tenant>
```

Example:

```bash
mp-proxy bind-account school-a wx1234567890abcdef appsecret_here 某某学校
```

Equivalent advanced call:

```bash
mp-proxy agent POST /agent/accounts '{"name":"school-a","tenant":"某某学校","appid":"wx1234567890abcdef","appsecret":"appsecret_here"}'
```

After binding, verify with:

```bash
mp-proxy accounts
mp-proxy status
```

If binding succeeds, tell the customer:

```text
公众号信息已保存。我已经为你绑定了这个公众号，接下来可以查询服务状态、查看到期提醒或创建续费订单。
```

If binding returns an error about credentials, tell the customer:

```text
公众号 AppID 或 AppSecret 可能不正确，请重新检查微信公众平台“设置与开发 → 基本配置”中的 AppID 和 AppSecret。
```

## Customer-Safe Commands

```bash
# public health check, no credentials needed
mp-proxy health

# signed agent calls, require MP_AGENT_* credentials
mp-proxy onboarding
mp-proxy status
mp-proxy accounts
mp-proxy bind-account school-a wx... appsecret... 某机构
mp-proxy reminders
mp-proxy mark-reminder-sent REMINDER_ID
mp-proxy create-order school-a 1
mp-proxy order ORDER_ID

# advanced direct /agent call
mp-proxy agent GET /agent/status
mp-proxy agent POST /agent/accounts '{"name":"school-a","tenant":"某机构","appid":"wx...","appsecret":"..."}'
```

## Agent Behavior Rules

2. Never display `MP_AGENT_KEY`, `MP_AGENT_SIGNING_SECRET`, AppSecret, or any token.
3. Use `mp-proxy bind-account` to add a公众号.
4. Use `mp-proxy status` to check service state.
5. If credentials are invalid, tell the customer to contact the service operator for new Agent credentials.

## Troubleshooting

### `Missing MP_AGENT_ID, MP_AGENT_KEY, or MP_AGENT_SIGNING_SECRET`

The WorkBuddy install is missing agent credentials. Ask the service operator to generate Agent credentials and place them in `~/.mp-wechat-proxy/.env`.

### `401 invalid agent` or `invalid agent key`

The agent credentials are wrong, expired, suspended, or revoked. Ask the service operator to rotate or reactivate the Agent.

