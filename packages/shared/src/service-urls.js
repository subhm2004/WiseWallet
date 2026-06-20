import { SERVICE_PORTS } from "./ports.js";

/** Trim trailing slash so proxy targets stay consistent. */
function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

/**
 * Resolve a microservice base URL from env, falling back to localhost for local dev.
 * @param {string} envKey - e.g. AUTH_SERVICE_URL
 * @param {number} port - local fallback port
 */
export function resolveServiceUrl(envKey, port) {
  const fromEnv = process.env[envKey];
  if (fromEnv?.trim()) {
    return normalizeBaseUrl(fromEnv.trim());
  }
  return `http://localhost:${port}`;
}

/** All backend service URLs — localhost by default, override per env at deploy time. */
export function getServiceUrls() {
  return {
    auth: resolveServiceUrl("AUTH_SERVICE_URL", SERVICE_PORTS.AUTH),
    account: resolveServiceUrl("ACCOUNT_SERVICE_URL", SERVICE_PORTS.ACCOUNT),
    transaction: resolveServiceUrl(
      "TRANSACTION_SERVICE_URL",
      SERVICE_PORTS.TRANSACTION
    ),
    budget: resolveServiceUrl("BUDGET_SERVICE_URL", SERVICE_PORTS.BUDGET),
    notification: resolveServiceUrl(
      "NOTIFICATION_SERVICE_URL",
      SERVICE_PORTS.NOTIFICATION
    ),
    worker: resolveServiceUrl("WORKER_SERVICE_URL", SERVICE_PORTS.WORKER),
  };
}
