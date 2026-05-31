const crypto = require("crypto");

const DEFAULT_SHEET_NAME = "Pro Beta Leads";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function leadStorageConfig(env = process.env) {
  return {
    provider: (env.LEAD_STORAGE_PROVIDER || "").toLowerCase(),
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID || "",
    clientEmail: env.GOOGLE_SHEETS_CLIENT_EMAIL || "",
    privateKey: normalizePrivateKey(env.GOOGLE_SHEETS_PRIVATE_KEY || ""),
    sheetName: env.GOOGLE_SHEETS_LEADS_SHEET_NAME || DEFAULT_SHEET_NAME,
  };
}

function normalizePrivateKey(value) {
  return value.replace(/\\n/g, "\n");
}

function leadToGoogleSheetRow(lead = {}) {
  return [
    lead.created_at || new Date().toISOString(),
    "public-lite",
    "pro_beta",
    lead.name || "",
    lead.company || "",
    lead.country || "",
    lead.email || "",
    lead.messenger || "",
    lead.plan || "Pro Beta",
    lead.company_type || "",
    lead.estimated_monthly_inquiries || "",
    lead.message || "",
    "New",
    "",
  ];
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createGoogleJwt(config, nowSeconds = Math.floor(Date.now() / 1000)) {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const claim = {
    iss: config.clientEmail,
    scope: GOOGLE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: nowSeconds + 3600,
    iat: nowSeconds,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(config.privateKey);
  return `${unsigned}.${base64url(signature)}`;
}

async function getGoogleAccessToken(config, options = {}) {
  if (options.accessToken) return options.accessToken;
  const jwt = createGoogleJwt(config);
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error("Google Sheets access token request failed.");
  }
  return data.access_token;
}

function googleAppendUrl(config) {
  const range = encodeURIComponent(`${config.sheetName}!A:N`);
  return `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
}

async function appendLeadToGoogleSheet(lead, env = process.env, options = {}) {
  const config = leadStorageConfig(env);
  const row = leadToGoogleSheetRow(lead);

  if (!config.provider) {
    return {
      success: false,
      skipped: true,
      provider: "",
      warning: "Lead storage is not configured. Lead submission still succeeded.",
    };
  }

  if (config.provider !== "google_sheets") {
    return {
      success: false,
      skipped: true,
      provider: config.provider,
      warning: "Unsupported lead storage provider. Lead submission still succeeded.",
    };
  }

  if (!config.spreadsheetId || !config.clientEmail || !config.privateKey) {
    return {
      success: false,
      skipped: true,
      provider: "google_sheets",
      warning: "Google Sheets lead storage is not fully configured. Lead submission still succeeded.",
    };
  }

  if (options.dryRun) {
    return {
      success: true,
      dry_run: true,
      provider: "google_sheets",
      row,
    };
  }

  try {
    const accessToken = await getGoogleAccessToken(config, options);
    const response = await fetch(googleAppendUrl(config), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        failed: true,
        provider: "google_sheets",
        warning: "Google Sheets lead storage failed. Lead submission still succeeded.",
        status: response.status,
      };
    }

    return {
      success: true,
      provider: "google_sheets",
      appended: true,
    };
  } catch (error) {
    return {
      success: false,
      failed: true,
      provider: "google_sheets",
      warning: "Google Sheets lead storage failed. Lead submission still succeeded.",
    };
  }
}

module.exports = {
  appendLeadToGoogleSheet,
  createGoogleJwt,
  googleAppendUrl,
  leadStorageConfig,
  leadToGoogleSheetRow,
  normalizePrivateKey,
};
