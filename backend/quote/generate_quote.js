const { generateHokkaidoQuote } = require("./hokkaido_quote");
const { generateTokyoQuote } = require("./tokyo_quote");
const { generateOsakaQuote } = require("./osaka_quote");

function normalizeRegion(region = "") {
  const value = String(region).toLowerCase();
  if (value.includes("hokkaido") || value.includes("北海道")) return "Hokkaido";
  if (value.includes("tokyo") || value.includes("東京") || value.includes("东京")) return "Tokyo";
  if (value.includes("osaka") || value.includes("kansai") || value.includes("大阪") || value.includes("関西") || value.includes("关西")) return "Osaka";
  return "";
}

function generateQuote(input) {
  const region = normalizeRegion(input.region);

  if (region === "Hokkaido") return generateHokkaidoQuote(input);
  if (region === "Tokyo") return generateTokyoQuote(input);
  if (region === "Osaka") return generateOsakaQuote(input);

  return {
    success: false,
    price_status: "estimated",
    quote_confidence: "low",
    operator_review_required: true,
    reason: "Unsupported or missing region.",
  };
}

module.exports = {
  generateQuote,
  normalizeRegion,
};
