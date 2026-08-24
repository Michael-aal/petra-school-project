import { prisma } from "../config/db.js";
import {
  assertSchoolAccess,
  assertStudentAccess,
  canAccessFinancialData,
  getSchoolId,
} from "../utils/authorization.js";
import { normalizeRole } from "../utils/roleUtils.js";
import { parentAccessService } from "./parentAccessService.js";

const dateFilter = (startDate, endDate) => {
  const range = {};
  if (startDate) range.gte = new Date(`${startDate}T00:00:00.000Z`);
  if (endDate) range.lte = new Date(`${endDate}T23:59:59.999Z`);
  return Object.keys(range).length ? { attendanceDate: range } : {};
};

/**
 * Resolve target studentId safely based on role and linked relationships
 */
const resolveTargetStudent = async (user, studentId, schoolId) => {
  const role = normalizeRole(user.role);

  if (studentId) {
    const student = await assertStudentAccess(user, studentId, { schoolId });
    return student;
  }

  if (role === "student") {
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ userId: user.id }, { id: user.linkedStudentId || undefined }],
        schoolId,
      },
      select: { id: true, name: true, className: true, admissionNumber: true, schoolId: true },
    });
    if (!student) {
      throw Object.assign(new Error("No student record found for your account"), { statusCode: 404 });
    }
    return student;
  }

  if (role === "parent" || role === "guardian") {
    const children = await parentAccessService.listChildren(user.id, schoolId);
    if (!children.length) {
      throw Object.assign(
        new Error("No student is currently linked to your account. Please contact the school administrator."),
        { statusCode: 404 },
      );
    }
    // Return first child or specific child
    return children[0];
  }

  throw Object.assign(new Error("A studentId parameter is required for this query"), { statusCode: 400 });
};

export const aiDataService = {
  /**
   * TOOL 1: getSchoolOverview
   * High-level overview of the authenticated user's school.
   * Allowed: super_admin, principal
   */
  getSchoolOverview: async ({ user, schoolId }) => {
    const resolvedSchoolId = assertSchoolAccess(user, schoolId ?? getSchoolId(user));
    const role = normalizeRole(user?.role);

    if (!["super_admin", "principal"].includes(role)) {
      throw Object.assign(new Error("You are not authorized to view the school-wide overview"), {
        statusCode: 403,
      });
    }

    const [students, teachers, staff, classes, activeSession, attendanceRecords] = await Promise.all([
      prisma.student.count({ where: { schoolId: resolvedSchoolId } }),
      prisma.teacher.count({ where: { schoolId: resolvedSchoolId } }),
      prisma.staff.count({ where: { schoolId: resolvedSchoolId } }),
      prisma.academicClass
        .count({ where: { schoolId: resolvedSchoolId } })
        .catch(() => prisma.class.count({ where: { schoolId: resolvedSchoolId } }).catch(() => 0)),
      prisma.academicSession
        .findFirst({ where: { schoolId: resolvedSchoolId, isActive: true } })
        .catch(() => null),
      prisma.studentAttendance.findMany({
        where: { schoolId: resolvedSchoolId },
        select: { status: true },
        take: 500,
        orderBy: { attendanceDate: "desc" },
      }),
    ]);

    const presentCount = attendanceRecords.filter(
      (r) => String(r.status).toLowerCase() === "present",
    ).length;
    const attendanceRate = attendanceRecords.length
      ? Number(((presentCount / attendanceRecords.length) * 100).toFixed(1))
      : 100.0;

    return {
      schoolId: resolvedSchoolId,
      totalStudents: students,
      totalTeachers: teachers,
      totalStaff: staff,
      totalClasses: classes,
      attendanceRate,
      currentAcademicSession: activeSession?.name || "Current Academic Year",
      currentTerm: activeSession?.term || "First Term",
    };
  },

  /**
   * TOOL 2: getAttendanceSummary
   * Role-scoped attendance metrics.
   */
  getAttendanceSummary: async ({ user, schoolId, studentId, className, startDate, endDate, term }) => {
    const resolvedSchoolId = assertSchoolAccess(user, schoolId ?? getSchoolId(user));
    const role = normalizeRole(user?.role);

    let whereClause = {
      schoolId: resolvedSchoolId,
      ...dateFilter(startDate, endDate),
    };

    if (studentId) {
      await assertStudentAccess(user, studentId, { schoolId: resolvedSchoolId });
      whereClause.studentId = String(studentId);
    } else if (role === "student") {
      const student = await resolveTargetStudent(user, null, resolvedSchoolId);
      whereClause.studentId = student.id;
    } else if (role === "parent" || role === "guardian") {
      const children = await parentAccessService.listChildren(user.id, resolvedSchoolId);
      if (!children.length) {
        return {
          schoolId: resolvedSchoolId,
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0,
          message: "No student is currently linked to your account. Please contact the school administrator.",
        };
      }
      const childIds = children.map((c) => c.id);
      whereClause.studentId = { in: childIds };
    } else if (role === "teacher") {
      // Teachers can only view attendance for their assigned classes
      const teacherProfile = await prisma.teacher.findFirst({
        where: { userId: user.id, schoolId: resolvedSchoolId },
        include: { classes: { include: { class: { select: { name: true } } } } },
      });
      const assignedClasses = teacherProfile?.classes?.map((c) => c.class?.name).filter(Boolean) || [];
      if (!assignedClasses.length && user.staffClassAssigned) {
        assignedClasses.push(...user.staffClassAssigned.split(",").map((s) => s.trim()).filter(Boolean));
      }

      if (className) {
        if (assignedClasses.length > 0 && !assignedClasses.includes(className)) {
          throw Object.assign(new Error(`You are not authorized to access attendance for class "${className}"`), {
            statusCode: 403,
          });
        }
        whereClause.student = { className };
      } else if (assignedClasses.length > 0) {
        whereClause.student = { className: { in: assignedClasses } };
      }
    } else if (className) {
      whereClause.student = { className };
    }

    const rows = await prisma.studentAttendance.findMany({
      where: whereClause,
      select: { status: true, attendanceDate: true },
      take: 1000,
    });

    const total = rows.length;
    const present = rows.filter((row) => String(row.status).toLowerCase() === "present").length;
    const absent = total - present;
    const percentage = total ? Number(((present / total) * 100).toFixed(1)) : 0;

    return {
      schoolId: resolvedSchoolId,
      studentId: whereClause.studentId || null,
      className: className || null,
      total,
      present,
      absent,
      percentage,
    };
  },

  /**
   * TOOL 3: getStudentAttendance
   * Detailed attendance records for a specific authorized student.
   */
  getStudentAttendance: async ({ user, schoolId, studentId, startDate, endDate }) => {
    const resolvedSchoolId = assertSchoolAccess(user, schoolId ?? getSchoolId(user));
    const targetStudent = await resolveTargetStudent(user, studentId, resolvedSchoolId);

    const rows = await prisma.studentAttendance.findMany({
      where: {
        schoolId: resolvedSchoolId,
        studentId: String(targetStudent.id),
        ...dateFilter(startDate, endDate),
      },
      select: {
        attendanceDate: true,
        status: true,
        remark: true,
      },
      orderBy: { attendanceDate: "desc" },
      take: 50,
    });

    const total = rows.length;
    const present = rows.filter((row) => String(row.status).toLowerCase() === "present").length;
    const absent = total - present;
    const percentage = total ? Number(((present / total) * 100).toFixed(1)) : 0;

    return {
      schoolId: resolvedSchoolId,
      studentId: targetStudent.id,
      studentName: targetStudent.name || targetStudent.fullName || "Student",
      className: targetStudent.className || "",
      total,
      present,
      absent,
      percentage,
      records: rows.map((r) => ({
        date: r.attendanceDate ? r.attendanceDate.toISOString().slice(0, 10) : null,
        status: r.status,
        remark: r.remark || null,
      })),
    };
  },

  /**
   * TOOL 4: getStudentResults
   * Authoritative scores and averages for an authorized student.
   */
  getStudentResults: async ({ user, schoolId, studentId, termId, academicYearId }) => {
    const resolvedSchoolId = assertSchoolAccess(user, schoolId ?? getSchoolId(user));
    const targetStudent = await resolveTargetStudent(user, studentId, resolvedSchoolId);

    const [results, examResults] = await Promise.all([
      prisma.result.findMany({
        where: {
          schoolId: resolvedSchoolId,
          studentId: String(targetStudent.id),
          published: true,
          ...(termId ? { term: termId } : {}),
        },
        select: {
          subject: true,
          score: true,
          maxScore: true,
          grade: true,
          published: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.examResult.findMany({
        where: {
          schoolId: resolvedSchoolId,
          studentId: String(targetStudent.id),
        },
        include: {
          exam: { select: { title: true, subjectId: true, totalMarks: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }).catch(() => []),
    ]);

    const formattedResults = [];

    for (const r of results) {
      formattedResults.push({
        subject: r.subject || "Subject",
        score: Number(r.score) || 0,
        maxScore: Number(r.maxScore) || 100,
        percentage: Number((((Number(r.score) || 0) / (Number(r.maxScore) || 100)) * 100).toFixed(1)),
        grade: r.grade || null,
      });
    }

    for (const er of examResults) {
      if (!formattedResults.some((fr) => fr.subject === er.exam?.title)) {
        const totalMarks = er.exam?.totalMarks || 100;
        formattedResults.push({
          subject: er.exam?.title || "Exam",
          score: Number(er.score) || 0,
          maxScore: totalMarks,
          percentage: Number((((Number(er.score) || 0) / totalMarks) * 100).toFixed(1)),
          grade: er.grade || null,
        });
      }
    }

    const totalSubjects = formattedResults.length;
    const averageScore = totalSubjects
      ? Number((formattedResults.reduce((acc, curr) => acc + curr.percentage, 0) / totalSubjects).toFixed(1))
      : 0;

    return {
      schoolId: resolvedSchoolId,
      studentId: targetStudent.id,
      studentName: targetStudent.name || targetStudent.fullName || "Student",
      className: targetStudent.className || "",
      totalSubjects,
      averageScore,
      results: formattedResults,
    };
  },

  /**
   * TOOL 5: getFeeSummary
   * Authoritative financial calculations.
   * Super Admin & Principal: School-wide or Student
   * Parent & Student: Authorized child / self
   * Teacher: Strictly Denied
   */
  getFeeSummary: async ({ user, schoolId, studentId }) => {
    const resolvedSchoolId = assertSchoolAccess(user, schoolId ?? getSchoolId(user));
    const role = normalizeRole(user?.role);

    if (!canAccessFinancialData(user)) {
      throw Object.assign(new Error("You are not authorized to access financial information"), {
        statusCode: 403,
      });
    }

    // Principal / Super Admin asking for school-wide fee metrics
    if ((role === "principal" || role === "super_admin") && !studentId) {
      const [successfulPayments, invoices] = await Promise.all([
        prisma.payment.aggregate({
          where: { schoolId: resolvedSchoolId, status: "Successful" },
          _sum: { amount: true },
          _count: { id: true },
        }),
        prisma.invoice.aggregate({
          where: { schoolId: resolvedSchoolId },
          _sum: { totalAmount: true, outstandingBalance: true },
          _count: { id: true },
        }),
      ]);

      const totalBilled = invoices._sum.totalAmount || 0;
      const totalPaid = successfulPayments._sum.amount || 0;
      const outstandingBalance = invoices._sum.outstandingBalance || Math.max(0, totalBilled - totalPaid);

      return {
        schoolId: resolvedSchoolId,
        scope: "school_wide",
        totalBilled,
        totalPaid,
        outstandingBalance,
        totalInvoices: invoices._count.id || 0,
        totalSuccessfulPayments: successfulPayments._count.id || 0,
        currency: "NGN",
      };
    }

    // Specific student fee summary (Parent, Student, or Principal checking a student)
    const targetStudent = await resolveTargetStudent(user, studentId, resolvedSchoolId);

    const [invoices, studentFees, payments] = await Promise.all([
      prisma.invoice.findMany({
        where: { schoolId: resolvedSchoolId, studentId: String(targetStudent.id) },
        select: { invoiceNumber: true, totalAmount: true, outstandingBalance: true, status: true },
      }),
      prisma.studentFee.findMany({
        where: { schoolId: resolvedSchoolId, studentId: String(targetStudent.id) },
        select: { amount: true, outstandingBalance: true, status: true },
      }),
      prisma.payment.findMany({
        where: { schoolId: resolvedSchoolId, studentId: String(targetStudent.id), status: "Successful" },
        select: { amount: true, paidAt: true, reference: true },
      }),
    ]);

    let totalBilled = 0;
    let totalOutstanding = 0;

    if (invoices.length > 0) {
      totalBilled = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
      totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.outstandingBalance || 0), 0);
    } else if (studentFees.length > 0) {
      totalBilled = studentFees.reduce((acc, f) => acc + (f.amount || 0), 0);
      totalOutstanding = studentFees.reduce((acc, f) => acc + (f.outstandingBalance || 0), 0);
    }

    const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    if (totalOutstanding === 0 && totalBilled > totalPaid) {
      totalOutstanding = totalBilled - totalPaid;
    }

    const status = totalOutstanding <= 0 && totalBilled > 0 ? "Paid" : totalPaid > 0 ? "Partially Paid" : "Unpaid";

    return {
      schoolId: resolvedSchoolId,
      studentId: targetStudent.id,
      studentName: targetStudent.name || targetStudent.fullName || "Student",
      className: targetStudent.className || "",
      totalBilled,
      totalPaid,
      outstandingBalance: totalOutstanding,
      status,
      currency: "NGN",
      invoicesCount: invoices.length,
      feesCount: studentFees.length,
      paymentsCount: payments.length,
    };
  },
};
