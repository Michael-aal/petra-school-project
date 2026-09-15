import prisma from "../config/prisma.js";

const normalize = (value) => String(value || "").trim();

const canManage = (user) => {
  const role = normalize(user?.role).toLowerCase().replace(/\s+/g, "_");
  return ["developer", "super_admin", "superadmin"].includes(role);
};

export async function listKnowledge({ user, includeDisabled = false } = {}) {
  if (!canManage(user)) throw Object.assign(new Error("Developer access required"), { statusCode: 403 });
  return prisma.aiKnowledge.findMany({
    where: includeDisabled ? {} : { enabled: true },
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
    include: { createdBy: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
}

export async function createKnowledge({ user, title, content, category = "general", enabled = true }) {
  if (!canManage(user)) throw Object.assign(new Error("Developer access required"), { statusCode: 403 });
  if (!normalize(title) || !normalize(content)) throw Object.assign(new Error("Title and content are required"), { statusCode: 400 });
  return prisma.aiKnowledge.create({
    data: { title: normalize(title), content: normalize(content), category: normalize(category) || "general", enabled: Boolean(enabled), createdById: user.id },
  });
}

export async function updateKnowledge({ user, id, ...patch }) {
  if (!canManage(user)) throw Object.assign(new Error("Developer access required"), { statusCode: 403 });
  const data = {};
  if (patch.title !== undefined) data.title = normalize(patch.title);
  if (patch.content !== undefined) data.content = normalize(patch.content);
  if (patch.category !== undefined) data.category = normalize(patch.category) || "general";
  if (patch.enabled !== undefined) data.enabled = Boolean(patch.enabled);
  return prisma.aiKnowledge.update({ where: { id }, data });
}

export async function deleteKnowledge({ user, id }) {
  if (!canManage(user)) throw Object.assign(new Error("Developer access required"), { statusCode: 403 });
  return prisma.aiKnowledge.delete({ where: { id } });
}

export async function getActiveKnowledge() {
  return prisma.aiKnowledge.findMany({
    where: { enabled: true },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
    take: 100,
    select: { id: true, title: true, content: true, category: true, updatedAt: true },
  });
}
