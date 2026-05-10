const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const test = require("node:test");

function waitForHealth(baseUrl, timeoutMs = 5000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(`${baseUrl}/health`);
        if (res.ok) return resolve();
      } catch (_) {
        // Retry until timeout.
      }
      if (Date.now() - start > timeoutMs) return reject(new Error("health check timed out"));
      setTimeout(attempt, 100);
    };
    attempt();
  });
}

test("public CLI signup saves credentials and reads subscription", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..", "mp-wechat-proxy");
  const cliRoot = path.resolve(__dirname, "..");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mp-proxy-tools-"));
  const accountsFile = path.join(tmp, "accounts.json");
  const agentsFile = path.join(tmp, "agents.json");
  const remindersFile = path.join(tmp, "reminders.json");
  const ordersFile = path.join(tmp, "orders.json");
  const payEnvFile = path.join(tmp, "wechat-pay.env");
  const envFile = path.join(tmp, ".env");

  fs.writeFileSync(accountsFile, "{}\n");
  fs.writeFileSync(agentsFile, "{}\n");
  fs.writeFileSync(remindersFile, "{}\n");
  fs.writeFileSync(ordersFile, "{}\n");
  fs.writeFileSync(payEnvFile, "");

  const port = 21080 + Math.floor(Math.random() * 1000);
  const serverEnv = {
    ...process.env,
    PORT: String(port),
    PROXY_API_KEY: "test-proxy-key",
    ADMIN_API_KEY: "test-admin-key",
    ADMIN_SIGNING_SECRET: "test-admin-signing-secret",
    UPSTREAM_BASE: "https://api.weixin.qq.com",
    ACCOUNTS_FILE: accountsFile,
    AGENTS_FILE: agentsFile,
    REMINDER_STATE_FILE: remindersFile,
    BILLING_ORDERS_FILE: ordersFile,
    WECHAT_PAY_ENV_FILE: payEnvFile,
    REQUIRE_ACCOUNT_SIGNATURE: "true"
  };

  const child = spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env: serverEnv,
    stdio: ["ignore", "pipe", "pipe"]
  });

  function runCli(args) {
    return new Promise((resolve) => {
      const proc = spawn(process.execPath, ["bin/mp-proxy.js", ...args], {
        cwd: cliRoot,
        env: {
          ...process.env,
          MP_PROXY_BASE_URL: `http://127.0.0.1:${port}`,
          MP_PROXY_ENV_PATH: envFile,
        },
        stdio: ["ignore", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (chunk) => { stdout += chunk; });
      proc.stderr.on("data", (chunk) => { stderr += chunk; });
      proc.on("close", (code) => resolve({ code, stdout, stderr }));
    });
  }

  try {
    await waitForHealth(`http://127.0.0.1:${port}`);

    const signup = await runCli(["signup", "Demo School", "demo-school", "wx-demo-appid", "demo-secret", "Demo School"]);
    assert.strictEqual(signup.code, 0, signup.stderr);
    const signupBody = JSON.parse(signup.stdout);
    assert.strictEqual(signupBody.ok, true);
    const savedEnv = fs.readFileSync(envFile, "utf8");
    assert.match(savedEnv, /MP_AGENT_ID=/);
    assert.match(savedEnv, /MP_AGENT_KEY=/);
    assert.match(savedEnv, /MP_AGENT_SIGNING_SECRET=/);

    const subscription = await runCli(["subscription"]);
    assert.strictEqual(subscription.code, 0, subscription.stderr);
    const subscriptionBody = JSON.parse(subscription.stdout);
    assert.strictEqual(subscriptionBody.data.plan.trialArticlesRemaining, 3);
    assert.strictEqual(subscriptionBody.data.plan.nextChargeCents, 990);
  } finally {
    child.kill("SIGTERM");
  }
});

test("public CLI subscription reflects server-managed pricing", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..", "mp-wechat-proxy");
  const cliRoot = path.resolve(__dirname, "..");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mp-proxy-tools-pricing-"));
  const accountsFile = path.join(tmp, "accounts.json");
  const agentsFile = path.join(tmp, "agents.json");
  const remindersFile = path.join(tmp, "reminders.json");
  const ordersFile = path.join(tmp, "orders.json");
  const payEnvFile = path.join(tmp, "wechat-pay.env");
  const pricingFile = path.join(tmp, "pricing.json");
  const envFile = path.join(tmp, ".env");

  fs.writeFileSync(accountsFile, "{}\n");
  fs.writeFileSync(agentsFile, "{}\n");
  fs.writeFileSync(remindersFile, "{}\n");
  fs.writeFileSync(ordersFile, "{}\n");
  fs.writeFileSync(payEnvFile, "");

  const port = 23080 + Math.floor(Math.random() * 1000);
  const serverEnv = {
    ...process.env,
    PORT: String(port),
    PROXY_API_KEY: "test-proxy-key",
    ADMIN_API_KEY: "test-admin-key",
    ADMIN_SIGNING_SECRET: "test-admin-signing-secret",
    UPSTREAM_BASE: "https://api.weixin.qq.com",
    ACCOUNTS_FILE: accountsFile,
    AGENTS_FILE: agentsFile,
    REMINDER_STATE_FILE: remindersFile,
    BILLING_ORDERS_FILE: ordersFile,
    WECHAT_PAY_ENV_FILE: payEnvFile,
    PRICING_CONFIG_FILE: pricingFile,
    REQUIRE_ACCOUNT_SIGNATURE: "true"
  };

  const child = spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env: serverEnv,
    stdio: ["ignore", "pipe", "pipe"]
  });

  function runCli(args) {
    return new Promise((resolve) => {
      const proc = spawn(process.execPath, ["bin/mp-proxy.js", ...args], {
        cwd: cliRoot,
        env: {
          ...process.env,
          MP_PROXY_BASE_URL: `http://127.0.0.1:${port}`,
          MP_PROXY_ENV_PATH: envFile,
        },
        stdio: ["ignore", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (chunk) => { stdout += chunk; });
      proc.stderr.on("data", (chunk) => { stderr += chunk; });
      proc.on("close", (code) => resolve({ code, stdout, stderr }));
    });
  }

  try {
    await waitForHealth(`http://127.0.0.1:${port}`);

    const signup = await runCli(["signup", "Demo School", "demo-school", "wx-demo-appid", "demo-secret", "Demo School"]);
    assert.strictEqual(signup.code, 0, signup.stderr);

    const subscriptionBefore = await runCli(["subscription"]);
    assert.strictEqual(subscriptionBefore.code, 0, subscriptionBefore.stderr);
    const beforeBody = JSON.parse(subscriptionBefore.stdout);
    assert.strictEqual(beforeBody.data.pricing.firstMonthPriceCents, 990);

    const payload = JSON.stringify({
      trialArticleLimit: 6,
      firstMonthPriceCents: 1888,
      recurringMonthPriceCents: 3999,
      includedAccounts: 2,
      extraAccountMonthlyPriceCents: 666,
    });
    const adminRunner = `
const crypto = require("node:crypto");
const payload = ${JSON.stringify(payload)};
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = crypto.randomBytes(12).toString("hex");
const bodyHash = crypto.createHash("sha256").update(Buffer.from(payload)).digest("hex");
const canonical = [timestamp, nonce, "PATCH", "/admin/pricing", "", bodyHash].join("\\n");
const signature = crypto.createHmac("sha256", "test-admin-signing-secret").update(canonical).digest("hex");
fetch("http://127.0.0.1:${port}/admin/pricing", {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "X-Admin-Key": "test-admin-key",
    "X-Sign-Timestamp": timestamp,
    "X-Sign-Nonce": nonce,
    "X-Signature": signature,
  },
  body: payload,
}).then(async (res) => {
  console.log(await res.text());
  process.exit(res.ok ? 0 : 1);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
`;
    const adminProc = spawn(process.execPath, ["-e", adminRunner], {
      cwd: cliRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    await new Promise((resolve, reject) => {
      adminProc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`admin pricing patch failed: ${code}`))));
    });

    const subscriptionAfter = await runCli(["subscription"]);
    assert.strictEqual(subscriptionAfter.code, 0, subscriptionAfter.stderr);
    const afterBody = JSON.parse(subscriptionAfter.stdout);
    assert.strictEqual(afterBody.data.pricing.firstMonthPriceCents, 1888);
    assert.strictEqual(afterBody.data.pricing.recurringMonthPriceCents, 3999);
    assert.strictEqual(afterBody.data.pricing.extraAccountMonthlyPriceCents, 666);
  } finally {
    child.kill("SIGTERM");
  }
});
