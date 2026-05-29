const assert = require("assert");
const { generateHokkaidoQuote } = require("./hokkaido_quote");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("CTS to Niseko Alphard ordinary time returns fixed price and includes toll parking", () => {
  const quote = generateHokkaidoQuote({
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Niseko",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "Alphard/Vellfire",
    passenger_count: 4,
    luggage_count: 4,
  });
  assert.equal(quote.price_status, "fixed_price");
  assert.equal(quote.operator_review_required, false);
  assert.equal(quote.included.includes("Highway toll"), true);
  assert.equal(quote.included.includes("Parking fee"), true);
  assert.equal(quote.excluded.includes("Highway toll"), false);
  assert.equal(quote.excluded.includes("Parking fee"), false);
});

test("CTS to Niseko HiAce at 21:30 non-peak adds 20 percent night surcharge", () => {
  const quote = generateHokkaidoQuote({
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Niseko",
    pickup_date: "2026-06-01",
    pickup_time: "21:30",
    vehicle_type: "HiAce",
    passenger_count: 6,
    luggage_count: 6,
  });
  assert.equal(quote.night_surcharge_rate, 0.2);
  assert.equal(quote.breakdown.night_surcharge_jpy, Math.round(quote.breakdown.base_price_jpy * 0.2 / 100) * 100);
  assert.equal(quote.price_jpy, quote.breakdown.base_price_jpy + quote.breakdown.night_surcharge_jpy);
});

test("CTS to Niseko HiAce at 21:30 on Dec 25 uses peak base price plus 20 percent and 60 min waiting", () => {
  const quote = generateHokkaidoQuote({
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Niseko",
    pickup_date: "2026-12-25",
    booking_created_at: "2026-12-10",
    pickup_time: "21:30",
    vehicle_type: "HiAce",
    passenger_count: 6,
    luggage_count: 6,
  });
  assert.equal(quote.night_surcharge_rate, 0.2);
  assert.equal(quote.free_waiting_minutes, 60);
  assert.equal(quote.applied_base_price_type, "peak_price");
  assert.equal(quote.early_booking_protection_applied, false);
  assert.equal(quote.breakdown.night_surcharge_jpy, Math.round(quote.breakdown.base_price_jpy * 0.2 / 100) * 100);
});

test("CTS to Niseko HiAce at peak night booked 25 days early uses normal price plus 20 percent", () => {
  const quote = generateHokkaidoQuote({
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Niseko",
    pickup_date: "2026-12-25",
    booking_created_at: "2026-11-30",
    pickup_time: "21:30",
    vehicle_type: "HiAce",
    passenger_count: 6,
    luggage_count: 6,
  });
  assert.equal(quote.night_surcharge_rate, 0.2);
  assert.equal(quote.free_waiting_minutes, 60);
  assert.equal(quote.applied_base_price_type, "normal_price");
  assert.equal(quote.early_booking_protection_applied, true);
  assert.equal(quote.breakdown.night_surcharge_jpy, Math.round(quote.breakdown.base_price_jpy * 0.2 / 100) * 100);
});

test("CTS to unknown destination requires operator review with low confidence", () => {
  const quote = generateHokkaidoQuote({
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Unknown Destination",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "Alphard/Vellfire",
  });
  assert.equal(quote.operator_review_required, true);
  assert.equal(quote.quote_confidence, "low");
});

test("4 passengers plus 4 luggage plus ski bags recommends HiAce and requires operator review", () => {
  const quote = generateHokkaidoQuote({
    service_type: "airport_pickup",
    pickup_location: "CTS",
    dropoff_location: "Niseko",
    pickup_date: "2026-06-01",
    pickup_time: "14:30",
    vehicle_type: "Alphard/Vellfire",
    passenger_count: 4,
    luggage_count: 4,
    ski_equipment_count: 1,
  });
  assert.equal(quote.recommended_vehicle, "HiAce");
  assert.equal(quote.operator_review_required, true);
  assert.equal(quote.quote_confidence, "medium");
});
