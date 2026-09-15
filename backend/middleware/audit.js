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
    userId: user?.id || null,
    entity,
    entityId: String(entityId),
    action,
    actionType,
    performedBy,
    oldData: toJsonSnapshot(before),
    newData: toJsonSnapshot(after),
  };

  // AuditLog uses a Prisma relation to School, not a scalar schoolId field.
  const resolvedSchoolId = Number(schoolId);
  if (Number.isInteger(resolvedSchoolId) && resolvedSchoolId > 0) {
    auditData.school = { connect: { id: resolvedSchoolId } };
  }

  return prisma.auditLog.create({ data: auditData });
};
