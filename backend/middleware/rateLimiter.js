import IORedis from "ioredis";

const isProduction = process.env.NODE_ENV === "production";
const distributedRedis = isProduction
  ? new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    })
  : null;

distributedRedis?.on("error", () => undefined);

const hitStore = new Map();

// Periodic cleanup every 5 minutes to prevent memory accumulation
setInterval(() => {
  const now = Date.now();
  for (const [key, records] of hitStore.entries()) {
    const valid = records.filter((timestamp) => now - timestamp < 15 * 60 * 1000);
    if (valid.length === 0) {
      hitStore.delete(key);
    } else {
      hitStore.set(key, valid);
    }
  }
}, 5 * 60 * 1000).unref();

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 10, // Limit each key to 10 requests per windowMs
  message = "Too many requests, please try again later.",
  keyGenerator = (req) => `${req.ip || "unknown"}_${req.originalUrl}`,
} = {}) => {
  return async (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    if (distributedRedis) {
      try {
        const redisKey = `petra:rate-limit:${key}`;
        const count = await distributedRedis.incr(redisKey);
        if (count === 1) await distributedRedis.pExpire(redisKey, windowMs);

        if (count > max) {
          const remainingMs = Math.max(0, await distributedRedis.pTtl(redisKey));
          const retryAfterSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
          res.setHeader("Retry-After", retryAfterSeconds);
          return res.status(429).json({ success: false, message, retryAfterSeconds });
        }
        return next();
      } catch (error) {
        return res.status(503).json({ success: false, message: "Request protection is temporarily unavailable." });
      }
    }

    const timestamps = hitStore.get(key) || [];
    const recentHits = timestamps.filter((time) => time > windowStart);

    if (recentHits.length >= max) {
      const retryAfterSeconds = Math.ceil((recentHits[0] + windowMs - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds,
      });
    }

    recentHits.push(now);
    hitStore.set(key, recentHits);
    return next();
  };
};

// Specialized limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const body = req.body || {};
    const credential = String(body.email || body.username || "anonymous").trim().toLowerCase();
    return `${req.ip || "unknown"}:${credential}`;
  },
  message: "Too many authentication attempts. Please try again after 15 minutes.",
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: "Rate limit exceeded. Please slow down your requests.",
});
