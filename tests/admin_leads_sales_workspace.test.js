const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { routeRequest } = require("../backend/server");

const ROOT = path.resolve(__dirname, "..");
const ADMIN_PAGE = path.join(ROOT, "frontend/admin-leads.html");

let passed = 0;
let failed = 0;
const failures = [];

async function callRoute({ url, env = {} }) {
  const oldEnv = { ...process.env };
  Object.assign(process.env, env);
  const req = {
    method: "GET",
    url,
    on(event, callback) {
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
  const html = fs.readFileSync(ADMIN_PAGE, "utf8");

  await test("admin leads page keeps token protection", async () => {
    const missing = await callRoute({
      url: "/admin/leads",
      env: { ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token" },
    });
    assert.equal(missing.status, 404);
    assert.ok(missing.body.includes("Access denied"));

    const wrong = await callRoute({
      url: "/admin/leads?token=wrong",
      env: { ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token" },
    });
    assert.equal(wrong.status, 404);
    assert.ok(wrong.body.includes("Access denied"));

    const correct = await callRoute({
      url: "/admin/leads?token=secret-admin-token",
      env: { ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token" },
    });
    assert.equal(correct.status, 200);
    assert.ok(correct.body.includes("JTDOS Admin Leads"));
  });

  await test("status filters are available", async () => {
    for (const label of ["All", "New", "Contacted", "Qualified", "Won", "Lost", "Spam"]) {
      assert.ok(html.includes(`>${label}</button>`) || html.includes(`>${label}<`), `${label} filter missing`);
    }
    for (const status of ["all", "new", "contacted", "qualified", "won", "lost", "spam"]) {
      assert.ok(html.includes(`data-filter="${status}"`), `${status} data filter missing`);
    }
    assert.ok(html.includes("activeStatusFilter"));
    assert.ok(html.includes("visibleLeads"));
  });

  await test("local search is available for sales leads", async () => {
    assert.ok(html.includes('id="lead-search"'));
    assert.ok(html.includes("Search name, company, country, email, messenger, or message"));
    assert.ok(html.includes("searchableText"));
    for (const field of ["lead.name", "lead.company", "lead.country", "lead.email", "lead.messenger", "lead.message"]) {
      assert.ok(html.includes(field), `${field} missing from search scope`);
    }
  });

  await test("status counters are displayed", async () => {
    for (const id of [
      "total-leads",
      "new-leads",
      "contacted-leads",
      "qualified-leads",
      "won-leads",
      "lost-leads",
      "spam-leads",
    ]) {
      assert.ok(html.includes(`id="${id}"`), `${id} counter missing`);
    }
    assert.ok(html.includes("statusCount"));
  });

  await test("WhatsApp follow-up copy template exists", async () => {
    assert.ok(html.includes("Copy WhatsApp Follow-up"));
    assert.ok(html.includes("whatsappFollowUpTemplate"));
    assert.ok(html.includes("thank you for your interest in JTDOS"));
    assert.ok(html.includes("current Japan travel transfer workflow"));
    assert.ok(html.includes("what you would like to automate first"));
  });

  await test("Email follow-up copy template exists", async () => {
    assert.ok(html.includes("Copy Email Follow-up"));
    assert.ok(html.includes("emailFollowUpTemplate"));
    assert.ok(html.includes("Subject: JTDOS"));
    assert.ok(html.includes("Which Japan regions you serve"));
    assert.ok(html.includes("Whether you already work with drivers or suppliers"));
    assert.ok(html.includes("Whether you need Pro Cloud or Private deployment"));
  });

  await test("copy success feedback exists", async () => {
    assert.ok(html.includes("copyText"));
    assert.ok(html.includes("Copied"));
    assert.ok(html.includes("navigator.clipboard"));
  });

  await test("admin sales workspace does not expose secrets", async () => {
    for (const forbidden of [
      "SUPABASE_SERVICE_ROLE_KEY",
      "EMAIL_API_KEY",
      "GOOGLE_SHEETS_PRIVATE_KEY",
      "PAYPAL_CLIENT_SECRET",
    ]) {
      assert.equal(html.includes(forbidden), false, `${forbidden} leaked in admin page`);
    }
  });

  console.log(`\nadmin_leads_sales_workspace summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

run();
