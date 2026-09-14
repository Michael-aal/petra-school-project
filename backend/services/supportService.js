import crypto from "node:crypto";
import { prisma } from "../config/db.js";

const roleOf = (user) => String(user?.role || "").trim().toLowerCase().replace(/\s+/g, "_");
const isPlatform = (user) => ["super_admin", "developer"].includes(roleOf(user));
const isSchoolAdmin = (user) => ["admin", "principal"].includes(roleOf(user));

const schoolIdFor = (user) => {
  if (isPlatform(user)) return user?.schoolId == null ? null : Number(user.schoolId);
  const id = Number(user?.schoolId);
  if (!Number.isInteger(id) || id <= 0) { const error = new Error("School context missing"); error.statusCode = 403; throw error; }
  return id;
};

const selectSql = `t.id,t."schoolId",t."createdById",t.subject,t.description,t.category,t.priority,t.status,t."assignedToId",t."createdAt",t."updatedAt",t."resolvedAt",creator."fullName" AS "createdByName",creator.email AS "createdByEmail",creator.role AS "createdByRole",creator."schoolId" AS "createdBySchoolId",assignee."fullName" AS "assignedToName",assignee.email AS "assignedToEmail",assignee.role AS "assignedToRole"`;
const mapTicket = (r) => ({ id:r.id, schoolId:r.schoolId, subject:r.subject, description:r.description, category:r.category, priority:r.priority, status:r.status, assignedToId:r.assignedToId, createdAt:r.createdAt, updatedAt:r.updatedAt, resolvedAt:r.resolvedAt, createdBy:r.createdById?{id:r.createdById,fullName:r.createdByName,email:r.createdByEmail,role:r.createdByRole,schoolId:r.createdBySchoolId}:null, assignedTo:r.assignedToId?{id:r.assignedToId,fullName:r.assignedToName,email:r.assignedToEmail,role:r.assignedToRole}:null });
const notFound = () => { const e = new Error("Support ticket not found"); e.statusCode=404; return e; };

export const supportService = {
  listTickets: async (user, query = {}) => {
    const page=Math.max(1,Number.parseInt(query.page,10)||1), limit=Math.min(50,Math.max(1,Number.parseInt(query.limit,10)||20));
    const values=[],filters=[]; const add=(v)=>{values.push(v);return `$${values.length}`;};
    if(isPlatform(user)){const schoolId=Number(query.schoolId);if(Number.isInteger(schoolId)&&schoolId>0)filters.push(`t."schoolId"=${add(schoolId)}`);}
    else {const schoolId=schoolIdFor(user);filters.push(`t."schoolId"=${add(schoolId)}`);if(!isSchoolAdmin(user))filters.push(`t."createdById"=${add(user.id)}`);}
    if(query.status)filters.push(`t.status=${add(String(query.status))}`);
    const where=filters.length?`WHERE ${filters.join(" AND ")}`:""; const filterValues=[...values]; const limitParam=add(limit),offsetParam=add((page-1)*limit);
    const [rows,countRows]=await Promise.all([prisma.$queryRawUnsafe(`SELECT ${selectSql} FROM "SupportTicket" t LEFT JOIN "User" creator ON creator.id=t."createdById" LEFT JOIN "User" assignee ON assignee.id=t."assignedToId" ${where} ORDER BY t."updatedAt" DESC LIMIT ${limitParam} OFFSET ${offsetParam}`,...values),prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "SupportTicket" t ${where}`,...filterValues)]);
    const total=Number(countRows[0]?.count||0); return {tickets:rows.map(mapTicket),pagination:{page,limit,total,totalPages:Math.max(1,Math.ceil(total/limit))}};
  },

  createTicket: async (user,payload) => {
    const schoolId=schoolIdFor(user), subject=String(payload.subject||"").trim(), description=String(payload.description||payload.message||"").trim();
    if(!subject||!description){const e=new Error("Subject and description are required");e.statusCode=400;throw e;}
    if(schoolId&&!(await prisma.school.findUnique({where:{id:schoolId},select:{id:true}}))){const e=new Error("School not found");e.statusCode=400;throw e;}
    const id=crypto.randomUUID(); await prisma.$executeRawUnsafe(`INSERT INTO "SupportTicket" ("id","schoolId","createdById","subject","description","category","priority","status","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,'Open',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,id,schoolId,user.id,subject,description,String(payload.category||"General"),String(payload.priority||"Medium"));
    return supportService.getTicket(user,id);
  },

  getTicket: async (user,ticketId) => {
    const values=[ticketId];let access=`t.id=$1`;
    if(!isPlatform(user)){const schoolId=schoolIdFor(user);values.push(schoolId);access+=` AND t."schoolId"=$${values.length}`;if(!isSchoolAdmin(user)){values.push(user.id);access+=` AND t."createdById"=$${values.length}`;}}
    const rows=await prisma.$queryRawUnsafe(`SELECT ${selectSql} FROM "SupportTicket" t LEFT JOIN "User" creator ON creator.id=t."createdById" LEFT JOIN "User" assignee ON assignee.id=t."assignedToId" WHERE ${access}`,...values);if(!rows.length)throw notFound();
    const messages=await prisma.$queryRawUnsafe(`SELECT m.id,m."ticketId",m."authorId",m.body,m."isInternal",m."createdAt",u."fullName" AS "authorName",u.email AS "authorEmail",u.role AS "authorRole" FROM "SupportTicketMessage" m LEFT JOIN "User" u ON u.id=m."authorId" WHERE m."ticketId"=$1 ${isPlatform(user)?"":"AND m.\"isInternal\"=false"} ORDER BY m."createdAt" ASC`,ticketId);
    return {ticket:mapTicket(rows[0]),messages};
  },

  addMessage: async (user,ticketId,payload) => {
    await supportService.getTicket(user,ticketId);const body=String(payload.body||payload.message||"").trim();if(!body){const e=new Error("Message body is required");e.statusCode=400;throw e;}
    const id=crypto.randomUUID(),internal=Boolean(payload.isInternal)&&isPlatform(user);await prisma.$executeRawUnsafe(`INSERT INTO "SupportTicketMessage" ("id","ticketId","authorId","body","isInternal","createdAt") VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)`,id,ticketId,user.id,body,internal);await prisma.$executeRawUnsafe(`UPDATE "SupportTicket" SET "updatedAt"=CURRENT_TIMESTAMP WHERE id=$1`,ticketId);return supportService.getTicket(user,ticketId);
  },

  updateTicket: async (user,ticketId,payload) => {
    if(!isPlatform(user)&&!isSchoolAdmin(user)){const e=new Error("Only support administrators can update tickets");e.statusCode=403;throw e;}
    const {ticket}=await supportService.getTicket(user,ticketId),status=payload.status?String(payload.status):ticket.status,priority=payload.priority?String(payload.priority):ticket.priority,assignedToId=payload.assignedToId===undefined?ticket.assignedToId:(payload.assignedToId||null);
    await prisma.$executeRawUnsafe(`UPDATE "SupportTicket" SET "status"=$1,"priority"=$2,"assignedToId"=$3,"resolvedAt"=CASE WHEN $1 IN ('Resolved','Closed') THEN COALESCE("resolvedAt",CURRENT_TIMESTAMP) ELSE NULL END,"updatedAt"=CURRENT_TIMESTAMP WHERE id=$4`,status,priority,assignedToId,ticketId);return supportService.getTicket(user,ticketId);
  },
};

export default supportService;
