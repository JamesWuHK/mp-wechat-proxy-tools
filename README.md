# mp-wechat-proxy-tools

Public WorkBuddy CLI for the hosted `mp-wechat-proxy` service.

This public repository intentionally does **not** contain:

- private API server source
- customer runtime data
- payment certificates

It only contains the customer/WorkBuddy CLI that calls the hosted `/agent/...` APIs with agent credentials.

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


## No公众号 Bound Yet

If `mp-proxy onboarding` or `mp-proxy accounts` shows no bound公众号, WorkBuddy should ask the customer to retrieve AppID/AppSecret from 微信公众平台 → 设置与开发 → 基本配置, then run:

```bash
mp-proxy bind-account school-a wx... appsecret... 某机构
```

## Add A公众号

WorkBuddy should add a customer公众号 with the customer-safe agent command:

```bash
mp-proxy bind-account school-a wx... appsecret... 某机构
```

Then verify:

```bash
mp-proxy accounts
mp-proxy status
```

## CLI

```bash
mp-proxy --help
mp-proxy health
mp-proxy onboarding
mp-proxy status
mp-proxy accounts
mp-proxy bind-account school-a wx... appsecret... 某机构
mp-proxy reminders
mp-proxy create-order school-a 1
mp-proxy order ORDER_ID
```

## Security Notes

- Do not print or send agent credentials in chat.
- Do not store AppSecret in normal documents.
- Use `mp-proxy bind-account` to bind a公众号 through the customer-safe `/agent/accounts` API.
