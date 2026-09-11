import { Router } from "express";
import { prisma } from "../config/db.js";
import { checkQueueHealth } from "../jobs/queue.js";

const router = Router();

router.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/readyz", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Readiness probe database check failed:", error);
    return res.status(503).json({ status: "unready", database: "disconnected" });
  }

  try {
    const redis = await checkQueueHealth();
    return res.status(200).json({ status: "ready", database: "connected", redis: redis.connected ? "connected" : "disconnected" });
  } catch (error) {
    console.error("Readiness probe Redis check failed:", error);
    return res.status(503).json({ status: "unready", database: "connected", redis: "disconnected" });
  }
});

export default router;
