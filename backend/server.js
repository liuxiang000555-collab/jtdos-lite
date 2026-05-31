const http = require("http");
const fs = require("fs");
const path = require("path");
const { extractOrder } = require("./agent/extract_order");
const { generateQuote } = require("./quote/generate_quote");
const { createBookingRequest } = require("./order/create_order");
const { sendOrderToJtdss } = require("./jtdss");
const { getJtdssMode, configCheck } = require("./config/env");
const { isPublicLiteMode } = require("./config/edition");
const { sendContactLeadEmailNotification } = require("./notification/contact_lead_email");
const { appendLeadToGoogleSheet } = require("./lead_storage/google_sheets_lead_storage");

const ROOT = path.resolve(__dirname, "..");
const PRICE_TABLES = {
  hokkaido: "database/jtdos_hokkaido_price_real_v1.json",
  tokyo: "database/jtdos_tokyo_price_real_v1.json",
  osaka: "database/jtdos_osaka_price_real_v1.json",
};
const LITE_PRICE_TABLES = {
  hokkaido: "database/mock_hokkaido_price_lite.json",
  tokyo: "database/mock_tokyo_price_lite.json",
  osaka: "database/mock_osaka_price_lite.json",
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendHtml(res, status, html) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function priceTableStatus() {
  const tables = isPublicLiteMode(process.env) ? LITE_PRICE_TABLES : PRICE_TABLES;
  return Object.fromEntries(
    Object.entries(tables).map(([region, file]) => [
      region,
      fs.existsSync(path.join(ROOT, file)),
    ])
  );
}

function maskSensitiveOrderForLog(order = {}) {
  return {
    jtdos_order_id: order.jtdos_order_id,
    service_type: order.service_type,
    region: order.region,
    status: order.status || order.order_status,
    customer: order.customer ? {
      name: order.customer.name ? "[masked]" : "",
      email: order.customer.email ? "[masked]" : "",
      whatsapp: order.customer.whatsapp ? "[masked]" : "",
      line_contact: order.customer.line_contact ? "[masked]" : "",
      primary_contact_channel: order.customer.primary_contact_channel,
    } : undefined,
  };
}

function maskLeadForLog(lead = {}) {
  return {
    lead_id: lead.lead_id,
    plan: lead.plan,
    company_type: lead.company_type,
    country: lead.country,
    estimated_monthly_inquiries: lead.estimated_monthly_inquiries,
    name: lead.name ? "[masked]" : "",
    company: lead.company ? "[masked]" : "",
    email: lead.email ? "[masked]" : "",
    messenger: lead.messenger ? "[masked]" : "",
  };
}

function publicConfig(env = process.env) {
  const whatsapp = env.PUBLIC_FAST_TRACK_WHATSAPP || "";
  return {
    success: true,
    fast_track_whatsapp_configured: Boolean(whatsapp),
    fast_track_whatsapp_url: whatsapp,
    paypal_payment_note: env.PUBLIC_PAYPAL_PAYMENT_NOTE || "PayPal payment is available after WhatsApp confirmation.",
    paypal_qr_enabled: env.PUBLIC_PAYPAL_QR_ENABLED === "true",
  };
}

async function routeRequest(req, res) {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/") {
    const html = fs.readFileSync(path.join(ROOT, "frontend/landing.html"), "utf8");
    return sendHtml(res, 200, html);
  }

  if (req.method === "GET" && url.pathname === "/pricing") {
    const html = fs.readFileSync(path.join(ROOT, "frontend/pricing.html"), "utf8");
    return sendHtml(res, 200, html);
  }

  if (req.method === "GET" && url.pathname === "/contact") {
    const html = fs.readFileSync(path.join(ROOT, "frontend/contact.html"), "utf8");
    return sendHtml(res, 200, html);
  }

  if (req.method === "GET" && [
    "/dashboard",
    "/dashboard/settings",
    "/dashboard/billing",
    "/dashboard/price-tables",
    "/dashboard/integrations",
  ].includes(url.pathname)) {
    const html = fs.readFileSync(path.join(ROOT, "frontend/dashboard.html"), "utf8");
    return sendHtml(res, 200, html);
  }

  if (req.method === "GET" && url.pathname === "/upgrade") {
    const html = fs.readFileSync(path.join(ROOT, "frontend/upgrade.html"), "utf8");
    return sendHtml(res, 200, html);
  }

  if (req.method === "GET" && url.pathname === "/jtdss-login") {
    const html = fs.readFileSync(path.join(ROOT, "frontend/jtdss-login.html"), "utf8");
    return sendHtml(res, 200, html);
  }

  if (req.method === "GET" && (url.pathname === "/debug/ai-booking" || (url.pathname === "/ai-booking" && url.searchParams.get("debug") === "1"))) {
    const html = fs.readFileSync(path.join(ROOT, "frontend/debug-ai-booking.html"), "utf8");
    return sendHtml(res, 200, html);
  }

  if (req.method === "GET" && url.pathname === "/ai-booking") {
    const html = fs.readFileSync(path.join(ROOT, "frontend/ai-booking.html"), "utf8");
    return sendHtml(res, 200, html);
  }

  if (req.method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, {
      success: true,
      service: "JTDOS Alpha 0.1",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      jtdss_mode: getJtdssMode(process.env),
      price_tables: priceTableStatus(),
    });
  }

  if (req.method === "GET" && url.pathname === "/internal/config-check") {
    return sendJson(res, 200, configCheck(process.env));
  }

  if (req.method === "GET" && url.pathname === "/api/public-config") {
    return sendJson(res, 200, publicConfig(process.env));
  }

  if (req.method === "POST" && url.pathname === "/api/agent/extract-order") {
    const body = await readJsonBody(req);
    return sendJson(res, 200, extractOrder(body.customer_message || body.message || ""));
  }

  if (req.method === "POST" && url.pathname === "/api/quote/generate") {
    const body = await readJsonBody(req);
    return sendJson(res, 200, generateQuote(body));
  }

  if (req.method === "POST" && url.pathname === "/api/order/create") {
    const body = await readJsonBody(req);
    const order = createBookingRequest({
      draftOrder: body.draftOrder || body.draft_order || body.order_draft,
      quote: body.quote,
      customer: body.customer,
    });
    return sendJson(res, 200, { success: true, order });
  }

  if (req.method === "POST" && url.pathname === "/api/contact/submit") {
    const body = await readJsonBody(req);
    const lead = {
      lead_id: `JTDOS-LEAD-${Date.now()}`,
      source: "jtdos_lite_contact",
      name: body.name || "",
      company: body.company || "",
      country: body.country || "",
      email: body.email || "",
      messenger: body.messenger || "",
      plan: body.plan || "Pro Beta",
      company_type: body.company_type || "",
      estimated_monthly_inquiries: body.estimated_monthly_inquiries || "",
      message: body.message || "",
      created_at: new Date().toISOString(),
      mock_submission: true,
    };
    console.log("JTDOS Pro Beta lead mock submission", maskLeadForLog(lead));
    const emailNotification = await sendContactLeadEmailNotification(lead, process.env);
    const leadStorage = await appendLeadToGoogleSheet(lead, process.env);
    return sendJson(res, 200, {
      success: true,
      lead_id: lead.lead_id,
      mock_submission: true,
      email_notification: emailNotification,
      lead_storage: leadStorage,
      message: "Thank you. Your Pro Beta request has been received. The JTDOS team will review your use case and contact you shortly.",
    });
  }

  if (req.method === "POST" && url.pathname === "/api/billing/mock-upgrade") {
    return sendJson(res, 200, {
      success: true,
      plan: "pro",
      payment_status: "paid",
      message: "Pro Cloud activated in mock mode.",
    });
  }

  if (req.method === "POST" && (url.pathname === "/api/jtdss/send-order" || url.pathname === "/api/external/jtdos/orders")) {
    const body = await readJsonBody(req);
    console.log("JTDSS send-order request", maskSensitiveOrderForLog(body.order || body));
    const result = await sendOrderToJtdss(body.order || body, { env: process.env });
    return sendJson(res, result.success ? 200 : 400, result);
  }

  return sendJson(res, 404, { success: false, error_code: "NOT_FOUND" });
}

function createServer() {
  return http.createServer(handleRequest);
}

function handleRequest(req, res) {
  return routeRequest(req, res).catch((error) => {
    sendJson(res, 500, {
      success: false,
      error_code: "INTERNAL_ERROR",
      message: error.message,
    });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, () => {
    console.log(`JTDOS Alpha server listening on http://localhost:${port}`);
  });
}

module.exports = Object.assign(handleRequest, {
  createServer,
  routeRequest,
  priceTableStatus,
  maskSensitiveOrderForLog,
  maskLeadForLog,
  publicConfig,
});
