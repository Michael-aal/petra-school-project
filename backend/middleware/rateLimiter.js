/**
 * Redis-backed sliding-window rate limiters for Express.
 * Authentication limits are deliberately separated from normal API traffic.
 * If Redis is temporarily unavailable, the limiter falls back to an in-process
 * memory limiter instead of blocking legitimate requests with a 503.
 */
import crypto from "node:crypto";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { measureRedis, rateLimitHits, redisClient } from "../config/redis.js";

const RATE_LIMIT_VERSION = "v6";
const LOAD_TEST_MODE = process.env.LOAD_TEST_MODE === "true" && process.env.NODE_ENV !== "production";
const LOAD_TEST_MAX = 100000;
const localLimiters = new Map();
const memoryFallbacks = new Map();
const testHits = new Map();

const seconds = (windowMs) => Math.max(1, Math.ceil(windowMs / 1000));

const createLimiter = ({ keyPrefix, windowMs, max, scope }) => {
  const effectiveMax = LOAD_TEST_MODE ? Math.max(max, LOAD_TEST_MAX) : max;
  const duration = seconds(windowMs);

  if (process.env.NODE_ENV === "test") {
    return new RateLimiterMemory({ keyPrefix, points: effectiveMax, duration });
  }

  // Always keep a local limiter available. Redis is preferred, but a temporary
  // Redis outage must not turn every login/API request into a 503.
  const memoryLimiter = new RateLimiterMemory({
    keyPrefix: `${keyPrefix}:memory-fallback`,
    points: effectiveMax,
    duration,
    blockDuration: duration,
  });
  memoryFallbacks.set(scope, memoryLimiter);

  if (!redisClient) return memoryLimiter;

  return new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix,
    points: effectiveMax,
    duration,
    blockDuration: duration,
    inmemoryBlockOnConsumed: effectiveMax + 1,
    inmemoryBlockDuration: duration,
  });
};

const consumeMemoryFallback = async (scope, key) => {
  const limiter = memoryFallbacks.get(scope);
  if (!limiter) throw new Error(`Memory fallback limiter is unavailable for ${scope}`);
  return limiter.consume(key);
};

const consume = async (limiter, key, scope) => {
  if (!limiter) return consumeMemoryFallback(scope, key);

  try {
    return redisClient
      ? await measureRedis("rate_limit_consume", () => limiter.consume(key))
      : await limiter.consume(key);
  } catch (error) {
    // A Redis/connection/transport failure is infrastructure, not a user's
    // rate-limit violation. Fall back locally and keep the security boundary.
    const blocked = error?.remainingPoints === 0 || error?.msBeforeNext !== undefined;
    if (blocked) throw error;

    console.error(`[rate-limit:${scope}] Redis unavailable; using memory fallback`, {
      name: error?.name,
      code: error?.code,
      message: error?.message,
    });
    return consumeMemoryFallback(scope, key);
  }
};

const fingerprint = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 32);
};

const tabCredentialKey = (req) => {
  const bearer = String(req.get("authorization") || "");
  const refresh = String(req.get("x-petra-tab-refresh") || "");
  const credential = bearer || refresh;
  return fingerprint(credential);
};

const tabIdKey = (req) => fingerprint(req.get("x-petra-tab-id") || "");

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = "Too many requests, please try again later.",
  keyGenerator = (req) => `${req.ip || "unknown"}_${req.originalUrl}`,
  scope = "api",
} = {}) => {
  const effectiveMax = LOAD_TEST_MODE ? Math.max(max, LOAD_TEST_MAX) : max;
  const mode = LOAD_TEST_MODE ? "load" : "normal";
  const limiter = createLimiter({ keyPrefix: `petra:rate-limit:${RATE_LIMIT_VERSION}:${mode}:${scope}`, windowMs, max: effectiveMax, scope });
  if (limiter) localLimiters.set(scope, limiter);

  return async (req, res, next) => {
    const key = String(keyGenerator(req));
    if (process.env.NODE_ENV === "test") {
      const now = Date.now();
      const timestamps = (testHits.get(`${scope}:${key}`) || []).filter((time) => now - time < windowMs);
      if (timestamps.length >= effectiveMax) {
        rateLimitHits.inc({ scope });
        const retryAfterSeconds = Math.max(1, Math.ceil((timestamps[0] + windowMs - now) / 1000));
        res.setHeader("Retry-After", retryAfterSeconds);
        return res.status(429).json({ success: false, message, retryAfterSeconds });
      }
      timestamps.push(now);
      testHits.set(`${scope}:${key}`, timestamps);
      return next();
    }

    try {
      const result = await consume(limiter, key, scope);
      if (result?.msBeforeNext !== undefined) res.setHeader("X-RateLimit-Remaining", result.remainingPoints);
      return next();
    } catch (error) {
      const blocked = error?.remainingPoints === 0 || error?.msBeforeNext !== undefined;
      if (blocked) {
        rateLimitHits.inc({ scope });
        const retryAfterSeconds = Math.max(1, Math.ceil(Number(error.msBeforeNext || windowMs) / 1000));
        res.setHeader("Retry-After", retryAfterSeconds);
        return res.status(429).json({ success: false, message, retryAfterSeconds });
      }

      // Last-resort local limiter. This path should only be reached if both
      // Redis and the normal memory fallback unexpectedly fail.
      try {
        const result = await consumeMemoryFallback(scope, key);
        if (result?.msBeforeNext !== undefined) res.setHeader("X-RateLimit-Remaining", result.remainingPoints);
        return next();
      } catch (fallbackError) {
        console.error(`[rate-limit:${scope}] all rate-limit backends unavailable`, {
          name: fallbackError?.name,
          code: fallbackError?.code,
          message: fallbackError?.message,
        });
        return res.status(503).json({ success: false, message: "Rate limiting service is unavailable." });
      }
    }
  };
};

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  scope: "auth",
  keyGenerator: (req) => {
    const body = req.body || {};
    const credential = String(body.email || body.username || "anonymous").trim().toLowerCase();
    const tabId = tabIdKey(req);
    return `${req.ip || "unknown"}:${credential}:tab:${tabId || "unidentified"}`;
  },
  message: "Too many authentication attempts. Please try again later.",
});

export const authIpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  scope: "auth-ip",
  keyGenerator: (req) => String(req.ip || "unknown"),
  message: "Too many authentication requests from this network. Please try again later.",
});

export const refreshRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  scope: "auth-refresh",
  keyGenerator: (req) => {
    const tabCredential = tabCredentialKey(req);
    if (tabCredential) return `tab:${tabCredential}`;

    const cookie = String(req.get("cookie") || "");
    const refreshCookie = cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("petra_refresh="));
    const cookieCredential = refreshCookie ? decodeURIComponent(refreshCookie.slice("petra_refresh=".length)) : "";
    return cookieCredential
      ? `refresh:${fingerprint(cookieCredential)}`
      : `ip:${req.ip || "unknown"}`;
  },
  message: "Too many session refresh requests. Please slow down briefly.",
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  scope: "api",
  keyGenerator: (req) => {
    const tabCredential = tabCredentialKey(req);
    if (tabCredential) return `tab:${tabCredential}:${req.originalUrl}`;
    return `ip:${req.ip || "unknown"}:${req.originalUrl}`;
  },
  message: "Rate limit exceeded. Please slow down your requests.",
});

export const publicWorkflowRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  scope: "public-workflow",
  keyGenerator: (req) => `${req.ip || "unknown"}:${req.baseUrl}${req.path}`,
  message: "Too many public workflow requests. Please try again later.",
});

export const closeRateLimiter = async () => {
  localLimiters.clear();
  memoryFallbacks.clear();
  testHits.clear();
};
