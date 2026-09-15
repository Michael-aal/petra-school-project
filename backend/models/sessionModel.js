import crypto from "node:crypto";
import { prisma } from "../config/db.js";

const hashToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");

export const sessionModel = {
  hashToken,

  create: ({ id, userId, accessToken, ipAddress = null, userAgent = null, expiresAt }) => prisma.session.create({
    data: {
      id,
      userId: String(userId),
      token: hashToken(accessToken),
      ipAddress,
      userAgent,
      expiresAt,
    },
  }),

  findActive: async ({ id, userId }) => prisma.session.findFirst({
    where: {
      id: String(id),
      userId: String(userId),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  }),

  revoke: (id, userId) => prisma.session.updateMany({
    where: { id: String(id), userId: String(userId), revokedAt: null },
    data: { revokedAt: new Date() },
  }),

  revokeAll: (userId) => prisma.session.updateMany({
    where: { userId: String(userId), revokedAt: null },
    data: { revokedAt: new Date() },
  }),

  listActive: (userId) => prisma.session.findMany({
    where: { userId: String(userId), revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
  }),

  createRefreshToken: ({ userId, token, expiresAt }) => prisma.refreshToken.create({
    data: {
      userId: String(userId),
      token: hashToken(token),
      expiresAt,
    },
  }),

  findActiveRefreshToken: (token) => prisma.refreshToken.findFirst({
    where: {
      token: hashToken(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  }),

  revokeRefreshToken: (id) => prisma.refreshToken.updateMany({
    where: { id: String(id), revokedAt: null },
    data: { revokedAt: new Date() },
  }),

  revokeAllRefreshTokens: (userId) => prisma.refreshToken.updateMany({
    where: { userId: String(userId), revokedAt: null },
    data: { revokedAt: new Date() },
  }),
};
