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

export const logAudit = async ({ userId = null, schoolId = null, action, entity = null, resourceId = null, details = null, severity = "INFO" }) => {
  const safeDetails = cleanDetails(details);
  logger.info("audit event", { userId, schoolId, action, entity, resourceId, severity });

  // Audit logging must never prevent authentication or another successful
  // business operation from completing. It is observability, not a gate.
  try {
    const auditData = {
      actionType: String(action || "unknown").slice(0, 120),
      oldData: {
        userId: userId ? String(userId) : null,
        performedBy: userId ? String(userId) : "system",
        schoolId: schoolId ? Number(schoolId) : null,
        entity: entity ? String(entity).slice(0, 120) : "System",
        entityId: resourceId ? String(resourceId) : "unknown",
        severity: String(severity || "INFO").slice(0, 32),
      },
      newData: safeDetails ? {
        details: safeDetails,
      } : null,
    };

    if (schoolId) {
      const resolvedSchoolId = Number(schoolId);
      if (Number.isInteger(resolvedSchoolId) && resolvedSchoolId > 0) {
        auditData.school = { connect: { id: resolvedSchoolId } };
      }
    }

    return await prisma.auditLog.create({ data: auditData });
  } catch (error) {
    logger.warn("audit log persistence failed", {
      action,
      userId,
      schoolId,
      error: error?.message || String(error),
    });
    return null;
  }
};
