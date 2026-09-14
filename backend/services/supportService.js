import crypto from "node:crypto";
import { prisma } from "../config/db.js";
import notificationService from "./notificationService.js";

const roleOf = (user) => String(user?.role || "").trim().toLowerCase().replace(/\s+/g, "_");
const isPlatform = (user) => ["super_admin", "developer"].includes(roleOf(user));

const schoolIdFor = (user) => {
  if (isPlatform(user)) return user?.schoolId == null ? null : Number(user.schoolId);
  const id = Number(user?.schoolId);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("School context missing");
    error.statusCode = 403;
    throw error;
  }
  return id;
};

const selectSql = `t.id,t."schoolId",t."createdById",t.subject,t.description,t.category,t.priority,t.status,t."assignedToId",t."createdAt",t."updatedAt",t."resolvedAt",creator."fullName" AS "createdByName",creator.email AS "createdByEmail",creator.role AS "createdByRole",creator."schoolId" AS "createdBySchoolId",assignee."fullName" AS "assignedToName",assignee.email AS "assignedToEmail",assignee.role AS "assignedToRole"`;

const mapTicket = (r) => ({
  id: r.id,
  schoolId: r.schoolId,
  subject: r.subject,
  description: r.description,
  category: r.category,
  priority: r.priority,
  status: r.status,
  assignedToId: r.assignedToId,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  resolvedAt: r.resolvedAt,
  createdBy: r.createdById
    ? { id: r.createdById, fullName: r.createdByName, email: r.createdByEmail, role: r.createdByRole, schoolId: r.createdBySchoolId }
    : null,
  assignedTo: r.assignedToId
    ? { id: r.assignedToId, fullName: r.assignedToName, email: r.assignedToEmail, role: r.assignedToRole }
    : null,
});

const notFound = () => {
  const error = new Error("Support ticket not found");
  error.statusCode = 404;
  return error;
};

export const supportService = {
  listTickets: async (user, query = {}) => {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
    const values = [];
    const filters = [];
    const add = (value) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (isPlatform(user)) {
      const schoolId = Number(query.schoolId);
      if (Number.isInteger(schoolId) && schoolId > 0) filters.push(`t."schoolId"=${add(schoolId)}`);
    } else {
      const schoolId = schoolIdFor(user);
      filters.push(`t."schoolId"=${add(schoolId)}`);
      filters.push(`t."createdById"=${add(user.id)}`);
    }

    if (query.status) filters.push(`t.status=${add(String(query.status))}`);
    if (query.priority) filters.push(`t.priority=${add(String(query.priority))}`);
    if (query.category) filters.push(`t.category=${add(String(query.category))}`);

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const filterValues = [...values];
    const limitParam = add(limit);
    const offsetParam = add((page - 1) * limit);

    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe(
        `SELECT ${selectSql} FROM "SupportTicket" t LEFT JOIN "User" creator ON creator.id=t."createdById" LEFT JOIN "User" assignee ON assignee.id=t."assignedToId" ${where} ORDER BY t."updatedAt" DESC LIMIT ${limitParam} OFFSET ${offsetParam}`,
        ...values,
      ),
      prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS count FROM "SupportTicket" t ${where}`,
        ...filterValues,
      ),
    ]);

    const total = Number(countRows[0]?.count || 0);
    return { tickets: rows.map(mapTicket), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },

  createTicket: async (user, payload) => {
    const schoolId = schoolIdFor(user);
    const subject = String(payload.subject || "").trim();
    const description = String(payload.description || payload.message || "").trim();
    if (!subject || !description) {
      const error = new Error("Subject and description are required");
      error.statusCode = 400;
      throw error;
    }
    if (schoolId && !(await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true } }))) {
      const error = new Error("School not found");
      error.statusCode = 400;
      throw error;
    }

    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "SupportTicket" ("id","schoolId","createdById","subject","description","category","priority","status","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,'Open',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      id,
      schoolId,
      user.id,
      subject,
      description,
      String(payload.category || "General"),
      String(payload.priority || "Medium"),
    );

    // Support requests must actively reach the platform support team, not merely sit in the ticket list.
    if (schoolId) {
      try {
        await notificationService.notifySupportTeam({
          schoolId,
          ticketId: id,
          requesterName: user.fullName,
          requesterRole: roleOf(user),
          subject,
        });
      } catch (notificationError) {
        // The support ticket is already persisted; notification failure must not make the user's request disappear.
        console.error("Support notification failed:", notificationError);
      }
    }

    return supportService.getTicket(user, id);
  },

  getTicket: async (user, ticketId) => {
    const values = [ticketId];
    let access = `t.id=$1`;
    if (!isPlatform(user)) {
      const schoolId = schoolIdFor(user);
      values.push(schoolId);
      access += ` AND t."schoolId"=$${values.length}`;
      values.push(user.id);
      access += ` AND t."createdById"=$${values.length}`;
    }

    const rows = await prisma.$queryRawUnsafe(
      `SELECT ${selectSql} FROM "SupportTicket" t LEFT JOIN "User" creator ON creator.id=t."createdById" LEFT JOIN "User" assignee ON assignee.id=t."assignedToId" WHERE ${access}`,
      ...values,
    );
    if (!rows.length) throw notFound();

    const messages = await prisma.$queryRawUnsafe(
      `SELECT m.id,m."ticketId",m."authorId",m.body,m."isInternal",m."createdAt",u."fullName" AS "authorName",u.email AS "authorEmail",u.role AS "authorRole" FROM "SupportTicketMessage" m LEFT JOIN "User" u ON u.id=m."authorId" WHERE m."ticketId"=$1 ${isPlatform(user) ? "" : "AND m.\"isInternal\"=false"} ORDER BY m."createdAt" ASC`,
      ticketId,
    );
    return { ticket: mapTicket(rows[0]), messages };
  },

  addMessage: async (user, ticketId, payload) => {
    await supportService.getTicket(user, ticketId);
    const body = String(payload.body || payload.message || "").trim();
    if (!body) {
      const error = new Error("Message body is required");
      error.statusCode = 400;
      throw error;
    }
    const id = crypto.randomUUID();
    const internal = Boolean(payload.isInternal) && isPlatform(user);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "SupportTicketMessage" ("id","ticketId","authorId","body","isInternal","createdAt") VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)`,
      id,
      ticketId,
      user.id,
      body,
      internal,
    );
    await prisma.$executeRawUnsafe(`UPDATE "SupportTicket" SET "updatedAt"=CURRENT_TIMESTAMP WHERE id=$1`, ticketId);
    return supportService.getTicket(user, ticketId);
  },

  updateTicket: async (user, ticketId, payload) => {
    if (!isPlatform(user)) {
      const error = new Error("Only SuperAdmin or Developer can update support tickets");
      error.statusCode = 403;
      throw error;
    }
    const { ticket } = await supportService.getTicket(user, ticketId);
    const status = payload.status ? String(payload.status) : ticket.status;
    const priority = payload.priority ? String(payload.priority) : ticket.priority;
    const assignedToId = payload.assignedToId === undefined ? ticket.assignedToId : (payload.assignedToId || null);

    await prisma.$executeRawUnsafe(
      `UPDATE "SupportTicket" SET "status"=$1,"priority"=$2,"assignedToId"=$3,"resolvedAt"=CASE WHEN $1 IN ('Resolved','Closed') THEN COALESCE("resolvedAt",CURRENT_TIMESTAMP) ELSE NULL END,"updatedAt"=CURRENT_TIMESTAMP WHERE id=$4`,
      status,
      priority,
      assignedToId,
      ticketId,
    );
    return supportService.getTicket(user, ticketId);
  },
};

export default supportService;
