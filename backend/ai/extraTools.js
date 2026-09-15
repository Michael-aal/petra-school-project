import { prisma } from "../config/db.js";
import { assertSchoolAccess, getSchoolId } from "../utils/authorization.js";
import { normalizeRole } from "../utils/roleUtils.js";
import { parentAccessService } from "../services/parentAccessService.js";

const role = (user) => normalizeRole(user?.role);
const isSchoolAdmin = (user) => ["super_admin", "superadmin", "principal"].includes(role(user));
const canUseActivity = (user) => ["super_admin", "superadmin", "principal", "teacher"].includes(role(user));
const canNavigate = (user) => Boolean(user?.id);
const PORTALS = [
  "dashboard", "students", "teachers", "classes", "applicants", "attendance",
  "results", "exams", "payments", "fees", "announcements", "messages",
  "support", "notifications",
];

const activityTool = {
  name: "getRecentActivity",
  description: "Retrieve recent authorized Petra activity for the current school. Use for questions about what happened today, recent activity, or recent user actions.",
  parameters: {
    type: "object",
    properties: {
      limit: { type: "integer", description: "Number of records, maximum 50" },
      startDate: { type: "string", description: "Optional YYYY-MM-DD start date" },
      endDate: { type: "string", description: "Optional YYYY-MM-DD end date" },
    },
  },
};

const portalTool = {
  name: "getPortalOverview",
  description: "Get live information from an authorized Petra dashboard portal. Use when the user asks about a specific portal such as Students, Applicants, Attendance, Results, Payments, Fees, Announcements, Messages, Support, Notifications, Teachers, Classes, or Exams.",
  parameters: {
    type: "object",
    required: ["portal"],
    properties: {
      portal: { type: "string", enum: PORTALS },
    },
  },
};

const navigateTool = {
  name: "openPetraPage",
  description: "Navigate the authenticated user to an existing Petra page. This does not modify data.",
  parameters: {
    type: "object",
    required: ["page"],
    properties: {
      page: { type: "string", enum: PORTALS.concat(["settings"]) },
    },
  },
};

export const getExtraApprovedTools = (user) => {
  const tools = [portalTool];
  if (canUseActivity(user)) tools.push(activityTool);
  if (canNavigate(user)) tools.push(navigateTool);
  return tools;
};

const schoolPortalOverview = async (schoolId, portal) => {
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  switch (portal) {
    case "dashboard": {
      const [students, teachers, classes, admissions, attendance] = await Promise.all([
        prisma.student.count({ where: { schoolId } }),
        prisma.teacher.count({ where: { schoolId } }),
        prisma.class.count({ where: { schoolId } }),
        prisma.admission.count({ where: { schoolId } }),
        prisma.studentAttendance.findMany({ where: { schoolId, attendanceDate: { gte: since } }, select: { status: true }, take: 5000 }),
      ]);
      const present = attendance.filter((x) => String(x.status).toLowerCase() === "present").length;
      return { portal, students, teachers, classes, applicants: admissions, attendanceRate: attendance.length ? Number((present / attendance.length * 100).toFixed(1)) : 0 };
    }
    case "students":
      return { portal, total: await prisma.student.count({ where: { schoolId } }), active: await prisma.student.count({ where: { schoolId, status: "active" } }) };
    case "teachers":
      return { portal, total: await prisma.teacher.count({ where: { schoolId } }), active: await prisma.teacher.count({ where: { schoolId, isActive: true } }) };
    case "classes":
      return { portal, total: await prisma.class.count({ where: { schoolId } }), sections: await prisma.section.count({ where: { schoolId } }) };
    case "applicants": {
      const grouped = await prisma.admission.groupBy({ by: ["status"], where: { schoolId }, _count: { id: true } });
      return { portal, total: grouped.reduce((n, x) => n + x._count.id, 0), byStatus: Object.fromEntries(grouped.map((x) => [x.status, x._count.id])) };
    }
    case "attendance": {
      const rows = await prisma.studentAttendance.findMany({ where: { schoolId, attendanceDate: { gte: since } }, select: { status: true }, take: 5000 });
      const present = rows.filter((x) => String(x.status).toLowerCase() === "present").length;
      return { portal, periodDays: 30, records: rows.length, present, absent: rows.length - present, attendanceRate: rows.length ? Number((present / rows.length * 100).toFixed(1)) : 0 };
    }
    case "results": {
      const [published, exams] = await Promise.all([
        prisma.result.count({ where: { schoolId, published: true } }),
        prisma.examResult.count({ where: { exam: { schoolId } } }).catch(() => 0),
      ]);
      return { portal, publishedResults: published, examResults: exams };
    }
    case "exams":
      return { portal, total: await prisma.exam.count({ where: { schoolId } }), recent: await prisma.exam.count({ where: { schoolId, examDate: { gte: since } } }) };
    case "payments": {
      const [count, sum] = await Promise.all([
        prisma.payment.count({ where: { schoolId, status: "Successful" } }),
        prisma.payment.aggregate({ where: { schoolId, status: "Successful" }, _sum: { amount: true } }),
      ]);
      return { portal, successfulPayments: count, totalPaid: Number(sum._sum.amount || 0), currency: "NGN" };
    }
    case "fees": {
      const [feeStructures, invoices] = await Promise.all([
        prisma.feeStructure.count({ where: { schoolId } }),
        prisma.invoice.aggregate({ where: { schoolId }, _sum: { totalAmount: true, outstandingBalance: true }, _count: { id: true } }),
      ]);
      return { portal, configuredFeeItems: feeStructures, invoices: invoices._count.id, totalBilled: Number(invoices._sum.totalAmount || 0), outstandingBalance: Number(invoices._sum.outstandingBalance || 0), currency: "NGN" };
    }
    case "announcements": {
      const [total, recent] = await Promise.all([
        prisma.announcement.count({ where: { schoolId } }),
        prisma.announcement.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, status: true, createdAt: true } }),
      ]);
      return { portal, total, recent };
    }
    case "messages":
      return { portal, totalMessages: await prisma.message.count({ where: { schoolId } }) };
    default:
      throw Object.assign(new Error(`Portal "${portal}" is not supported yet`), { statusCode: 400 });
  }
};

const personalPortalOverview = async (user, schoolId, portal) => {
  const r = role(user);
  let studentIds = [];
  if (r === "student") {
    const student = await prisma.student.findFirst({ where: { OR: [{ userId: user.id }, { id: user.linkedStudentId || undefined }], schoolId }, select: { id: true } });
    if (student) studentIds = [student.id];
  } else if (r === "parent" || r === "guardian") {
    const children = await parentAccessService.listChildren(user.id, schoolId).catch(() => []);
    studentIds = children.map((x) => x.id);
  }

  if (["students", "results", "attendance", "payments", "fees", "exams"].includes(portal) && !studentIds.length) {
    return { portal, message: "No student is currently linked to this account." };
  }

  if (portal === "students") return { portal, linkedStudents: studentIds.length };
  if (portal === "attendance") return { portal, records: await prisma.studentAttendance.count({ where: { schoolId, studentId: { in: studentIds } } }) };
  if (portal === "results") return { portal, publishedResults: await prisma.result.count({ where: { schoolId, studentId: { in: studentIds }, published: true } }) };
  if (portal === "payments" || portal === "fees") {
    const payments = await prisma.payment.aggregate({ where: { schoolId, studentId: { in: studentIds }, status: "Successful" }, _sum: { amount: true }, _count: { id: true } });
    return { portal, successfulPayments: payments._count.id, totalPaid: Number(payments._sum.amount || 0), currency: "NGN" };
  }
  if (portal === "announcements") return { portal, total: await prisma.announcement.count({ where: { schoolId } }) };
  if (portal === "messages") return { portal, totalMessages: await prisma.message.count({ where: { schoolId, OR: [{ senderId: user.id }, { receiverId: user.id }] } }) };
  if (portal === "notifications") return { portal, unread: await prisma.notification.count({ where: { userId: user.id, read: false } }) };
  return { portal, message: "This portal is not available for school-wide data from your role." };
};

export const executeExtraAITool = async ({ user, toolName, input = {} }) => {
  if (toolName === "openPetraPage") {
    if (!canNavigate(user)) throw Object.assign(new Error("You are not authorized to navigate Petra"), { statusCode: 403 });
    const page = String(input.page || "").trim().toLowerCase();
    const routes = {
      dashboard: "/dashboard", students: "/students", teachers: "/teachers", classes: "/classes", applicants: "/applicants",
      attendance: "/attendance", results: "/results", exams: "/exams", payments: "/Payment", fees: "/extra-fees",
      announcements: "/announcements", messages: "/messages", support: "/support", notifications: "/notifications", settings: "/settings",
    };
    if (!routes[page]) throw Object.assign(new Error("That Petra page is not available to Nuvora"), { statusCode: 400 });
    return { type: "navigation", page, route: routes[page] };
  }

  if (toolName === "getPortalOverview") {
    const portal = String(input.portal || "").trim().toLowerCase();
    if (!PORTALS.includes(portal)) throw Object.assign(new Error("Invalid Petra portal"), { statusCode: 400 });
    const schoolId = assertSchoolAccess(user, input.schoolId ?? getSchoolId(user));
    if (portal === "support" || portal === "notifications") {
      if (portal === "notifications") return { portal, unread: await prisma.notification.count({ where: { userId: user.id, read: false } }) };
      return { portal, message: isSchoolAdmin(user) ? "Support is available through the Support portal; ticket details require the support service." : "Your support requests are available in the Support portal." };
    }
    if (isSchoolAdmin(user)) return schoolPortalOverview(schoolId, portal);
    if (["teacher"].includes(role(user))) {
      if (["dashboard", "attendance", "results", "classes", "exams", "announcements", "messages"].includes(portal)) return schoolPortalOverview(schoolId, portal);
      return { portal, message: "Your role does not have access to this portal's school-wide data." };
    }
    return personalPortalOverview(user, schoolId, portal);
  }

  if (toolName !== "getRecentActivity") throw Object.assign(new Error(`AI extra tool "${toolName}" is not registered`), { statusCode: 400 });
  if (!canUseActivity(user)) throw Object.assign(new Error("You are not authorized to view recent school activity"), { statusCode: 403 });

  const schoolId = assertSchoolAccess(user, input.schoolId ?? getSchoolId(user));
  const take = Math.max(1, Math.min(50, Number(input.limit) || 25));
  const createdAt = {};
  if (input.startDate) createdAt.gte = new Date(`${input.startDate}T00:00:00.000Z`);
  if (input.endDate) createdAt.lte = new Date(`${input.endDate}T23:59:59.999Z`);

  const logs = await prisma.activityLog.findMany({
    where: { schoolId, ...(Object.keys(createdAt).length ? { createdAt } : {}) },
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { id: true, fullName: true, role: true } } },
  });

  return { schoolId, count: logs.length, activity: logs.map((log) => ({ id: log.id, at: log.createdAt, user: log.user ? { id: log.user.id, name: log.user.fullName, role: log.user.role } : null, action: log.activity, metadata: log.metadata || null })) };
};
