function getJtdssConfig(env = process.env) {
  return {
    apiBaseUrl: env.JTDSS_API_BASE_URL || "",
    apiKey: env.JTDSS_API_KEY || "",
    orderEndpoint: env.JTDSS_ORDER_ENDPOINT || "/api/external/jtdos/orders",
    timeoutMs: Number(env.JTDSS_TIMEOUT_MS || 10000),
  };
}

function validateJtdssConfig(env = process.env) {
  const config = getJtdssConfig(env);
  const missing = [];
  if (!config.apiBaseUrl) missing.push("JTDSS_API_BASE_URL");
  if (!config.apiKey) missing.push("JTDSS_API_KEY");
  if (!config.orderEndpoint) missing.push("JTDSS_ORDER_ENDPOINT");
  return {
    valid: missing.length === 0,
    missing,
    config,
  };
}

function getRuntimeMode(env = process.env) {
  if (env.JTDSS_USE_MOCK === "true") return "test";
  if (env.NODE_ENV === "production" || env.NODE_ENV === "staging") return "production";
  return "test";
}

function getJtdssMode(env = process.env) {
  return getRuntimeMode(env) === "production" ? "real" : "mock";
}

function configCheck(env = process.env) {
  return {
    jtdss_api_base_url: Boolean(env.JTDSS_API_BASE_URL),
    jtdss_api_key: Boolean(env.JTDSS_API_KEY),
    email_provider: Boolean(env.EMAIL_PROVIDER),
    telegram_bot_token: Boolean(env.TELEGRAM_BOT_TOKEN),
    paypal_payment_link: Boolean(env.PAYPAL_PAYMENT_LINK),
    usd_jpy_rate: Boolean(env.USD_JPY_RATE),
  };
}

module.exports = {
  getJtdssConfig,
  validateJtdssConfig,
  getRuntimeMode,
  getJtdssMode,
  configCheck,
};
