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

## Main Flow

After installation, WorkBuddy should follow this main flow:

```bash
mp-proxy --help
mp-proxy doctor
mp-proxy health
mp-proxy onboarding
mp-proxy accounts
```

If `mp-proxy accounts` shows no bound公众号, WorkBuddy should immediately guide the customer to retrieve their公众号 `AppID` and `AppSecret` from 微信公众平台 → 设置与开发 → 基本配置, then run:

```bash
mp-proxy bind-account <accountName> <appid> <appsecret> <tenant>
```

After binding, confirm with:

```bash
mp-proxy accounts
mp-proxy status
```

If `mp-proxy` is not globally available, use:

```bash
node ~/.mp-wechat-proxy/bin/mp-proxy.js --help
node ~/.mp-wechat-proxy/bin/mp-proxy.js health
```



## If `mp-proxy onboarding` Returns `invalid agent`

This means the CLI installed correctly, but the Agent credentials in `~/.mp-wechat-proxy/.env` are not real server-side credentials, are expired, or were revoked.

WorkBuddy cannot fix this by asking the customer for any other key. WorkBuddy should not ask for service-side credentials.

WorkBuddy should do exactly this:

1. Run:

```bash
mp-proxy doctor
```

2. If `hasAgentId`, `hasAgentKey`, or `hasAgentSigningSecret` is `false`, tell the customer:

```text
CLI 已安装成功，但还没有配置服务方签发的 Agent 凭据。请联系服务方获取 MP_AGENT_ID、MP_AGENT_KEY、MP_AGENT_SIGNING_SECRET，并把它们填入 ~/.mp-wechat-proxy/.env。
```

3. If all three fields are present but `mp-proxy onboarding` still returns `invalid agent`, tell the customer:

```text
CLI 已安装成功，但当前 Agent 凭据没有被服务端认可，可能是占位符、已过期、被停用或复制错误。请联系服务方重新生成 Agent 凭据。
```

4. Give the customer this handoff message to send to the service operator:

```text
请为我的 WorkBuddy 生成一组可用的 Agent 凭据：MP_AGENT_ID、MP_AGENT_KEY、MP_AGENT_SIGNING_SECRET。当前 mp-proxy doctor 显示 CLI 已安装，但 mp-proxy onboarding 返回 invalid agent。
```

5. After the service operator provides new Agent credentials, update:

```text
~/.mp-wechat-proxy/.env
```

Then verify:

```bash
mp-proxy doctor
mp-proxy onboarding
mp-proxy status
```

## Add Or Bind A WeChat Official Account

When the customer has not yet bound a公众号, or says any of the following, WorkBuddy should start the binding flow:

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

WorkBuddy should proactively ask the customer to retrieve `AppID` and `AppSecret` from the公众号后台. If the customer does not know where to find them, say:

```text
请由公众号管理员登录微信公众平台，进入 设置与开发 → 基本配置，复制开发者ID(AppID) 和 开发者密码(AppSecret)。如果 AppSecret 页面不显示，需要按微信提示启用或重置后立即复制。AppSecret 只在当前绑定流程中使用，不要发到无关群聊。
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
