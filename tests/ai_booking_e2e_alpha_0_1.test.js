const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { extractOrder } = require("../backend/agent/extract_order");
const { generateQuote } = require("../backend/quote/generate_quote");
const { quoteInputFromDraft, runAiBookingScenario } = require("../backend/e2e/ai_booking_flow");
const { createBookingRequest } = require("../backend/order/create_order");
const { sendOrderToJtdss, resetJtdssMock } = require("../backend/jtdss/mock_jtdss");

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    resetJtdssMock();
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    failures.push({ name, message: error.message });
    console.error(`not ok - ${name}`);
    console.error(error.stack);
  }
}

function finish() {
  console.log(`\nai_booking_e2e_alpha_0_1 summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

function assertFrontendComponent(id) {
  const html = fs.readFileSync(path.resolve(__dirname, "../frontend/ai-booking.html"), "utf8");
  assert.equal(html.includes(`id="${id}"`), true, `${id} is missing from ai-booking page`);
}

function assertQuoteCard(quoteCard) {
  assert.equal(typeof quoteCard.price_jpy, "number");
  assert.ok(Array.isArray(quoteCard.included));
  assert.ok(Array.isArray(quoteCard.excluded));
  assert.equal(quoteCard.deposit_required, true);
  assert.equal(quoteCard.deposit_rate, 0.2);
  assert.equal(typeof quoteCard.deposit_amount_jpy, "number");
  assert.ok(quoteCard.cancellation_policy.includes("7 days"));
  assert.ok(quoteCard.price_status);
}

test("/ai-booking page contains required Alpha 0.1 components", () => {
  for (const id of [
    "chat-input",
    "chat-message-list",
    "request-summary-panel",
    "quote-card",
    "customer-contact-form",
    "send-need-button",
    "estimate-price-button",
    "continue-info-button",
    "submit-booking-request-button",
    "success-error-message",
  ]) {
    assertFrontendComponent(id);
  }
});

test("/ai-booking customer page uses sales assistant language and hides debug by default", () => {
  const html = fs.readFileSync(path.resolve(__dirname, "../frontend/ai-booking.html"), "utf8");
  assert.ok(html.includes("JTDOS AI Japan Travel Assistant"));
  assert.ok(html.includes("AI 日本旅游用车顾问"));
  assert.ok(html.includes("告诉我您的日本行程需求"));
  assert.ok(html.includes("submit-booking-request-button"));
  assert.equal(html.includes("debug"), false);
  assert.equal(html.includes('id="debug-panel"'), false);
  assert.equal(html.includes("send to JTDSS"), false);
  assert.equal(html.includes("JTDSS"), false);
  assert.equal(html.includes("webhook"), false);
  assert.equal(html.includes("raw JSON"), false);
  assert.equal(html.includes("extract-order"), false);
  assert.equal(html.includes("backend"), false);
  assert.equal(html.includes("API"), false);
  assert.equal(html.includes('value="Test Customer"'), false);
  assert.equal(html.includes('value="test@example.com"'), false);
  assert.equal(html.includes(">Status<"), false);
  assert.equal(html.includes(">Included<"), false);
  assert.equal(html.includes(">Excluded<"), false);
  assert.ok(html.includes("Fixed route price"));
  assert.ok(html.includes("固定路线价格"));
  assert.ok(html.includes("Precio fijo de la ruta"));
  assert.ok(html.includes("只有 URL 带") === false);
});

test("extract-order recognizes child seat, stroller, and signage requests", () => {
  const childSeatDraft = extractOrder("Haneda to Shinjuku, 2 adults and 1 child, need child seat.");
  assert.equal(childSeatDraft.child_seat_required, true);
  assert.ok(childSeatDraft.child_seat_count >= 1);
  const childSeatQuote = generateQuote(quoteInputFromDraft(childSeatDraft));
  assert.equal(childSeatQuote.breakdown.child_seat_jpy, 1000);

  const strollerDraft = extractOrder("Haneda to Shinjuku. We have 2 suitcases and one baby stroller.");
  assert.equal(strollerDraft.stroller_detected, true);
  assert.equal(strollerDraft.stroller_count, 1);
  assert.ok(strollerDraft.special_luggage.includes("baby_stroller"));
  assert.equal(strollerDraft.luggage_count, 3);

  const signageDraft = extractOrder("Haneda Airport to Shinjuku for 2 people with 2 suitcases. Can the driver hold a name sign at the airport?");
  assert.equal(signageDraft.signage_required, true);
  const signageQuote = generateQuote(quoteInputFromDraft(signageDraft));
  assert.equal(signageQuote.breakdown.signage_jpy, 2000);
});

test("extract-order handles Tokyo Haneda to Shinjuku complete input", () => {
  const draft = extractOrder("We are 4 people arriving at Haneda Airport on June 1 at 14:30, flight JL000, going to Shinjuku with 4 suitcases. We prefer a Chinese-speaking driver.");
  assert.equal(draft.service_type, "airport_pickup");
  assert.equal(draft.region, "Tokyo");
  assert.equal(draft.arrival_airport, "HND");
  assert.equal(draft.dropoff_location, "Shinjuku / Tokyo 23 Wards");
  assert.equal(draft.pickup_date, "2026-06-01");
  assert.equal(draft.pickup_time, "14:30");
  assert.equal(draft.flight_number, "JL000");
  assert.equal(draft.passenger_count, 4);
  assert.equal(draft.luggage_count, 4);
  assert.equal(draft.preferred_language, "Chinese");
  assert.equal(draft.vehicle_type, "Alphard/Vellfire");
  assert.deepEqual(draft.missing_fields, []);
});

test("extract-order handles Kansai Airport to Kyoto incomplete input", () => {
  const draft = extractOrder("We need a car from Kansai Airport to Kyoto for 6 people with 6 suitcases.");
  assert.equal(draft.region, "Osaka");
  assert.equal(draft.arrival_airport, "KIX");
  assert.equal(draft.dropoff_location, "Kyoto City");
  assert.equal(draft.passenger_count, 6);
  assert.equal(draft.luggage_count, 6);
  assert.equal(draft.recommended_vehicle, "HiAce");
  assert.ok(draft.missing_fields.includes("pickup_date"));
  assert.ok(draft.missing_fields.includes("pickup_time"));
  assert.ok(draft.missing_fields.includes("flight_number"));
});

test("extract-order handles Hokkaido ski equipment input", () => {
  const draft = extractOrder("We are going to Niseko from New Chitose Airport with 4 people, 4 suitcases and ski bags.");
  assert.equal(draft.region, "Hokkaido");
  assert.equal(draft.arrival_airport, "CTS");
  assert.equal(draft.dropoff_location, "Niseko");
  assert.equal(draft.recommended_vehicle, "HiAce");
  assert.equal(draft.operator_review_required, true);
  assert.ok(draft.reason.toLowerCase().includes("ski"));
});

test("extract-order handles vague Chinese Hokkaido airport transfer price inquiry", () => {
  const draft = extractOrder("我想去北海道 想问一下 接送机多少钱");
  assert.equal(draft.service_type, "airport_pickup");
  assert.equal(draft.region, "Hokkaido");
  assert.ok(draft.missing_fields.includes("arrival_airport"));
  assert.ok(draft.missing_fields.includes("dropoff_location"));
  assert.ok(draft.missing_fields.includes("passenger_count"));
  assert.ok(draft.missing_fields.includes("luggage_count"));
});

test("extract-order can merge a vague Hokkaido inquiry with later customer details", () => {
  const combinedMessage = [
    "我想去北海道 想问一下 接送机多少钱",
    "新千岁机场到二世谷，4个人，4个箱子，2个雪板，1月10日13点，航班 NH000",
  ].join("\n");
  const draft = extractOrder(combinedMessage);
  assert.equal(draft.region, "Hokkaido");
  assert.equal(draft.arrival_airport, "CTS");
  assert.equal(draft.dropoff_location, "Niseko");
  assert.equal(draft.passenger_count, 4);
  assert.equal(draft.luggage_count, 4);
  assert.equal(draft.ski_equipment_count, 2);
  assert.equal(draft.pickup_date, "2026-01-10");
  assert.equal(draft.pickup_time, "13:00");
  assert.equal(draft.flight_number, "NH000");
  assert.equal(draft.recommended_vehicle, "HiAce");
  assert.equal(draft.operator_review_required, true);
});

test("extract-order handles Chinese adults, children, and Hoshino destination", () => {
  const combinedMessage = [
    "我想去北海道 接机多少钱",
    "新千岁机场 接我们去星野酒店 2个大人1个孩子 3个行李箱",
  ].join("\n");
  const draft = extractOrder(combinedMessage);
  assert.equal(draft.region, "Hokkaido");
  assert.equal(draft.arrival_airport, "CTS");
  assert.equal(draft.dropoff_location, "Hoshino Resort Tomamu");
  assert.equal(draft.passenger_count, 3);
  assert.equal(draft.luggage_count, 3);
  assert.equal(draft.recommended_vehicle, "Alphard/Vellfire");
  assert.equal(draft.missing_fields.includes("dropoff_location"), false);
  assert.equal(draft.missing_fields.includes("passenger_count"), false);
});

test("extract-order merges Chinese Tokyo vague inquiry with Haneda to Shinjuku details", () => {
  const combinedMessage = [
    "我们想去东京 请问接机多少钱",
    "羽田机场 到 新宿酒店 2个人 4个行李 12月24号",
  ].join("\n");
  const draft = extractOrder(combinedMessage);
  assert.equal(draft.region, "Tokyo");
  assert.equal(draft.arrival_airport, "HND");
  assert.equal(draft.dropoff_location, "Shinjuku / Tokyo 23 Wards");
  assert.equal(draft.passenger_count, 2);
  assert.equal(draft.luggage_count, 4);
  assert.equal(draft.pickup_date, "2026-12-24");
  assert.equal(draft.missing_fields.includes("region"), false);
  assert.equal(draft.missing_fields.includes("arrival_airport"), false);
  assert.equal(draft.missing_fields.includes("dropoff_location"), false);
});

test("extract-order recognizes multilingual Tokyo, Osaka, and Hokkaido destinations", () => {
  const tokyo = extractOrder("Llegamos al aeropuerto de Haneda el 24 de diciembre y vamos a Shinjuku. Somos 2 personas con 4 maletas.");
  assert.equal(tokyo.region, "Tokyo");
  assert.equal(tokyo.arrival_airport, "HND");
  assert.equal(tokyo.dropoff_location, "Shinjuku / Tokyo 23 Wards");
  assert.equal(tokyo.passenger_count, 2);
  assert.equal(tokyo.luggage_count, 4);
  assert.equal(tokyo.pickup_date, "2026-12-24");

  const osaka = extractOrder("Kansai Airport to Universal Studios Japan for 5 people with 5 suitcases.");
  assert.equal(osaka.region, "Osaka");
  assert.equal(osaka.arrival_airport, "KIX");
  assert.equal(osaka.dropoff_location, "USJ");
  assert.equal(osaka.recommended_vehicle, "HiAce");

  const hokkaido = extractOrder("新千岁机场到洞爷湖，3个人，3个行李");
  assert.equal(hokkaido.region, "Hokkaido");
  assert.equal(hokkaido.arrival_airport, "CTS");
  assert.equal(hokkaido.dropoff_location, "Lake Toya");
  assert.equal(hokkaido.passenger_count, 3);
  assert.equal(hokkaido.luggage_count, 3);
});

test("extract-order recognizes Spanish ski and snowboard equipment", () => {
  const draft = extractOrder("Llegamos al aeropuerto de New Chitose y vamos a Niseko. Somos 4 personas con 4 maletas y 2 bolsas de esquí.");
  assert.equal(draft.region, "Hokkaido");
  assert.equal(draft.arrival_airport, "CTS");
  assert.equal(draft.dropoff_location, "Niseko");
  assert.equal(draft.passenger_count, 4);
  assert.equal(draft.luggage_count, 4);
  assert.equal(draft.ski_equipment_count, 2);
  assert.equal(draft.recommended_vehicle, "HiAce");
  assert.equal(draft.operator_review_required, true);
});

test("extract-order detects Chinese service types and route direction", () => {
  const pickup = extractOrder("羽田机场到新宿酒店，2个人，4个行李");
  assert.equal(pickup.service_type, "airport_pickup");
  assert.equal(pickup.pickup_location, "HND");
  assert.equal(pickup.dropoff_location, "Shinjuku / Tokyo 23 Wards");

  const dropoff = extractOrder("新宿酒店到羽田机场，明天早上送机");
  assert.equal(dropoff.service_type, "airport_dropoff");
  assert.equal(dropoff.pickup_location, "Shinjuku / Tokyo 23 Wards");
  assert.equal(dropoff.dropoff_location, "HND");
  assert.equal(dropoff.departure_airport, "HND");

  const pointToPoint = extractOrder("东京到箱根多少钱？");
  assert.equal(pointToPoint.service_type, "point_to_point");
  assert.equal(pointToPoint.pickup_location, "Tokyo 23 Wards");
  assert.equal(pointToPoint.dropoff_location, "Hakone");

  assert.equal(extractOrder("我想东京包车一天").service_type, "charter");
  assert.equal(extractOrder("北海道5天包车多少钱？").service_type, "multi_day_charter");
});

test("extract-order detects English service types and from-to routes", () => {
  const pickup = extractOrder("Haneda Airport to Shinjuku hotel");
  assert.equal(pickup.service_type, "airport_pickup");
  assert.equal(pickup.pickup_location, "HND");
  assert.equal(pickup.dropoff_location, "Shinjuku / Tokyo 23 Wards");

  const dropoff = extractOrder("Shinjuku hotel to Haneda Airport tomorrow morning");
  assert.equal(dropoff.service_type, "airport_dropoff");
  assert.equal(dropoff.pickup_location, "Shinjuku / Tokyo 23 Wards");
  assert.equal(dropoff.dropoff_location, "HND");

  const pointToPoint = extractOrder("How much from Tokyo to Hakone?");
  assert.equal(pointToPoint.service_type, "point_to_point");
  assert.equal(pointToPoint.pickup_location, "Tokyo 23 Wards");
  assert.equal(pointToPoint.dropoff_location, "Hakone");

  assert.equal(extractOrder("I need a car charter in Tokyo for one day").service_type, "charter");
  assert.equal(extractOrder("We need a 5-day charter in Hokkaido").service_type, "multi_day_charter");
});

test("extract-order detects Spanish service types and from-to routes", () => {
  const pickup = extractOrder("Del aeropuerto de Haneda a Shinjuku");
  assert.equal(pickup.service_type, "airport_pickup");
  assert.equal(pickup.pickup_location, "HND");
  assert.equal(pickup.dropoff_location, "Shinjuku / Tokyo 23 Wards");

  const dropoff = extractOrder("De Shinjuku al aeropuerto de Haneda mañana por la mañana");
  assert.equal(dropoff.service_type, "airport_dropoff");
  assert.equal(dropoff.pickup_location, "Shinjuku / Tokyo 23 Wards");
  assert.equal(dropoff.dropoff_location, "HND");

  const pointToPoint = extractOrder("¿Cuánto cuesta de Tokio a Hakone?");
  assert.equal(pointToPoint.service_type, "point_to_point");
  assert.equal(pointToPoint.pickup_location, "Tokyo 23 Wards");
  assert.equal(pointToPoint.dropoff_location, "Hakone");

  assert.equal(extractOrder("Necesitamos un coche privado por un día en Tokio").service_type, "charter");
  assert.equal(extractOrder("Queremos un tour privado de 5 días en Hokkaido").service_type, "multi_day_charter");
});

test("extract-order handles point-to-point from/to examples across regions", () => {
  const osaka = extractOrder("从大阪市区去USJ");
  assert.equal(osaka.service_type, "point_to_point");
  assert.equal(osaka.region, "Osaka");
  assert.equal(osaka.pickup_location, "Osaka City");
  assert.equal(osaka.dropoff_location, "USJ");

  const hokkaido = extractOrder("Sapporo to Lake Toya");
  assert.equal(hokkaido.service_type, "point_to_point");
  assert.equal(hokkaido.region, "Hokkaido");
  assert.equal(hokkaido.pickup_location, "Sapporo");
  assert.equal(hokkaido.dropoff_location, "Lake Toya");

  const kansaiDropoff = extractOrder("del hotel en Kioto al aeropuerto de Kansai");
  assert.equal(kansaiDropoff.service_type, "airport_dropoff");
  assert.equal(kansaiDropoff.region, "Osaka");
  assert.equal(kansaiDropoff.pickup_location, "Kyoto City");
  assert.equal(kansaiDropoff.dropoff_location, "KIX");
});

test("/ai-booking has Tokyo and Osaka vague inquiry sales guidance", () => {
  const html = fs.readFileSync(path.resolve(__dirname, "../frontend/ai-booking.html"), "utf8");
  assert.ok(html.includes("羽田到东京23区通常更近"));
  assert.ok(html.includes("成田到东京市区距离更远"));
  assert.ok(html.includes("关西机场到大阪市区、京都、奈良、神户"));
  assert.ok(html.includes("Kyoto hotels and old town areas"));
  assert.equal(html.includes("缺失字段"), false);
});

test("/ai-booking explains vehicle recommendation like a sales consultant", () => {
  const hokkaidoDraft = extractOrder("We are 4 people going to Niseko with 4 suitcases and ski bags.");
  assert.equal(hokkaidoDraft.recommended_vehicle, "HiAce");

  const tokyoDraft = extractOrder("Haneda Airport to Shinjuku, 2 people, 2 suitcases.");
  assert.equal(tokyoDraft.recommended_vehicle, "Alphard/Vellfire");

  const html = fs.readFileSync(path.resolve(__dirname, "../frontend/ai-booking.html"), "utf8");
  assert.ok(html.includes("ski bags and large suitcases"));
  assert.ok(html.includes("HiAce is safer and more comfortable"));
  assert.ok(html.includes("适合 1–4 位客人"));
  assert.ok(html.includes("airport transfers, business reception, and small family groups"));
});

test("/ai-booking quote card includes commercial booking information", () => {
  const html = fs.readFileSync(path.resolve(__dirname, "../frontend/ai-booking.html"), "utf8");
  assert.ok(html.includes("20% deposit"));
  assert.ok(html.includes("PayPal"));
  assert.ok(html.includes("Cancellation within 7 days is charged 10%"));
  assert.ok(html.includes("21:00 and 07:00 adds 20%"));
  assert.ok(html.includes("90 minutes of free waiting time"));
  assert.ok(html.includes("Highway toll"));
  assert.ok(html.includes("Parking fee"));
  assert.ok(html.includes("This booking request is not final confirmation"));
  assert.ok(html.includes("fixed_price 只代表路线价格不需要人工确认"));
});

test("/ai-booking contact form appears only after booking intent", () => {
  const html = fs.readFileSync(path.resolve(__dirname, "../frontend/ai-booking.html"), "utf8");
  assert.ok(html.includes('id="customer-contact-form" class="hidden"'));
  const estimateSection = html.slice(html.indexOf("async function estimatePrice()"), html.indexOf("async function submitBookingRequest()"));
  assert.equal(estimateSection.includes('contactForm.classList.remove("hidden")'), false);
  assert.ok(html.includes("If you would like us to continue checking vehicle availability"));
  assert.ok(html.includes("WhatsApp、Email 或 LINE"));
  assert.ok(html.includes('id="customer-country"'));
  assert.ok(html.includes('id="customer-preferred-contact"'));
  assert.ok(html.includes('id="customer-message"'));
});

test("quote-generate reads Tokyo real price table and returns fixed price", () => {
  const quote = generateQuote({
    region: "Tokyo",
    service_type: "airport_pickup",
    pickup_location: "HND",
    dropoff_location: "Tokyo 23 Wards",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "Alphard/Vellfire",
    exchange_rate_usd_jpy: 155,
  });
  assert.equal(quote.price_status, "fixed_price");
  assert.equal(quote.operator_review_required, false);
});

test("quote-generate reads Hokkaido real price table and flags ski review", () => {
  const draft = extractOrder("We are 4 people arriving at New Chitose Airport on January 10 at 13:00, flight NH000, going to Niseko with 4 suitcases and 2 ski bags.");
  const quote = generateQuote(quoteInputFromDraft(draft));
  assert.equal(quote.region, "Hokkaido");
  assert.equal(quote.recommended_vehicle, "HiAce");
  assert.equal(quote.operator_review_required, true);
});

test("quote-generate reads Osaka real price table and returns fixed price", () => {
  const quote = generateQuote({
    region: "Osaka",
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Kyoto City",
    pickup_date: "2026-06-05",
    pickup_time: "15:00",
    vehicle_type: "HiAce",
    exchange_rate_usd_jpy: 155,
  });
  assert.equal(quote.price_status, "fixed_price");
  assert.equal(quote.operator_review_required, false);
});

test("quote-generate unknown route requires operator review", () => {
  const quote = generateQuote({
    region: "Tokyo",
    service_type: "airport_pickup",
    pickup_location: "HND",
    dropoff_location: "Unknown Destination",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(quote.operator_review_required, true);
  assert.equal(quote.quote_confidence, "low");
});

test("booking request includes deposit, PayPal, status, and customer contact", () => {
  const draft = extractOrder("We are 4 people arriving at Haneda Airport on June 1 at 14:30, flight JL000, going to Shinjuku with 4 suitcases. We prefer a Chinese-speaking driver.");
  const quote = generateQuote(quoteInputFromDraft(draft));
  const order = createBookingRequest({
    draftOrder: draft,
    quote,
    customer: { name: "Test Customer", email: "test@example.com", whatsapp: "+000000000", primary_contact_channel: "WhatsApp" },
  });
  assert.ok(order.jtdos_order_id.startsWith("JTDOS-20260601-"));
  assert.equal(order.pricing.deposit_required, true);
  assert.equal(order.pricing.deposit_rate, 0.2);
  assert.equal(order.pricing.deposit_amount_jpy, Math.round(order.pricing.price_jpy * 0.2));
  assert.equal(order.pricing.paypal_payment_required, true);
  assert.equal(order.order_status, "booking_request_created");
  assert.equal(order.pricing.final_confirmation_required_by_operator, false);
  assert.equal(order.vehicle_assignment_required, true);
  assert.ok(order.customer.email || order.customer.whatsapp || order.customer.line_contact);
});

test("JTDSS accepts booking request, prevents duplicates, and returns jtdss_order_id", () => {
  const result = runAiBookingScenario("We are 4 people arriving at Haneda Airport on June 1 at 14:30, flight JL000, going to Shinjuku with 4 suitcases. We prefer a Chinese-speaking driver.");
  assert.equal(result.jtdssResult.success, true);
  assert.ok(result.jtdssResult.jtdss_order_id.startsWith("JTDSS-"));
  assert.equal(result.jtdssResult.status, "booking_request_received");

  const duplicate = sendOrderToJtdss(result.bookingRequest);
  assert.equal(duplicate.success, false);
  assert.equal(duplicate.error_code, "DUPLICATE_ORDER");
});

test("notifications are triggered and skipped warnings do not block JTDSS order creation", () => {
  const result = runAiBookingScenario("We are 4 people arriving at Haneda Airport on June 1 at 14:30, flight JL000, going to Shinjuku with 4 suitcases. We prefer a Chinese-speaking driver.", {
    env: {},
  });
  assert.equal(result.jtdssResult.success, true);
  assert.equal(result.jtdssResult.notifications.email.skipped, true);
  assert.equal(result.jtdssResult.notifications.telegram.skipped, true);
  assert.equal(result.jtdssResult.notifications.whatsapp.success, true);
  assert.ok(result.jtdssResult.notifications.whatsapp.whatsapp_manual_link.startsWith("https://wa.me/"));
});

test("operator review warning appears in notifications for special orders", () => {
  const result = runAiBookingScenario("We are 4 people arriving at New Chitose Airport on January 10 at 13:00, flight NH000, going to Niseko with 4 suitcases and 2 ski bags.", {
    env: { EMAIL_PROVIDER: "test", TELEGRAM_BOT_TOKEN: "test", TELEGRAM_CHAT_ID: "test" },
  });
  assert.equal(result.bookingRequest.order_status, "pending_operator_review");
  assert.equal(result.jtdssResult.status, "pending_operator_review");
  assert.ok(result.jtdssResult.notifications.email.body.includes("Operator review required"));
  assert.ok(result.jtdssResult.notifications.telegram.message.includes("Operator review required"));
});

test("E2E scenario 1 Tokyo normal airport pickup succeeds", () => {
  const result = runAiBookingScenario("We are 4 people arriving at Haneda Airport on June 1 at 14:30, flight JL000, going to Shinjuku with 4 suitcases. We prefer a Chinese-speaking driver.");
  assert.equal(result.draftOrder.region, "Tokyo");
  assert.equal(result.draftOrder.vehicle_type, "Alphard/Vellfire");
  assert.equal(result.quote.price_status, "fixed_price");
  assert.equal(result.quote.operator_review_required, false);
  assertQuoteCard(result.quoteCard);
  assert.equal(result.bookingRequest.pricing.deposit_rate, 0.2);
  assert.equal(result.jtdssResult.success, true);
});

test("E2E scenario 2 Osaka normal airport pickup succeeds", () => {
  const result = runAiBookingScenario("We are 6 people arriving at Kansai Airport on June 5 at 15:00, flight SQ000, going to Kyoto City with 6 suitcases.");
  assert.equal(result.draftOrder.region, "Osaka");
  assert.equal(result.draftOrder.arrival_airport, "KIX");
  assert.equal(result.draftOrder.vehicle_type, "HiAce");
  assert.equal(result.quote.price_status, "fixed_price");
  assert.equal(result.quote.operator_review_required, false);
  assert.equal(result.jtdssResult.success, true);
});

test("E2E scenario 3 Hokkaido ski airport pickup goes to operator review", () => {
  const result = runAiBookingScenario("We are 4 people arriving at New Chitose Airport on January 10 at 13:00, flight NH000, going to Niseko with 4 suitcases and 2 ski bags.");
  assert.equal(result.draftOrder.region, "Hokkaido");
  assert.equal(result.draftOrder.arrival_airport, "CTS");
  assert.equal(result.draftOrder.dropoff_location, "Niseko");
  assert.equal(result.quote.recommended_vehicle, "HiAce");
  assert.equal(result.quote.operator_review_required, true);
  assert.equal(result.bookingRequest.order_status, "pending_operator_review");
  assert.equal(result.jtdssResult.success, true);
  assert.equal(result.jtdssResult.status, "pending_operator_review");
});

finish();
