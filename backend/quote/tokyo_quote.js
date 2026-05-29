const fs = require("fs");
const path = require("path");
const { calculateEarlyBookingPeakPrice } = require("./early_booking_peak_protection");
const { isPublicLiteMode } = require("../config/edition");

const PRICE_TABLE_PATH = path.resolve(__dirname, "../../database/jtdos_tokyo_price_real_v1.json");
const LITE_PRICE_TABLE_PATH = path.resolve(__dirname, "../../database/mock_tokyo_price_lite.json");

function loadTokyoPriceTable() {
  const tablePath = isPublicLiteMode() ? LITE_PRICE_TABLE_PATH : PRICE_TABLE_PATH;
  return JSON.parse(fs.readFileSync(tablePath, "utf8"));
}

function normalizeVehicleKey(vehicleType = "") {
  const value = String(vehicleType).toLowerCase();
  if (value.includes("hiace") || value.includes("海狮") || value.includes("hi ace")) {
    return "HiAce";
  }
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
    return "Luxury";
  }
  return "Alphard/Vellfire";
}

function normalizeServiceType(serviceType = "") {
  const value = String(serviceType).toLowerCase();
  if (value.includes("charter") || value.includes("包车") || value.includes("貸切")) return "charter_10h";
  if (value.includes("point") || value.includes("transfer")) return "point_to_point";
  return "airport_transfer";
}

function normalizePlace(value = "") {
  const text = String(value).toLowerCase();
  if (text.includes("hnd") || text.includes("haneda") || text.includes("羽田")) return "HND";
  if (text.includes("nrt") || text.includes("narita") || text.includes("成田")) return "NRT";
  if (
    text.includes("tokyo station")
    || text.includes("shinkansen")
    || text.includes("东京站")
    || text.includes("東京駅")
    || text.includes("新干线")
    || text.includes("新幹線")
    || text.includes("shinjuku")
    || text.includes("shibuya")
    || text.includes("ginza")
    || text.includes("roppongi")
    || text.includes("ueno")
    || text.includes("ikebukuro")
    || text.includes("akasaka")
    || text.includes("东京23")
    || text.includes("東京23")
    || text.includes("tokyo 23")
  ) {
    return "东京23区";
  }
  if (text.includes("yokohama") || text.includes("横滨") || text.includes("横浜")) return "横滨";
  if (
    text.includes("maihama")
    || text.includes("disney")
    || text.includes("迪士尼")
    || text.includes("ディズニー")
  ) {
    return "舞滨 / 迪士尼";
  }
  if (
    text.includes("kawaguchiko")
    || text.includes("fuji")
    || text.includes("富士")
    || text.includes("河口湖")
  ) {
    return "河口湖 / 富士山";
  }
  if (text.includes("hakone") || text.includes("箱根")) return "箱根";
  if (text.includes("kamakura") || text.includes("镰仓") || text.includes("鎌倉")) return "镰仓";
  if (text.includes("nikko") || text.includes("日光")) return "日光";
  if (text.includes("karuizawa") || text.includes("轻井泽") || text.includes("軽井沢")) return "轻井泽";
  return String(value);
}

function routeContainsPlace(route, place) {
  if (!place) return false;
  if (place === "东京23区") {
    return route.includes("东京23区") || route.includes("东京市内");
  }
  return route.includes(place);
}

function routeMatches(recordRoute, pickup, dropoff, serviceType) {
  const route = String(recordRoute);
  const pickupPlace = normalizePlace(pickup);
  const dropoffPlace = normalizePlace(dropoff);

  if (serviceType === "charter_10h") {
    return routeContainsPlace(route, pickupPlace) || routeContainsPlace(route, dropoffPlace);
  }

  return routeContainsPlace(route, pickupPlace) && routeContainsPlace(route, dropoffPlace);
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

function isTokyoPeakSeason(dateText) {
  const date = parseDate(dateText);
  if (!date) return false;
  const month = date.getMonth() + 1;
  const md = monthDay(date);
  return month === 7 || month === 8 || isBetweenMonthDay(md, "12-20", "01-05");
}

function peakPriceFromNormal(normalPrice, table) {
  const multiplier = Number(table.surcharges?.peak_price_multiplier || 1.5);
  return Math.round(normalPrice * multiplier);
}

function roundYen(value) {
  return Math.round(value);
}

function generateTokyoQuote(input) {
  const table = loadTokyoPriceTable();
  const serviceType = normalizeServiceType(input.service_type);
  const vehicleKey = normalizeVehicleKey(input.vehicle_type);

  if (vehicleKey === "Luxury") {
    return {
      success: true,
      region: "Tokyo",
      price_status: "operator_review_required",
      quote_confidence: "low",
      operator_review_required: true,
      reason: "Luxury vehicle availability and final price require operator confirmation.",
      included: table.included_default,
      excluded: table.excluded_default,
    };
  }

  const record = table.routes.find((route) =>
    route.service_type === serviceType
    && route.prices_jpy?.[vehicleKey] != null
    && routeMatches(route.route, input.pickup_location, input.dropoff_location, serviceType)
  );

  if (!record) {
    return {
      success: true,
      region: "Tokyo",
      price_status: "estimated",
      quote_confidence: "low",
      operator_review_required: true,
      reason: "Route not found in real Tokyo price table.",
      included: table.included_default,
      excluded: table.excluded_default,
    };
  }

  const normalPrice = Number(record.prices_jpy[vehicleKey]);
  const peakPrice = Number(record.peak_prices_jpy?.[vehicleKey] || peakPriceFromNormal(normalPrice, table));
  const serviceDateKnown = Boolean(parseDate(input.pickup_date));
  const peakSeason = isTokyoPeakSeason(input.pickup_date);
  const protectedPrice = calculateEarlyBookingPeakPrice({
    normalPrice,
    peakPrice,
    isPeakSeason: peakSeason,
    serviceDate: input.pickup_date,
    bookingCreatedAt: input.booking_created_at,
    serviceTime: input.pickup_time,
  });

  const basePrice = protectedPrice.base_price_jpy;
  const nightSurchargeJpy = roundYen(protectedPrice.night_surcharge_jpy);
  const signageJpy = input.signage_required ? Number(table.surcharges?.signage_jpy || 2000) : 0;
  const childSeatUnit = Number(table.surcharges?.child_seat_jpy_per_seat || 1000);
  const childSeatJpy = input.child_seat_required ? Number(input.child_seat_count || 0) * childSeatUnit : 0;
  const priceJpy = basePrice + nightSurchargeJpy + signageJpy + childSeatJpy;

  const passengerCount = Number(input.passenger_count || 0);
  const multipleVehicles = Boolean(input.multiple_vehicles_required) || passengerCount > 9;
  const operatorReviewRequired = multipleVehicles
    || Boolean(input.female_driver_required)
    || Boolean(input.vip_airport_service_required)
    || Boolean(input.private_jet_service_required);

  return {
    success: true,
    region: "Tokyo",
    service_type: input.service_type,
    matched_service_type: serviceType,
    route: record.route,
    vehicle_type: vehicleKey,
    currency: table.currency || "JPY",
    price_status: operatorReviewRequired ? "estimated" : record.price_status || "fixed_price",
    quote_confidence: operatorReviewRequired ? "medium" : (serviceDateKnown ? "high" : "medium"),
    operator_review_required: operatorReviewRequired,
    driver_assignment_confirmed: false,
    price_jpy: priceJpy,
    night_surcharge_rate: protectedPrice.night_surcharge_rate,
    is_peak_season: peakSeason,
    booking_lead_days: protectedPrice.booking_lead_days,
    early_booking_protection_applied: protectedPrice.early_booking_protection_applied,
    applied_base_price_type: protectedPrice.applied_base_price_type,
    included: table.included_default,
    excluded: table.excluded_default,
    breakdown: {
      base_price_jpy: basePrice,
      normal_price_jpy: normalPrice,
      peak_price_jpy: peakPrice,
      night_surcharge_jpy: nightSurchargeJpy,
      signage_jpy: signageJpy,
      child_seat_jpy: childSeatJpy,
      waiting_fee_jpy_per_30_min: Number(table.surcharges?.waiting_fee_jpy_per_30_min || 3000),
    },
    notes: [
      table.mock_data ? "Tokyo Lite quote uses mock demo price data." : "Tokyo quote code reads database/jtdos_tokyo_price_real_v1.json.",
      "For standard transfers, highway toll and parking fee are included by default.",
      "Fixed price does not mean driver assignment is confirmed.",
    ],
    mock_data: Boolean(table.mock_data),
  };
}

module.exports = {
  generateTokyoQuote,
  loadTokyoPriceTable,
  isTokyoPeakSeason,
  normalizePlace,
};
