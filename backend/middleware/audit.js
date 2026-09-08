import { prisma } from "../config/db.js";

const toJsonSnapshot = (value) => {
  if (value === undefined || value === null) return null;
  return JSON.parse(JSON.stringify(value, (_key, item) => {
    if (item && typeof item === "object" && typeof item.toJSON === "function") return item.toJSON();
    return item;
  }));
};

export const recordAuditMutation = async ({ user, schoolId, entity, entityId, action, before = null, after = null }) => {
  const performedBy = String(user?.id || "system");
  return prisma.auditLog.create({
    data: {
      schoolId: schoolId === undefined || schoolId === null ? null : Number(schoolId),
      userId: user?.id || null,
      entity,
      entityId: String(entityId),
      action,
      performedBy,
      oldData: toJsonSnapshot(before),
      newData: toJsonSnapshot(after),
    },
  });
};
