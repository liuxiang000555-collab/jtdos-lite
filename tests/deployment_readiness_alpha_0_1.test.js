const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { createBookingRequest } = require("../backend/order/create_order");
const { extractOrder } = require("../backend/agent/extract_order");
const { generateQuote } = require("../backend/quote/generate_quote");
const { quoteInputFromDraft } = require("../backend/e2e/ai_booking_flow");
const mockJtdss = require("../backend/jtdss/mock_jtdss");
const { sendOrderToJtdss: sendOrderToRealJtdss, buildJtdssOrderUrl } = require("../backend/jtdss/jtdss_client");
const { getJtdssClient } = require("../backend/jtdss");
const { validateJtdssConfig } = require("../backend/config/env");
const { notifyJtdosOrder } = require("../backend/notification/notifications");
const { routeRequest } = require("../backend/server");

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`ok - ${name}`);
    })
    .catch((error) => {
      failed += 1;
      failures.push({ name, message: error.message });
      console.error(`not ok - ${name}`);
      console.error(error.stack);
    });
}

async function runTests(tests) {
  for (const [name, fn] of tests) {
    await Promise.resolve()
      .then(fn)
      .then(() => {
        passed += 1;
        console.log(`ok - ${name}`);
      })
      .catch((error) => {
        failed += 1;
        failures.push({ name, message: error.message });
        console.error(`not ok - ${name}`);
        console.error(error.stack);
      });
  }

  console.log(`\ndeployment_readiness_alpha_0_1 summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

function sampleOrder() {
  const draft = extractOrder("We are 4 people arriving at Haneda Airport on June 1 at 14:30, flight JL000, going to Shinjuku with 4 suitcases. We prefer a Chinese-speaking driver.");
  const quote = generateQuote(quoteInputFromDraft(draft));
  return createBookingRequest({
    draftOrder: draft,
    quote,
    customer: {
      name: "Test Customer",
      email: "test@example.com",
      whatsapp: "+000000000",
      primary_contact_channel: "WhatsApp",
    },
  });
}

const tests = [
  ["mock JTDSS accepts order and returns jtdss_order_id", () => {
    mockJtdss.resetJtdssMock();
    const result = mockJtdss.sendOrderToJtdss(sampleOrder(), { env: {} });
    assert.equal(result.success, true);
    assert.ok(result.jtdss_order_id.startsWith("JTDSS-"));
  }],

  ["real JTDSS client reports missing config and preserves booking request", async () => {
    const result = await sendOrderToRealJtdss(sampleOrder(), { env: {} });
    assert.equal(result.success, false);
    assert.equal(result.error_code, "JTDSS_CONFIG_MISSING");
    assert.equal(result.local_booking_request_preserved, true);
    assert.ok(result.local_booking_request.jtdos_order_id);
  }],

  ["mock JTDSS duplicate order is rejected", () => {
    mockJtdss.resetJtdssMock();
    const order = sampleOrder();
    const first = mockJtdss.sendOrderToJtdss(order, { env: {} });
    const second = mockJtdss.sendOrderToJtdss(order, { env: {} });
    assert.equal(first.success, true);
    assert.equal(second.success, false);
    assert.equal(second.error_code, "DUPLICATE_ORDER");
  }],

  ["notification warnings do not block order creation", () => {
    const order = sampleOrder();
    const notifications = notifyJtdosOrder(order, {});
    assert.equal(notifications.email.skipped, true);
    assert.equal(notifications.telegram.skipped, true);
    assert.equal(notifications.whatsapp.success, true);
  }],

  ["JTDSS env validation detects missing and complete config", () => {
    const missing = validateJtdssConfig({});
    assert.equal(missing.valid, false);
    assert.ok(missing.missing.includes("JTDSS_API_BASE_URL"));
    assert.ok(missing.missing.includes("JTDSS_API_KEY"));

    const complete = validateJtdssConfig({
      JTDSS_API_BASE_URL: "https://jtdss.example.com",
      JTDSS_API_KEY: "secret",
      JTDSS_ORDER_ENDPOINT: "/api/external/jtdos/orders",
    });
    assert.equal(complete.valid, true);
    assert.equal(buildJtdssOrderUrl(complete.config), "https://jtdss.example.com/api/external/jtdos/orders");
  }],

  ["production uses real client and test uses mock client", () => {
    assert.equal(getJtdssClient({ NODE_ENV: "production" }).sendOrderToJtdss, sendOrderToRealJtdss);
    assert.equal(getJtdssClient({ NODE_ENV: "test" }).sendOrderToJtdss, mockJtdss.sendOrderToJtdss);
    assert.equal(getJtdssClient({ JTDSS_USE_MOCK: "true", NODE_ENV: "production" }).sendOrderToJtdss, mockJtdss.sendOrderToJtdss);
  }],

  [".env.example contains required deployment variables", () => {
    const envExample = fs.readFileSync(path.resolve(__dirname, "../.env.example"), "utf8");
    for (const key of [
      "JTDSS_API_BASE_URL=",
      "JTDSS_API_KEY=",
      "JTDSS_ORDER_ENDPOINT=/api/external/jtdos/orders",
      "EMAIL_PROVIDER=",
      "TELEGRAM_BOT_TOKEN=",
      "PAYPAL_PAYMENT_LINK=",
      "USD_JPY_RATE=",
      "DEFAULT_TIMEZONE=Asia/Tokyo",
    ]) {
      assert.ok(envExample.includes(key), `${key} missing from .env.example`);
    }
  }],

  ["/ai-booking route handler serves the booking page", async () => {
    const req = { method: "GET", url: "/ai-booking" };
    const res = {
      status: 0,
      headers: {},
      body: "",
      writeHead(status, headers) {
        this.status = status;
        this.headers = headers;
      },
      end(body) {
        this.body = body;
      },
    };
    await routeRequest(req, res);
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("AI Booking Assistant"));
    assert.ok(res.body.includes('id="chat-input"'));
  }],

  ["deployment checklist exists", () => {
    const checklist = fs.readFileSync(path.resolve(__dirname, "../docs/ALPHA_0_1_DEPLOYMENT_CHECKLIST.md"), "utf8");
    assert.ok(checklist.includes("JTDSS API Configuration"));
    assert.ok(checklist.includes("Rollback Plan"));
  }],
];

runTests(tests);
