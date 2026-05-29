const { notifyJtdosOrder } = require("../notification/notifications");

const ordersByJtdosId = new Map();
let jtdssSequence = 1;

function validateOrder(order) {
  const required = [
    ["jtdos_order_id", order.jtdos_order_id],
    ["service_type", order.service_type],
    ["region", order.region],
    ["route.pickup_location", order.route?.pickup_location],
    ["route.dropoff_location", order.route?.dropoff_location],
    ["route.pickup_date", order.route?.pickup_date],
    ["route.pickup_time", order.route?.pickup_time],
    ["passenger.passenger_count", order.passenger?.passenger_count],
    ["vehicle.vehicle_type", order.vehicle?.vehicle_type],
    ["pricing.price_jpy", order.pricing?.price_jpy],
  ];
  const missing = required.filter(([, value]) => value === undefined || value === null || value === "").map(([key]) => key);
  return missing;
}

function nextJtdssOrderId() {
  const id = `JTDSS-${String(jtdssSequence).padStart(6, "0")}`;
  jtdssSequence += 1;
  return id;
}

function mapJtdssStatus(order) {
  return order.metadata?.operator_review_required ? "pending_operator_review" : "booking_request_received";
}

function sendOrderToJtdss(order, options = {}) {
  const missing = validateOrder(order);
  if (missing.length) {
    return {
      success: false,
      error_code: "INVALID_PAYLOAD",
      message: `Missing required field: ${missing[0]}`,
    };
  }

  if (ordersByJtdosId.has(order.jtdos_order_id)) {
    return {
      success: false,
      error_code: "DUPLICATE_ORDER",
      message: "This JTDOS order already exists.",
    };
  }

  const jtdssOrderId = nextJtdssOrderId();
  const jtdssStatus = mapJtdssStatus(order);
  const storedOrder = {
    ...order,
    jtdss_order_id: jtdssOrderId,
    jtdss_status: jtdssStatus,
  };
  ordersByJtdosId.set(order.jtdos_order_id, storedOrder);

  const notifications = notifyJtdosOrder(storedOrder, options.env || process.env);

  return {
    success: true,
    jtdss_order_id: jtdssOrderId,
    jtdos_order_id: order.jtdos_order_id,
    status: jtdssStatus,
    message: "Order received by JTDSS.",
    notifications,
  };
}

function resetJtdssMock() {
  ordersByJtdosId.clear();
  jtdssSequence = 1;
}

function getJtdssOrder(jtdosOrderId) {
  return ordersByJtdosId.get(jtdosOrderId);
}

module.exports = {
  sendOrderToJtdss,
  resetJtdssMock,
  getJtdssOrder,
};
