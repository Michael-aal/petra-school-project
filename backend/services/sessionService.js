import crypto from "node:crypto";
import IORedis from "ioredis";
import { runWithoutSchoolContext } from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";
import { sessionModel } from "../models/sessionModel.js";

// Keep a practical ceiling for normal users/dev testing while still allowing
// multiple browser tabs/devices. Deployments can override this with the env var.
const MAX_SESSIONS = Math.max(1, Number(process.env.MAX_SESSIONS_PER_USER || 20));
const ACCESS_TTL_MS = 15 * 60 * 1000;
const redisEnabled = process.env.NODE_ENV === "production" || process.env.RUN_INTEGRATION_TESTS === "true";
const redis = redisEnabled && process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false })
  : null;

const cacheKey = (sessionId) => `petra:session:${sessionId}`;
const cacheTtlSeconds = Math.max(1, Math.ceil(ACCESS_TTL_MS / 1000));

const cacheGet = async (sessionId) => {
  if (!redis) return null;
  try {
    const value = await redis.get(cacheKey(sessionId));
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const cacheSet = async (session) => {
  if (!redis) return;
  try {
    await redis.set(cacheKey(session.id), JSON.stringify({ id: session.id, userId: session.userId, expiresAt: session.expiresAt }), "EX", cacheTtlSeconds);
  } catch {
    // Database validation remains authoritative when Redis is unavailable.
  }
};

const cacheDelete = async (sessionId) => {
  if (!redis) return;
  try { await redis.del(cacheKey(sessionId)); } catch {}
};

export const sessionService = {
  maxSessions: MAX_SESSIONS,

  create: async ({ user, req }) => runWithoutSchoolContext(async () => {
    const active = await sessionModel.listActive(user.id);
    if (active.length >= MAX_SESSIONS) {
      const error = new Error(`Maximum of ${MAX_SESSIONS} active sessions reached`);
      error.statusCode = 429;
      throw error;
    }

    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ACCESS_TTL_MS);
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId || null,
      sessionVersion: user.sessionVersion,
      sessionId: id,
    });
    const session = await sessionModel.create({
      id,
      userId: user.id,
      accessToken: token,
      ipAddress: req?.ip || null,
      userAgent: req?.get?.("user-agent") || null,
      expiresAt,
    });
    await cacheSet(session);
    return { session, token };
  }),

  validate: async ({ id, userId }) => {
    const cached = await cacheGet(id);
    if (cached && String(cached.userId) === String(userId) && new Date(cached.expiresAt) > new Date()) return cached;
    const session = await runWithoutSchoolContext(() => sessionModel.findActive({ id, userId }));
    if (session) await cacheSet(session);
    return session;
  },

  revoke: async ({ id, userId }) => {
    const result = await runWithoutSchoolContext(() => sessionModel.revoke(id, userId));
    await cacheDelete(id);
    return result;
  },

  revokeAll: async (userId) => {
    const active = await runWithoutSchoolContext(() => sessionModel.listActive(userId));
    const result = await runWithoutSchoolContext(() => sessionModel.revokeAll(userId));
    await Promise.all(active.map((session) => cacheDelete(session.id)));
    return result;
  },

  rotate: async ({ oldSessionId, user, req }) => {
    await sessionService.revoke({ id: oldSessionId, userId: user.id });
    return sessionService.create({ user, req });
  },

  close: async () => { if (redis) await redis.quit(); },
};
