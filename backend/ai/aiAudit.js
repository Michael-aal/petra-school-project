import { prisma } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { logAudit } from "../utils/auditLog.js";

const safeMetadata = (metadata = {}) => {
  const allowed = ["toolName", "resourceScope", "success", "durationMs"];
  return Object.fromEntries(allowed.filter((key) => metadata[key] !== undefined).map((key) => [key, metadata[key]]));
};

export const logAIActivity = async ({ userId, schoolId, action, resourceScope, toolName, success, durationMs }) => {
  const metadata = safeMetadata({ toolName, resourceScope, success, durationMs });
  logger.info("AI activity", { userId, schoolId, action, ...metadata });
  if (!userId && !schoolId) return null;
  return logAudit({ userId, schoolId, action, entity: "AI", details: metadata });
};
