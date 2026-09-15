import axios from "axios";
import CircuitBreaker from "opossum";
import { logAudit } from "./auditLog.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

const isRetryableMethod = (method = "GET") => ["get", "head", "options"].includes(String(method).toLowerCase());
const isRetryableError = (error) => {
  const status = error?.response?.status;
  return !status || status === 408 || status === 429 || status >= 500;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const createResilientProviderClient = ({
  provider,
  baseURL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  timeoutEnv,
  maxRetries = MAX_RETRIES,
  resetTimeout = 300_000,
}) => {
  const configuredTimeout = Number(timeoutEnv || timeoutMs || DEFAULT_TIMEOUT_MS);
  const client = axios.create({ baseURL, timeout: configuredTimeout });

  client.interceptors.request.use((config) => {
    config.metadata = { ...(config.metadata || {}), retryCount: Number(config.metadata?.retryCount || 0), provider };
    return config;
  });

  client.interceptors.response.use(undefined, async (error) => {
    const config = error.config || {};
    const retryCount = Number(config.metadata?.retryCount || 0);
    const canRetry = isRetryableMethod(config.method) || config.retryable === true;

    if (canRetry && isRetryableError(error) && retryCount < maxRetries) {
      config.metadata = { ...(config.metadata || {}), retryCount: retryCount + 1 };
      await sleep(2 ** (retryCount + 1) * 1000);
      return client.request(config);
    }

    error.retryCount = retryCount;
    throw error;
  });

  const request = async (config) => {
    const endpoint = `${config.baseURL || baseURL || ""}${config.url || ""}`;
    try {
      return await client.request({ ...config, timeout: configuredTimeout });
    } catch (error) {
      await logAudit({
        action: "external_api.failure",
        actionType: "EXTERNAL_API_ERROR",
        entity: "ExternalProvider",
        details: {
          metadata: {
            provider,
            endpoint,
            error: error?.message || "External provider request failed",
            retryCount: Number(error?.retryCount || error?.config?.metadata?.retryCount || 0),
          },
        },
      }).catch(() => null);
      throw error;
    }
  };

  const breaker = new CircuitBreaker(request, {
    timeout: configuredTimeout,
    errorThresholdPercentage: 100,
    volumeThreshold: 5,
    rollingCountTimeout: 60_000,
    resetTimeout,
  });

  breaker.on("open", () => {
    void logAudit({
      action: "external_api.circuit_open",
      actionType: "EXTERNAL_API_ERROR",
      entity: "ExternalProvider",
      details: { metadata: { provider, endpoint: baseURL, error: "Circuit breaker opened", retryCount: 0 } },
    }).catch(() => null);
  });

  return {
    request: (config) => breaker.fire(config),
    get: (url, config = {}) => breaker.fire({ ...config, method: "GET", url }),
    post: (url, data, config = {}) => breaker.fire({ ...config, method: "POST", url, data }),
    breaker,
    client,
    timeoutMs: configuredTimeout,
  };
};
