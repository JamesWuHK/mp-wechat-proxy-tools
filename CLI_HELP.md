# mp-proxy CLI Help For Agents

This file is the shortest command-oriented reference for WorkBuddy or any other agent using the public `mp-proxy` CLI.

## Main Goal

Help a customer:

1. self-register
2. bind their first公众号
3. check free quota and pricing
4. bind more公众号 if needed
5. create subscription orders after the free quota is used

## Primary Commands

### 1. Health

```bash
mp-proxy health
```

Use this to confirm the hosted API is reachable.

### 2. Self-Serve Signup

```bash
mp-proxy signup "<tenant>" <account_name> <appid> <appsecret> [display_name]
```

Example:

```bash
mp-proxy signup "某机构" school-a wx1234567890abcdef appsecret_here "某机构"
```

Use this for the customer's first公众号. It automatically:

- creates the customer agent
- creates the first bound公众号
- writes returned Agent credentials into local `.env`

### 3. Onboarding

```bash
mp-proxy onboarding
```

Use this right after signup to get product guidance and the recommended next action.

### 4. List Bound公众号

```bash
mp-proxy accounts
```

Use this to see whether the customer already has bound公众号.

### 5. Free Quota And Pricing

```bash
mp-proxy subscription
```

Alias:

```bash
mp-proxy publish-quota
mp-proxy pricing
```

Use this to explain:

- free article quota remaining
- first paid month price
- recurring monthly price
- included公众号 count
- extra公众号 monthly price

### 6. Bind Another公众号

```bash
mp-proxy bind-account <account_name> <appid> <appsecret> [tenant]
```

Example:

```bash
mp-proxy bind-account school-b wx1234567890abcdef appsecret_here "某机构"
```

Use this after the customer already completed signup and wants to add more公众号.

### 7. Subscription Order

```bash
mp-proxy subscribe 1
```

Use this after the free quota is exhausted or when the customer asks to subscribe.

### 8. Check Order

```bash
mp-proxy order <order_id>
```

Use this to poll an existing order after payment.

### 9. Reminder Flow

```bash
mp-proxy reminders
mp-proxy mark-reminder-sent <reminder_id>
```

Use these when asking the customer whether they want to renew.

## Customer Conversation Rules

### First-time customer

Ask the customer to provide:

- tenant / organization name
- account short name
-公众号 `AppID`
-公众号 `AppSecret`

Then run:

```bash
mp-proxy signup "<tenant>" <account_name> <appid> <appsecret> [display_name]
```

### Existing customer adding another公众号

Ask for:

- new `account_name`
- new公众号 `AppID`
- new公众号 `AppSecret`

Then run:

```bash
mp-proxy bind-account <account_name> <appid> <appsecret> [tenant]
```

### When discussing price

Always read current pricing from:

```bash
mp-proxy subscription
```

Do not hardcode prices in conversation.

### When customer asks how to find AppID/AppSecret

Tell them:

```text
请由公众号管理员登录微信公众平台，进入 设置与开发 → 基本配置，复制开发者ID(AppID) 和 开发者密码(AppSecret)。如果 AppSecret 页面不显示，需要按微信提示启用或重置后立即复制。
```

## Troubleshooting

### Missing credentials

For a first-time customer, run signup first:

```bash
mp-proxy signup "<tenant>" <account_name> <appid> <appsecret> [display_name]
```

Then run:

```bash
mp-proxy doctor
```

### Invalid agent

If `mp-proxy onboarding` returns `invalid agent`, first check whether signup has already been run:

```bash
mp-proxy doctor
```

If local Agent credentials are missing, run `mp-proxy signup ...`. If credentials exist but still fail, ask the service operator to reactivate or regenerate that Agent.

### Pricing question

Use:

```bash
mp-proxy subscription
```

That is the source of truth for current quota and pricing.
