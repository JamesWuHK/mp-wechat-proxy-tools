# mp-wechat-proxy-tools

Public WorkBuddy CLI for the hosted `mp-wechat-proxy` service.

This public repository intentionally does **not** contain:

- private API server source
- customer runtime data
- payment certificates

It only contains the customer/WorkBuddy CLI that calls the hosted `/agent/...` APIs with agent credentials.

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

## WorkBuddy Entry Point

Share this page with WorkBuddy:

```text
https://github.com/JamesWuHK/mp-wechat-proxy-tools/blob/main/WORKBUDDY.md
```

For a shorter command-only reference, point the agent to:

```text
https://github.com/JamesWuHK/mp-wechat-proxy-tools/blob/main/CLI_HELP.md
```

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

## First-Time Credentials

First-time signup does **not** need pre-issued Agent credentials.

WorkBuddy should install the CLI, ask the customer for their公众号 AppID/AppSecret, then run:

```bash
mp-proxy signup "某机构" school-a wx... appsecret... "某机构"
```

On success, signup automatically writes these local credentials into `~/.mp-wechat-proxy/.env`:

```text
MP_PROXY_BASE_URL=https://mp.wanli.wiki
MP_AGENT_ID=...
MP_AGENT_KEY=...
MP_AGENT_SIGNING_SECRET=...
```

Only commands after signup, such as `onboarding`, `accounts`, `subscription`, and `bind-account`, require those saved Agent credentials.

## Configure

Usually no manual config is needed before signup. If needed, initialize the local env file with:

```bash
mp-proxy setup
```


## Main Flow

After installation, WorkBuddy should follow this main flow:

```bash
mp-proxy signup "某机构" school-a wx... appsecret... "某机构"
mp-proxy onboarding
mp-proxy accounts
mp-proxy subscription
mp-proxy publish-quota
mp-proxy pricing
```

For additional公众号 after signup, WorkBuddy should ask the customer to retrieve `AppID` and `AppSecret` from 微信公众平台 → 设置与开发 → 基本配置, then run:

```bash
mp-proxy bind-account school-b wx... appsecret... 某机构
```

## If Onboarding Returns `invalid agent`

This is a recovery path, not the normal first-time path. The normal path is `mp-proxy signup ...`, which creates and saves Agent credentials automatically.

If signup already succeeded but `mp-proxy onboarding` later returns `invalid agent`, run:

```bash
mp-proxy doctor
```

If the local `MP_AGENT_*` fields are missing, rerun `mp-proxy signup ...`. If all fields exist but the server still rejects them, ask the service operator to regenerate or reactivate that Agent.


## Add A公众号

WorkBuddy should add a customer公众号 with the customer-safe agent command:

```bash
mp-proxy bind-account school-a wx... appsecret... 某机构
```

Then verify:

```bash
mp-proxy accounts
mp-proxy status
mp-proxy subscription
```

## CLI

```bash
mp-proxy signup "某机构" school-a wx... appsecret... "某机构"
mp-proxy --help
mp-proxy health
mp-proxy onboarding
mp-proxy status
mp-proxy accounts
mp-proxy subscription
mp-proxy subscribe 1
mp-proxy bind-account school-a wx... appsecret... 某机构
mp-proxy reminders
mp-proxy create-order school-a 1
mp-proxy order ORDER_ID
```

## Security Notes

- Do not print or send agent credentials in chat.
- Do not store AppSecret in normal documents.
- Use `mp-proxy bind-account` to bind a公众号 through the customer-safe `/agent/accounts` API.
