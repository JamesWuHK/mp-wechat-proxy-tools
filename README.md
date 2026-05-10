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

## Required Credentials

WorkBuddy needs only agent credentials from the service operator:

```text
MP_AGENT_ID
MP_AGENT_KEY
MP_AGENT_SIGNING_SECRET
```

## Configure

```bash
mp-proxy setup
vim ~/.mp-wechat-proxy/.env
```

Example `.env`:

```text
MP_PROXY_BASE_URL=https://mp.wanli.wiki
MP_AGENT_ID=agent_xxx
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

For additional公众号 after signup, WorkBuddy should ask the customer to retrieve `AppID` and `AppSecret` from 微信公众平台 → 设置与开发 → 基本配置, then run:

```bash
mp-proxy bind-account school-b wx... appsecret... 某机构
```

## If Onboarding Returns `invalid agent`

The CLI is installed, but the Agent credentials in `~/.mp-wechat-proxy/.env` are not valid server-side credentials. Ask the service operator to generate real values for:

```text
MP_AGENT_ID
MP_AGENT_KEY
MP_AGENT_SIGNING_SECRET
```

Then update `~/.mp-wechat-proxy/.env` and run:

```bash
mp-proxy doctor
mp-proxy onboarding
```

Do not proceed to `mp-proxy bind-account` until onboarding succeeds.


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
