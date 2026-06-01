const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { routeRequest } = require("../backend/server");
const {
  appendLeadToSupabase,
  leadToSupabaseLeadRow,
  parseLeadStorageProviders,
  planToLeadType,
} = require("../backend/lead_storage/supabase_lead_storage");
const { getSupabaseServerClient, supabaseServerConfig } = require("../backend/supabase/supabase_server");

const ROOT = path.resolve(__dirname, "..");

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
  await test("Supabase server client is disabled when env is missing", async () => {
    const config = supabaseServerConfig({});
    assert.equal(config.url, "");
    assert.equal(config.serviceRoleKey, "");
    const client = getSupabaseServerClient({});
    assert.equal(client.enabled, false);
    assert.ok(client.warning.includes("not configured"));
  });

  await test("LEAD_STORAGE_PROVIDER=supabase with missing env returns warning and does not block contact submit", async () => {
    const res = await callRoute({
      method: "POST",
      url: "/api/contact/submit",
      env: {
        LEAD_STORAGE_PROVIDER: "supabase",
        SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
      },
      body: {
        name: "Supabase Missing Env",
        company: "Missing Env Travel",
        country: "Japan",
        email: "missing-env@example.com",
        messenger: "+8100000000",
        plan: "Pro Cloud",
        company_type: "Travel Agency",
        estimated_monthly_inquiries: "50–200",
        message: "Supabase missing env should not block.",
      },
    });
    const body = JSON.parse(res.body);
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.lead_storage.supabase.skipped, true);
    assert.equal(body.lead_storage.supabase.provider, "supabase");
    assert.equal(res.body.includes("missing-env@example.com"), false);
    assert.equal(res.body.includes("+8100000000"), false);
  });

  await test("mock Supabase insert succeeds without exposing service role key", async () => {
    let requestUrl = "";
    let requestBody = "";
    let authHeader = "";
    const result = await appendLeadToSupabase({
      name: "Mock Lead",
      company: "Mock Company",
      country: "Singapore",
      email: "mock@example.com",
      messenger: "+6500000000",
      plan: "Pro Cloud",
      company_type: "Transfer Operator",
      estimated_monthly_inquiries: "200–1000",
      message: "Please store this in Supabase.",
    }, {
      LEAD_STORAGE_PROVIDER: "supabase",
      SUPABASE_URL: "https://project-ref.supabase.test",
      SUPABASE_SERVICE_ROLE_KEY: "super-secret-service-role-key",
    }, {
      fetch: async (url, options) => {
        requestUrl = url;
        requestBody = options.body;
        authHeader = options.headers.Authorization;
        return {
          ok: true,
          status: 201,
        };
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.provider, "supabase");
    assert.equal(result.inserted, true);
    assert.ok(requestUrl.includes("/rest/v1/leads"));
    assert.ok(authHeader.includes("super-secret-service-role-key"));
    assert.equal(JSON.stringify(result).includes("super-secret-service-role-key"), false);
    assert.equal(JSON.stringify(result).includes("project-ref.supabase.test"), false);

    const row = JSON.parse(requestBody);
    assert.equal(row.organization_id, null);
    assert.equal(row.source, "public_contact");
    assert.equal(row.lead_status, "new");
    assert.equal(row.lead_type, "pro_beta");
  });

  await test("Supabase row mapping keeps public lead organization_id null", async () => {
    const row = leadToSupabaseLeadRow({
      plan: "Private / Enterprise",
      name: "Private Lead",
      email: "private@example.com",
    });
    assert.equal(row.organization_id, null);
    assert.equal(row.source, "public_contact");
    assert.equal(row.lead_status, "new");
    assert.equal(row.lead_type, "private_license");
    assert.equal(row.interested_plan, "Private / Enterprise");
  });

  await test("lead type and provider parsing support combined providers", async () => {
    assert.deepEqual(parseLeadStorageProviders({ LEAD_STORAGE_PROVIDER: "google_sheets,supabase" }), ["google_sheets", "supabase"]);
    assert.equal(planToLeadType("Pro Beta"), "pro_beta");
    assert.equal(planToLeadType("Pro Cloud"), "pro_beta");
    assert.equal(planToLeadType("Private / Enterprise"), "private_license");
  });

  await test("frontend does not expose Supabase service role details", async () => {
    for (const relative of ["frontend/landing.html", "frontend/pricing.html", "frontend/contact.html", "frontend/ai-booking.html"]) {
      const text = fs.readFileSync(path.join(ROOT, relative), "utf8");
      assert.equal(text.includes("SUPABASE_SERVICE_ROLE_KEY"), false, `${relative} exposes service role key name`);
      assert.equal(/service_role/i.test(text), false, `${relative} exposes service role wording`);
      assert.equal(/supabase_server/i.test(text), false, `${relative} imports server client`);
    }
  });

  console.log(`\nsupabase_lead_storage summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

run();
