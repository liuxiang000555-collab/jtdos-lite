const { extractOrder } = require("../agent/extract_order");
const { generateQuote } = require("../quote/generate_quote");
const { createBookingRequest } = require("../order/create_order");
const { sendOrderToJtdss } = require("../jtdss/mock_jtdss");

function quoteInputFromDraft(draft, overrides = {}) {
  return {
    region: draft.region,
    service_type: draft.service_type,
    pickup_location: draft.pickup_location || draft.arrival_airport,
    dropoff_location: draft.dropoff_location,
    pickup_date: draft.pickup_date,
    pickup_time: draft.pickup_time,
    vehicle_type: draft.recommended_vehicle || draft.vehicle_type,
    passenger_count: draft.passenger_count,
    luggage_count: draft.luggage_count,
    ski_equipment_count: draft.ski_equipment_count,
    child_seat_required: draft.child_seat_required,
    child_seat_count: draft.child_seat_count,
    signage_required: draft.signage_required,
    preferred_language: draft.preferred_language,
    exchange_rate_usd_jpy: 155,
    ...overrides,
  };
}

function buildQuoteCard(quote) {
  return {
    price_jpy: quote.price_jpy,
    price_usd_reference: quote.price_usd_reference,
    included: quote.included,
    excluded: quote.excluded,
    night_surcharge_jpy: quote.breakdown?.night_surcharge_jpy || 0,
    deposit_required: true,
    deposit_rate: 0.2,
    deposit_amount_jpy: Math.round(Number(quote.price_jpy || 0) * 0.2),
    cancellation_policy: "Free cancellation 7 days or more before service date; 10% of total order amount charged within 7 days.",
    price_status: quote.price_status,
    operator_review_required: quote.operator_review_required,
  };
}

function runAiBookingScenario(customerMessage, options = {}) {
  const draftOrder = extractOrder(customerMessage);
  const quote = generateQuote(quoteInputFromDraft(draftOrder, options.quoteOverrides));
  const bookingRequest = createBookingRequest({
    draftOrder,
    quote,
    customer: options.customer || {
      name: "Test Customer",
      country: "United States",
      email: "test@example.com",
      whatsapp: "+000000000",
      primary_contact_channel: "WhatsApp",
    },
  });
  const jtdssResult = sendOrderToJtdss(bookingRequest, { env: options.env || {} });

  return {
    draftOrder,
    quote,
    quoteCard: buildQuoteCard(quote),
    bookingRequest,
    jtdssResult,
  };
}

module.exports = {
  runAiBookingScenario,
  quoteInputFromDraft,
  buildQuoteCard,
};
