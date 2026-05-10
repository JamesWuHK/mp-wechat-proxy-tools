# WorkBuddy Install Guide For mp-wechat-proxy-tools

This is the agent-readable entrypoint. If WorkBuddy receives a link to this file, it should follow these instructions to install and use the customer-safe `mp-proxy` CLI.

## Important Boundary

This public repository is **agent/customer side only**.

First-time customers do **not** need pre-issued Agent credentials.

WorkBuddy should start with `mp-proxy signup ...`. Signup creates the customer Agent, binds the first公众号, and writes Agent credentials locally.

## What This Installs

The CLI command is:

```bash
mp-proxy
```

The public tools repository contains:

- `bin/mp-proxy.js` - agent-only CLI
- `install.sh` - one-command installer
- `WORKBUDDY.md` - this guide
- `CLI_HELP.md` - short command-oriented CLI reference for agents
- `.env.example` - safe config template

It intentionally does not contain the private API server source. The CLI calls the hosted service at `https://mp.wanli.wiki` by default.

## Pricing

The current pricing is maintained by the service-side admin API and should be read from:

```bash
mp-proxy subscription
```

The default product policy is:

- Free trial article quota
- First paid month price
- Recurring monthly price from month 2 onward
- Included公众号 count in the base plan
- Extra monthly price for each公众号 above the included count

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

For a first-time customer, WorkBuddy usually does not edit this file manually. Run signup first:

```bash
mp-proxy signup "某机构" school-a wx... appsecret... "某机构"
```

On success, signup writes the Agent credentials into `~/.mp-wechat-proxy/.env` automatically:

```text
MP_PROXY_BASE_URL=https://mp.wanli.wiki
MP_AGENT_ID=...
MP_AGENT_KEY=...
MP_AGENT_SIGNING_SECRET=...
```

## Main Flow

After installation, WorkBuddy should follow this main flow:

```bash
mp-proxy signup "某机构" school-a wx... appsecret... "某机构"
mp-proxy onboarding
mp-proxy accounts
mp-proxy subscription
```

For the shortest command reference, read:

```text
CLI_HELP.md
```

This is the default self-serve flow. The customer does not need a pre-created Agent credential package. The signup call creates the first bound公众号 and returns the Agent credentials automatically.

For each additional公众号, WorkBuddy should immediately guide the customer to retrieve their公众号 `AppID` and `AppSecret` from 微信公众平台 → 设置与开发 → 基本配置, then run:

```bash
mp-proxy bind-account <accountName> <appid> <appsecret> <tenant>
```

After binding, confirm with:

```bash
mp-proxy accounts
mp-proxy status
mp-proxy subscription
```

If `mp-proxy` is not globally available, use:

```bash
node ~/.mp-wechat-proxy/bin/mp-proxy.js --help
node ~/.mp-wechat-proxy/bin/mp-proxy.js health
```



## If `mp-proxy onboarding` Returns `invalid agent`

This is a recovery path, not the normal first-time path.

Normal first-time path:

```bash
mp-proxy signup "某机构" school-a wx... appsecret... "某机构"
```

Signup should create and save Agent credentials automatically. If onboarding later returns `invalid agent`, WorkBuddy should do exactly this:

1. Run:

```bash
mp-proxy doctor
```

2. If `hasAgentId`, `hasAgentKey`, or `hasAgentSigningSecret` is `false`, rerun the normal signup flow. Do not ask the customer for service-side credentials.

3. If all three fields are present but `mp-proxy onboarding` still returns `invalid agent`, tell the customer:

```text
CLI 已安装成功，但当前自动注册生成的 Agent 凭据没有被服务端认可，可能是已过期、被停用或本地 .env 被覆盖。请联系服务方重新生成或恢复该 Agent。
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

# self-serve signup for first公众号
mp-proxy signup "某机构" school-a wx... appsecret... "某机构"

# signed agent calls, require MP_AGENT_* credentials
mp-proxy onboarding
mp-proxy status
mp-proxy accounts
mp-proxy subscription
mp-proxy publish-quota
mp-proxy pricing
mp-proxy subscribe 1
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
3. Use `mp-proxy signup` as the default first-step self-serve onboarding flow.
4. Use `mp-proxy bind-account` to add additional公众号.
5. Use `mp-proxy subscription` to explain free quota and paid pricing.
6. Use `mp-proxy status` to check service state.
7. If Agent credentials are missing for a first-time customer, run signup instead of asking the customer for service-side credentials.

## Troubleshooting

### `Missing MP_AGENT_ID, MP_AGENT_KEY, or MP_AGENT_SIGNING_SECRET`

For a first-time customer, this means signup has not completed yet. Run:

```bash
mp-proxy signup "<tenant>" <account_name> <appid> <appsecret> [display_name]
```

If signup already succeeded before and the local `.env` was lost, rerun signup or ask the service operator to restore that Agent.

### `401 invalid agent` or `invalid agent key`

If signup has not completed yet, run signup first. If signup did complete and `.env` contains `MP_AGENT_ID`, `MP_AGENT_KEY`, and `MP_AGENT_SIGNING_SECRET`, the Agent may be expired, suspended, or revoked. Ask the service operator to rotate or reactivate that Agent.
