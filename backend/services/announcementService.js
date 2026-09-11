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

const buildAudienceFilter = (audience) => {
  if (audience === "TEACHERS") return { role: "teacher" };
  if (audience === "PARENTS") return { role: "parent" };
  return {};
};

export const announcementService = {
  listForUser: async (user, query = {}) => {
    const schoolId = normalizeSchoolId(user);
    const role = String(user.role || "").toLowerCase();
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 20)));
    const search = query.search ? String(query.search).trim() : "";

    if (role === "principal" || role === "super_admin") {
      return announcementService.listForSchool(user, query);
    }

    const recipientWhere = { userId: user.id, schoolId };
    const recipients = await prisma.announcementRecipient.findMany({
      where: recipientWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { announcement: { include: { attachments: true } } },
    });

    const total = await prisma.announcementRecipient.count({ where: recipientWhere });

    const announcements = recipients
      .filter((recipient) => {
        if (!search) return true;
        const content = `${recipient.announcement.title} ${recipient.announcement.body}`.toLowerCase();
        return content.includes(search.toLowerCase());
      })
      .map((recipient) => ({
        ...recipient.announcement,
        recipient: {
          id: recipient.id,
          isRead: recipient.isRead,
          readAt: recipient.readAt,
          reaction: recipient.reaction,
        },
      }));

    return {
      announcements,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  listForSchool: async (user, query = {}) => {
    const schoolId = normalizeSchoolId(user);
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 20)));
    const search = query.search ? String(query.search).trim() : "";
    const where = { schoolId };

    if (query.onlyDrafts === "true") where.isDraft = true;
    if (query.published === "true") where.isDraft = false;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, announcements] = await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.findMany({
        where,
        orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: { attachments: true },
      }),
    ]);

    return { announcements, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },

  createAnnouncement: async (user, payload) => {
    const schoolId = normalizeSchoolId(user);
    if (!payload.title || !payload.body) {
      const err = new Error("Title and body are required");
      err.statusCode = 400;
      throw err;
    }

    const announcement = await prisma.announcement.create({
      data: {
        schoolId,
        title: String(payload.title).trim(),
        body: String(payload.body).trim(),
        priority: payload.priority || "NORMAL",
        audience: payload.audience || "TEACHERS_AND_PARENTS",
        isDraft: payload.isDraft === true || payload.isDraft === "true",
        publishAt: payload.publishAt ? new Date(payload.publishAt) : payload.isDraft ? null : new Date(),
        expiryAt: payload.expiryAt ? new Date(payload.expiryAt) : null,
      },
    });

    if (Array.isArray(payload.attachments) && payload.attachments.length) {
      const attachments = payload.attachments.map((attachment) => ({
        announcementId: announcement.id,
        schoolId,
        filename: attachment.filename,
        url: attachment.url,
        contentType: attachment.contentType || null,
        size: attachment.size || null,
      }));
      await prisma.announcementAttachment.createMany({ data: attachments });
    }

    const recipientFilter = buildAudienceFilter(announcement.audience);
    const recipients = await prisma.user.findMany({ where: { schoolId, ...recipientFilter }, select: { id: true, role: true } });

    if (recipients.length) {
      const recipientRecords = recipients.map((recipient) => ({
        announcementId: announcement.id,
        schoolId,
        userId: recipient.id,
        role: recipient.role,
      }));
      await prisma.announcementRecipient.createMany({ data: recipientRecords, skipDuplicates: true });

      const notifications = recipients.map((recipient) => ({
        schoolId,
        userId: recipient.id,
        title: `New announcement: ${announcement.title}`,
        body: announcement.body,
      }));
      await prisma.notification.createMany({ data: notifications });
    }

    return announcement;
  },

  markRead: async (user, announcementId) => {
    const schoolId = normalizeSchoolId(user);
    const recipient = await prisma.announcementRecipient.findFirst({ where: { announcementId, userId: user.id, schoolId } });
    if (!recipient) {
      const err = new Error("Announcement not accessible");
      err.statusCode = 404;
      throw err;
    }
    return prisma.announcementRecipient.update({
      where: { id: recipient.id },
      data: { isRead: true, readAt: new Date() },
    });
  },

  react: async (user, announcementId, reaction) => {
    const schoolId = normalizeSchoolId(user);
    const recipient = await prisma.announcementRecipient.findFirst({ where: { announcementId, userId: user.id, schoolId } });
    if (!recipient) {
      const err = new Error("Announcement not accessible");
      err.statusCode = 404;
      throw err;
    }
    return prisma.announcementRecipient.update({
      where: { id: recipient.id },
      data: { reaction: reaction || null },
    });
  },

  getAnalytics: async (user, announcementId, roleFilter) => {
    const schoolId = normalizeSchoolId(user);
    const announcement = await prisma.announcement.findFirst({ where: { id: announcementId, schoolId } });
    if (!announcement) {
      const err = new Error("Announcement not found");
      err.statusCode = 404;
      throw err;
    }

    const recipientWhere = { announcementId, schoolId, ...(roleFilter ? { role: roleFilter } : {}) };
    const totalRecipients = await prisma.announcementRecipient.count({ where: recipientWhere });
    const reads = await prisma.announcementRecipient.count({ where: { ...recipientWhere, isRead: true } });
    const acknowledged = await prisma.announcementRecipient.count({ where: { ...recipientWhere, reaction: "ACKNOWLEDGED" } });
    const understood = await prisma.announcementRecipient.count({ where: { ...recipientWhere, reaction: "UNDERSTOOD" } });
    const willAttend = await prisma.announcementRecipient.count({ where: { ...recipientWhere, reaction: "WILL_ATTEND" } });
    const cannotAttend = await prisma.announcementRecipient.count({ where: { ...recipientWhere, reaction: "CANNOT_ATTEND" } });
    const needAssistance = await prisma.announcementRecipient.count({ where: { ...recipientWhere, reaction: "NEED_ASSISTANCE" } });
    const notResponded = totalRecipients - (acknowledged + understood + willAttend + cannotAttend + needAssistance);

    return {
      announcement,
      analytics: {
        totalRecipients,
        totalReads: reads,
        readPercentage: totalRecipients ? Math.round((reads / totalRecipients) * 100) : 0,
        acknowledged,
        understood,
        willAttend,
        cannotAttend,
        needAssistance,
        notResponded,
      },
    };
  },
};

export default announcementService;
