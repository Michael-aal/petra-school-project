import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";

export interface ApplicationJob {
  readonly type: string;
  readonly payload: Record<string, unknown>;
}

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL is required before background jobs can start.");
}

const parsedRedisUrl = new URL(redisUrl);
const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  ...(parsedRedisUrl.protocol === "rediss:" ? { tls: {} } : {}),
});

export const applicationQueue = new Queue<ApplicationJob>("application-jobs", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

export const applicationWorker = new Worker<ApplicationJob>(
  "application-jobs",
  async (job: Job<ApplicationJob>): Promise<{ jobId: string; type: string }> => ({
    jobId: job.id ?? "unknown",
    type: job.data.type,
  }),
  { connection, concurrency: 5 },
);

let shuttingDown = false;

export const shutdownQueues = async (): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;
  await Promise.all([applicationWorker.close(), applicationQueue.close()]);
  await connection.quit();
};

const handleShutdown = (): void => {
  void shutdownQueues().catch((error: unknown) => {
    console.error("Failed to shut down background queues.", error);
    process.exitCode = 1;
  });
};

process.once("SIGTERM", handleShutdown);
process.once("SIGINT", handleShutdown);
