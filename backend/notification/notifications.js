function orderSummary(order) {
  return {
    jtdos_order_id: order.jtdos_order_id,
    service_type: order.service_type,
    region: order.region,
    pickup_location: order.route.pickup_location,
    dropoff_location: order.route.dropoff_location,
    pickup_date: order.route.pickup_date,
    pickup_time: order.route.pickup_time,
    passenger_count: order.passenger.passenger_count,
    luggage_count: order.passenger.luggage_count,
    vehicle_type: order.vehicle.vehicle_type,
    price_jpy: order.pricing.price_jpy,
    customer_name: order.customer.name,
    customer_contact: order.customer.whatsapp || order.customer.email || order.customer.line_contact,
    operator_review_required: order.metadata.operator_review_required,
  };
}

function reviewWarning(order) {
  return order.metadata.operator_review_required ? "⚠️ Operator review required before dispatch." : "";
}

function sendJtdosOrderEmailNotification(order, env = process.env) {
  if (!env.EMAIL_PROVIDER && !env.SMTP_HOST && !env.RESEND_API_KEY && !env.SENDGRID_API_KEY) {
    return {
      success: false,
      skipped: true,
      channel: "email",
      warning: "Email service is not configured. Notification skipped.",
    };
  }

  return {
    success: true,
    channel: "email",
    subject: `New JTDOS Order: ${order.service_type} - ${order.route.pickup_location} to ${order.route.dropoff_location}`,
    body: `${reviewWarning(order)}\n${JSON.stringify(orderSummary(order), null, 2)}`.trim(),
  };
}

function sendJtdosOrderTelegramNotification(order, env = process.env) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return {
      success: false,
      skipped: true,
      channel: "telegram",
      warning: "Telegram service is not configured. Notification skipped.",
    };
  }

  return {
    success: true,
    channel: "telegram",
    message: `${reviewWarning(order)}\nNew JTDOS Order\n${JSON.stringify(orderSummary(order), null, 2)}`.trim(),
  };
}

function generateWhatsAppManualLink(order) {
  const whatsapp = order.customer.whatsapp;
  if (!whatsapp) {
    return {
      success: false,
      skipped: true,
      channel: "whatsapp",
      warning: "Customer WhatsApp is missing. Manual link skipped.",
    };
  }

  const phone = whatsapp.replace(/[^\d]/g, "");
  const message = [
    "Hello, thank you for your booking request.",
    `Order ID: ${order.jtdos_order_id}`,
    `Service: ${order.service_type}`,
    `Route: ${order.route.pickup_location} to ${order.route.dropoff_location}`,
    `Date/Time: ${order.route.pickup_date} ${order.route.pickup_time}`,
    `Vehicle: ${order.vehicle.vehicle_type}`,
    `Estimated Price: JPY ${order.pricing.price_jpy}`,
    "We will confirm vehicle availability and final details shortly.",
  ].join("\n");

  return {
    success: true,
    channel: "whatsapp",
    whatsapp_manual_link: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
  };
}

function notifyJtdosOrder(order, env = process.env) {
  return {
    email: sendJtdosOrderEmailNotification(order, env),
    telegram: sendJtdosOrderTelegramNotification(order, env),
    whatsapp: generateWhatsAppManualLink(order),
  };
}

module.exports = {
  notifyJtdosOrder,
  sendJtdosOrderEmailNotification,
  sendJtdosOrderTelegramNotification,
  generateWhatsAppManualLink,
};
