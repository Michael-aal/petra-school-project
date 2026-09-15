import IORedis from "ioredis";
import Redlock from "redlock";
import { Counter, Histogram, Registry } from "prom-client";

const isProduction = process.env.NODE_ENV === "production";
const redisUrl = process.env.REDIS_URL;
if (isProduction && !redisUrl) {
  throw new Error("REDIS_URL is required in production.");
}

const parseNodes = (value) => String(value || "")
  .split(",")
  .map((node) => node.trim())
  .filter(Boolean)
  .map((node) => node.startsWith("redis://") || node.startsWith("rediss://") ? node : `redis://${node}`);

const mode = String(process.env.REDIS_MODE || "single").toLowerCase();
const nodes = parseNodes(process.env.REDIS_NODES || redisUrl);
const redisOptions = {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy: () => null,
};

export const redisClient = !redisUrl && !isProduction
  ? null
  : mode === "cluster"
    ? new IORedis.Cluster(nodes.map((url) => ({ url })), { redisOptions })
    : mode === "sentinel"
      ? new IORedis(redisUrl, { ...redisOptions, sentinels: nodes.map((url) => new URL(url)), name: process.env.REDIS_SENTINEL_NAME || "mymaster" })
      : new IORedis(redisUrl, redisOptions);

export const redlock = redisClient
  ? new Redlock([redisClient], { driftFactor: 0.01, retryCount: 10, retryDelay: 200, retryJitter: 200 })
  : null;

export const metricsRegistry = new Registry();
export const rateLimitHits = new Counter({ name: "petra_rate_limit_hits", help: "Number of requests rejected by rate limiting", labelNames: ["scope"], registers: [metricsRegistry] });
export const redisErrors = new Counter({ name: "petra_redis_errors", help: "Number of Redis errors", labelNames: ["operation"], registers: [metricsRegistry] });
export const redisLatency = new Histogram({ name: "petra_redis_latency_ms", help: "Redis operation latency in milliseconds", labelNames: ["operation"], buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000], registers: [metricsRegistry] });

if (redisClient) {
  redisClient.on("error", () => redisErrors.inc({ operation: "connection" }));
}

export const measureRedis = async (operation, callback) => {
  const end = redisLatency.startTimer({ operation });
  try {
    return await callback();
  } catch (error) {
    redisErrors.inc({ operation });
    throw error;
  } finally {
    end();
  }
};

export const closeRedis = async () => {
  if (redlock) await redlock.quit();
  if (redisClient) await redisClient.quit();
};
