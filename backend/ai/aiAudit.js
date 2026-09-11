import { logger } from "../utils/logger.js";
import { logAudit } from "../utils/auditLog.js";

const safeMetadata = (metadata = {}) => {
  const allowed = ["toolName", "resourceScope", "success", "durationMs", "provider", "model", "toolsUsed"];
  return Object.fromEntries(
    allowed
      .filter((key) => metadata[key] !== undefined)
      .map((key) => [key, metadata[key]]),
  );
};

export const logAIActivity = async ({
  userId,
  schoolId,
  action = "ai.query",
  toolName,
  toolsUsed = [],
  success = true,
  durationMs = 0,
  provider,
  model,
}) => {
  const metadata = safeMetadata({
    toolName,
    toolsUsed,
    success,
    durationMs,
    provider,
    model,
  });

  logger.info("AI activity", { userId, schoolId, action, ...metadata });

  if (!userId && !schoolId) return null;

  try {
    return await logAudit({
      userId: userId || null,
      schoolId: schoolId || null,
      action,
      entity: "AI",
      details: metadata,
    });
  } catch (err) {
    logger.warn("Failed to write AI audit log", { error: err.message });
    return null;
  }
};
