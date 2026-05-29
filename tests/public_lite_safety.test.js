const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { generateQuote } = require("../backend/quote/generate_quote");

const ROOT = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    failures.push({ name, message: error.message });
    console.error(`not ok - ${name}`);
    console.error(error.stack);
  }
}

function finish() {
  console.log(`\npublic_lite_safety summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

function withLiteEnv(fn) {
  const oldEnv = {
    PUBLIC_LITE_MODE: process.env.PUBLIC_LITE_MODE,
    JTDOS_EDITION: process.env.JTDOS_EDITION,
    JTDSS_USE_MOCK: process.env.JTDSS_USE_MOCK,
  };
  process.env.PUBLIC_LITE_MODE = "true";
  process.env.JTDOS_EDITION = "lite";
  process.env.JTDSS_USE_MOCK = "true";
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function copyFile(relativePath, destinationRoot) {
  const source = path.join(ROOT, relativePath);
  const destination = path.join(destinationRoot, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function createPublicLiteFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jtdos-public-lite-"));
  for (const file of [
    "database/mock_hokkaido_price_lite.json",
    "database/mock_tokyo_price_lite.json",
    "database/mock_osaka_price_lite.json",
    "frontend/ai-booking.html",
    "README.md",
    ".env.staging.example",
    "backend/config/edition.js",
    "backend/jtdss/mock_jtdss.js",
    "backend/quote/hokkaido_quote.js",
    "backend/quote/tokyo_quote.js",
    "backend/quote/osaka_quote.js",
  ]) {
    copyFile(file, fixtureRoot);
  }
  return fixtureRoot;
}

test("Lite mode uses mock Tokyo, Osaka, and Hokkaido prices", () => {
  withLiteEnv(() => {
    const tokyo = generateQuote({
      region: "Tokyo",
      service_type: "airport_pickup",
      pickup_location: "HND",
      dropoff_location: "Shinjuku",
      pickup_date: "2026-06-01",
      pickup_time: "14:00",
      vehicle_type: "Alphard/Vellfire",
    });
    assert.equal(tokyo.mock_data, true);
    assert.equal(tokyo.price_jpy, 12345);

    const osaka = generateQuote({
      region: "Osaka",
      service_type: "airport_pickup",
      pickup_location: "KIX",
      dropoff_location: "Kyoto City",
      pickup_date: "2026-06-01",
      pickup_time: "14:00",
      vehicle_type: "HiAce",
    });
    assert.equal(osaka.mock_data, true);
    assert.equal(osaka.price_jpy, 29876);

    const hokkaido = generateQuote({
      region: "Hokkaido",
      service_type: "airport_pickup",
      pickup_location: "CTS",
      dropoff_location: "Sapporo",
      pickup_date: "2026-06-01",
      pickup_time: "14:00",
      vehicle_type: "Alphard/Vellfire",
    });
    assert.equal(hokkaido.mock_data, true);
    assert.equal(hokkaido.price_jpy, 15432);
  });
});

test("Lite mode does not need real price JSON files for quote generation", () => {
  withLiteEnv(() => {
    const quote = generateQuote({
      region: "Tokyo",
      service_type: "airport_pickup",
      pickup_location: "HND",
      dropoff_location: "Tokyo 23 Wards",
      pickup_date: "2026-06-01",
      pickup_time: "14:00",
      vehicle_type: "Alphard/Vellfire",
    });
    assert.equal(quote.success, true);
    assert.equal(quote.mock_data, true);
    assert.equal(quote.notes.some((note) => note.toLowerCase().includes("mock demo price data")), true);
  });
});

test("/ai-booking customer page does not expose real price source or internal words", () => {
  const html = fs.readFileSync(path.join(ROOT, "frontend/ai-booking.html"), "utf8");
  for (const text of [
    "jtdos_hokkaido_price_real_v1",
    "jtdos_tokyo_price_real_v1",
    "jtdos_osaka_price_real_v1",
    "JTDSS",
    "webhook",
    "raw JSON",
    "extract-order",
    "send to JTDSS",
  ]) {
    assert.equal(html.includes(text), false, `${text} should not appear on customer page`);
  }
});

test("public Lite fixture passes check_lite_public_safety", () => {
  const fixtureRoot = createPublicLiteFixture();
  const output = execFileSync(process.execPath, [path.join(ROOT, "scripts/check_lite_public_safety.js")], {
    cwd: ROOT,
    env: {
      ...process.env,
      PUBLIC_LITE_CHECK_ROOT: fixtureRoot,
    },
    encoding: "utf8",
  });
  assert.ok(output.includes("failed"));
  assert.ok(output.includes("0 failed"));
});

finish();
