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
