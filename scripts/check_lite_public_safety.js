const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(process.env.PUBLIC_LITE_CHECK_ROOT || path.resolve(__dirname, ".."));

const forbiddenFiles = [
  "database/base_prices_hokkaido_real_v1.json",
  "database/jtdos_hokkaido_price_real_v1.json",
  "database/jtdos_tokyo_price_real_v1.json",
  "database/jtdos_osaka_price_real_v1.json",
  "database/base_prices_hokkaido_real_v1.md",
  "database/base_prices_tokyo_real_v1.md",
  "database/base_prices_osaka_real_v1.md",
  "docs/REAL_BUSINESS_RULES_V1.md",
  "docs/REAL_PRICING_AND_CHARTER_RULES_V1.md",
  "backend/jtdss/jtdss_client.js",
  ".env",
];

const mockPriceFiles = [
  "database/mock_hokkaido_price_lite.json",
  "database/mock_tokyo_price_lite.json",
  "database/mock_osaka_price_lite.json",
];

const customerPageForbiddenWords = [
  "JTDSS",
  "webhook",
  "raw JSON",
  "extract-order",
  "send to JTDSS",
  "backend",
];

const scanExtensions = new Set([
  ".js",
  ".json",
  ".md",
  ".html",
  ".example",
  "",
]);

const skipDirs = new Set(["node_modules", ".git"]);

let passed = 0;
let failed = 0;
const failures = [];

function record(ok, message) {
  if (ok) {
    passed += 1;
    console.log(`ok - ${message}`);
  } else {
    failed += 1;
    failures.push(message);
    console.error(`not ok - ${message}`);
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function readTextFiles() {
  return walk(ROOT).filter((file) => {
    const ext = path.extname(file);
    return scanExtensions.has(ext);
  }).map((file) => ({
    file,
    relative: path.relative(ROOT, file),
    text: fs.readFileSync(file, "utf8"),
  }));
}

function checkForbiddenFiles() {
  for (const file of forbiddenFiles) {
    record(!exists(file), `public Lite must not include ${file}`);
  }
}

function checkMockPriceFiles() {
  for (const file of mockPriceFiles) {
    const fullPath = path.join(ROOT, file);
    const ok = fs.existsSync(fullPath);
    record(ok, `public Lite includes ${file}`);
    if (!ok) continue;

    try {
      const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      record(data.mock_data === true, `${file} has mock_data = true`);
      record(data.for_demo_only === true, `${file} has for_demo_only = true`);
      record(data.not_for_commercial_quote === true, `${file} has not_for_commercial_quote = true`);
    } catch (error) {
      record(false, `${file} is valid JSON with Lite mock flags`);
    }
  }
}

function checkSecretsAndRealData() {
  const files = readTextFiles();
  const jtdssUrlPattern = /https?:\/\/[^\s"'`]*/gi;
  const realPaypalPattern = /https?:\/\/(?:www\.)?paypal\.(?:com|me)\/(?!example|pay\b)/i;
  const nonExampleEmailPattern = /\b[A-Z0-9._%+-]+@(?!example\.com\b)[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

  const offenders = {
    jtdss: [],
    apiKey: [],
    paypal: [],
    customer: [],
  };

  for (const item of files) {
    if (item.relative === "scripts/check_lite_public_safety.js") continue;
    const urls = item.text.match(jtdssUrlPattern) || [];
    if (urls.some((url) =>
      /jtdss/i.test(url)
      && !/example\.com/i.test(url)
      && !/your-jtdss/i.test(url)
      && !/localhost|127\.0\.0\.1/i.test(url)
    )) {
      offenders.jtdss.push(item.relative);
    }
    for (const line of item.text.split(/\r?\n/)) {
      const match = line.match(/^\s*(JTDSS_API_KEY|EMAIL_API_KEY|TELEGRAM_BOT_TOKEN|GOOGLE_SHEETS_SPREADSHEET_ID|GOOGLE_SHEETS_CLIENT_EMAIL|GOOGLE_SHEETS_PRIVATE_KEY)\s*=\s*(.*?)\s*$/);
      if (!match) continue;
      const value = match[2];
      if (
        value
        && !value.includes("...")
        && !value.startsWith("your-")
        && value !== "secret"
        && value !== "super-secret-key"
        && value !== "telegram-secret"
      ) {
        offenders.apiKey.push(item.relative);
      }
    }
    if (realPaypalPattern.test(item.text)) offenders.paypal.push(item.relative);
    if (nonExampleEmailPattern.test(item.text) && !item.relative.endsWith(".md")) offenders.customer.push(item.relative);
  }

  record(offenders.jtdss.length === 0, "no real JTDSS API URL is present");
  record(offenders.apiKey.length === 0, "no API key or token is assigned in repository files");
  record(offenders.paypal.length === 0, "no real PayPal link is present");
  record(offenders.customer.length === 0, "no obvious real customer email data is present");

  for (const [kind, list] of Object.entries(offenders)) {
    if (list.length) {
      console.error(`${kind} offenders: ${[...new Set(list)].join(", ")}`);
    }
  }
}

function checkCustomerPage() {
  const pagePath = path.join(ROOT, "frontend/ai-booking.html");
  if (!fs.existsSync(pagePath)) {
    record(false, "customer page exists at frontend/ai-booking.html");
    return;
  }
  const page = fs.readFileSync(pagePath, "utf8");
  for (const word of customerPageForbiddenWords) {
    record(!page.includes(word), `customer page does not expose ${word}`);
  }
}

function checkMockMode() {
  record(exists("backend/jtdss/mock_jtdss.js"), "Lite Demo has mock operations backend");
  const stagingExample = exists(".env.staging.example")
    ? fs.readFileSync(path.join(ROOT, ".env.staging.example"), "utf8")
    : "";
  record(stagingExample.includes("JTDSS_USE_MOCK=true"), "Lite Demo uses mock data by default in staging example");
}

function checkLiteQuoteEngineUsesMockOnly() {
  const quoteFiles = [
    ["backend/quote/hokkaido_quote.js", "mock_hokkaido_price_lite.json"],
    ["backend/quote/tokyo_quote.js", "mock_tokyo_price_lite.json"],
    ["backend/quote/osaka_quote.js", "mock_osaka_price_lite.json"],
  ];

  record(exists("backend/config/edition.js"), "Lite mode edition config exists");
  for (const [file, mockFile] of quoteFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) {
      record(false, `${file} exists for Lite quote routing check`);
      continue;
    }
    const text = fs.readFileSync(fullPath, "utf8");
    record(text.includes("isPublicLiteMode"), `${file} checks PUBLIC_LITE_MODE / JTDOS_EDITION`);
    record(text.includes(mockFile), `${file} references ${mockFile}`);
  }
}

function checkReadmeStatesMockOnly() {
  const readmePath = path.join(ROOT, "README.md");
  if (!fs.existsSync(readmePath)) {
    record(false, "README.md exists");
    return;
  }
  const readme = fs.readFileSync(readmePath, "utf8").toLowerCase();
  record(readme.includes("mock data only"), "README states Lite uses mock data only");
  record(readme.includes("real price tables"), "README states Lite does not include real price tables");
}

checkForbiddenFiles();
checkMockPriceFiles();
checkSecretsAndRealData();
checkCustomerPage();
checkMockMode();
checkLiteQuoteEngineUsesMockOnly();
checkReadmeStatesMockOnly();

console.log(`\ncheck_lite_public_safety summary: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
