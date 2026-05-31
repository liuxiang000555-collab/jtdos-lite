function contactLeadEmailConfig(env = process.env) {
  return {
    provider: (env.EMAIL_PROVIDER || "").toLowerCase(),
    from: env.EMAIL_FROM || "",
    to: env.CONTACT_NOTIFY_EMAIL || env.EMAIL_TO || "",
    apiKey: env.EMAIL_API_KEY || env.RESEND_API_KEY || "",
  };
}

function contactLeadEmailSubject(lead) {
  return `New JTDOS Pro Beta Lead: ${lead.plan || "Pro Beta"} - ${lead.company || lead.name || "Unknown"}`;
}

function contactLeadEmailBody(lead) {
  return [
    "New JTDOS Contact / Pro Beta Request",
    "",
    `Lead ID: ${lead.lead_id}`,
    `Name: ${lead.name || ""}`,
    `Company: ${lead.company || ""}`,
    `Country: ${lead.country || ""}`,
    `Email: ${lead.email || ""}`,
    `WhatsApp / LINE: ${lead.messenger || ""}`,
    `Interested Plan: ${lead.plan || ""}`,
    `Company Type: ${lead.company_type || ""}`,
    `Estimated Monthly Inquiries: ${lead.estimated_monthly_inquiries || ""}`,
    "",
    "Message:",
    lead.message || "",
  ].join("\n");
}

async function sendContactLeadEmailNotification(lead, env = process.env, options = {}) {
  const config = contactLeadEmailConfig(env);
  const subject = contactLeadEmailSubject(lead);
  const body = contactLeadEmailBody(lead);

  if (!config.provider || !config.from || !config.to) {
    return {
      success: false,
      skipped: true,
      channel: "email",
      warning: "Contact email notification is not configured. Lead submission still succeeded.",
    };
  }

  if (options.dryRun) {
    return {
      success: true,
      dry_run: true,
      channel: "email",
      provider: config.provider,
      to_configured: true,
      subject,
      body,
    };
  }

  if (config.provider === "resend") {
    if (!config.apiKey) {
      return {
        success: false,
        skipped: true,
        channel: "email",
        provider: "resend",
        warning: "Resend API key is not configured. Lead submission still succeeded.",
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.from,
          to: [config.to],
          subject,
          text: body,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          success: false,
          failed: true,
          channel: "email",
          provider: "resend",
          warning: "Resend email notification failed. Lead submission still succeeded.",
          status: response.status,
        };
      }
      return {
        success: true,
        channel: "email",
        provider: "resend",
        email_id: result.id || "",
      };
    } catch (error) {
      return {
        success: false,
        failed: true,
        channel: "email",
        provider: "resend",
        warning: "Resend email notification failed. Lead submission still succeeded.",
      };
    }
  }

  if (config.provider === "smtp") {
    return {
      success: false,
      skipped: true,
      channel: "email",
      provider: "smtp",
      warning: "SMTP email notification is configured as a placeholder. Lead submission still succeeded.",
    };
  }

  return {
    success: false,
    skipped: true,
    channel: "email",
    provider: config.provider,
    warning: "Unsupported email provider. Lead submission still succeeded.",
  };
}

module.exports = {
  contactLeadEmailBody,
  contactLeadEmailConfig,
  contactLeadEmailSubject,
  sendContactLeadEmailNotification,
};
