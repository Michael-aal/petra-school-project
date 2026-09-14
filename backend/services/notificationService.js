import { prisma } from "../config/db.js";

const roleOf = (user) => String(user?.role || "").trim().toLowerCase().replace(/\s+/g, "_");
const isPlatform = (user) => ["super_admin", "developer"].includes(roleOf(user));

const normalizeSchoolId = (user, { allowPlatformWithoutSchool = false } = {}) => {
  if (isPlatform(user) && allowPlatformWithoutSchool && (user.schoolId === undefined || user.schoolId === null)) return null;
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
    const platformUser = isPlatform(user);
    const schoolId = normalizeSchoolId(user, { allowPlatformWithoutSchool: true });
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 20)));
    const search = query.search ? String(query.search).trim() : "";

    const where = platformUser
      ? { userId: user.id }
      : { schoolId, userId: user.id };

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
    const platformUser = isPlatform(user);
    const schoolId = normalizeSchoolId(user, { allowPlatformWithoutSchool: true });
    const where = platformUser
      ? { id: notificationId, userId: user.id }
      : { id: notificationId, schoolId, userId: user.id };
    const existing = await prisma.notification.findFirst({ where });
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
    const platformUser = isPlatform(user);
    const schoolId = normalizeSchoolId(user, { allowPlatformWithoutSchool: true });
    const where = platformUser
      ? { userId: user.id, isRead: false }
      : { schoolId, userId: user.id, isRead: false };
    const result = await prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });
    return { updated: result.count };
  },

  notifySupportTeam: async ({ schoolId, ticketId, requesterName, requesterRole, subject }) => {
    const platformUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: { equals: "developer", mode: "insensitive" } },
          { role: { equals: "super_admin", mode: "insensitive" } },
          { role: { equals: "superadmin", mode: "insensitive" } },
        ],
        accountStatus: "active",
      },
      select: { id: true },
    });

    if (!platformUsers.length) return { notified: 0 };

    const body = `${requesterName || "A user"} (${requesterRole || "user"}) requested support: ${subject}.`;
    await prisma.notification.createMany({
      data: platformUsers.map((recipient) => ({
        schoolId: Number(schoolId),
        userId: recipient.id,
        title: "New Support Request",
        body,
        isRead: false,
      })),
    });

    return { notified: platformUsers.length, ticketId };
  },
};

export default notificationService;
