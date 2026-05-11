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

## Main Flow

1. Install CLI
2. Configure Agent credentials in `~/.mp-wechat-proxy/.env`
3. Bind customer公众号: ask customer for AppID/AppSecret from 微信公众平台 → 设置与开发 → 基本配置
4. Run `mp-proxy bind-account <name> <appid> <appsecret> <tenant>`
5. Verify with `mp-proxy accounts` and `mp-proxy status`

## CLI

```bash
mp-proxy health
mp-proxy doctor
mp-proxy onboarding
mp-proxy status
mp-proxy accounts
mp-proxy bind-account school-a wx... appsecret... 某机构
mp-proxy reminders
mp-proxy create-order school-a 1
mp-proxy order ORDER_ID
```

## Limitations

- `mp-proxy agent` only supports JSON body. Multipart file uploads are not supported.

## Security Notes

- Do not print or send agent credentials in chat.
- Do not store AppSecret in normal documents.
- The customer only provides their own公众号 AppID/AppSecret.
