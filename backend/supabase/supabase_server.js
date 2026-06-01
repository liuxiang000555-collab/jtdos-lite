function supabaseServerConfig(env = process.env) {
  return {
    url: env.SUPABASE_URL || "",
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

function getSupabaseServerClient(env = process.env, options = {}) {
  const config = supabaseServerConfig(env);
  const fetchImpl = options.fetch || globalThis.fetch;

  if (!config.url || !config.serviceRoleKey) {
    return {
      enabled: false,
      warning: "Supabase server storage is not configured.",
    };
  }

  return {
    enabled: true,
    select: async (table, { search = "", headers = {} } = {}) => {
      const endpoint = `${config.url.replace(/\/$/, "")}/rest/v1/${encodeURIComponent(table)}${search}`;
      const response = await fetchImpl(endpoint, {
        method: "GET",
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          Accept: "application/json",
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error(`Supabase select failed with status ${response.status}`);
      }

      return response.json();
    },
    insert: async (table, row) => {
      const endpoint = `${config.url.replace(/\/$/, "")}/rest/v1/${encodeURIComponent(table)}`;
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(row),
      });

      if (!response.ok) {
        throw new Error(`Supabase insert failed with status ${response.status}`);
      }

      return { success: true };
    },
  };
}

module.exports = {
  getSupabaseServerClient,
  supabaseServerConfig,
};
