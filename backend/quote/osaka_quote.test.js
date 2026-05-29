const assert = require("assert");
const { generateOsakaQuote, loadOsakaPriceTable } = require("./osaka_quote");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("loads the Osaka real JSON price table", () => {
  const table = loadOsakaPriceTable();
  assert.equal(table.version, "osaka_real_v1");
  assert.ok(Array.isArray(table.routes));
  assert.ok(table.routes.length > 0);
});

test("KIX to Osaka City Alphard reads fixed price from Osaka JSON", () => {
  const quote = generateOsakaQuote({
    service_type: "airport_pickup",
    pickup_location: "Kansai Airport",
    dropoff_location: "Osaka City",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "Alphard/Vellfire",
    passenger_count: 4,
    luggage_count: 4,
  });
  assert.equal(quote.price_status, "fixed_price");
  assert.equal(quote.operator_review_required, false);
  assert.equal(quote.price_jpy, 12000);
  assert.equal(quote.included.includes("Highway toll"), true);
  assert.equal(quote.included.includes("Parking fee"), true);
  assert.equal(quote.excluded.includes("Highway toll"), false);
  assert.equal(quote.excluded.includes("Parking fee"), false);
});

test("KIX to Kyoto HiAce at non-peak night adds 20 percent", () => {
  const quote = generateOsakaQuote({
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Kyoto",
    pickup_date: "2026-06-01",
    pickup_time: "21:30",
    vehicle_type: "HiAce",
  });
  assert.equal(quote.route_key, "KIX_KYOTO_CITY");
  assert.equal(quote.night_surcharge_rate, 0.2);
  assert.equal(quote.price_jpy, 26400);
  assert.equal(quote.applied_base_price_type, "normal_price");
});

test("KIX to Kyoto City HiAce daytime returns fixed price", () => {
  const quote = generateOsakaQuote({
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Kyoto City",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "HiAce",
  });
  assert.equal(quote.price_status, "fixed_price");
  assert.equal(quote.operator_review_required, false);
  assert.equal(quote.price_jpy, 22000);
});


test("peak Osaka order booked less than 25 days uses peak price plus 20 percent at night", () => {
  const quote = generateOsakaQuote({
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Osaka",
    pickup_date: "2026-12-25",
    booking_created_at: "2026-12-10",
    pickup_time: "21:30",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(quote.applied_base_price_type, "peak_price");
  assert.equal(quote.early_booking_protection_applied, false);
  assert.equal(quote.night_surcharge_rate, 0.2);
  assert.equal(quote.price_jpy, 21600);
});

test("peak Osaka order booked 25 days early uses normal price plus 20 percent at night", () => {
  const quote = generateOsakaQuote({
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Osaka",
    pickup_date: "2026-12-25",
    booking_created_at: "2026-11-30",
    pickup_time: "21:30",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(quote.applied_base_price_type, "normal_price");
  assert.equal(quote.early_booking_protection_applied, true);
  assert.equal(quote.night_surcharge_rate, 0.2);
  assert.equal(quote.price_jpy, 14400);
});

test("USJ point-to-point route is read from Osaka JSON", () => {
  const quote = generateOsakaQuote({
    service_type: "point_to_point",
    pickup_location: "Osaka City",
    dropoff_location: "USJ",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(quote.route_key, "OSAKA_USJ");
  assert.equal(quote.price_jpy, 8000);
});

test("14-seater returns price but requires operator review", () => {
  const quote = generateOsakaQuote({
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Osaka City",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "14-seater",
  });
  assert.equal(quote.price_jpy, 18000);
  assert.equal(quote.operator_review_required, true);
  assert.equal(quote.price_status, "operator_review_required");
});

test("unknown Osaka route requires operator review", () => {
  const quote = generateOsakaQuote({
    service_type: "airport_pickup",
    pickup_location: "KIX",
    dropoff_location: "Unknown Destination",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(quote.operator_review_required, true);
  assert.equal(quote.quote_confidence, "low");
});
