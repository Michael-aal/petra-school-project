import { prisma } from "../config/db.js";

const toJsonSnapshot = (value) => {
  if (value === undefined || value === null) return null;
  return JSON.parse(JSON.stringify(value, (_key, item) => {
    if (item && typeof item === "object" && typeof item.toJSON === "function") return item.toJSON();
    return item;
  }));
};

export const recordAuditMutation = async ({ user, schoolId, entity, entityId, action, actionType = null, before = null, after = null }) => {
  const performedBy = String(user?.id || "system");

  const auditData = {
    entity,
    entityId: String(entityId),
    action,
    actionType,
    performedBy,
    oldData: toJsonSnapshot(before),
    newData: toJsonSnapshot(after),
  };

  // AuditLog exposes User and School as Prisma relations, not scalar create fields.
  if (user?.id) {
    auditData.user = { connect: { id: String(user.id) } };
  }

  const resolvedSchoolId = Number(schoolId);
  if (Number.isInteger(resolvedSchoolId) && resolvedSchoolId > 0) {
    auditData.school = { connect: { id: resolvedSchoolId } };
  }

  // Audit logging must never break the business operation that triggered it.
  try {
    return await prisma.auditLog.create({ data: auditData });
  } catch (error) {
    console.error("Audit log persistence failed; continuing without blocking the operation:", error);
    return null;
  }
};
