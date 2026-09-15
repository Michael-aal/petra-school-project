/**
 * In-memory sliding window rate limiter middleware for Express
 * Prevents brute force and credential stuffing attacks on sensitive endpoints.
 */
import crypto from "node:crypto";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { measureRedis, rateLimitHits, redisClient, redlock } from "../config/redis.js";

const localLimiters = new Map();
const testHits = new Map();

const createLimiter = ({ keyPrefix, windowMs, max }) => {
  if (process.env.NODE_ENV === "test") {
    return new RateLimiterMemory({ keyPrefix, points: max, duration: Math.ceil(windowMs / 1000) });
  }
  if (!redisClient) return null;
  return new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix,
    points: max,
    duration: Math.ceil(windowMs / 1000),
    blockDuration: Math.ceil(windowMs / 1000),
    inmemoryBlockOnConsumed: max + 1,
    inmemoryBlockDuration: Math.ceil(windowMs / 1000),
  });
};

const lockAndConsume = async (limiter, key, scope) => {
  if (!limiter) throw new Error("Redis rate limiter is unavailable");
  const consume = () => redisClient
    ? measureRedis("rate_limit_consume", () => limiter.consume(key))
    : limiter.consume(key);

  if (!redlock || !redisClient) return consume();
  const resource = `petra:rate-limit-lock:${scope}:${key}`;
  const lock = await measureRedis("rate_limit_lock", () => redlock.acquire([resource], 1000));
  try {
    return await consume();
  } finally {
    await lock.release().catch(() => undefined);
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

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = "Too many requests, please try again later.",
  keyGenerator = (req) => `${req.ip || "unknown"}_${req.originalUrl}`,
  scope = "api",
} = {}) => {
  const limiter = createLimiter({ keyPrefix: `petra:rate-limit:${scope}`, windowMs, max });
  if (limiter) localLimiters.set(scope, limiter);

  return async (req, res, next) => {
    const key = String(keyGenerator(req));
    if (process.env.NODE_ENV === "test") {
      const now = Date.now();
      const timestamps = (testHits.get(`${scope}:${key}`) || []).filter((time) => now - time < windowMs);
      if (timestamps.length >= max) {
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
      const result = await lockAndConsume(limiter, key, scope);
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

      // Security controls fail closed when Redis is unavailable.
      rateLimitHits.inc({ scope });
      return res.status(429).json({ success: false, message: "Rate limiting service is unavailable." });
    }
  };
};

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  scope: "auth",
  keyGenerator: (req) => {
    const body = req.body || {};
    const credential = String(body.email || body.username || "anonymous").trim().toLowerCase();
    return `${req.ip || "unknown"}:${credential}`;
  },
  message: "Too many authentication attempts. Please try again after 15 minutes.",
});

// Refresh is a normal part of an active session, not a password attempt.
// It must be isolated per tab refresh token; otherwise two accounts in the
// same browser/IP consume the same anonymous bucket and one tab can receive
// 429s, lose its access token, and then cascade into "token missing" errors.
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
