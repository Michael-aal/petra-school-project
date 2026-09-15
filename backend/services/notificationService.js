import { prisma } from "../config/db.js";

const roleOf = (user) => String(user?.role || "").trim().toLowerCase().replace(/\s+/g, "_");
const isPlatform = (user) => ["super_admin", "developer"].includes(roleOf(user));
const isSchoolAdmin = (user) => ["admin", "principal"].includes(roleOf(user));

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

const notificationSection = (notification) => {
  const text = `${notification?.title || ""} ${notification?.body || ""}`.toLowerCase();
  if (/announcement|notice|school resumption/.test(text)) return "announcements";
  if (/message|inbox|replied|reply/.test(text)) return "messages";
  if (/result|report card|grade|score|exam result/.test(text)) return "results";
  if (/payment|invoice|fee|receipt|paystack|wallet|flexpay|cashflow/.test(text)) return "payments";
  if (/attendance|absent|present/.test(text)) return "attendance";
  if (/assignment|homework|classwork/.test(text)) return "assignments";
  if (/admission|applicant|enrollment|enrol/.test(text)) return "admissions";
  if (/student|parent|guardian/.test(text)) return "students";
  if (/staff|teacher|admin|principal|invitation/.test(text)) return "staff";
  if (/support|ticket|help request/.test(text)) return "support";
  return "notifications";
};

const userNotificationWhere = (user, schoolId, unreadOnly = false) => {
  const readFilter = unreadOnly ? { isRead: false } : {};
  if (isPlatform(user)) return { userId: user.id, ...readFilter };
  if (isSchoolAdmin(user)) {
    return {
      schoolId,
      ...readFilter,
      OR: [{ userId: user.id }, { userId: null }],
    };
  }
  return { schoolId, userId: user.id, ...readFilter };
};

const sectionMatches = (notification, section) => notificationSection(notification) === section;

export const notificationService = {
  listForUser: async (user, query = {}) => {
    const schoolId = normalizeSchoolId(user, { allowPlatformWithoutSchool: true });
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 20)));
    const search = query.search ? String(query.search).trim() : "";

    const where = userNotificationWhere(user, schoolId);
    if (search) {
      where.AND = [{ OR: [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ] }];
    }

    const [total, unread, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, title: true, body: true, isRead: true, createdAt: true, updatedAt: true },
      }),
    ]);

    return {
      notifications,
      unread,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  unreadSummary: async (user) => {
    const schoolId = normalizeSchoolId(user, { allowPlatformWithoutSchool: true });
    const where = userNotificationWhere(user, schoolId, true);
    const notifications = await prisma.notification.findMany({ where, select: { id: true, title: true, body: true } });

    const bySection = {
      dashboard: false,
      admissions: false,
      students: false,
      academics: false,
      attendance: false,
      results: false,
      staff: false,
      payments: false,
      invoices: false,
      announcements: false,
      messages: false,
      assignments: false,
      support: false,
      notifications: notifications.length > 0,
    };

    for (const notification of notifications) {
      const section = notificationSection(notification);
      if (section in bySection) bySection[section] = true;
    }

    return { total: notifications.length, bySection };
  },

  markSectionRead: async (user, section) => {
    const allowed = new Set([
      "announcements", "messages", "results", "payments", "invoices", "attendance",
      "assignments", "admissions", "students", "staff", "support", "notifications",
    ]);
    const normalizedSection = String(section || "").trim().toLowerCase();
    if (!allowed.has(normalizedSection)) {
      const err = new Error("Unknown notification section");
      err.statusCode = 400;
      throw err;
    }

    const schoolId = normalizeSchoolId(user, { allowPlatformWithoutSchool: true });
    const where = userNotificationWhere(user, schoolId, true);
    const unread = await prisma.notification.findMany({ where, select: { id: true, title: true, body: true } });
    const ids = unread.filter((item) => sectionMatches(item, normalizedSection)).map((item) => item.id);

    if (!ids.length) return { updated: 0 };
    const result = await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { isRead: true } });
    return { updated: result.count };
  },

  markRead: async (user, notificationId) => {
    const schoolId = normalizeSchoolId(user, { allowPlatformWithoutSchool: true });
    const where = isPlatform(user)
      ? { id: notificationId, userId: user.id }
      : isSchoolAdmin(user)
        ? { id: notificationId, schoolId, OR: [{ userId: user.id }, { userId: null }] }
        : { id: notificationId, schoolId, userId: user.id };
    const existing = await prisma.notification.findFirst({ where });
    if (!existing) {
      const err = new Error("Notification not found");
      err.statusCode = 404;
      throw err;
    }
    return prisma.notification.update({ where: { id: existing.id }, data: { isRead: true } });
  },

  markAllRead: async (user) => {
    const schoolId = normalizeSchoolId(user, { allowPlatformWithoutSchool: true });
    const where = userNotificationWhere(user, schoolId, true);
    const result = await prisma.notification.updateMany({ where, data: { isRead: true } });
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
