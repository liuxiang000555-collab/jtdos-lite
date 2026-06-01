const { getSupabaseServerClient } = require("../supabase/supabase_server");

function parseLeadStorageProviders(env = process.env) {
  return (env.LEAD_STORAGE_PROVIDER || "")
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean);
}

function planToLeadType(plan = "") {
  const normalized = String(plan).toLowerCase();
  if (normalized.includes("private") || normalized.includes("enterprise")) {
    return "private_license";
  }
  if (normalized.includes("pro")) {
    return "pro_beta";
  }
  if (normalized.includes("partner")) {
    return "partnership";
  }
  return "pro_beta";
}

function leadToSupabaseLeadRow(lead = {}) {
  return {
    organization_id: null,
    name: lead.name || "",
    company: lead.company || "",
    country: lead.country || "",
    email: lead.email || "",
    messenger: lead.messenger || "",
    interested_plan: lead.plan || "Pro Beta",
    company_type: lead.company_type || "",
    estimated_monthly_inquiries: lead.estimated_monthly_inquiries || "",
    message: lead.message || "",
    source: "public_contact",
    lead_status: "new",
    lead_type: planToLeadType(lead.plan),
  };
}

async function appendLeadToSupabase(lead, env = process.env, options = {}) {
  const providers = parseLeadStorageProviders(env);
  const row = leadToSupabaseLeadRow(lead);

  if (!providers.length) {
    return {
      success: false,
      skipped: true,
      provider: "",
      warning: "Lead storage is not configured. Lead submission still succeeded.",
    };
  }

  if (!providers.includes("supabase")) {
    return {
      success: false,
      skipped: true,
      provider: providers.join(","),
      warning: "Supabase lead storage is not enabled. Lead submission still succeeded.",
    };
  }

  const client = getSupabaseServerClient(env, options);
  if (!client.enabled) {
    return {
      success: false,
      skipped: true,
      provider: "supabase",
      warning: "Supabase lead storage is not fully configured. Lead submission still succeeded.",
    };
  }

  if (options.dryRun) {
    return {
      success: true,
      dry_run: true,
      provider: "supabase",
      row,
    };
  }

  try {
    await client.insert("leads", row);
    return {
      success: true,
      provider: "supabase",
      inserted: true,
    };
  } catch (error) {
    return {
      success: false,
      failed: true,
      provider: "supabase",
      warning: "Supabase lead storage failed. Lead submission still succeeded.",
    };
  }
}

module.exports = {
  appendLeadToSupabase,
  leadToSupabaseLeadRow,
  parseLeadStorageProviders,
  planToLeadType,
};
