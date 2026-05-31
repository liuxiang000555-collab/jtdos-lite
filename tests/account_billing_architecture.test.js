const assert = require("assert");
const { execFileSync } = require("child_process");
const { routeRequest } = require("../backend/server");

let passed = 0;
let failed = 0;
const failures = [];

async function callRoute({ method = "GET", url, body, env = {} }) {
  const oldEnv = { ...process.env };
  Object.assign(process.env, env);
  const req = {
    method,
    url,
    on(event, callback) {
      if (event === "data" && body !== undefined) callback(Buffer.from(JSON.stringify(body)));
      if (event === "end") callback();
    },
  };
  const res = {
    status: 0,
    headers: {},
    body: "",
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },
    end(payload) {
      this.body = payload || "";
    },
  };

  try {
    await routeRequest(req, res);
  } finally {
    process.env = oldEnv;
  }

  return res;
}

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    failures.push({ name, message: error.message });
    console.error(`not ok - ${name}`);
    console.error(error.stack);
  }
}

async function run() {
  await test("account and billing architecture document exists", async () => {
    const res = await callRoute({ url: "/pricing" });
    assert.equal(res.status, 200);
    assert.ok(require("fs").existsSync(require("path").join(__dirname, "../docs/ACCOUNT_AND_BILLING_ARCHITECTURE.md")));
  });

  await test("Lite user sees Upgrade to Pro on dashboard", async () => {
    const res = await callRoute({ url: "/dashboard" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("Lite plan: Upgrade to Pro"));
    assert.ok(res.body.includes("Upgrade to Pro"));
    assert.ok(res.body.includes("Lite users can preview the dashboard"));
  });

  await test("mock upgrade changes plan to pro", async () => {
    const res = await callRoute({ method: "POST", url: "/api/billing/mock-upgrade" });
    const body = JSON.parse(res.body);
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.plan, "pro");
    assert.equal(body.payment_status, "paid");
    assert.equal(body.message, "Pro Cloud activated in mock mode. No real payment was processed.");
  });

  await test("Pro user can access dashboard preview", async () => {
    const res = await callRoute({ url: "/dashboard?plan=pro" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("Pro features unlocked in demo mode."));
    assert.ok(res.body.includes("Custom price tables"));
    assert.ok(res.body.includes("Lead storage settings"));
    assert.ok(res.body.includes("JTDSS connector configuration"));
  });

  await test("dashboard subroutes are available", async () => {
    for (const url of ["/dashboard/settings", "/dashboard/billing", "/dashboard/price-tables", "/dashboard/integrations"]) {
      const res = await callRoute({ url });
      assert.equal(res.status, 200);
      assert.ok(res.body.includes("JTDOS Pro Cloud"));
    }
  });

  await test("Pricing shows Pro Cloud USD 999", async () => {
    const res = await callRoute({ url: "/pricing" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("Pro Cloud"));
    assert.ok(res.body.includes("USD 999"));
    assert.ok(res.body.includes("Request Pro Cloud access"));
    assert.ok(res.body.includes("Request Pro Cloud Access"));
    assert.ok(res.body.includes('href="/contact?plan=pro-cloud"'));
    assert.equal(res.body.includes("Pay and unlock Pro Cloud"), false);
    assert.equal(res.body.includes("Pay Now"), false);
  });

  await test("Private shows USD 9,999+ and manual approval", async () => {
    const res = await callRoute({ url: "/pricing" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("Private Source License"));
    assert.ok(res.body.includes("USD 9,999+"));
    assert.ok(res.body.includes("Manual approval required"));
    assert.ok(res.body.includes("Commercial license"));
    assert.ok(res.body.includes("No automatic source download"));
    assert.ok(res.body.includes("Request Private License"));
  });

  await test("Private does not auto-download source", async () => {
    const res = await callRoute({ url: "/pricing" });
    assert.equal(res.status, 200);
    assert.equal(/href=["'][^"']*source/i.test(res.body), false);
    assert.ok(res.body.includes("No automatic source download"));
  });

  await test("Upgrade page presents mock payment only", async () => {
    const res = await callRoute({ url: "/upgrade" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("USD 999 one-time setup"));
    assert.ok(res.body.includes("Demo Mode / Mock Payment"));
    assert.ok(res.body.includes("This page demonstrates the future Pro Cloud upgrade flow. Real payment activation will require production checkout and server-side payment verification."));
    assert.ok(res.body.includes("Simulate Pro Upgrade"));
    assert.ok(res.body.includes("Pro Cloud activated in mock mode. No real payment was processed."));
    assert.ok(res.body.includes("No real PayPal or Stripe API is connected"));
  });

  await test("Public safety still passes", async () => {
    const output = execFileSync("node", ["scripts/check_lite_public_safety.js"], {
      cwd: require("path").join(__dirname, ".."),
      encoding: "utf8",
    });
    assert.ok(output.includes("0 failed"));
  });

  console.log(`\naccount_billing_architecture summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

run();
