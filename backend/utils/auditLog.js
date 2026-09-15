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

export const logAudit = async ({ userId = null, schoolId = null, action, actionType = null, entity = null, resourceId = null, details = null, severity = "INFO" }) => {
  const safeDetails = cleanDetails({ ...(typeof details === "object" && details ? details : {}), ...(resourceId ? { resourceId } : {}), ...(severity ? { severity } : {}) });
  logger.info("audit event", { userId, schoolId, action, entity, resourceId, severity });

  if (userId) {
    try {
      const userExists = await prisma.user.findUnique({
        where: { id: String(userId) },
        select: { id: true },
      });
      if (!userExists) return null;
    } catch {
      return null;
    }
  }

  const data = {
    action: String(action || "unknown").slice(0, 120),
    actionType: actionType ? String(actionType).slice(0, 64) : null,
    entity: entity ? String(entity).slice(0, 120) : "System",
    entityId: resourceId ? String(resourceId) : "unknown",
    performedBy: userId ? String(userId) : "system",
    details: safeDetails,
    severity: String(severity || "INFO").slice(0, 32),
  };

  // AuditLog exposes User and School as Prisma relations, not scalar create fields.
  if (userId) {
    data.user = { connect: { id: String(userId) } };
  }

  const resolvedSchoolId = Number(schoolId);
  if (Number.isInteger(resolvedSchoolId) && resolvedSchoolId > 0) {
    data.school = { connect: { id: resolvedSchoolId } };
  }

  return prisma.auditLog.create({ data });
};
