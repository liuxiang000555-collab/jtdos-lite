const fs = require("fs");
const path = require("path");
const { calculateEarlyBookingPeakPrice } = require("./early_booking_peak_protection");
const { isPublicLiteMode } = require("../config/edition");

const PRICE_TABLE_PATH = path.resolve(__dirname, "../../database/jtdos_osaka_price_real_v1.json");
const LITE_PRICE_TABLE_PATH = path.resolve(__dirname, "../../database/mock_osaka_price_lite.json");

const INCLUDED_STANDARD_TRANSFER = [
  "Driver",
  "Vehicle",
  "Fuel",
  "Highway toll",
  "Parking fee",
];

const EXCLUDED_STANDARD_TRANSFER = [
  "Extra waiting time",
  "Signage / placard service",
  "Child seat fee",
  "Additional stop",
  "Route change",
  "Guide service",
];

function loadOsakaPriceTable() {
  const tablePath = isPublicLiteMode() ? LITE_PRICE_TABLE_PATH : PRICE_TABLE_PATH;
  return JSON.parse(fs.readFileSync(tablePath, "utf8"));
}

function normalizeVehicleCode(vehicleType = "") {
  const value = String(vehicleType).toLowerCase();
  if (value.includes("14") || value.includes("fourteen")) return "fourteen_seater";
  if (value.includes("hiace") || value.includes("海狮") || value.includes("10")) return "hiace";
  if (
    value.includes("lexus")
    || value.includes("mercedes")
    || value.includes("rolls")
    || value.includes("lm550")
    || value.includes("s400")
    || value.includes("s500")
    || value.includes("ghost")
    || value.includes("豪华")
    || value.includes("高級")
  ) {
    return "luxury";
  }
  return "alphard_vellfire";
}

function normalizeServiceType(serviceType = "") {
  const value = String(serviceType).toLowerCase();
  if (value.includes("charter") || value.includes("service_area") || value.includes("包车") || value.includes("貸切")) {
    return "charter_10h_or_service_area";
  }
  if (value.includes("point") || value.includes("transfer")) return "point_to_point";
  return "airport_transfer";
}

function normalizePlace(value = "") {
  const text = String(value).toLowerCase();
  if (
    text.includes("kix")
    || text.includes("kansai airport")
    || text.includes("kansai international")
    || text.includes("関西空港")
    || text.includes("関西国際空港")
    || text.includes("关西机场")
    || text.includes("关西国际机场")
  ) {
    return "KIX";
  }
  if (
    text.includes("osaka")
    || text.includes("umeda")
    || text.includes("namba")
    || text.includes("shinsaibashi")
    || text.includes("dotonbori")
    || text.includes("大阪")
    || text.includes("梅田")
    || text.includes("难波")
    || text.includes("難波")
    || text.includes("心斋桥")
    || text.includes("心斎橋")
    || text.includes("道顿堀")
    || text.includes("道頓堀")
  ) {
    return "Osaka City";
  }
  if (text.includes("kyoto") || text.includes("京都")) return "Kyoto City";
  if (text.includes("nara") || text.includes("奈良")) return "Nara City";
  if (text.includes("kobe") || text.includes("神户") || text.includes("神戸")) return "Kobe City";
  if (text.includes("wakayama") || text.includes("和歌山")) return "Wakayama City";
  if (text.includes("shirahama") || text.includes("白浜") || text.includes("白滨")) return "Shirahama";
  if (
    text.includes("universal studios")
    || text.includes("usj")
    || text.includes("环球影城")
    || text.includes("環球影城")
    || text.includes("ユニバーサル")
  ) {
    return "USJ";
  }
  if (text.includes("service area")) return "Service Area";
  return String(value);
}

function routeMatches(record, pickup, dropoff) {
  const pickupPlace = normalizePlace(pickup);
  const dropoffPlace = normalizePlace(dropoff);
  const recordPickup = normalizePlace(record.pickup_location);
  const recordDropoff = normalizePlace(record.dropoff_location);

  if (record.bidirectional) {
    return (pickupPlace === recordPickup && dropoffPlace === recordDropoff)
      || (pickupPlace === recordDropoff && dropoffPlace === recordPickup);
  }

  return pickupPlace === recordPickup && dropoffPlace === recordDropoff;
}

function parseDate(dateText) {
  if (!dateText) return null;
  const date = new Date(`${dateText}T00:00:00+09:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthDay(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isBetweenMonthDay(md, start, end) {
  if (start <= end) return md >= start && md <= end;
  return md >= start || md <= end;
}

function isOsakaPeakSeason(dateText) {
  const date = parseDate(dateText);
  if (!date) return false;
  const month = date.getMonth() + 1;
  const md = monthDay(date);
  return month === 7 || month === 8 || isBetweenMonthDay(md, "12-20", "01-05");
}

function generateOsakaQuote(input) {
  const table = loadOsakaPriceTable();
  const serviceType = normalizeServiceType(input.service_type);
  const vehicleCode = normalizeVehicleCode(input.vehicle_type);

  if (vehicleCode === "luxury") {
    return {
      success: true,
      region: "Osaka",
      price_status: "operator_review_required",
      quote_confidence: "low",
      operator_review_required: true,
      reason: "Luxury vehicle availability and final price require operator confirmation.",
      included: INCLUDED_STANDARD_TRANSFER,
      excluded: EXCLUDED_STANDARD_TRANSFER,
    };
  }

  const record = table.routes.find((route) =>
    route.service_type === serviceType
    && route.prices?.[vehicleCode]
    && routeMatches(route, input.pickup_location, input.dropoff_location)
  );

  if (!record) {
    return {
      success: true,
      region: "Osaka",
      price_status: "estimated",
      quote_confidence: "low",
      operator_review_required: true,
      reason: "Route not found in real Osaka price table.",
      included: INCLUDED_STANDARD_TRANSFER,
      excluded: EXCLUDED_STANDARD_TRANSFER,
    };
  }

  const vehiclePrice = record.prices[vehicleCode];
  const normalPrice = Number(vehiclePrice.normal_price_jpy);
  const peakPrice = Number(vehiclePrice.peak_price_jpy);
  const peakSeason = isOsakaPeakSeason(input.pickup_date);
  const serviceDateKnown = Boolean(parseDate(input.pickup_date));
  const protectedPrice = calculateEarlyBookingPeakPrice({
    normalPrice,
    peakPrice,
    isPeakSeason: peakSeason,
    serviceDate: input.pickup_date,
    bookingCreatedAt: input.booking_created_at,
    serviceTime: input.pickup_time,
  });

  const signageJpy = input.signage_required ? Number(table.price_rules.fees.signage_jpy || 2000) : 0;
  const childSeatJpy = input.child_seat_required
    ? Number(input.child_seat_count || 0) * Number(table.price_rules.fees.child_seat_jpy_per_seat || 1000)
    : 0;
  const priceJpy = protectedPrice.final_price_jpy + signageJpy + childSeatJpy;

  const peakPriceMissing = peakSeason && !vehiclePrice.peak_price_jpy;
  const shortCharter = serviceType === "charter_10h_or_service_area"
    && Number(input.charter_hours_per_day || 10) < 10;
  const largeLuggage = Number(input.luggage_count || 0) > 8 || Boolean(input.large_luggage_required);
  const englishDriverRequired = String(input.preferred_language || "").toLowerCase().includes("english")
    || Boolean(input.english_driver_required);
  const operatorReviewRequired = Boolean(record.operator_review_required)
    || Boolean(vehiclePrice.operator_review_required)
    || vehicleCode === "fourteen_seater"
    || Number(input.passenger_count || 0) > 9
    || Boolean(input.multiple_vehicles_required)
    || largeLuggage
    || peakPriceMissing
    || shortCharter
    || englishDriverRequired
    || Boolean(input.female_driver_required)
    || Boolean(input.vip_airport_service_required)
    || Boolean(input.private_jet_service_required);
  const priceUsdReference = input.exchange_rate_usd_jpy
    ? Math.round((priceJpy / Number(input.exchange_rate_usd_jpy)) * 100) / 100
    : undefined;

  return {
    success: true,
    region: "Osaka",
    service_type: input.service_type,
    matched_service_type: serviceType,
    route_key: record.route_key,
    route: `${record.pickup_location} ↔ ${record.dropoff_location}`,
    vehicle_code: vehicleCode,
    currency: table.price_rules.currency || "JPY",
    price_status: operatorReviewRequired ? "operator_review_required" : "fixed_price",
    quote_confidence: operatorReviewRequired ? "medium" : (serviceDateKnown ? "high" : "medium"),
    operator_review_required: operatorReviewRequired,
    driver_assignment_confirmed: false,
    price_jpy: priceJpy,
    price_usd_reference: priceUsdReference,
    night_surcharge_rate: protectedPrice.night_surcharge_rate,
    is_peak_season: peakSeason,
    booking_lead_days: protectedPrice.booking_lead_days,
    early_booking_protection_applied: protectedPrice.early_booking_protection_applied,
    applied_base_price_type: protectedPrice.applied_base_price_type,
    included: record.included,
    excluded: record.excluded,
    breakdown: {
      base_price_jpy: protectedPrice.base_price_jpy,
      normal_price_jpy: normalPrice,
      peak_price_jpy: peakPrice,
      night_surcharge_jpy: protectedPrice.night_surcharge_jpy,
      signage_jpy: signageJpy,
      child_seat_jpy: childSeatJpy,
      waiting_fee_jpy_per_30_min: Number(table.price_rules.fees.waiting_fee_jpy_per_30_min || 3000),
    },
    notes: [
      table.mock_data ? "Osaka Lite quote uses mock demo price data." : "Osaka quote code reads database/jtdos_osaka_price_real_v1.json.",
      "For standard transfers, highway toll and parking fee are included by default.",
      "Fixed price does not mean driver assignment is confirmed.",
    ],
    mock_data: Boolean(table.mock_data),
  };
}

module.exports = {
  generateOsakaQuote,
  loadOsakaPriceTable,
  isOsakaPeakSeason,
  normalizePlace,
};
