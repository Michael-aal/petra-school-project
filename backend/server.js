import "./config/loadEnv.js";
import { env } from "./utils/env.js";
import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { closeQueues } from "./jobs/queue.js";
import { closeRateLimiter } from "./middleware/rateLimiter.js";
import { closeRedis, connectRedis } from "./config/redis.js";
import { sessionService } from "./services/sessionService.js";
import { startNotificationPushWatcher, stopNotificationPushWatcher } from "./services/notificationPushWatcher.js";

let server;
let isShuttingDown = false;

const start = async () => {
  await connectDB();
  await connectRedis();
  startNotificationPushWatcher();
  server = app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} received, shutting down gracefully`);
  const forceExit = setTimeout(() => {
    console.error("Graceful shutdown timed out after 10 seconds");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    stopNotificationPushWatcher();
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await closeQueues();
    await closeRateLimiter();
    await closeRedis();
    await sessionService.close();
    await disconnectDB();
    clearTimeout(forceExit);
    process.exit(0);
  } catch (error) {
    console.error("Graceful shutdown failed:", error);
    clearTimeout(forceExit);
    process.exit(1);
  }
};

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  void shutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  void shutdown("uncaughtException");
});

process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
process.on("SIGINT", () => { void shutdown("SIGINT"); });

void start().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
