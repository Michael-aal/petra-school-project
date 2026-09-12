import IORedis from "ioredis";

const isProduction = process.env.NODE_ENV === "production";
const redis = isProduction
  ? new IORedis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    })
  : null;

const clientIp = (req) => String(req.ip || req.socket?.remoteAddress || "unknown");

export const distributedApiRateLimiter = ({ windowMs = 60_000, max = 100 } = {}) => async (req, res, next) => {
  if (!redis) return next();

  const window = Math.floor(Date.now() / windowMs);
  const key = `rate-limit:api:${clientIp(req)}:${window}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.pexpire(key, windowMs);

    if (count > max) {
      const ttl = await redis.pttl(key);
      const retryAfterSeconds = Math.max(1, Math.ceil(ttl / 1000));
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({ success: false, message: "Rate limit exceeded. Please slow down your requests.", retryAfterSeconds });
    }
    return next();
  } catch (error) {
    // Never silently disable a production security control when Redis is down.
    return res.status(503).json({ success: false, message: "Rate limiting service is unavailable." });
  }
};

export const closeRateLimiter = async () => {
  if (redis) await redis.quit();
};
