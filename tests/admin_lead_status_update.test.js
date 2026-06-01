const assert = require("assert");
const { routeRequest } = require("../backend/server");
const { updatePublicLeadStatus } = require("../backend/lead_storage/admin_leads");

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

function supabaseMockFetch({ existingRows = [{ id: "lead-1", lead_status: "new", organization_id: null }] } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options, body: options.body ? JSON.parse(options.body) : null });
    if (options.method === "GET") {
      return {
        ok: true,
        status: 200,
        json: async () => existingRows,
      };
    }
    if (options.method === "PATCH") {
      return {
        ok: true,
        status: 200,
        json: async () => [{
          id: "lead-1",
          lead_status: calls.at(-1).body.lead_status,
          organization_id: null,
          internal_notes: calls.at(-1).body.internal_notes || null,
        }],
      };
    }
    if (options.method === "POST") {
      return {
        ok: true,
        status: 201,
      };
    }
    throw new Error(`Unexpected method ${options.method}`);
  };
  return { fetchImpl, calls };
}

const env = {
  ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token",
  SUPABASE_URL: "https://project-ref.supabase.test",
  SUPABASE_SERVICE_ROLE_KEY: "super-secret-service-role-key",
};

async function run() {
  await test("no token update denied", async () => {
    const res = await callRoute({
      method: "PATCH",
      url: "/api/admin/leads/status",
      env,
      body: { lead_id: "lead-1", lead_status: "contacted" },
    });
    const body = JSON.parse(res.body);
    assert.equal(res.status, 404);
    assert.equal(body.access_denied, true);
  });

  await test("wrong token update denied", async () => {
    const res = await callRoute({
      method: "PATCH",
      url: "/api/admin/leads/status",
      env,
      body: { token: "wrong", lead_id: "lead-1", lead_status: "contacted" },
    });
    const body = JSON.parse(res.body);
    assert.equal(res.status, 404);
    assert.equal(body.access_denied, true);
  });

  await test("invalid status rejected", async () => {
    const res = await callRoute({
      method: "PATCH",
      url: "/api/admin/leads/status",
      env,
      body: { token: "secret-admin-token", lead_id: "lead-1", lead_status: "finished" },
    });
    const body = JSON.parse(res.body);
    assert.equal(res.status, 400);
    assert.equal(body.error_code, "INVALID_LEAD_STATUS");
  });

  await test("valid token updates public lead status", async () => {
    const { fetchImpl, calls } = supabaseMockFetch();
    const result = await updatePublicLeadStatus({
      token: "secret-admin-token",
      leadId: "lead-1",
      lead_status: "contacted",
      last_contacted_at: "2026-06-02T00:00:00.000Z",
      internal_notes: "Called once.",
      env,
      fetchImpl,
    });

    assert.equal(result.success, true);
    assert.equal(result.lead.lead_status, "contacted");
    assert.equal(result.audit_logged, true);
    assert.equal(calls.length, 3);
    assert.equal(calls[0].options.method, "GET");
    assert.ok(calls[0].url.includes("organization_id=is.null"));
    assert.equal(calls[1].options.method, "PATCH");
    assert.ok(calls[1].url.includes("organization_id=is.null"));
    assert.deepEqual(calls[1].body, {
      lead_status: "contacted",
      last_contacted_at: "2026-06-02T00:00:00.000Z",
      internal_notes: "Called once.",
    });
  });

  await test("organization-owned lead cannot be updated by public admin route", async () => {
    const { fetchImpl, calls } = supabaseMockFetch({ existingRows: [] });
    const result = await updatePublicLeadStatus({
      token: "secret-admin-token",
      leadId: "org-owned-lead",
      lead_status: "qualified",
      env,
      fetchImpl,
    });

    assert.equal(result.success, false);
    assert.equal(result.error_code, "PUBLIC_LEAD_NOT_FOUND");
    assert.equal(result.status, 404);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.includes("organization_id=is.null"));
  });

  await test("audit log inserted with old and new status", async () => {
    const { fetchImpl, calls } = supabaseMockFetch({ existingRows: [{ id: "lead-1", lead_status: "new", organization_id: null }] });
    const result = await updatePublicLeadStatus({
      token: "secret-admin-token",
      leadId: "lead-1",
      lead_status: "won",
      env,
      fetchImpl,
    });

    assert.equal(result.success, true);
    const auditCall = calls.find((call) => call.url.includes("/rest/v1/audit_logs"));
    assert.ok(auditCall);
    assert.equal(auditCall.options.method, "POST");
    assert.equal(auditCall.body.action, "lead_status_updated");
    assert.equal(auditCall.body.target_type, "lead");
    assert.equal(auditCall.body.target_id, "lead-1");
    assert.deepEqual(auditCall.body.metadata, { old_status: "new", new_status: "won" });
  });

  await test("status update response does not leak Supabase secrets", async () => {
    const res = await callRoute({
      method: "PATCH",
      url: "/api/admin/leads/status",
      env: {
        ADMIN_LEADS_ACCESS_TOKEN: "secret-admin-token",
        SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: "super-secret-service-role-key",
      },
      body: { token: "secret-admin-token", lead_id: "lead-1", lead_status: "contacted" },
    });
    assert.equal(res.body.includes("super-secret-service-role-key"), false);
    assert.equal(res.body.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
  });

  console.log(`\nadmin_lead_status_update summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

run();
