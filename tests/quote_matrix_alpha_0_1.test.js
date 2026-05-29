const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { generateQuote } = require("../backend/quote/generate_quote");

const ROOT = path.resolve(__dirname, "..");
const PRICE_FILES = [
  "database/jtdos_hokkaido_price_real_v1.json",
  "database/jtdos_tokyo_price_real_v1.json",
  "database/jtdos_osaka_price_real_v1.json",
];

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
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
  console.log(`\nquote_matrix_alpha_0_1 summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

function assertIncludedExcluded(quote) {
  for (const item of ["Driver", "Vehicle", "Fuel", "Highway toll", "Parking fee"]) {
    assert.equal(quote.included.includes(item), true, `${item} should be included`);
  }
  assert.equal(quote.excluded.includes("Highway toll"), false);
  assert.equal(quote.excluded.includes("Parking fee"), false);
}

function assertFixedPriceQuote(quote) {
  assert.equal(quote.price_status, "fixed_price");
  assert.equal(quote.quote_confidence, "high");
  assert.equal(quote.operator_review_required, false);
  assert.equal(quote.currency, "JPY");
  assert.equal(typeof quote.price_jpy, "number");
  assert.equal("estimated_price_range_jpy" in quote, false);
  assert.equal("price_range_jpy" in quote, false);
  assertIncludedExcluded(quote);
}

function assertUnknownRouteQuote(quote) {
  assert.equal(quote.price_status, "estimated");
  assert.equal(quote.quote_confidence, "low");
  assert.equal(quote.operator_review_required, true);
  assertIncludedExcluded(quote);
}

function assertNightTwentyPercent(quote) {
  assert.equal(quote.night_surcharge_rate, 0.2);
  assert.equal(quote.breakdown.night_surcharge_jpy, Math.round(quote.breakdown.base_price_jpy * 0.2 / 100) * 100);
  assert.equal(quote.price_jpy, quote.breakdown.base_price_jpy + quote.breakdown.night_surcharge_jpy);
}

test("real Hokkaido, Tokyo, and Osaka JSON price files are readable", () => {
  for (const file of PRICE_FILES) {
    const fullPath = path.join(ROOT, file);
    assert.equal(fs.existsSync(fullPath), true, `${file} should exist`);
    const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    assert.ok(data.records || data.routes, `${file} should contain records or routes`);
  }
});

test("H-001 CTS to Sapporo Alphard daytime returns fixed price", () => {
  const quote = generateQuote({
    region: "Hokkaido",
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Sapporo",
    pickup_date: "2026-06-01",
    pickup_time: "14:00",
    vehicle_type: "Alphard/Vellfire",
  });
  assertFixedPriceQuote(quote);
});

test("H-002 CTS to Niseko HiAce night non-peak adds 20 percent", () => {
  const quote = generateQuote({
    region: "Hokkaido",
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Niseko",
    pickup_date: "2026-06-01",
    pickup_time: "22:30",
    vehicle_type: "HiAce",
  });
  assertNightTwentyPercent(quote);
});

test("H-003 CTS to Niseko HiAce peak daytime early booking uses normal price", () => {
  const quote = generateQuote({
    region: "Hokkaido",
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Niseko",
    pickup_date: "2026-12-25",
    booking_created_at: "2026-11-30",
    pickup_time: "14:00",
    vehicle_type: "HiAce",
  });
  assert.equal(quote.early_booking_protection_applied, true);
  assert.equal(quote.applied_base_price_type, "normal_price");
  assert.equal(quote.price_jpy, quote.breakdown.normal_price_jpy);
});

test("H-004 CTS to Niseko HiAce peak night late booking uses peak price plus 20 percent", () => {
  const quote = generateQuote({
    region: "Hokkaido",
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Niseko",
    pickup_date: "2026-12-25",
    booking_created_at: "2026-12-10",
    pickup_time: "22:30",
    vehicle_type: "HiAce",
  });
  assert.equal(quote.applied_base_price_type, "peak_price");
  assertNightTwentyPercent(quote);
});

test("H-005 Hokkaido unknown route requires operator review", () => {
  const quote = generateQuote({
    region: "Hokkaido",
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Unknown Destination",
    pickup_date: "2026-06-01",
    pickup_time: "14:00",
    vehicle_type: "Alphard/Vellfire",
  });
  assertUnknownRouteQuote(quote);
});

test("T-001 HND to Tokyo 23 Wards Alphard daytime returns fixed price", () => {
  const quote = generateQuote({
    region: "Tokyo",
    service_type: "airport_pickup",
    pickup_location: "HND",
    dropoff_location: "Tokyo 23 Wards",
    pickup_date: "2026-06-01",
    pickup_time: "14:00",
    vehicle_type: "Alphard/Vellfire",
  });
  assertFixedPriceQuote(quote);
});

test("T-002 HND to Tokyo 23 Wards Alphard night non-peak adds 20 percent", () => {
  const quote = generateQuote({
    region: "Tokyo",
    service_type: "airport_pickup",
    pickup_location: "HND",
    dropoff_location: "Tokyo 23 Wards",
    pickup_date: "2026-06-01",
    pickup_time: "22:00",
    vehicle_type: "Alphard/Vellfire",
  });
  assertNightTwentyPercent(quote);
});

test("T-003 NRT to Tokyo 23 Wards HiAce daytime returns fixed price", () => {
  const quote = generateQuote({
    region: "Tokyo",
    service_type: "airport_pickup",
    pickup_location: "NRT",
    dropoff_location: "Tokyo 23 Wards",
    pickup_date: "2026-06-01",
    pickup_time: "13:00",
    vehicle_type: "HiAce",
  });
  assertFixedPriceQuote(quote);
});

test("T-004 Tokyo unknown route requires operator review", () => {
  const quote = generateQuote({
    region: "Tokyo",
    service_type: "point_to_point",
    pickup_location: "Tokyo 23 Wards",
    dropoff_location: "Unknown Destination",
    pickup_date: "2026-06-01",
    pickup_time: "14:00",
    vehicle_type: "Alphard/Vellfire",
  });
  assertUnknownRouteQuote(quote);
});

test("O-001 KIX to Osaka City Alphard daytime returns fixed price", () => {
  const quote = generateQuote({
    region: "Osaka",
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Osaka City",
    pickup_date: "2026-06-01",
    pickup_time: "14:00",
    vehicle_type: "Alphard/Vellfire",
  });
  assertFixedPriceQuote(quote);
});

test("O-002 KIX to Kyoto City HiAce daytime returns fixed price", () => {
  const quote = generateQuote({
    region: "Osaka",
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Kyoto City",
    pickup_date: "2026-06-01",
    pickup_time: "13:00",
    vehicle_type: "HiAce",
  });
  assertFixedPriceQuote(quote);
});

test("O-003 KIX to Osaka City Alphard night non-peak adds 20 percent", () => {
  const quote = generateQuote({
    region: "Osaka",
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Osaka City",
    pickup_date: "2026-06-01",
    pickup_time: "22:30",
    vehicle_type: "Alphard/Vellfire",
  });
  assertNightTwentyPercent(quote);
});

test("O-004 Osaka unknown route requires operator review", () => {
  const quote = generateQuote({
    region: "Osaka",
    service_type: "point_to_point",
    pickup_location: "Osaka City",
    dropoff_location: "Unknown Destination",
    pickup_date: "2026-06-01",
    pickup_time: "14:00",
    vehicle_type: "Alphard/Vellfire",
  });
  assertUnknownRouteQuote(quote);
});

test("O-005 Osaka 14-Seater request requires operator review", () => {
  const quote = generateQuote({
    region: "Osaka",
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Osaka City",
    pickup_date: "2026-06-01",
    pickup_time: "14:00",
    vehicle_type: "14-Seater",
  });
  assert.equal(quote.operator_review_required, true);
  assert.equal(quote.price_status, "operator_review_required");
});

test("S-001 signage fee is JPY 2,000", () => {
  const quote = generateQuote({
    region: "Osaka",
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Osaka City",
    pickup_date: "2026-06-01",
    pickup_time: "14:00",
    vehicle_type: "Alphard/Vellfire",
    signage_required: true,
  });
  assert.equal(quote.breakdown.signage_jpy, 2000);
});

test("S-002 child seat fee is JPY 1,000 per seat", () => {
  const quote = generateQuote({
    region: "Osaka",
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Osaka City",
    pickup_date: "2026-06-01",
    pickup_time: "14:00",
    vehicle_type: "Alphard/Vellfire",
    child_seat_required: true,
    child_seat_count: 2,
  });
  assert.equal(quote.breakdown.child_seat_jpy, 2000);
});

test("S-004 Hokkaido ski equipment recommends HiAce and requires operator review", () => {
  const quote = generateQuote({
    region: "Hokkaido",
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Niseko",
    pickup_date: "2026-06-01",
    pickup_time: "14:00",
    vehicle_type: "Alphard/Vellfire",
    passenger_count: 4,
    luggage_count: 4,
    ski_equipment_count: 1,
  });
  assert.equal(quote.recommended_vehicle, "HiAce");
  assert.equal(quote.operator_review_required, true);
});

test("early booking peak rule uses normal price 25+ days before and peak price inside 25 days", () => {
  const earlyQuote = generateQuote({
    region: "Tokyo",
    service_type: "airport_pickup",
    pickup_location: "HND",
    dropoff_location: "Tokyo 23 Wards",
    pickup_date: "2026-12-25",
    booking_created_at: "2026-11-30",
    pickup_time: "14:00",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(earlyQuote.early_booking_protection_applied, true);
  assert.equal(earlyQuote.applied_base_price_type, "normal_price");
  assert.equal(earlyQuote.price_jpy, earlyQuote.breakdown.normal_price_jpy);

  const lateQuote = generateQuote({
    region: "Tokyo",
    service_type: "airport_pickup",
    pickup_location: "HND",
    dropoff_location: "Tokyo 23 Wards",
    pickup_date: "2026-12-25",
    booking_created_at: "2026-12-10",
    pickup_time: "14:00",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(lateQuote.early_booking_protection_applied, false);
  assert.equal(lateQuote.applied_base_price_type, "peak_price");
  assert.equal(lateQuote.price_jpy, lateQuote.breakdown.peak_price_jpy);
});

test("JPY is primary, USD is reference only, and CNY is not customer-facing", () => {
  const quote = generateQuote({
    region: "Hokkaido",
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Sapporo",
    pickup_date: "2026-06-01",
    pickup_time: "14:00",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(quote.currency, "JPY");
  assert.equal(typeof quote.price_jpy, "number");
  assert.equal("price_range_jpy" in quote, false);

  const customerFacing = JSON.stringify({
    price_jpy: quote.price_jpy,
    price_usd_reference: quote.price_usd_reference,
    customer_visible_price: quote.customer_visible_price,
  }).toLowerCase();
  assert.equal(customerFacing.includes("cny"), false);
  assert.equal(customerFacing.includes("source_price"), false);
});

test("generate_quote supports Hokkaido, Tokyo, and Osaka region dispatch", () => {
  const regions = [
    { region: "Hokkaido", pickup_location: "CTS", dropoff_location: "Sapporo" },
    { region: "Tokyo", pickup_location: "HND", dropoff_location: "Tokyo 23 Wards" },
    { region: "Osaka", pickup_location: "KIX", dropoff_location: "Osaka City" },
  ];

  for (const item of regions) {
    const quote = generateQuote({
      ...item,
      service_type: "airport_pickup",
      pickup_date: "2026-06-01",
      pickup_time: "14:00",
      vehicle_type: "Alphard/Vellfire",
    });
    assert.equal(quote.success, true);
    assert.equal(quote.price_status, "fixed_price");
  }
});

finish();
