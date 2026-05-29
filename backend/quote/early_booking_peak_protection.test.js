const assert = require("assert");
const { calculateEarlyBookingPeakPrice } = require("./early_booking_peak_protection");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

const normalPrice = 10000;
const peakPrice = 15000;

test("non-peak daytime uses normal price", () => {
  const result = calculateEarlyBookingPeakPrice({
    normalPrice,
    peakPrice,
    isPeakSeason: false,
    serviceDate: "2026-06-01",
    bookingCreatedAt: "2026-05-01",
    serviceTime: "14:00",
  });
  assert.equal(result.final_price_jpy, 10000);
  assert.equal(result.applied_base_price_type, "normal_price");
  assert.equal(result.night_surcharge_rate, 0);
});

test("non-peak nighttime uses normal price plus 20 percent", () => {
  const result = calculateEarlyBookingPeakPrice({
    normalPrice,
    peakPrice,
    isPeakSeason: false,
    serviceDate: "2026-06-01",
    bookingCreatedAt: "2026-05-01",
    serviceTime: "21:30",
  });
  assert.equal(result.final_price_jpy, 12000);
  assert.equal(result.applied_base_price_type, "normal_price");
  assert.equal(result.night_surcharge_rate, 0.2);
});

test("peak daytime booked 25 or more days early uses protected normal price", () => {
  const result = calculateEarlyBookingPeakPrice({
    normalPrice,
    peakPrice,
    isPeakSeason: true,
    serviceDate: "2026-12-25",
    bookingCreatedAt: "2026-11-30",
    serviceTime: "14:00",
  });
  assert.equal(result.final_price_jpy, 10000);
  assert.equal(result.early_booking_protection_applied, true);
  assert.equal(result.applied_base_price_type, "normal_price");
  assert.equal(result.night_surcharge_rate, 0);
});

test("peak nighttime booked 25 or more days early uses protected normal price plus 20 percent", () => {
  const result = calculateEarlyBookingPeakPrice({
    normalPrice,
    peakPrice,
    isPeakSeason: true,
    serviceDate: "2026-12-25",
    bookingCreatedAt: "2026-11-30",
    serviceTime: "21:30",
  });
  assert.equal(result.final_price_jpy, 12000);
  assert.equal(result.early_booking_protection_applied, true);
  assert.equal(result.applied_base_price_type, "normal_price");
  assert.equal(result.night_surcharge_rate, 0.2);
});

test("peak daytime booked less than 25 days early uses peak price", () => {
  const result = calculateEarlyBookingPeakPrice({
    normalPrice,
    peakPrice,
    isPeakSeason: true,
    serviceDate: "2026-12-25",
    bookingCreatedAt: "2026-12-10",
    serviceTime: "14:00",
  });
  assert.equal(result.final_price_jpy, 15000);
  assert.equal(result.early_booking_protection_applied, false);
  assert.equal(result.applied_base_price_type, "peak_price");
  assert.equal(result.night_surcharge_rate, 0);
});

test("peak nighttime booked less than 25 days early uses peak price plus 20 percent", () => {
  const result = calculateEarlyBookingPeakPrice({
    normalPrice,
    peakPrice,
    isPeakSeason: true,
    serviceDate: "2026-12-25",
    bookingCreatedAt: "2026-12-10",
    serviceTime: "21:30",
  });
  assert.equal(result.final_price_jpy, 18000);
  assert.equal(result.early_booking_protection_applied, false);
  assert.equal(result.applied_base_price_type, "peak_price");
  assert.equal(result.night_surcharge_rate, 0.2);
});
