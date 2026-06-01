const { getSupabaseServerClient } = require("../supabase/supabase_server");

const ADMIN_LEAD_FIELDS = [
  "id",
  "created_at",
  "name",
  "company",
  "country",
  "email",
  "messenger",
  "interested_plan",
  "company_type",
  "estimated_monthly_inquiries",
  "lead_type",
  "lead_status",
  "source",
  "message",
];

function isAdminLeadsTokenValid(token, env = process.env) {
  const expected = env.ADMIN_LEADS_ACCESS_TOKEN || "";
  return Boolean(expected && token && token === expected);
}

function sanitizeLimit(value, fallback = 50) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), 200);
}

function summarizeLeads(leads = []) {
  const byType = new Map();
  for (const lead of leads) {
    byType.set(lead.lead_type || "unknown", (byType.get(lead.lead_type || "unknown") || 0) + 1);
  }
  return {
    total_leads: leads.length,
    new_leads: leads.filter((lead) => lead.lead_status === "new").length,
    pro_beta_leads: leads.filter((lead) => lead.lead_type === "pro_beta").length,
    private_license_leads: leads.filter((lead) => lead.lead_type === "private_license").length,
    latest_created_at: leads[0]?.created_at || null,
    by_type: Object.fromEntries(byType.entries()),
  };
}

async function fetchPublicAdminLeads({ token, limit = 50, env = process.env, fetchImpl } = {}) {
  if (!isAdminLeadsTokenValid(token, env)) {
    return {
      success: false,
      access_denied: true,
      status: 404,
      message: "Access denied.",
    };
  }

  const client = getSupabaseServerClient(env, { fetch: fetchImpl });
  if (!client.enabled) {
    return {
      success: true,
      provider: "supabase",
      skipped: true,
      warning: "Supabase server storage is not configured.",
      leads: [],
      summary: summarizeLeads([]),
    };
  }

  try {
    const safeLimit = sanitizeLimit(limit);
    const query = new URLSearchParams({
      select: ADMIN_LEAD_FIELDS.join(","),
      organization_id: "is.null",
      order: "created_at.desc",
      limit: String(safeLimit),
    });
    const leads = await client.select("leads", { search: `?${query.toString()}` });
    return {
      success: true,
      provider: "supabase",
      leads,
      summary: summarizeLeads(leads),
    };
  } catch (error) {
    return {
      success: false,
      provider: "supabase",
      warning: "Admin leads could not be loaded.",
      leads: [],
      summary: summarizeLeads([]),
    };
  }
}

module.exports = {
  ADMIN_LEAD_FIELDS,
  fetchPublicAdminLeads,
  isAdminLeadsTokenValid,
  sanitizeLimit,
  summarizeLeads,
};
