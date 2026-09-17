/**
 * Redis-backed sliding-window rate limiters for Express.
 * Authentication limits are deliberately separated from normal API traffic.
 */
import crypto from "node:crypto";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { measureRedis, rateLimitHits, redisClient } from "../config/redis.js";

const RATE_LIMIT_VERSION = "v5";
const LOAD_TEST_MODE = process.env.LOAD_TEST_MODE === "true" && process.env.NODE_ENV !== "production";
const LOAD_TEST_MAX = 100000;
const localLimiters = new Map();
const testHits = new Map();

const createLimiter = ({ keyPrefix, windowMs, max }) => {
  const effectiveMax = LOAD_TEST_MODE ? Math.max(max, LOAD_TEST_MAX) : max;
  if (process.env.NODE_ENV === "test") {
    return new RateLimiterMemory({ keyPrefix, points: effectiveMax, duration: Math.ceil(windowMs / 1000) });
  }
  if (!redisClient) return null;
  return new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix,
    points: effectiveMax,
    duration: Math.ceil(windowMs / 1000),
    blockDuration: Math.ceil(windowMs / 1000),
    inmemoryBlockOnConsumed: effectiveMax + 1,
    inmemoryBlockDuration: Math.ceil(windowMs / 1000),
  });
};

const consume = async (limiter, key) => {
  if (!limiter) throw new Error("Redis rate limiter is unavailable");
  return redisClient
    ? measureRedis("rate_limit_consume", () => limiter.consume(key))
    : limiter.consume(key);
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
  const limiter = createLimiter({ keyPrefix: `petra:rate-limit:${RATE_LIMIT_VERSION}:${mode}:${scope}`, windowMs, max: effectiveMax });
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
      const result = await consume(limiter, key);
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

      rateLimitHits.inc({ scope });
      // Keep production fail-closed for security, but distinguish infrastructure
      // failure from an actual rate-limit hit in logs/monitoring.
      console.error(`[rate-limit:${scope}] backing service unavailable`, {
        name: error?.name,
        code: error?.code,
        message: error?.message,
      });
      return res.status(503).json({ success: false, message: "Rate limiting service is unavailable." });
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
  testHits.clear();
};
