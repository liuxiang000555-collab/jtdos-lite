const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { routeRequest } = require("../backend/server");
const { fetchPublicAdminLeads, isAdminLeadsTokenValid } = require("../backend/lead_storage/admin_leads");

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
  await test("token helper rejects missing or wrong token", async () => {
    assert.equal(isAdminLeadsTokenValid("", { ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token" }), false);
    assert.equal(isAdminLeadsTokenValid("wrong", { ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token" }), false);
    assert.equal(isAdminLeadsTokenValid("secret-admin-token", { ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token" }), true);
    assert.equal(isAdminLeadsTokenValid("secret-admin-token", {}), false);
  });

  await test("/admin/leads denies missing token", async () => {
    const res = await callRoute({
      url: "/admin/leads",
      env: { ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token" },
    });
    assert.equal(res.status, 404);
    assert.ok(res.body.includes("Access denied"));
  });

  await test("/api/admin/leads denies wrong token", async () => {
    const res = await callRoute({
      url: "/api/admin/leads?token=wrong",
      env: { ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token" },
    });
    const body = JSON.parse(res.body);
    assert.equal(res.status, 404);
    assert.equal(body.access_denied, true);
    assert.equal(res.body.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
  });

  await test("/admin/leads renders admin page with correct token", async () => {
    const res = await callRoute({
      url: "/admin/leads?token=secret-admin-token",
      env: { ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token" },
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("JTDOS Admin Leads"));
    assert.ok(res.body.includes("Total leads"));
    assert.ok(res.body.includes("Leads table"));
    assert.equal(res.body.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
  });

  await test("/api/admin/leads can read mocked public leads with correct token", async () => {
    const calls = [];
    const result = await fetchPublicAdminLeads({
      token: "secret-admin-token",
      limit: "25",
      env: {
        ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token",
        SUPABASE_URL: "https://project-ref.supabase.test",
        SUPABASE_SERVICE_ROLE_KEY: "super-secret-service-role-key",
      },
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: "lead-1",
              created_at: "2026-06-01T00:00:00.000Z",
              name: "Lead One",
              company: "Agency One",
              country: "Japan",
              email: "lead-one@example.com",
              messenger: "+8100000000",
              interested_plan: "Pro Beta",
              company_type: "Travel Agency",
              estimated_monthly_inquiries: "50-200",
              lead_type: "pro_beta",
              lead_status: "new",
              source: "public_contact",
              message: "Please contact us.",
            },
          ],
        };
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.leads.length, 1);
    assert.equal(result.summary.total_leads, 1);
    assert.equal(result.summary.new_leads, 1);
    assert.equal(result.summary.pro_beta_leads, 1);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.includes("/rest/v1/leads"));
    assert.ok(calls[0].url.includes("organization_id=is.null"));
    assert.ok(calls[0].url.includes("order=created_at.desc"));
    assert.ok(calls[0].options.headers.Authorization.includes("super-secret-service-role-key"));
    assert.equal(JSON.stringify(result).includes("super-secret-service-role-key"), false);
    assert.equal(JSON.stringify(result).includes("project-ref.supabase.test"), false);
  });

  await test("admin leads API does not expose Supabase key in route response", async () => {
    const res = await callRoute({
      url: "/api/admin/leads?token=secret-admin-token",
      env: {
        ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token",
        SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: "super-secret-service-role-key",
      },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.includes("super-secret-service-role-key"), false);
    assert.equal(res.body.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
  });

  await test("admin leads page is separate from customer pages", async () => {
    for (const relative of ["frontend/landing.html", "frontend/pricing.html", "frontend/contact.html", "frontend/ai-booking.html"]) {
      const text = fs.readFileSync(path.join(ROOT, relative), "utf8");
      assert.equal(text.includes("/admin/leads"), false, `${relative} links to admin leads`);
      assert.equal(text.includes("ADMIN_LEADS_ACCESS_TOKEN"), false, `${relative} exposes admin token name`);
    }
  });

  console.log(`\nadmin_leads_view summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

run();
