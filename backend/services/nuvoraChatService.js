import { randomUUID } from "node:crypto";
import { prisma } from "../config/db.js";

const normalizeId = (value) => String(value || "").trim();

export const nuvoraChatService = {
  async createConversation({ userId, schoolId, title = "New chat" }) {
    const id = randomUUID();
    const safeTitle = String(title || "New chat").trim().slice(0, 120) || "New chat";
    const normalizedSchoolId = Number.isInteger(Number(schoolId)) ? Number(schoolId) : null;

    await prisma.$executeRaw`
      INSERT INTO "NuvoraConversation" ("id", "userId", "schoolId", "title", "createdAt", "updatedAt")
      VALUES (${id}, ${normalizeId(userId)}, ${normalizedSchoolId}, ${safeTitle}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    return { id, userId: normalizeId(userId), schoolId: normalizedSchoolId, title: safeTitle };
  },

  async listConversations(userId) {
    return prisma.$queryRaw`
      SELECT "id", "schoolId", "title", "createdAt", "updatedAt"
      FROM "NuvoraConversation"
      WHERE "userId" = ${normalizeId(userId)}
      ORDER BY "updatedAt" DESC
    `;
  },

  async getConversation(userId, conversationId) {
    const id = normalizeId(conversationId);
    const conversations = await prisma.$queryRaw`
      SELECT "id", "schoolId", "title", "createdAt", "updatedAt"
      FROM "NuvoraConversation"
      WHERE "id" = ${id} AND "userId" = ${normalizeId(userId)}
      LIMIT 1
    `;

    if (!conversations[0]) return null;

    const messages = await prisma.$queryRaw`
      SELECT "id", "role", "content", "data", "createdAt"
      FROM "NuvoraMessage"
      WHERE "conversationId" = ${id}
      ORDER BY "createdAt" ASC
    `;

    return { ...conversations[0], messages };
  },

  async getRecentMessages(userId, conversationId, limit = 10) {
    const id = normalizeId(conversationId);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
    const rows = await prisma.$queryRaw`
      SELECT m."role", m."content"
      FROM "NuvoraMessage" m
      INNER JOIN "NuvoraConversation" c ON c."id" = m."conversationId"
      WHERE c."id" = ${id} AND c."userId" = ${normalizeId(userId)}
      ORDER BY m."createdAt" DESC
      LIMIT ${safeLimit}
    `;
    return rows.reverse();
  },

  async addMessage({ conversationId, role, content, data = null }) {
    const id = randomUUID();
    const normalizedRole = role === "assistant" ? "assistant" : "user";
    const safeContent = String(content || "").slice(0, 10000);

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO "NuvoraMessage" ("id", "conversationId", "role", "content", "data", "createdAt")
        VALUES (${id}, ${normalizeId(conversationId)}, ${normalizedRole}, ${safeContent}, ${data ? JSON.stringify(data) : null}, CURRENT_TIMESTAMP)
      `;
      await tx.$executeRaw`
        UPDATE "NuvoraConversation"
        SET "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${normalizeId(conversationId)}
      `;
    });

    return id;
  },

  async renameConversation(userId, conversationId, title) {
    const safeTitle = String(title || "New chat").trim().slice(0, 120) || "New chat";
    const result = await prisma.$executeRaw`
      UPDATE "NuvoraConversation"
      SET "title" = ${safeTitle}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${normalizeId(conversationId)} AND "userId" = ${normalizeId(userId)}
    `;
    return Number(result) > 0;
  },

  async deleteConversation(userId, conversationId) {
    const result = await prisma.$executeRaw`
      DELETE FROM "NuvoraConversation"
      WHERE "id" = ${normalizeId(conversationId)} AND "userId" = ${normalizeId(userId)}
    `;
    return Number(result) > 0;
  },

  async deleteAllConversations(userId) {
    const result = await prisma.$executeRaw`
      DELETE FROM "NuvoraConversation"
      WHERE "userId" = ${normalizeId(userId)}
    `;
    return Number(result);
  },
};
