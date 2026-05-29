const fs = require("fs");
const path = require("path");
const { calculateEarlyBookingPeakPrice } = require("./early_booking_peak_protection");
const { isPublicLiteMode } = require("../config/edition");

const PRICE_TABLE_PATH = path.resolve(__dirname, "../../database/jtdos_hokkaido_price_real_v1.json");
const LITE_PRICE_TABLE_PATH = path.resolve(__dirname, "../../database/mock_hokkaido_price_lite.json");

const INCLUDED_STANDARD_TRANSFER = [
  "Driver",
  "Vehicle",
  "Fuel",
  "Highway toll",
  "Parking fee",
];

const EXCLUDED_STANDARD_TRANSFER = [
  "Extra waiting fee",
  "Signage service",
  "Child seat fee",
  "Additional stop",
  "Route change",
  "Extra hour",
  "Guide service",
  "Entrance tickets",
  "Meals",
  "Accommodation",
  "Customer personal expenses",
];

function loadHokkaidoPriceTable() {
  const tablePath = isPublicLiteMode() ? LITE_PRICE_TABLE_PATH : PRICE_TABLE_PATH;
  return JSON.parse(fs.readFileSync(tablePath, "utf8"));
}

function normalizeVehicleCode(vehicleType = "") {
  const value = vehicleType.toLowerCase();
  if (value.includes("hiace") || value.includes("海狮") || value.includes("10")) {
    return "hiace_10";
  }
  return "alphard_vellfire";
}

function normalizeServiceType(serviceType = "") {
  if (serviceType === "charter" || serviceType === "charter_10h") {
    return "charter_10h";
  }
  return "airport_transfer";
}

function normalizePlace(value = "") {
  const text = String(value).toLowerCase();
  if (text.includes("cts") || text.includes("new chitose") || text.includes("新千岁") || text.includes("新千歳")) return "CTS";
  if (text.includes("niseko") || text.includes("二世谷") || text.includes("二世古")) return "Niseko";
  if (text.includes("sapporo") || text.includes("札幌")) return "Sapporo";
  if (text.includes("hoshino") || text.includes("tomamu") || text.includes("星野") || text.includes("トマム")) return "Hoshino Resort Tomamu";
  if (text.includes("otaru") || text.includes("小樽")) return "Otaru";
  if (text.includes("furano") || text.includes("富良野")) return "Furano";
  if (text.includes("biei") || text.includes("美瑛")) return "Biei";
  if (text.includes("asahikawa") || text.includes("旭川")) return "Asahikawa";
  if (text.includes("lake toya") || text.includes("洞爷湖") || text.includes("洞爺湖")) return "Lake Toya";
  if (text.includes("rusutsu") || text.includes("留寿都")) return "Rusutsu";
  if (text.includes("noboribetsu") || text.includes("登别") || text.includes("登別")) return "Noboribetsu";
  if (text.includes("hakodate") || text.includes("函馆") || text.includes("函館")) return "Hakodate";
  if (text.includes("kiroro")) return "Kiroro";
  return value;
}

function routeMatches(recordRoute, pickup, dropoff) {
  const a = normalizePlace(pickup);
  const b = normalizePlace(dropoff);
  const route = recordRoute.toLowerCase();

  if (a === "CTS" || b === "CTS") {
    const other = a === "CTS" ? b : a;
    return route.includes("cts") && route.includes(String(other).toLowerCase());
  }

  return route.includes(String(a).toLowerCase()) && route.includes(String(b).toLowerCase());
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
  return md >= start && md <= end;
}

function selectPeriod(dateText) {
  const date = parseDate(dateText);
  if (!date) return { period: null, confidence: "medium", date_known: false };
  const md = monthDay(date);
  if (isBetweenMonthDay(md, "12-01", "12-20")) return { period: "12.1-12.20", confidence: "high", date_known: true };
  if (isBetweenMonthDay(md, "12-21", "12-31")) return { period: "12.21-12.31", confidence: "high", date_known: true };
  if (isBetweenMonthDay(md, "01-01", "02-10")) return { period: "1.1-2.10", confidence: "high", date_known: true };
  if (isBetweenMonthDay(md, "02-11", "02-21")) return { period: "2.11-2.21", confidence: "high", date_known: true };
  if (md >= "02-22" && md <= "03-31") return { period: "2.22-后", confidence: "high", date_known: true };
  return { period: "Off-season / non-winter", confidence: "high", date_known: true };
}

function isHokkaidoPeakSeason(dateText) {
  const date = parseDate(dateText);
  if (!date) return false;
  const md = monthDay(date);
  return isBetweenMonthDay(md, "12-20", "12-31");
}

function isNightTime(timeText = "") {
  const match = String(timeText).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return false;
  const hour = Number(match[1]);
  return hour >= 21 || hour < 7;
}

function roundToNearest100(value) {
  return Math.round(value / 100) * 100;
}

function lowestRecord(records) {
  return [...records].sort((a, b) => a.price_jpy - b.price_jpy)[0] || null;
}

function peakRecord(records) {
  return records.find((record) => record.period === "12.21-12.31") || lowestRecord(records);
}

function hasSkiEquipment(input) {
  return Number(input.ski_equipment_count || 0) > 0
    || Number(input.snowboard_bag_count || 0) > 0
    || Number(input.ski_bag_count || 0) > 0;
}

function generateHokkaidoQuote(input) {
  const table = loadHokkaidoPriceTable();
  const serviceType = normalizeServiceType(input.service_type);
  let vehicleCode = normalizeVehicleCode(input.vehicle_type);
  const periodInfo = selectPeriod(input.pickup_date);
  const ski = hasSkiEquipment(input);
  const needsHiAceForSki = ski && Number(input.passenger_count || 0) >= 4 && Number(input.luggage_count || 0) >= 4;

  if (needsHiAceForSki) {
    vehicleCode = "hiace_10";
  }

  const routeRecords = table.records.filter((record) =>
    record.service_type === serviceType
    && record.vehicle_code === vehicleCode
    && routeMatches(record.route_en, input.pickup_location, input.dropoff_location)
  );

  if (!routeRecords.length) {
    return {
      success: true,
      region: "Hokkaido",
      price_status: "estimated",
      quote_confidence: "low",
      operator_review_required: true,
      reason: "Route not found in real Hokkaido price table.",
      included: INCLUDED_STANDARD_TRANSFER,
      excluded: EXCLUDED_STANDARD_TRANSFER,
    };
  }

  const datedRecord = periodInfo.period
    ? routeRecords.find((record) => record.period === periodInfo.period) || lowestRecord(routeRecords)
    : lowestRecord(routeRecords);
  const normalRecord = lowestRecord(routeRecords);
  const peakPriceRecord = peakRecord(routeRecords);

  const peakSeason = isHokkaidoPeakSeason(input.pickup_date);
  const protectedPrice = calculateEarlyBookingPeakPrice({
    normalPrice: normalRecord.price_jpy,
    peakPrice: peakPriceRecord.price_jpy,
    isPeakSeason: peakSeason,
    serviceDate: input.pickup_date,
    bookingCreatedAt: input.booking_created_at,
    serviceTime: input.pickup_time,
  });
  const baseRecord = protectedPrice.applied_base_price_type === "peak_price" ? peakPriceRecord : normalRecord;
  const nightSurchargeRate = protectedPrice.night_surcharge_rate;
  const nightSurchargeJpy = roundToNearest100(protectedPrice.night_surcharge_jpy);
  const signageJpy = input.signage_required ? 2000 : 0;
  const childSeatJpy = input.child_seat_required ? Number(input.child_seat_count || 0) * 1000 : 0;
  const priceJpy = baseRecord.price_jpy + nightSurchargeJpy + signageJpy + childSeatJpy;

  const operatorReviewRequired = needsHiAceForSki;
  const quoteConfidence = operatorReviewRequired ? "medium" : periodInfo.confidence;

  return {
    success: true,
    region: "Hokkaido",
    service_type: input.service_type,
    matched_service_type: serviceType,
    route: baseRecord.route_en,
    route_cn: baseRecord.route_cn,
    vehicle_code: needsHiAceForSki ? "hiace_10" : vehicleCode,
    recommended_vehicle: needsHiAceForSki ? "HiAce" : input.vehicle_type,
    period: datedRecord.period,
    date_known: periodInfo.date_known,
    currency: "JPY",
    price_status: "fixed_price",
    quote_confidence: quoteConfidence,
    operator_review_required: operatorReviewRequired,
    driver_assignment_confirmed: false,
    price_jpy: priceJpy,
    price_usd_reference: baseRecord.price_usd_reference,
    customer_visible_price: {
      price_jpy: priceJpy,
      price_usd_reference: baseRecord.price_usd_reference,
    },
    internal_source_price: {
      source_price_cny: baseRecord.source_price_cny,
    },
    night_surcharge_rate: nightSurchargeRate,
    is_peak_season: peakSeason,
    booking_lead_days: protectedPrice.booking_lead_days,
    early_booking_protection_applied: protectedPrice.early_booking_protection_applied,
    applied_base_price_type: protectedPrice.applied_base_price_type,
    free_waiting_minutes: peakSeason ? 60 : 90,
    included: INCLUDED_STANDARD_TRANSFER,
    excluded: EXCLUDED_STANDARD_TRANSFER,
    breakdown: {
      base_price_jpy: baseRecord.price_jpy,
      normal_price_jpy: normalRecord.price_jpy,
      peak_price_jpy: peakPriceRecord.price_jpy,
      night_surcharge_jpy: nightSurchargeJpy,
      signage_jpy: signageJpy,
      child_seat_jpy: childSeatJpy,
      waiting_fee_jpy_per_30_min: 3000,
    },
    notes: [
      table.mock_data ? "Hokkaido Lite quote uses mock demo price data." : "JPY is the main customer-facing price. USD is reference only.",
      "For standard transfers, highway toll and parking fee are included by default.",
    ],
    mock_data: Boolean(table.mock_data),
  };
}

module.exports = {
  generateHokkaidoQuote,
  loadHokkaidoPriceTable,
  selectPeriod,
  isHokkaidoPeakSeason,
  isNightTime,
};
