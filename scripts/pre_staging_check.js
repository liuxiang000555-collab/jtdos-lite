const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const checks = [];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

function check(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
    console.log(`ok - ${name}`);
  } catch (error) {
    checks.push({ name, ok: false, message: error.message });
    console.error(`not ok - ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function scanForHardcodedSecrets() {
  const files = [
    "backend/jtdss/jtdss_client.js",
    "backend/server.js",
    "backend/config/env.js",
    "tests/staging_smoke_alpha_0_1.test.js",
  ];
  const suspicious = [
    /JTDSS_API_KEY\s*=\s*["'][^"']+["']/,
    /TELEGRAM_BOT_TOKEN\s*=\s*["'][^"']+["']/,
    /EMAIL_API_KEY\s*=\s*["'][^"']+["']/,
    /sk_live_[A-Za-z0-9]/,
    /xox[baprs]-[A-Za-z0-9-]/,
  ];

  for (const file of files) {
    const content = read(file);
    for (const pattern of suspicious) {
      assert(!pattern.test(content), `possible hardcoded secret in ${file}`);
    }
  }
}

check("three real price JSON files exist", () => {
  for (const file of [
    "database/jtdos_hokkaido_price_real_v1.json",
    "database/jtdos_tokyo_price_real_v1.json",
    "database/jtdos_osaka_price_real_v1.json",
  ]) {
    assert(exists(file), `${file} missing`);
    JSON.parse(read(file));
  }
});

check(".env.staging exists or .env.staging.example is available", () => {
  assert(exists(".env.staging") || exists(".env.staging.example"), "create .env.staging from .env.staging.example before deploying");
});

check("/health handler exists", () => {
  const server = read("backend/server.js");
  assert(server.includes('url.pathname === "/health"'), "/health route missing");
});

check("/ai-booking handler exists", () => {
  const server = read("backend/server.js");
  assert(server.includes('url.pathname === "/ai-booking"'), "/ai-booking route missing");
});

check("JTDSS_USE_MOCK is explicitly configured in staging template", () => {
  const env = read(".env.staging.example");
  assert(env.includes("JTDSS_USE_MOCK=true"), "JTDSS_USE_MOCK must be explicit");
});

check(".env is ignored by git", () => {
  const gitignore = read(".gitignore");
  assert(gitignore.split(/\r?\n/).includes(".env"), ".env missing from .gitignore");
  assert(gitignore.includes(".env.*"), ".env.* missing from .gitignore");
  assert(gitignore.includes("!.env.example"), ".env.example should remain committable");
});

check("API keys are not hardcoded", () => {
  scanForHardcodedSecrets();
});

check("package.json contains start:staging", () => {
  const pkg = JSON.parse(read("package.json"));
  assert(pkg.scripts?.["start:staging"], "start:staging script missing");
});

check("staging smoke test exists", () => {
  assert(exists("tests/staging_smoke_alpha_0_1.test.js"), "staging smoke test missing");
});

const failed = checks.filter((item) => !item.ok);
console.log(`\npre_staging_check summary: ${checks.length - failed.length} passed, ${failed.length} failed`);

if (failed.length > 0) {
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
