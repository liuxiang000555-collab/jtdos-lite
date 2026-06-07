const assert = require("assert");
const { routeRequest } = require("../backend/server");

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

function assertNoRealPaymentClaim(html) {
  assert.equal(html.includes("Payment successful"), false);
  assert.equal(html.includes("Real payment was processed"), false);
  assert.ok(html.includes("No real payment was processed") || html.includes("No real payment") || html.includes("No se procesó ningún pago real"));
}

async function run() {
  await test("/dashboard?plan=pro contains Pro Test Workspace", async () => {
    const res = await callRoute({ url: "/dashboard?plan=pro" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("Pro Test Workspace"));
    assert.ok(res.body.includes("Pro 测试工作区"));
    assert.ok(res.body.includes("Espacio de prueba Pro"));
  });

  await test("/dashboard?plan=pro contains Start Pro AI Conversation Test link", async () => {
    const res = await callRoute({ url: "/dashboard?plan=pro" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("Start Pro AI Conversation Test"));
    assert.ok(res.body.includes("开始 Pro AI 对话测试"));
    assert.ok(res.body.includes("Iniciar prueba de conversación Pro AI"));
    assert.ok(res.body.includes("/ai-booking?mode=pro-test"));
  });

  await test("/dashboard?plan=pro has Chinese and Spanish language switcher", async () => {
    const res = await callRoute({ url: "/dashboard?plan=pro" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("中文"));
    assert.ok(res.body.includes("Español"));
    assert.ok(res.body.includes("jtdos_site_lang"));
  });

  await test("/dashboard?plan=pro renders parseable language switcher script", async () => {
    const res = await callRoute({ url: "/dashboard?plan=pro" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("window.__JTDOS_DASHBOARD_STATE__ = {"));
    assert.equal(res.body.includes("__JTDOS_DASHBOARD_STATE_JSON__"), false);
    assert.equal(res.body.includes("window.{"), false);
    const scripts = [...res.body.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
    assert.ok(scripts.length > 0);
    scripts.forEach((script) => {
      new Function(script);
    });
  });

  await test("/ai-booking?mode=pro-test shows Internal Pro Test Mode", async () => {
    const res = await callRoute({ url: "/ai-booking?mode=pro-test" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("Internal Pro Test Mode"));
    assert.ok(res.body.includes("内部 Pro 测试模式"));
    assert.ok(res.body.includes("Modo interno de prueba Pro"));
    assert.ok(res.body.includes("pro-test@jtdos.com"));
    assert.ok(res.body.includes("test_paid"));
    assert.ok(res.body.includes("manual_test"));
  });

  await test("/ai-booking?mode=pro-test keeps chat input workspace", async () => {
    const res = await callRoute({ url: "/ai-booking?mode=pro-test" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('id="chat-input"'));
    assert.ok(res.body.includes('id="quote-card"'));
    assert.ok(res.body.includes('id="request-summary-panel"'));
    assert.ok(res.body.includes('id="submit-booking-request-button"'));
  });

  await test("/ai-booking?mode=pro-test contains demo test buttons", async () => {
    const res = await callRoute({ url: "/ai-booking?mode=pro-test" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("羽田到新宿，2个人2个箱子"));
    assert.ok(res.body.includes("New Chitose to Niseko with ski bags"));
    assert.ok(res.body.includes("De Haneda a Shinjuku, 2 personas, 2 maletas"));
    assert.ok(res.body.includes("接机需要举牌"));
  });

  await test("/upgrade shows Demo Mode / Mock Payment", async () => {
    const res = await callRoute({ url: "/upgrade" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("Demo Mode / Mock Payment"));
    assert.ok(res.body.includes("This page demonstrates the future Pro Cloud upgrade flow"));
    assert.ok(res.body.includes("Simulate Pro Upgrade"));
  });

  await test("/upgrade contains Chinese mock payment copy", async () => {
    const res = await callRoute({ url: "/upgrade" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("演示模式 / 模拟付款"));
    assert.ok(res.body.includes("此页面仅用于展示未来 Pro Cloud 升级流程"));
    assert.ok(res.body.includes("模拟升级 Pro"));
  });

  await test("/upgrade contains Spanish mock payment copy", async () => {
    const res = await callRoute({ url: "/upgrade" });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("Modo demo / Pago simulado"));
    assert.ok(res.body.includes("Esta página muestra el futuro flujo de actualización a Pro Cloud"));
    assert.ok(res.body.includes("Simular actualización Pro"));
  });

  await test("Pro test pages do not claim real payment was processed", async () => {
    const dashboard = await callRoute({ url: "/dashboard?plan=pro" });
    const booking = await callRoute({ url: "/ai-booking?mode=pro-test" });
    const upgrade = await callRoute({ url: "/upgrade" });
    assertNoRealPaymentClaim(dashboard.body);
    assertNoRealPaymentClaim(booking.body);
    assertNoRealPaymentClaim(upgrade.body);
  });
}

run().then(() => {
  console.log(`\nPro test multilingual workspace tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(failures);
    process.exit(1);
  }
});
