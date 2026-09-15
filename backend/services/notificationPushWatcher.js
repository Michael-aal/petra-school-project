import { prisma } from "../config/db.js";
import { redlock, redisClient } from "../config/redis.js";
import { pushNotificationService } from "./pushNotificationService.js";

const STATE_KEY = "petra:push-notification-watcher:cursor";
const LOCK_KEY = "petra:push-notification-watcher:lock";
let timer = null;
let running = false;

const loadCursor = async () => {
  if (!redisClient) return { createdAt: new Date().toISOString(), id: "" };
  if (redisClient.status === "wait") await redisClient.connect();
  const value = await redisClient.get(STATE_KEY);
  if (!value) return { createdAt: new Date().toISOString(), id: "" };
  try { return JSON.parse(value); } catch { return { createdAt: new Date().toISOString(), id: "" }; }
};

const saveCursor = async (cursor) => {
  if (!redisClient) return;
  await redisClient.set(STATE_KEY, JSON.stringify(cursor));
};

const deliver = async (notification) => {
  const payload = {
    title: notification.title,
    body: notification.body,
    notificationId: notification.id,
    url: "/dashboard/communication/notifications",
    tag: `notification-${notification.id}`,
  };

  if (notification.userId) {
    if (!(await pushNotificationService.wasDelivered(notification.id, notification.userId))) {
      await pushNotificationService.sendToUser(notification.userId, payload);
    }
    return;
  }

  const admins = await prisma.user.findMany({
    where: {
      schoolId: notification.schoolId,
      accountStatus: "active",
      role: { in: ["admin", "principal"] },
    },
    select: { id: true },
  });
  for (const admin of admins) {
    if (await pushNotificationService.wasDelivered(notification.id, admin.id)) continue;
    await pushNotificationService.sendToUser(admin.id, payload);
  }
};

const tick = async () => {
  if (running || !redisClient || !pushNotificationService.isConfigured()) return;
  running = true;
  let lock;
  try {
    if (redisClient.status === "wait") await redisClient.connect();
    if (redlock) {
      try { lock = await redlock.acquire([LOCK_KEY], 1500); } catch { return; }
    }

    const cursor = await loadCursor();
    const createdAt = new Date(cursor.createdAt);
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { createdAt: { gt: createdAt } },
          ...(cursor.id ? [{ createdAt, id: { gt: cursor.id } }] : []),
        ],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 100,
      select: { id: true, schoolId: true, userId: true, title: true, body: true, createdAt: true },
    });

    for (const notification of notifications) await deliver(notification);
    if (notifications.length) {
      const last = notifications[notifications.length - 1];
      await saveCursor({ createdAt: last.createdAt.toISOString(), id: last.id });
    }
  } catch {
    // Push delivery must never take down the application.
  } finally {
    if (lock) await lock.release().catch(() => {});
    running = false;
  }
};

export const startNotificationPushWatcher = () => {
  if (timer || process.env.NODE_ENV === "test") return;
  timer = setInterval(() => { void tick(); }, 2000);
  timer.unref?.();
  void tick();
};

export const stopNotificationPushWatcher = () => {
  if (timer) clearInterval(timer);
  timer = null;
};
