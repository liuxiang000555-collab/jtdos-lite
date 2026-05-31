const assert = require("assert");
const { routeRequest, maskSensitiveOrderForLog, maskLeadForLog } = require("../backend/server");
const { extractOrder } = require("../backend/agent/extract_order");
const { generateQuote } = require("../backend/quote/generate_quote");
const { quoteInputFromDraft } = require("../backend/e2e/ai_booking_flow");
const { createBookingRequest } = require("../backend/order/create_order");

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
  await test("/health returns success and price table status", async () => {
    const res = await callRoute({ url: "/health", env: { NODE_ENV: "staging", JTDSS_USE_MOCK: "true" } });
    const body = JSON.parse(res.body);
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.service, "JTDOS Alpha 0.1");
    assert.equal(body.environment, "staging");
    assert.equal(body.jtdss_mode, "mock");
    assert.equal(body.price_tables.hokkaido, true);
    assert.equal(body.price_tables.tokyo, true);
    assert.equal(body.price_tables.osaka, true);
  });

  await test("/ai-booking returns page", async () => {
    const res = await callRoute({ url: "/ai-booking" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("JTDOS AI Japan Travel Assistant"));
    assert.ok(res.body.includes('id="chat-input"'));
    for (const word of ["JTDSS", "webhook", "extract-order", "raw JSON", "send to JTDSS", "backend"]) {
      assert.equal(res.body.includes(word), false, `${word} leaked to customer page`);
    }
    assert.equal(res.body.includes("Debug Panel"), false);
  });

  await test("debug page only appears with debug route or query", async () => {
    const normal = await callRoute({ url: "/ai-booking" });
    assert.equal(normal.body.includes("Debug Panel"), false);

    const debugQuery = await callRoute({ url: "/ai-booking?debug=1" });
    assert.equal(debugQuery.status, 200);
    assert.equal(debugQuery.body.includes("Debug Panel"), true);

    const debugRoute = await callRoute({ url: "/debug/ai-booking" });
    assert.equal(debugRoute.status, 200);
    assert.equal(debugRoute.body.includes("Debug Panel"), true);
  });

  await test("landing, pricing, and contact pages return Lite commercial pages", async () => {
    const landing = await callRoute({ url: "/" });
    assert.equal(landing.status, 200);
    assert.ok(landing.body.includes("JTDOS AI Japan Travel Sales Assistant"));
    assert.ok(landing.body.includes("Try AI Booking Demo"));

    const pricing = await callRoute({ url: "/pricing" });
    assert.equal(pricing.status, 200);
    assert.ok(pricing.body.includes("Lite Free"));
    assert.ok(pricing.body.includes("Pro Beta"));
    assert.ok(pricing.body.includes("Starting from USD 999"));
    assert.ok(pricing.body.includes("Request Pro Beta"));
    assert.ok(pricing.body.includes("Fast Track Pro Beta"));
    assert.ok(pricing.body.includes("Contact us before payment"));
    assert.ok(pricing.body.includes("PayPal available after confirmation"));
    assert.ok(pricing.body.includes('id="fast-track-whatsapp"'));
    assert.ok(pricing.body.includes("hidden"));
    assert.ok(pricing.body.includes("Private / Enterprise"));
    assert.ok(pricing.body.includes("Book Private Demo"));

    const contact = await callRoute({ url: "/contact" });
    assert.equal(contact.status, 200);
    assert.ok(contact.body.includes("Interested Plan"));
    assert.ok(contact.body.includes("Company Type"));
    assert.ok(contact.body.includes("Estimated Monthly Inquiries"));
    assert.ok(contact.body.includes("中文"));
    assert.ok(contact.body.includes("Español"));
    assert.ok(contact.body.includes("申请 JTDOS Pro Beta"));
    assert.ok(contact.body.includes("Solicitar JTDOS Pro Beta"));
    assert.ok(contact.body.includes("Travel Agency"));
    assert.ok(contact.body.includes("Transfer Operator"));
    assert.ok(contact.body.includes("Pro Beta"));
    assert.ok(contact.body.includes("For faster onboarding"));
    assert.ok(contact.body.includes("PayPal payment is available after we confirm your use case"));
    assert.ok(contact.body.includes("Thank you. Your Pro Beta request has been received."));
  });

  await test("/api/public-config hides Fast Track WhatsApp when not configured", async () => {
    const res = await callRoute({
      url: "/api/public-config",
      env: {
        PUBLIC_FAST_TRACK_WHATSAPP: "",
        PUBLIC_PAYPAL_PAYMENT_NOTE: "",
        PUBLIC_PAYPAL_QR_ENABLED: "false",
      },
    });
    const body = JSON.parse(res.body);
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.fast_track_whatsapp_configured, false);
    assert.equal(body.fast_track_whatsapp_url, "");
    assert.equal(body.paypal_qr_enabled, false);
    assert.equal(res.body.includes("API_KEY"), false);
  });

  await test("/api/public-config exposes only public Fast Track values when configured", async () => {
    const res = await callRoute({
      url: "/api/public-config",
      env: {
        PUBLIC_FAST_TRACK_WHATSAPP: "https://wa.me/0000000000",
        PUBLIC_PAYPAL_PAYMENT_NOTE: "PayPal payment is available after confirmation.",
        PUBLIC_PAYPAL_QR_ENABLED: "true",
        JTDSS_API_KEY: "must-not-leak",
      },
    });
    const body = JSON.parse(res.body);
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.fast_track_whatsapp_configured, true);
    assert.equal(body.fast_track_whatsapp_url, "https://wa.me/0000000000");
    assert.equal(body.paypal_payment_note, "PayPal payment is available after confirmation.");
    assert.equal(body.paypal_qr_enabled, true);
    assert.equal(res.body.includes("must-not-leak"), false);
  });

  await test("contact mock submit returns Pro Beta lead response without requiring email integration", async () => {
    const res = await callRoute({
      method: "POST",
      url: "/api/contact/submit",
      body: {
        name: "Test Lead",
        company: "Example Travel",
        country: "United States",
        email: "lead@example.com",
        messenger: "+000000000",
        plan: "Pro Beta",
        company_type: "Travel Agency",
        estimated_monthly_inquiries: "50–200",
        message: "We want to test JTDOS Pro Beta.",
      },
    });
    const body = JSON.parse(res.body);
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.mock_submission, true);
    assert.ok(body.lead_id.startsWith("JTDOS-LEAD-"));
    assert.equal(body.message, "Thank you. Your Pro Beta request has been received. The JTDOS team will review your use case and contact you shortly.");
    assert.equal(res.body.includes("lead@example.com"), false);
    assert.equal(res.body.includes("+000000000"), false);
  });

  await test("/internal/config-check does not leak secrets", async () => {
    const res = await callRoute({
      url: "/internal/config-check",
      env: {
        JTDSS_API_BASE_URL: "https://staging.secret.example",
        JTDSS_API_KEY: "super-secret-key",
        EMAIL_PROVIDER: "smtp",
        TELEGRAM_BOT_TOKEN: "telegram-secret",
        PAYPAL_PAYMENT_LINK: "https://paypal.example/pay",
        USD_JPY_RATE: "155",
      },
    });
    const body = JSON.parse(res.body);
    assert.deepEqual(body, {
      jtdss_api_base_url: true,
      jtdss_api_key: true,
      email_provider: true,
      telegram_bot_token: true,
      paypal_payment_link: true,
      usd_jpy_rate: true,
    });
    assert.equal(res.body.includes("super-secret-key"), false);
    assert.equal(res.body.includes("telegram-secret"), false);
    assert.equal(res.body.includes("paypal.example"), false);
  });

  await test("quote API can read Hokkaido, Tokyo, and Osaka price tables", async () => {
    const cases = [
      { region: "Hokkaido", pickup_location: "CTS", dropoff_location: "Sapporo" },
      { region: "Tokyo", pickup_location: "HND", dropoff_location: "Tokyo 23 Wards" },
      { region: "Osaka", pickup_location: "KIX", dropoff_location: "Osaka City" },
    ];

    for (const item of cases) {
      const res = await callRoute({
        method: "POST",
        url: "/api/quote/generate",
        body: {
          ...item,
          service_type: "airport_pickup",
          pickup_date: "2026-06-01",
          pickup_time: "14:00",
          vehicle_type: "Alphard/Vellfire",
        },
      });
      const body = JSON.parse(res.body);
      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.price_status, "fixed_price");
    }
  });

  await test("mock JTDSS mode can create order through send-order route", async () => {
    const draft = extractOrder("We are 4 people arriving at Haneda Airport on June 1 at 14:30, flight JL000, going to Shinjuku with 4 suitcases. We prefer a Chinese-speaking driver.");
    const quote = generateQuote(quoteInputFromDraft(draft));
    const order = createBookingRequest({
      draftOrder: draft,
      quote,
      customer: { name: "Test Customer", email: "test@example.com", whatsapp: "+000000000" },
    });
    const res = await callRoute({
      method: "POST",
      url: "/api/jtdss/send-order",
      body: { order },
      env: { JTDSS_USE_MOCK: "true" },
    });
    const body = JSON.parse(res.body);
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.jtdss_order_id.startsWith("JTDSS-"));
  });

  await test("notification unconfigured warning does not block order", async () => {
    const draft = extractOrder("We are 4 people arriving at Haneda Airport on June 1 at 14:30, flight JL000, going to Shinjuku with 4 suitcases. We prefer a Chinese-speaking driver.");
    const quote = generateQuote(quoteInputFromDraft(draft));
    const order = createBookingRequest({
      draftOrder: draft,
      quote,
      customer: { name: "Test Customer", email: "test@example.com", whatsapp: "+000000000" },
    });
    const res = await callRoute({
      method: "POST",
      url: "/api/jtdss/send-order",
      body: { order },
      env: { JTDSS_USE_MOCK: "true" },
    });
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.notifications.email.skipped, true);
    assert.equal(body.notifications.telegram.skipped, true);
  });

  await test("booking request logs mask sensitive customer fields", () => {
    const masked = maskSensitiveOrderForLog({
      jtdos_order_id: "JTDOS-1",
      service_type: "airport_pickup",
      region: "Tokyo",
      customer: {
        name: "Real Name",
        email: "real@example.com",
        whatsapp: "+123456",
        line_contact: "line-id",
        primary_contact_channel: "WhatsApp",
      },
    });
    const text = JSON.stringify(masked);
    assert.equal(text.includes("real@example.com"), false);
    assert.equal(text.includes("+123456"), false);
    assert.equal(text.includes("line-id"), false);
    assert.equal(masked.customer.email, "[masked]");
  });

  await test("Pro Beta lead logs mask personal contact fields", () => {
    const masked = maskLeadForLog({
      lead_id: "JTDOS-LEAD-1",
      plan: "Pro Beta",
      company_type: "Travel Agency",
      country: "United States",
      estimated_monthly_inquiries: "50–200",
      name: "Real Lead",
      company: "Real Company",
      email: "lead@example.com",
      messenger: "+123456",
    });
    const text = JSON.stringify(masked);
    assert.equal(text.includes("Real Lead"), false);
    assert.equal(text.includes("Real Company"), false);
    assert.equal(text.includes("lead@example.com"), false);
    assert.equal(text.includes("+123456"), false);
    assert.equal(masked.email, "[masked]");
    assert.equal(masked.messenger, "[masked]");
  });

  console.log(`\nstaging_smoke_alpha_0_1 summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

run();
