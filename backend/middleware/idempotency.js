import { prisma } from "../config/db.js";
import { logger } from "../utils/logger.js";

const WINDOW_MS = 24 * 60 * 60 * 1000;

export const paymentIdempotency = async (req, res, next) => {
  const key = String(req.get("x-idempotency-key") || "").trim();
  if (!key || key.length > 200) {
    return res.status(400).json({ success: false, message: "X-Idempotency-Key is required and must be at most 200 characters." });
  }

  const schoolId = Number(req.schoolId ?? req.user?.schoolId);
  if (!Number.isInteger(schoolId) || schoolId <= 0) {
    return res.status(403).json({ success: false, message: "School context missing." });
  }

  const cutoff = new Date(Date.now() - WINDOW_MS);
  const existing = await prisma.paymentIdempotency.findUnique({ where: { key } });
  if (existing && existing.schoolId !== schoolId) {
    return res.status(409).json({ success: false, message: "The idempotency key is already in use." });
  }
  if (existing && existing.createdAt >= cutoff) {
    if (existing.statusCode && existing.response) {
      return res.status(existing.statusCode).json(existing.response);
    }
    return res.status(409).json({ success: false, message: "A request with this idempotency key is still in progress." });
  }
  if (existing) {
    await prisma.paymentIdempotency.delete({ where: { key } });
  }

  try {
    await prisma.paymentIdempotency.create({ data: { key, schoolId } });
  } catch (error) {
    if (error?.code !== "P2002") throw error;
    const inFlight = await prisma.paymentIdempotency.findUnique({ where: { key } });
    if (inFlight?.statusCode && inFlight.response) return res.status(inFlight.statusCode).json(inFlight.response);
    return res.status(409).json({ success: false, message: "A request with this idempotency key is still in progress." });
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const response = JSON.parse(JSON.stringify(body, (_key, value) => {
      if (value && typeof value === "object" && typeof value.toJSON === "function") return value.toJSON();
      return value;
    }));
    void prisma.paymentIdempotency.update({
      where: { key },
      data: { statusCode: res.statusCode, response },
    }).catch((error) => {
      logger.error("failed to persist payment idempotency response", { error, key });
    });
    return originalJson(body);
  };

  return next();
};
