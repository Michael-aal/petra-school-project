import { randomUUID } from "node:crypto";
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

const buildRecipientRoleCondition = (roleFilter) =>
  roleFilter ? Prisma.sql` AND ar."role" = ${roleFilter}` : Prisma.empty;

export const announcementService = {
  listForUser: async (user, query = {}) => {
    const schoolId = normalizeSchoolId(user);
    const role = String(user.role || "").toLowerCase();
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 20)));
    const search = query.search ? String(query.search).trim() : "";
    if (role === "principal" || role === "super_admin") return announcementService.listForSchool(user, query);

    const searchSql = search
      ? Prisma.sql` AND (a."title" ILIKE ${`%${search}%`} OR a."body" ILIKE ${`%${search}%`})`
      : Prisma.empty;
    const offset = (page - 1) * limit;

    const [countRows, rows] = await Promise.all([
      prisma.$queryRaw`
        SELECT COUNT(*)::int AS "count"
        FROM "AnnouncementRecipient" ar
        JOIN "Announcement" a ON a."id" = ar."announcementId"
        WHERE ar."userId" = ${user.id} AND ar."schoolId" = ${schoolId}${searchSql}
      `,
      prisma.$queryRaw`
        SELECT
          ar."id" AS "recipientId",
          ar."isRead" AS "recipientIsRead",
          ar."readAt" AS "recipientReadAt",
          ar."reaction" AS "recipientReaction",
          a.*
        FROM "AnnouncementRecipient" ar
        JOIN "Announcement" a ON a."id" = ar."announcementId"
        WHERE ar."userId" = ${user.id} AND ar."schoolId" = ${schoolId}${searchSql}
        ORDER BY ar."createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
    ]);

    const announcements = rows.map((row) => ({
      ...withMetadata(row, row),
      recipient: {
        id: row.recipientId,
        isRead: row.recipientIsRead,
        readAt: row.recipientReadAt,
        reaction: row.recipientReaction,
      },
    }));
    const total = Number(countRows[0]?.count || 0);
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
    const conditions = [Prisma.sql`"schoolId" = ${schoolId}`];
    if (query.onlyDrafts === "true") conditions.push(Prisma.sql`"isDraft" = true`);
    if (query.published === "true") conditions.push(Prisma.sql`"isDraft" = false`);
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(Prisma.sql`("title" ILIKE ${pattern} OR "body" ILIKE ${pattern})`);
    }

    const whereSql = Prisma.join(conditions, " AND ");
    const offset = (page - 1) * limit;
    const [countRows, announcements] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int AS "count" FROM "Announcement" WHERE ${whereSql}`,
      prisma.$queryRaw`
        SELECT * FROM "Announcement"
        WHERE ${whereSql}
        ORDER BY "publishedAt" DESC NULLS LAST, "createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
    ]);

    const total = Number(countRows[0]?.count || 0);
    const metadata = await loadAnnouncementMetadata(announcements.map((item) => item.id));
    return {
      announcements: announcements.map((item) => withMetadata(item, metadata.get(item.id))),
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
    // Strict invariant: the actor who publishes the announcement is never a recipient.
    const recipients = await prisma.user.findMany({
      where: { schoolId, id: { not: user.id }, ...recipientFilter },
      select: { id: true, role: true },
    });

    if (recipients.length) {
      const values = Prisma.join(
        recipients.map((recipient) =>
          Prisma.sql`(${randomUUID()}, ${announcement.id}, ${schoolId}, ${recipient.id}, ${recipient.role}, false, NULL, NULL, NOW(), NOW())`,
        ),
        ",",
      );
      await prisma.$executeRaw`
        INSERT INTO "AnnouncementRecipient"
          ("id", "announcementId", "schoolId", "userId", "role", "isRead", "readAt", "reaction", "createdAt", "updatedAt")
        VALUES ${values}
        ON CONFLICT ("announcementId", "userId") DO NOTHING
      `;

      // Notification rows are the single source of truth for push delivery.
      // The watcher sends them to background/closed devices and forwards them
      // to the active Petra tab, so we do not send a second direct push here.
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
    const rows = await prisma.$queryRaw`
      UPDATE "AnnouncementRecipient"
      SET "isRead" = true, "readAt" = NOW(), "updatedAt" = NOW()
      WHERE "announcementId" = ${announcementId}
        AND "userId" = ${user.id}
        AND "schoolId" = ${schoolId}
      RETURNING *
    `;
    if (!rows.length) {
      const err = new Error("Announcement not accessible");
      err.statusCode = 404;
      throw err;
    }
    return rows[0];
  },

  react: async (user, announcementId, reaction) => {
    const schoolId = normalizeSchoolId(user);
    const rows = await prisma.$queryRaw`
      UPDATE "AnnouncementRecipient"
      SET "reaction" = ${reaction || null}, "updatedAt" = NOW()
      WHERE "announcementId" = ${announcementId}
        AND "userId" = ${user.id}
        AND "schoolId" = ${schoolId}
      RETURNING *
    `;
    if (!rows.length) {
      const err = new Error("Announcement not accessible");
      err.statusCode = 404;
      throw err;
    }
    return rows[0];
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
    const roleCondition = buildRecipientRoleCondition(roleFilter);
    const [totalRows, readRows, reactionRows] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int AS "count" FROM "AnnouncementRecipient" ar WHERE ar."announcementId" = ${announcementId} AND ar."schoolId" = ${schoolId}${roleCondition}`,
      prisma.$queryRaw`SELECT COUNT(*)::int AS "count" FROM "AnnouncementRecipient" ar WHERE ar."announcementId" = ${announcementId} AND ar."schoolId" = ${schoolId} AND ar."isRead" = true${roleCondition}`,
      prisma.$queryRaw`
        SELECT "reaction", COUNT(*)::int AS "count"
        FROM "AnnouncementRecipient" ar
        WHERE ar."announcementId" = ${announcementId} AND ar."schoolId" = ${schoolId}${roleCondition}
        GROUP BY "reaction"
      `,
    ]);

    const reactionCounts = Object.fromEntries(reactionRows.map((row) => [row.reaction, Number(row.count)]));
    const totalRecipients = Number(totalRows[0]?.count || 0);
    const reads = Number(readRows[0]?.count || 0);
    const acknowledged = reactionCounts.ACKNOWLEDGED || 0;
    const understood = reactionCounts.UNDERSTOOD || 0;
    const willAttend = reactionCounts.WILL_ATTEND || 0;
    const cannotAttend = reactionCounts.CANNOT_ATTEND || 0;
    const needAssistance = reactionCounts.NEED_ASSISTANCE || 0;
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
