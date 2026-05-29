const mockJtdss = require("./mock_jtdss");
const { getRuntimeMode } = require("../config/env");

function getJtdssClient(env = process.env) {
  if (getRuntimeMode(env) !== "production") return mockJtdss;
  return require("./jtdss_client");
}

async function sendOrderToJtdss(order, options = {}) {
  const env = options.env || process.env;
  const client = getJtdssClient(env);
  return client.sendOrderToJtdss(order, options);
}

module.exports = {
  getJtdssClient,
  sendOrderToJtdss,
};
