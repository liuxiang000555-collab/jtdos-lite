const assert = require("assert");
const { generateTokyoQuote, loadTokyoPriceTable } = require("./tokyo_quote");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("loads the Tokyo real JSON price table", () => {
  const table = loadTokyoPriceTable();
  assert.equal(table.version, "tokyo_real_v1");
  assert.ok(Array.isArray(table.routes));
  assert.ok(table.routes.length > 0);
});

test("HND to Shinjuku Alphard reads fixed price from Tokyo JSON", () => {
  const quote = generateTokyoQuote({
    service_type: "airport_pickup",
    pickup_location: "Haneda Airport",
    dropoff_location: "Shinjuku",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "Alphard/Vellfire",
    passenger_count: 4,
    luggage_count: 4,
  });
  assert.equal(quote.price_status, "fixed_price");
  assert.equal(quote.operator_review_required, false);
  assert.equal(quote.price_jpy, 8000);
  assert.equal(quote.included.includes("Highway toll"), true);
  assert.equal(quote.included.includes("Parking fee"), true);
  assert.equal(quote.excluded.includes("Highway toll"), false);
  assert.equal(quote.excluded.includes("Parking fee"), false);
});

test("HND to Tokyo Station maps Shinkansen transfer to Tokyo 23 wards", () => {
  const quote = generateTokyoQuote({
    service_type: "airport_dropoff",
    pickup_location: "Tokyo Station Shinkansen",
    dropoff_location: "HND",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "HiAce",
  });
  assert.equal(quote.route, "HND ↔ 东京23区");
  assert.equal(quote.price_jpy, 10000);
});

test("HND to Disney reads Disney route from Tokyo JSON", () => {
  const quote = generateTokyoQuote({
    service_type: "airport_pickup",
    pickup_location: "HND",
    dropoff_location: "Tokyo Disneyland",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(quote.route, "HND ↔ 舞滨 / 迪士尼");
  assert.equal(quote.price_jpy, 8000);
});

test("non-peak night Tokyo transfer adds 20 percent", () => {
  const quote = generateTokyoQuote({
    service_type: "airport_pickup",
    pickup_location: "HND",
    dropoff_location: "Shinjuku",
    pickup_date: "2026-06-01",
    pickup_time: "21:30",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(quote.night_surcharge_rate, 0.2);
  assert.equal(quote.price_jpy, 9600);
  assert.equal(quote.applied_base_price_type, "normal_price");
});

test("peak Tokyo order booked less than 25 days uses peak price plus 20 percent at night", () => {
  const quote = generateTokyoQuote({
    service_type: "airport_pickup",
    pickup_location: "HND",
    dropoff_location: "Shinjuku",
    pickup_date: "2026-12-25",
    booking_created_at: "2026-12-10",
    pickup_time: "21:30",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(quote.applied_base_price_type, "peak_price");
  assert.equal(quote.early_booking_protection_applied, false);
  assert.equal(quote.night_surcharge_rate, 0.2);
  assert.equal(quote.price_jpy, 14400);
});

test("peak Tokyo order booked 25 days early uses normal price plus 20 percent at night", () => {
  const quote = generateTokyoQuote({
    service_type: "airport_pickup",
    pickup_location: "HND",
    dropoff_location: "Shinjuku",
    pickup_date: "2026-12-25",
    booking_created_at: "2026-11-30",
    pickup_time: "21:30",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(quote.applied_base_price_type, "normal_price");
  assert.equal(quote.early_booking_protection_applied, true);
  assert.equal(quote.night_surcharge_rate, 0.2);
  assert.equal(quote.price_jpy, 9600);
});

test("unknown Tokyo route requires operator review", () => {
  const quote = generateTokyoQuote({
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
