function parseDateOnly(dateText) {
  if (!dateText) return null;
  const date = new Date(`${dateText}T00:00:00+09:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(startDateText, endDateText) {
  const start = parseDateOnly(startDateText);
  const end = parseDateOnly(endDateText);
  if (!start || !end) return null;
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

function isNightTime(serviceTime = "") {
  const match = String(serviceTime).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return false;
  const hour = Number(match[1]);
  return hour >= 21 || hour < 7;
}

function calculateEarlyBookingPeakPrice({
  normalPrice,
  peakPrice,
  isPeakSeason,
  serviceDate,
  bookingCreatedAt,
  serviceTime,
}) {
  const leadDays = daysBetween(bookingCreatedAt, serviceDate);
  const earlyBookingProtectionApplied = Boolean(isPeakSeason && leadDays !== null && leadDays >= 25);
  const usePeakPrice = Boolean(isPeakSeason && !earlyBookingProtectionApplied);
  const appliedBasePriceType = usePeakPrice ? "peak_price" : "normal_price";
  const basePrice = usePeakPrice ? peakPrice : normalPrice;
  const nightSurchargeRate = isNightTime(serviceTime) ? 0.2 : 0;
  const nightSurcharge = Math.round(basePrice * nightSurchargeRate);
  const finalPrice = basePrice + nightSurcharge;

  return {
    normal_price: normalPrice,
    peak_price: peakPrice,
    is_peak_season: Boolean(isPeakSeason),
    booking_lead_days: leadDays,
    early_booking_protection_applied: earlyBookingProtectionApplied,
    applied_base_price_type: appliedBasePriceType,
    night_surcharge_rate: nightSurchargeRate,
    base_price_jpy: basePrice,
    night_surcharge_jpy: nightSurcharge,
    final_price_jpy: finalPrice,
  };
}

module.exports = {
  calculateEarlyBookingPeakPrice,
  daysBetween,
  isNightTime,
};
