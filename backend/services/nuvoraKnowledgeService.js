import crypto from "node:crypto";
import { prisma } from "../config/db.js";
import { normalizeRole } from "../utils/roleUtils.js";

const assertDeveloper = (user) => {
  const role = normalizeRole(user?.role);
  if (!["developer", "superadmin", "super_admin"].includes(role)) {
    throw Object.assign(new Error("Only developers can manage Nuvora knowledge"), { statusCode: 403 });
  }
};

const normalizeText = (value, max) => String(value ?? "").trim().slice(0, max);

export const nuvoraKnowledgeService = {
  assertDeveloper,

  list: async (user) => {
    assertDeveloper(user);
    return prisma.$queryRaw`
      SELECT id, title, content, category, enabled, "createdById", "createdAt", "updatedAt"
      FROM "NuvoraKnowledge"
      ORDER BY "updatedAt" DESC
    `;
  },

  create: async (user, payload = {}) => {
    assertDeveloper(user);
    const title = normalizeText(payload.title, 160);
    const content = normalizeText(payload.content, 10000);
    const category = normalizeText(payload.category || "general", 80) || "general";
    if (!title || !content) {
      throw Object.assign(new Error("Title and content are required"), { statusCode: 400 });
    }

    const id = crypto.randomUUID();
    const enabled = payload.enabled === undefined ? true : Boolean(payload.enabled);
    const rows = await prisma.$queryRaw`
      INSERT INTO "NuvoraKnowledge" (id, title, content, category, enabled, "createdById", "createdAt", "updatedAt")
      VALUES (${id}, ${title}, ${content}, ${category}, ${enabled}, ${user.id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, title, content, category, enabled, "createdById", "createdAt", "updatedAt"
    `;
    return rows[0];
  },

  update: async (user, id, payload = {}) => {
    assertDeveloper(user);
    const knowledgeId = normalizeText(id, 100);
    if (!knowledgeId) throw Object.assign(new Error("Knowledge id is required"), { statusCode: 400 });

    const title = payload.title === undefined ? null : normalizeText(payload.title, 160);
    const content = payload.content === undefined ? null : normalizeText(payload.content, 10000);
    const category = payload.category === undefined ? null : normalizeText(payload.category, 80);
    const enabled = payload.enabled === undefined ? null : Boolean(payload.enabled);

    const rows = await prisma.$queryRaw`
      UPDATE "NuvoraKnowledge"
      SET
        title = COALESCE(${title}, title),
        content = COALESCE(${content}, content),
        category = COALESCE(${category}, category),
        enabled = COALESCE(${enabled}, enabled),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${knowledgeId}
      RETURNING id, title, content, category, enabled, "createdById", "createdAt", "updatedAt"
    `;

    if (!rows[0]) throw Object.assign(new Error("Knowledge entry not found"), { statusCode: 404 });
    return rows[0];
  },

  remove: async (user, id) => {
    assertDeveloper(user);
    const knowledgeId = normalizeText(id, 100);
    const rows = await prisma.$queryRaw`
      DELETE FROM "NuvoraKnowledge"
      WHERE id = ${knowledgeId}
      RETURNING id
    `;
    if (!rows[0]) throw Object.assign(new Error("Knowledge entry not found"), { statusCode: 404 });
    return { id: rows[0].id, deleted: true };
  },

  getEnabledKnowledge: async () => {
    return prisma.$queryRaw`
      SELECT title, content, category
      FROM "NuvoraKnowledge"
      WHERE enabled = true
      ORDER BY "updatedAt" DESC
      LIMIT 40
    `;
  },
};
