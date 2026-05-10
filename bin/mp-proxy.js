#!/usr/bin/env node
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const defaultBaseUrl = "https://mp.wanli.wiki";

function usage() {
  console.log(`mp-proxy WorkBuddy CLI

Usage:
  mp-proxy setup
  mp-proxy health
  mp-proxy signup TENANT ACCOUNT_NAME APPID APPSECRET [DISPLAY_NAME]
  mp-proxy status
  mp-proxy onboarding
  mp-proxy accounts
  mp-proxy bind-account NAME APPID APPSECRET [TENANT]
  mp-proxy subscription
  mp-proxy subscribe MONTHS
  mp-proxy reminders
  mp-proxy mark-reminder-sent REMINDER_ID
  mp-proxy create-order ACCOUNT MONTHS
  mp-proxy order ORDER_ID
  mp-proxy publish-quota
  mp-proxy pricing
  mp-proxy agent METHOD PATH [JSON]
  mp-proxy doctor

Required customer/WorkBuddy credentials:
  MP_AGENT_ID
  MP_AGENT_KEY
  MP_AGENT_SIGNING_SECRET

Environment overrides:
  MP_PROXY_BASE_URL       default ${defaultBaseUrl}
  MP_PROXY_ENV_PATH       default ./.env
`);
}

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function envPath() {
  return path.resolve(process.env.MP_PROXY_ENV_PATH || path.join(repoRoot, ".env"));
}

function baseUrl() {
  return (process.env.MP_PROXY_BASE_URL || defaultBaseUrl).replace(/\/$/, "");
}

function readEnv() {
  const data = { ...process.env };
  const file = envPath();
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
      const index = line.indexOf("=");
      data[line.slice(0, index)] = line.slice(index + 1);
    }
  }
  return data;
}

function writeFile600(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  try {
    fs.chmodSync(file, 0o600);
  } catch (_) {
    // Some non-POSIX mounts do not support chmod.
  }
}

function copyIfMissing(src, dst) {
  if (fs.existsSync(dst)) {
    console.log(`exists  ${dst}`);
    return;
  }
  writeFile600(dst, fs.readFileSync(src, "utf8"));
  console.log(`created ${dst}`);
}

function setupRuntime() {
  copyIfMissing(path.join(repoRoot, ".env.example"), path.join(repoRoot, ".env"));
}

function sha256Hex(body) {
  return crypto.createHash("sha256").update(body || Buffer.alloc(0)).digest("hex");
}

function sign(secret, method, requestPath, body) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(12).toString("hex");
  const url = new URL(requestPath, "http://localhost");
  const canonical = [
    timestamp,
    nonce,
    method.toUpperCase(),
    url.pathname,
    url.search || "",
    sha256Hex(body),
  ].join("\n");
  const signature = crypto.createHmac("sha256", secret).update(canonical).digest("hex");
  return { timestamp, nonce, signature };
}

function parseBody(jsonArg) {
  if (!jsonArg) return Buffer.alloc(0);
  try {
    JSON.parse(jsonArg);
  } catch (error) {
    fail(`Invalid JSON body: ${error.message}`);
  }
  return Buffer.from(jsonArg, "utf8");
}

function agentCredentials() {
  const env = readEnv();
  const agentId = env.MP_AGENT_ID;
  const agentKey = env.MP_AGENT_KEY;
  const signingSecret = env.MP_AGENT_SIGNING_SECRET;
  if (!agentId || !agentKey || !signingSecret) {
    fail("Missing MP_AGENT_ID, MP_AGENT_KEY, or MP_AGENT_SIGNING_SECRET. Ask the service operator for WorkBuddy Agent credentials and put MP_AGENT_ID, MP_AGENT_KEY, and MP_AGENT_SIGNING_SECRET in .env.");
  }
  return { agentId, agentKey, signingSecret };
}

function saveAgentCredentials(agentId, agentKey, signingSecret) {
  const file = envPath();
  const env = readEnv();
  env.MP_AGENT_ID = agentId;
  env.MP_AGENT_KEY = agentKey;
  env.MP_AGENT_SIGNING_SECRET = signingSecret;
  const keys = Object.keys(env).filter(Boolean).sort();
  const content = `${keys.map((key) => `${key}=${env[key]}`).join("\n")}\n`;
  writeFile600(file, content);
}

async function request(method, requestPath, headers = {}, body = Buffer.alloc(0), options = {}) {
  const response = await fetch(`${baseUrl()}${requestPath}`, {
    method,
    headers: body.length > 0 ? { ...headers, "Content-Type": "application/json" } : headers,
    body: body.length > 0 ? body : undefined,
  });
  const text = await response.text();
  if (options.printStatus) console.log(`HTTP ${response.status}`);
  printBody(text);
  if (!options.allowFailure && response.status >= 400) process.exitCode = 1;
  return { response, text };
}

function printBody(text) {
  if (!text) return;
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch (_) {
    console.log(text);
  }
}

async function health() {
  return request("GET", "/health");
}

async function signup(args) {
  const [tenant, accountName, appid, appsecret, displayName = ""] = args;
  if (!tenant || !accountName || !appid || !appsecret) {
    fail("Usage: mp-proxy signup TENANT ACCOUNT_NAME APPID APPSECRET [DISPLAY_NAME]", 2);
  }
  const payload = {
    tenant,
    accountName,
    appid,
    appsecret,
    displayName: displayName || tenant,
    customerDisplayName: displayName || tenant,
  };
  const { response, text } = await request("POST", "/public/signup", {}, Buffer.from(JSON.stringify(payload), "utf8"));
  if (response.status >= 400) return;
  try {
    const parsed = JSON.parse(text);
    const credentials = parsed?.data?.credentials;
    if (credentials?.agentId && credentials?.agentKey && credentials?.signingSecret) {
      saveAgentCredentials(credentials.agentId, credentials.agentKey, credentials.signingSecret);
    }
  } catch (_) {
    // keep response output as-is even if parse fails
  }
}

async function agentRequest(method, agentPath, jsonArg) {
  const credentials = agentCredentials();
  const normalizedPath = agentPath.startsWith("/agent/") ? agentPath : `/agent/${agentPath.replace(/^\//, "")}`;
  const body = parseBody(jsonArg);
  const auth = sign(credentials.signingSecret, method, normalizedPath, body);
  return request(method, normalizedPath, {
    "X-Agent-Id": credentials.agentId,
    "X-Agent-Key": credentials.agentKey,
    "X-Sign-Timestamp": auth.timestamp,
    "X-Sign-Nonce": auth.nonce,
    "X-Signature": auth.signature,
  }, body);
}

async function bindAccount(args) {
  const [name, appid, appsecret, tenant = ""] = args;
  if (!name || !appid || !appsecret) fail("Usage: mp-proxy bind-account NAME APPID APPSECRET [TENANT]", 2);
  return agentRequest("POST", "/agent/accounts", JSON.stringify({ name, appid, appsecret, tenant }));
}

async function createOrder(args) {
  const [account, months = "1"] = args;
  if (!account) fail("Usage: mp-proxy create-order ACCOUNT MONTHS", 2);
  const parsedMonths = Number(months);
  if (!Number.isInteger(parsedMonths) || parsedMonths < 1) fail("MONTHS must be a positive integer", 2);
  return agentRequest("POST", "/agent/billing/orders", JSON.stringify({ account, months: parsedMonths }));
}

async function subscription() {
  return agentRequest("GET", "/agent/subscription");
}

async function publishQuota() {
  return subscription();
}

async function pricing() {
  return subscription();
}

async function subscribe(args) {
  const [months = "1"] = args;
  const parsedMonths = Number(months);
  if (!Number.isInteger(parsedMonths) || parsedMonths < 1) fail("Usage: mp-proxy subscribe MONTHS", 2);
  return agentRequest("POST", "/agent/billing/orders", JSON.stringify({ kind: "agent_subscription", months: parsedMonths }));
}

async function test() {
  await health();
  await agentRequest("GET", "/agent/onboarding");
}

function doctor() {
  const env = readEnv();
  const checks = {
    cli: "agent-only",
    baseUrl: baseUrl(),
    envPath: envPath(),
    hasAgentId: !!env.MP_AGENT_ID,
    hasAgentKey: !!env.MP_AGENT_KEY,
    hasAgentSigningSecret: !!env.MP_AGENT_SIGNING_SECRET,
    deprecatedCommandsRemoved: true,
  };
  console.log(JSON.stringify(checks, null, 2));
}


async function main() {
  const args = process.argv.slice(2);
  const command = args.shift();
  if (!command || command === "help" || command === "--help" || command === "-h") return usage();
  if (command === "setup") return setupRuntime();
  if (command === "health") return health();
  if (command === "signup") return signup(args);
  if (command === "test") return test();
  if (command === "doctor") return doctor();
  if (command === "onboarding") return agentRequest("GET", "/agent/onboarding");
  if (command === "status") return agentRequest("GET", "/agent/status");
  if (command === "accounts") return agentRequest("GET", "/agent/accounts");
  if (command === "bind-account") return bindAccount(args);
  if (command === "subscription") return subscription();
  if (command === "publish-quota") return publishQuota();
  if (command === "pricing") return pricing();
  if (command === "subscribe") return subscribe(args);
  if (command === "reminders") return agentRequest("GET", "/agent/customer-reminders");
  if (command === "mark-reminder-sent") {
    const [id] = args;
    if (!id) fail("Usage: mp-proxy mark-reminder-sent REMINDER_ID", 2);
    return agentRequest("POST", `/agent/customer-reminders/${id}/mark-sent`);
  }
  if (command === "create-order") return createOrder(args);
  if (command === "order") {
    const [id] = args;
    if (!id) fail("Usage: mp-proxy order ORDER_ID", 2);
    return agentRequest("GET", `/agent/billing/orders/${id}`);
  }
  if (command === "agent") {
    const [method, agentPath, jsonArg] = args;
    if (!method || !agentPath) fail("Usage: mp-proxy agent METHOD PATH [JSON]", 2);
    return agentRequest(method.toUpperCase(), agentPath, jsonArg);
  }
  fail(`Unknown command: ${command}`, 2);
}

main().catch((error) => fail(error.stack || error.message));
