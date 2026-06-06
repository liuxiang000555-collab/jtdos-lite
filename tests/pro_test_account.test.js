const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { routeRequest } = require("../backend/server");
const {
  PRO_TEST_ACCOUNT,
  isProTestQuery,
  dashboardStateFromRequest,
  publicProTestAccountSummary,
} = require("../backend/account/pro_test_account");

let passed = 0;
let failed = 0;
const failures = [];

async function callRoute({ method = "GET", url, body }) {
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

  await routeRequest(req, res);
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
  await test("Pro test account has manual test license fields", async () => {
    assert.equal(PRO_TEST_ACCOUNT.email, "pro-test@jtdos.com");
    assert.equal(PRO_TEST_ACCOUNT.account_type, "Internal Pro Test Account");
    assert.equal(PRO_TEST_ACCOUNT.plan, "pro");
    assert.equal(PRO_TEST_ACCOUNT.plan_status, "active");
    assert.equal(PRO_TEST_ACCOUNT.payment_status, "test_paid");
    assert.equal(PRO_TEST_ACCOUNT.payment_provider, "manual_test");
    assert.equal(PRO_TEST_ACCOUNT.license_source, "manual_test");
    assert.equal(PRO_TEST_ACCOUNT.license_status, "active");
    assert.equal(PRO_TEST_ACCOUNT.real_payment_processed, false);
    assert.equal(PRO_TEST_ACCOUNT.production_customer_account, false);
  });

  await test("Lite user does not automatically receive Pro permissions", async () => {
    assert.equal(isProTestQuery(new URLSearchParams("")), false);
    const state = dashboardStateFromRequest(new URL("http://localhost/dashboard"));
    assert.equal(state.plan, "lite");
    assert.equal(state.pro_features_unlocked, false);
    assert.equal(state.message.includes("Pro features unlocked"), false);
  });

  await test("Pro test query unlocks dashboard only in test mode", async () => {
    const state = dashboardStateFromRequest(new URL("http://localhost/dashboard?plan=pro"));
    assert.equal(state.account_mode, "manual_pro_test");
    assert.equal(state.email, "pro-test@jtdos.com");
    assert.equal(state.plan, "pro");
    assert.equal(state.payment_status, "test_paid");
    assert.equal(state.pro_features_unlocked, true);
    assert.equal(state.real_payment_processed, false);
    assert.ok(state.message.includes("test mode"));
    assert.ok(state.safety_note.includes("No real payment"));
  });

  await test("/dashboard renders Lite mode without Pro unlock by default", async () => {
    const res = await callRoute({ url: "/dashboard" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("JTDOS Pro Cloud"));
    assert.ok(res.body.includes('"account_mode":"lite"'));
    assert.ok(res.body.includes("Lite plan: Upgrade to Pro"));
    assert.equal(res.body.includes("Payment successful"), false);
  });

  await test("/dashboard?plan=pro renders internal test mode without real payment claim", async () => {
    const res = await callRoute({ url: "/dashboard?plan=pro" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("Internal Pro Test Account"));
    assert.ok(res.body.includes("Pro features unlocked in test mode"));
    assert.ok(res.body.includes("No real payment was processed"));
    assert.ok(res.body.includes("pro-test@jtdos.com"));
    assert.ok(res.body.includes("test_paid"));
    assert.ok(res.body.includes("manual_test"));
    assert.equal(res.body.includes("Payment successful"), false);
    assert.ok(res.body.includes("not a real paid production account"));
  });

  await test("/ai-booking supports Pro test mode banner but keeps normal page hidden", async () => {
    const normal = await callRoute({ url: "/ai-booking" });
    assert.equal(normal.status, 200);
    assert.ok(normal.body.includes('id="pro-test-banner" class="pro-test-banner hidden"'));

    const pro = await callRoute({ url: "/ai-booking?mode=pro-test" });
    assert.equal(pro.status, 200);
    assert.ok(pro.body.includes("Internal Pro Test Mode"));
    assert.ok(pro.body.includes("No real payment"));
  });

  await test("public Pro test account API returns safe summary only", async () => {
    const summary = publicProTestAccountSummary();
    assert.equal(summary.success, true);
    assert.equal(summary.account.email, "pro-test@jtdos.com");
    assert.equal(summary.account.payment_status, "test_paid");
    assert.equal(JSON.stringify(summary).includes("SERVICE_ROLE"), false);
    assert.equal(JSON.stringify(summary).includes("API_KEY"), false);

    const res = await callRoute({ url: "/api/pro-test-account" });
    assert.equal(res.status, 200);
    assert.equal(res.body.includes("pro-test@jtdos.com"), true);
    assert.equal(res.body.includes("SERVICE_ROLE"), false);
  });

  await test("setup document records safety boundaries", async () => {
    const doc = fs.readFileSync(path.join(__dirname, "../docs/PRO_TEST_ACCOUNT_SETUP.md"), "utf8");
    assert.ok(doc.includes("pro-test@jtdos.com"));
    assert.ok(doc.includes("test_paid"));
    assert.ok(doc.includes("manual_test"));
    assert.ok(doc.includes("not a real paid customer account"));
    assert.ok(doc.includes("No real payment was processed"));
    assert.ok(doc.includes("/ai-booking?mode=pro-test"));
  });
}

run().then(() => {
  console.log(`\nPro test account tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures);
    process.exit(1);
  }
});
