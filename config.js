// Centralized configuration loader for Novel Drip backend
// Usage: const { config } = require('../config');  then use config.paypal.clientId, etc.

const required = (key, def = undefined) => {
  const v = process.env[key] ?? def;
  if (v === undefined || v === "") {
    throw new Error(`Missing required env: ${key}`);
  }
  return v;
};

const optional = (key, def = undefined) => process.env[key] ?? def;

const config = {
  app: {
    baseUrl: required("APP_BASE_URL"),
    successUrl: optional("APP_SUCCESS_URL", ""),
    dashboardUrl: optional("APP_DASHBOARD_URL", ""),
    debug: optional("DEBUG_MODE", "false") === "true",
  },
  paypal: {
    clientId: required("PAYPAL_CLIENT_ID"),
    clientSecret: required("PAYPAL_CLIENT_SECRET"),
    apiBase: optional("PAYPAL_API_BASE", "https://api-m.paypal.com"),
    webhookId: required("PAYPAL_WEBHOOK_ID"),
  },
  gemini: {
    apiKey: required("GEMINI_API_KEY"),
    model: optional("GEMINI_MODEL", "gemini-2.5-flash-lite"),
  },
};

module.exports = { config };
