const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const REQUIRED_REAL_PRICE_FILES = [
  "database/jtdos_hokkaido_price_real_v1.json",
  "database/jtdos_tokyo_price_real_v1.json",
  "database/jtdos_osaka_price_real_v1.json",
];

function realPriceFilesAreMissing() {
  return REQUIRED_REAL_PRICE_FILES.some((file) => !fs.existsSync(path.join(ROOT, file)));
}

function isPublicLiteMode(env = process.env) {
  if (env.PUBLIC_LITE_MODE === "false" || String(env.JTDOS_EDITION || "").toLowerCase() === "private") {
    return false;
  }
  return env.PUBLIC_LITE_MODE === "true"
    || String(env.JTDOS_EDITION || "").toLowerCase() === "lite"
    || realPriceFilesAreMissing();
}

module.exports = {
  isPublicLiteMode,
};
