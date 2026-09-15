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
      const [students, teachers, classes, applicants, attendance] = await Promise.all([
        prisma.student.count({ where: { schoolId } }),
        prisma.teacher.count({ where: { schoolId } }),
        prisma.class.count({ where: { schoolId } }),
        prisma.admission.count({ where: { schoolId } }),
        prisma.studentAttendance.findMany({
          where: { schoolId, attendanceDate: { gte: since } },
          select: { status: true },
          take: 5000,
        }),
      ]);
      const present = attendance.filter((x) => String(x.status).toLowerCase() === "present").length;
      return {
        portal,
        students,
        teachers,
        classes,
        applicants,
        attendanceRate: attendance.length ? Number((present / attendance.length * 100).toFixed(1)) : 0,
      };
    }

    case "students": {
      const [total, active] = await Promise.all([
        prisma.student.count({ where: { schoolId } }),
        prisma.student.count({ where: { schoolId, status: "active" } }),
      ]);
      return { portal, total, active };
    }

    case "teachers": {
      const [total, active] = await Promise.all([
        prisma.teacher.count({ where: { schoolId } }),
        prisma.teacher.count({ where: { schoolId, isActive: true } }),
      ]);
      return { portal, total, active };
    }

    case "classes": {
      const [total, sections] = await Promise.all([
        prisma.class.count({ where: { schoolId } }),
        prisma.section.count({ where: { schoolId } }),
      ]);
      return { portal, total, sections };
    }

    case "applicants": {
      const grouped = await prisma.admission.groupBy({
        by: ["status"],
        where: { schoolId },
        _count: { id: true },
      });
      return {
        portal,
        total: grouped.reduce((n, x) => n + x._count.id, 0),
        byStatus: Object.fromEntries(grouped.map((x) => [x.status, x._count.id])),
      };
    }

    case "attendance": {
      const rows = await prisma.studentAttendance.findMany({
        where: { schoolId, attendanceDate: { gte: since } },
        select: { status: true },
        take: 5000,
      });
      const present = rows.filter((x) => String(x.status).toLowerCase() === "present").length;
      return {
        portal,
        periodDays: 30,
        records: rows.length,
        present,
        absent: rows.length - present,
        attendanceRate: rows.length ? Number((present / rows.length * 100).toFixed(1)) : 0,
      };
    }

    case "results": {
      const [publishedResults, examResults] = await Promise.all([
        prisma.result.count({ where: { schoolId, published: true } }),
        prisma.examResult.count({ where: { exam: { schoolId } } }),
      ]);
      return { portal, publishedResults, examResults };
    }

    case "exams": {
      const [total, recent] = await Promise.all([
        prisma.exam.count({ where: { schoolId } }),
        prisma.exam.count({ where: { schoolId, examDate: { gte: since } } }),
      ]);
      return { portal, total, recent };
    }

    case "payments": {
      const [count, sum] = await Promise.all([
        prisma.payment.count({ where: { schoolId, status: "Successful" } }),
        prisma.payment.aggregate({
          where: { schoolId, status: "Successful" },
          _sum: { amount: true },
        }),
      ]);
      return {
        portal,
        successfulPayments: count,
        totalPaid: Number(sum._sum.amount || 0),
        currency: "NGN",
      };
    }

    case "fees": {
      const [feeStructures, invoices] = await Promise.all([
        prisma.feeStructure.count({ where: { schoolId } }),
        prisma.invoice.aggregate({
          where: { schoolId },
          _sum: { totalAmount: true, outstandingBalance: true },
          _count: { id: true },
        }),
      ]);
      return {
        portal,
        configuredFeeItems: feeStructures,
        invoices: invoices._count.id || 0,
        totalBilled: Number(invoices._sum.totalAmount || 0),
        outstandingBalance: Number(invoices._sum.outstandingBalance || 0),
        currency: "NGN",
      };
    }

    case "announcements": {
      const [total, recent] = await Promise.all([
        prisma.announcement.count({ where: { schoolId } }),
        prisma.announcement.findMany({
          where: { schoolId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, title: true, status: true, createdAt: true },
        }),
      ]);
      return { portal, total, recent };
    }

    case "messages":
      return { portal, totalMessages: await prisma.message.count({ where: { schoolId } }) };

    case "support": {
      const rows = await prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "total",
          COUNT(*) FILTER (WHERE "status" = 'Open')::int AS "open",
          COUNT(*) FILTER (WHERE "status" = 'In Progress')::int AS "inProgress",
          COUNT(*) FILTER (WHERE "status" = 'Resolved')::int AS "resolved",
          COUNT(*) FILTER (WHERE "status" = 'Closed')::int AS "closed"
        FROM "SupportTicket"
        WHERE "schoolId" = ${schoolId}
      `;
      return { portal, ...(rows[0] || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 }) };
    }

    case "notifications": {
      const [total, unread] = await Promise.all([
        prisma.notification.count({ where: { schoolId } }),
        prisma.notification.count({ where: { schoolId, read: false } }),
      ]);
      return { portal, total, unread };
    }

    default:
      throw Object.assign(new Error(`Portal "${portal}" is not supported`), { statusCode: 400 });
  }
};

const personalPortalOverview = async (user, schoolId, portal) => {
  const r = role(user);
  let studentIds = [];

  if (r === "student") {
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ userId: user.id }, { id: user.linkedStudentId || undefined }],
        schoolId,
      },
      select: { id: true },
    });
    if (student) studentIds = [student.id];
  } else if (r === "parent" || r === "guardian") {
    const children = await parentAccessService.listChildren(user.id, schoolId).catch(() => []);
    studentIds = children.map((x) => x.id);
  }

  if (["students", "results", "attendance", "payments", "fees", "exams"].includes(portal) && !studentIds.length) {
    return { portal, message: "No student is currently linked to this account." };
  }

  if (portal === "students") {
    return { portal, linkedStudents: studentIds.length, studentIds };
  }

  if (portal === "attendance") {
    const rows = await prisma.studentAttendance.findMany({
      where: { schoolId, studentId: { in: studentIds } },
      select: { attendanceDate: true, status: true },
      orderBy: { attendanceDate: "desc" },
      take: 50,
    });
    const present = rows.filter((x) => String(x.status).toLowerCase() === "present").length;
    return {
      portal,
      records: rows.length,
      present,
      absent: rows.length - present,
      attendanceRate: rows.length ? Number((present / rows.length * 100).toFixed(1)) : 0,
      latestDate: rows[0]?.attendanceDate || null,
    };
  }

  if (portal === "results") {
    const [results, exams] = await Promise.all([
      prisma.result.findMany({
        where: { schoolId, studentId: { in: studentIds }, published: true },
        select: { subject: true, score: true, maxScore: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.examResult.findMany({
        where: { studentId: { in: studentIds }, exam: { schoolId } },
        select: {
          marks: true,
          percentage: true,
          grade: true,
          createdAt: true,
          exam: { select: { title: true, totalMarks: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ]);
    return {
      portal,
      publishedResults: results.length,
      examResults: exams.length,
      latestResults: results.map((x) => ({
        subject: x.subject,
        score: Number(x.score),
        maxScore: Number(x.maxScore),
        percentage: x.maxScore ? Number((Number(x.score) / Number(x.maxScore) * 100).toFixed(1)) : 0,
        createdAt: x.createdAt,
      })),
      latestExams: exams.map((x) => ({
        title: x.exam?.title || "Exam",
        marks: Number(x.marks),
        percentage: x.percentage == null && x.exam?.totalMarks ? Number((Number(x.marks) / Number(x.exam.totalMarks) * 100).toFixed(1)) : Number(x.percentage || 0),
        grade: x.grade || null,
        createdAt: x.createdAt,
      })),
    };
  }

  if (portal === "exams") {
    const exams = await prisma.examResult.findMany({
      where: { studentId: { in: studentIds }, exam: { schoolId } },
      select: {
        marks: true,
        percentage: true,
        grade: true,
        completedAt: true,
        exam: { select: { title: true, examDate: true, totalMarks: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 25,
    });
    return {
      portal,
      completedExams: exams.length,
      exams: exams.map((x) => ({
        title: x.exam?.title || "Exam",
        marks: Number(x.marks),
        totalMarks: Number(x.exam?.totalMarks || 100),
        percentage: x.percentage == null && x.exam?.totalMarks ? Number((Number(x.marks) / Number(x.exam.totalMarks) * 100).toFixed(1)) : Number(x.percentage || 0),
        grade: x.grade || null,
        examDate: x.exam?.examDate || null,
        completedAt: x.completedAt || null,
      })),
    };
  }

  if (portal === "payments" || portal === "fees") {
    const [payments, invoices] = await Promise.all([
      prisma.payment.aggregate({
        where: { schoolId, studentId: { in: studentIds }, status: "Successful" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: { schoolId, studentId: { in: studentIds } },
        _sum: { totalAmount: true, outstandingBalance: true },
        _count: { id: true },
      }),
    ]);
    return {
      portal,
      successfulPayments: payments._count.id || 0,
      totalPaid: Number(payments._sum.amount || 0),
      invoices: invoices._count.id || 0,
      totalBilled: Number(invoices._sum.totalAmount || 0),
      outstandingBalance: Number(invoices._sum.outstandingBalance || 0),
      currency: "NGN",
    };
  }

  if (portal === "announcements") {
    const [total, recent] = await Promise.all([
      prisma.announcement.count({ where: { schoolId } }),
      prisma.announcement.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { title: true, status: true, createdAt: true },
      }),
    ]);
    return { portal, total, recent };
  }

  if (portal === "messages") {
    return {
      portal,
      totalMessages: await prisma.message.count({
        where: { schoolId, OR: [{ senderId: user.id }, { receiverId: user.id }] },
      }),
    };
  }

  if (portal === "notifications") {
    const [total, unread] = await Promise.all([
      prisma.notification.count({ where: { userId: user.id } }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);
    return { portal, total, unread };
  }

  if (portal === "support") {
    const rows = await prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS "total",
        COUNT(*) FILTER (WHERE "status" = 'Open')::int AS "open",
        COUNT(*) FILTER (WHERE "status" = 'In Progress')::int AS "inProgress",
        COUNT(*) FILTER (WHERE "status" = 'Resolved')::int AS "resolved",
        COUNT(*) FILTER (WHERE "status" = 'Closed')::int AS "closed"
      FROM "SupportTicket"
      WHERE "schoolId" = ${schoolId} AND "createdById" = ${user.id}
    `;
    return { portal, ...(rows[0] || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 }) };
  }

  return { portal, message: "This portal does not expose school-wide data for your role." };
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

    if (isSchoolAdmin(user)) return schoolPortalOverview(schoolId, portal);
    if (role(user) === "teacher") {
      if (["dashboard", "attendance", "results", "classes", "exams", "announcements", "messages", "notifications"].includes(portal)) {
        return schoolPortalOverview(schoolId, portal);
      }
      return { portal, message: "Your role does not have access to this portal's school-wide data." };
    }
    return personalPortalOverview(user, schoolId, portal);
  }

  if (toolName !== "getRecentActivity") {
    throw Object.assign(new Error(`AI extra tool "${toolName}" is not registered`), { statusCode: 400 });
  }
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

  return {
    schoolId,
    count: logs.length,
    activity: logs.map((log) => ({
      id: log.id,
      at: log.createdAt,
      user: log.user ? { id: log.user.id, name: log.user.fullName, role: log.user.role } : null,
      action: log.activity,
      metadata: log.metadata || null,
    })),
  };
};
