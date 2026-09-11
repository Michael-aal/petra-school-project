import { Queue } from "bullmq";
import IORedis from "ioredis";

const jobsEnabled = process.env.NODE_ENV !== "test" || process.env.RUN_INTEGRATION_TESTS === "true";
const connection = jobsEnabled
  ? new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", { maxRetriesPerRequest: null, lazyConnect: true })
  : null;

const unavailableQueue = {
  add: async () => {
    throw new Error("Background jobs are disabled in the test runtime.");
  },
  close: async () => undefined,
};

export const reportGenerationQueue = jobsEnabled
  ? new Queue("report-generation", {
      connection,
      defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 2000 }, removeOnComplete: 100, removeOnFail: 100 },
    })
  : unavailableQueue;

export const notificationQueue = jobsEnabled
  ? new Queue("notifications", {
      connection,
      defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: 100, removeOnFail: 100 },
    })
  : unavailableQueue;

export const closeQueues = async () => {
  await Promise.all([
    reportGenerationQueue.close(),
    notificationQueue.close(),
    connection ? connection.quit() : Promise.resolve("disabled"),
  ]);
};

export const checkQueueHealth = async () => {
  if (!connection) return { required: false, connected: true };
  await connection.ping();
  return { required: true, connected: true };
};
