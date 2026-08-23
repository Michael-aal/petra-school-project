import { prisma } from "../config/db.js";
import { logger } from "./logger.js";

const cleanDetails = (details) => {
  if (details === undefined || details === null) return null;
  if (typeof details === "string") return details.slice(0, 1000);
  try {
    return JSON.stringify(details, (_key, value) => {
      if (["password", "token", "accessToken", "refreshToken", "secret", "apiKey"].includes(_key)) return "[REDACTED]";
      return value;
    }).slice(0, 1000);
  } catch {
    return null;
  }
};

export const logAudit = async ({ userId = null, schoolId = null, action, entity = null, resourceId = null, details = null }) => {
  const safeDetails = cleanDetails({ ...(typeof details === "object" && details ? details : {}), ...(resourceId ? { resourceId } : {}) });
  logger.info("audit event", { userId, schoolId, action, entity, resourceId });
  return prisma.auditLog.create({
    data: {
      userId,
      schoolId: schoolId ? Number(schoolId) : null,
      action: String(action || "unknown").slice(0, 120),
      entity: entity ? String(entity).slice(0, 120) : null,
      details: safeDetails,
    },
  });
};
