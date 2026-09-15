import webpush from "web-push";
import { redisClient } from "../config/redis.js";

const redisKey = (userId) => `petra:push-subscriptions:${userId}`;
const deliveredKey = (notificationId, userId) => `petra:push-delivered:${notificationId}:${userId}`;
const publicKey = String(process.env.VAPID_PUBLIC_KEY || "").trim();
const privateKey = String(process.env.VAPID_PRIVATE_KEY || "").trim();
const subject = String(process.env.VAPID_SUBJECT || "mailto:admin@petra-school.local").trim();

let configured = false;
const configure = () => {
  if (configured || !publicKey || !privateKey) return Boolean(publicKey && privateKey);
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
};

const ensureRedis = async () => {
  if (!redisClient) return false;
  if (redisClient.status === "wait") await redisClient.connect();
  return true;
};

const normalizeSubscription = (subscription) => ({
  endpoint: String(subscription?.endpoint || "").trim(),
  keys: { p256dh: String(subscription?.keys?.p256dh || "").trim(), auth: String(subscription?.keys?.auth || "").trim() },
});

const markDelivered = async (notificationId, userId) => {
  if (!redisClient || !notificationId || !userId) return;
  await redisClient.set(deliveredKey(notificationId, userId), "1", "EX", 86400);
};

export const pushNotificationService = {
  isConfigured: () => Boolean(publicKey && privateKey && redisClient),

  getPublicKey: () => {
    if (!publicKey) { const error = new Error("Web Push is not configured"); error.statusCode = 503; throw error; }
    return publicKey;
  },

  wasDelivered: async (notificationId, userId) => {
    if (!redisClient || !notificationId || !userId) return false;
    await ensureRedis();
    return Boolean(await redisClient.exists(deliveredKey(notificationId, userId)));
  },

  saveSubscription: async (userId, subscription, metadata = {}) => {
    const normalized = normalizeSubscription(subscription);
    if (!userId || !normalized.endpoint || !normalized.keys.p256dh || !normalized.keys.auth) {
      const error = new Error("A valid push subscription is required"); error.statusCode = 400; throw error;
    }
    if (!redisClient) { const error = new Error("Push storage is unavailable"); error.statusCode = 503; throw error; }
    await ensureRedis();
    const record = {
      endpoint: normalized.endpoint,
      keys: normalized.keys,
      userAgent: String(metadata.userAgent || "").slice(0, 500),
      deviceName: String(metadata.deviceName || "").slice(0, 120),
      updatedAt: new Date().toISOString(),
    };
    await redisClient.hset(redisKey(userId), normalized.endpoint, JSON.stringify(record));
    return { enabled: true };
  },

  removeSubscription: async (userId, endpoint) => {
    if (!redisClient || !userId || !endpoint) return { removed: 0 };
    await ensureRedis();
    return { removed: await redisClient.hdel(redisKey(userId), String(endpoint)) };
  },

  sendToUser: async (userId, payload) => {
    if (!configure() || !redisClient || !userId) return { sent: 0, skipped: true };
    await ensureRedis();
    const stored = await redisClient.hgetall(redisKey(userId));
    const subscriptions = Object.values(stored || {});
    if (!subscriptions.length) return { sent: 0 };

    const body = JSON.stringify({
      title: String(payload?.title || "Petra School"),
      body: String(payload?.body || "You have a new notification."),
      url: String(payload?.url || "/dashboard/communication/notifications"),
      notificationId: payload?.notificationId || null,
      tag: String(payload?.tag || "petra-notification"),
      timestamp: Date.now(),
    });

    let sent = 0;
    for (const raw of subscriptions) {
      let subscription;
      try {
        subscription = JSON.parse(raw);
        await webpush.sendNotification(subscription, body);
        sent += 1;
      } catch (error) {
        const statusCode = Number(error?.statusCode || error?.status || 0);
        if (statusCode === 404 || statusCode === 410) {
          const endpoint = subscription?.endpoint;
          if (endpoint) await redisClient.hdel(redisKey(userId), endpoint);
        }
      }
    }
    if (sent > 0 && payload?.notificationId) await markDelivered(payload.notificationId, userId);
    return { sent };
  },

  sendToUsers: async (users, payload) => {
    const ids = [...new Set((users || []).map((user) => typeof user === "string" ? user : user?.id).filter(Boolean))];
    const results = await Promise.allSettled(ids.map((id) => pushNotificationService.sendToUser(id, payload)));
    return { sent: results.reduce((sum, result) => sum + (result.status === "fulfilled" ? Number(result.value?.sent || 0) : 0), 0) };
  },
};

export default pushNotificationService;
