import { Prisma } from "@prisma/client";
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

const loadAnnouncementMetadata = async (ids) => {
  if (!ids.length) return new Map();
  const rows = await prisma.$queryRaw`
    SELECT "id", "priority", "audience", "isDraft", "publishAt", "expiryAt"
    FROM "Announcement"
    WHERE "id" IN (${Prisma.join(ids)})
  `;
  return new Map(rows.map((row) => [row.id, row]));
};

const withMetadata = (announcement, metadata) => ({
  ...announcement,
  priority: metadata?.priority ?? "NORMAL",
  audience: metadata?.audience ?? "TEACHERS_AND_PARENTS",
  isDraft: metadata?.isDraft ?? false,
  publishAt: metadata?.publishAt ?? null,
  expiryAt: metadata?.expiryAt ?? null,
});

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
      include: { announcement: true },
    });

    const total = await prisma.announcementRecipient.count({ where: recipientWhere });
    const metadata = await loadAnnouncementMetadata(recipients.map((recipient) => recipient.announcement.id));

    const announcements = recipients
      .filter((recipient) => {
        if (!search) return true;
        const content = `${recipient.announcement.title} ${recipient.announcement.body}`.toLowerCase();
        return content.includes(search.toLowerCase());
      })
      .map((recipient) => ({
        ...withMetadata(recipient.announcement, metadata.get(recipient.announcement.id)),
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
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const metadata = await loadAnnouncementMetadata(announcements.map((announcement) => announcement.id));
    const enriched = announcements.map((announcement) => withMetadata(announcement, metadata.get(announcement.id)));

    return {
      announcements: enriched,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  createAnnouncement: async (user, payload) => {
    const schoolId = normalizeSchoolId(user);
    if (!payload.title || !payload.body) {
      const err = new Error("Title and body are required");
      err.statusCode = 400;
      throw err;
    }

    const title = String(payload.title).trim();
    const body = String(payload.body).trim();
    const priority = payload.priority || "NORMAL";
    const audience = payload.audience || "TEACHERS_AND_PARENTS";
    const isDraft = payload.isDraft === true || payload.isDraft === "true";
    const publishedAt = payload.publishAt ? new Date(payload.publishAt) : isDraft ? null : new Date();
    const publishAt = payload.publishAt ? new Date(payload.publishAt) : null;
    const expiryAt = payload.expiryAt ? new Date(payload.expiryAt) : null;

    const [announcement] = await prisma.$queryRaw`
      INSERT INTO "Announcement"
        ("schoolId", "title", "body", "priority", "audience", "isDraft", "publishAt", "publishedAt", "expiryAt", "createdAt", "updatedAt")
      VALUES
        (${schoolId}, ${title}, ${body}, ${priority}::"AnnouncementPriority", ${audience}, ${isDraft}, ${publishAt}, ${publishedAt}, ${expiryAt}, NOW(), NOW())
      RETURNING *
    `;

    const recipientFilter = buildAudienceFilter(audience);
    const recipients = await prisma.user.findMany({
      where: { schoolId, ...recipientFilter },
      select: { id: true, role: true },
    });

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

    const metadata = await loadAnnouncementMetadata([announcementId]);
    const enrichedAnnouncement = withMetadata(announcement, metadata.get(announcementId));

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
      announcement: enrichedAnnouncement,
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
