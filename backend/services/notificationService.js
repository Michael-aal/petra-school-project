import { prisma } from "../config/db.js";

const normalizeSchoolId = (user) => {
  if (!user || user.schoolId === undefined || user.schoolId === null) {
    const err = new Error("School context missing");
    err.statusCode = 403;
    throw err;
  }
  return Number(user.schoolId);
};

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const notificationService = {
  listForUser: async (user, query = {}) => {
    const schoolId = normalizeSchoolId(user);
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 20)));
    const search = query.search ? String(query.search).trim() : "";

    const where = { schoolId, userId: user.id };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, unread, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          body: true,
          isRead: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      notifications,
      unread,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  markRead: async (user, notificationId) => {
    const schoolId = normalizeSchoolId(user);
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, schoolId, userId: user.id },
    });
    if (!existing) {
      const err = new Error("Notification not found");
      err.statusCode = 404;
      throw err;
    }
    return prisma.notification.update({
      where: { id: existing.id },
      data: { isRead: true },
    });
  },

  markAllRead: async (user) => {
    const schoolId = normalizeSchoolId(user);
    const result = await prisma.notification.updateMany({
      where: { schoolId, userId: user.id, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  },
};

export default notificationService;
