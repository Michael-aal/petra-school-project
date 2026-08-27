/**
 * In-memory sliding window rate limiter middleware for Express
 * Prevents brute force and credential stuffing attacks on sensitive endpoints.
 */

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
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

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
  max: 10,
  message: "Too many authentication attempts. Please try again after 15 minutes.",
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: "Rate limit exceeded. Please slow down your requests.",
});
