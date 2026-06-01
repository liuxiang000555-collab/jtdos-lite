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
  "last_contacted_at",
  "internal_notes",
];

const ALLOWED_LEAD_STATUSES = new Set(["new", "contacted", "qualified", "won", "lost", "spam"]);

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

function normalizeLeadStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return ALLOWED_LEAD_STATUSES.has(normalized) ? normalized : "";
}

function normalizeInternalNotes(notes) {
  if (notes === undefined || notes === null) return undefined;
  return String(notes).slice(0, 2000);
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

async function updatePublicLeadStatus({
  token,
  leadId,
  lead_status,
  last_contacted_at,
  internal_notes,
  env = process.env,
  fetchImpl,
} = {}) {
  if (!isAdminLeadsTokenValid(token, env)) {
    return {
      success: false,
      access_denied: true,
      status: 404,
      message: "Access denied.",
    };
  }

  const nextStatus = normalizeLeadStatus(lead_status);
  if (!leadId || !nextStatus) {
    return {
      success: false,
      status: 400,
      error_code: "INVALID_LEAD_STATUS",
      message: "Lead id and valid lead status are required.",
    };
  }

  const client = getSupabaseServerClient(env, { fetch: fetchImpl });
  if (!client.enabled) {
    return {
      success: false,
      provider: "supabase",
      status: 503,
      warning: "Supabase server storage is not configured.",
    };
  }

  try {
    const selectQuery = new URLSearchParams({
      select: "id,lead_status,organization_id",
      id: `eq.${leadId}`,
      organization_id: "is.null",
      limit: "1",
    });
    const existingRows = await client.select("leads", { search: `?${selectQuery.toString()}` });
    const existingLead = existingRows[0];
    if (!existingLead) {
      return {
        success: false,
        provider: "supabase",
        status: 404,
        error_code: "PUBLIC_LEAD_NOT_FOUND",
        message: "Public lead was not found.",
      };
    }

    const updatePayload = { lead_status: nextStatus };
    if (last_contacted_at !== undefined) {
      updatePayload.last_contacted_at = last_contacted_at || null;
    }
    const notes = normalizeInternalNotes(internal_notes);
    if (notes !== undefined) {
      updatePayload.internal_notes = notes;
    }

    const updateQuery = new URLSearchParams({
      id: `eq.${leadId}`,
      organization_id: "is.null",
      select: ADMIN_LEAD_FIELDS.join(","),
    });
    const updatedRows = await client.update("leads", {
      search: `?${updateQuery.toString()}`,
      row: updatePayload,
    });
    const updatedLead = updatedRows[0] || { id: leadId, lead_status: nextStatus };

    await client.insert("audit_logs", {
      organization_id: null,
      actor_user_id: null,
      action: "lead_status_updated",
      target_type: "lead",
      target_id: leadId,
      metadata: {
        old_status: existingLead.lead_status,
        new_status: nextStatus,
      },
    });

    return {
      success: true,
      provider: "supabase",
      lead: updatedLead,
      audit_logged: true,
    };
  } catch (error) {
    return {
      success: false,
      provider: "supabase",
      status: 500,
      warning: "Lead status could not be updated.",
    };
  }
}

module.exports = {
  ALLOWED_LEAD_STATUSES,
  ADMIN_LEAD_FIELDS,
  fetchPublicAdminLeads,
  isAdminLeadsTokenValid,
  normalizeLeadStatus,
  sanitizeLimit,
  summarizeLeads,
  updatePublicLeadStatus,
};
