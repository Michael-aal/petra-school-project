import { prisma } from "../config/db.js";
import { assertSchoolAccess, assertStudentAccess, getSchoolId } from "../utils/authorization.js";
import { financeService } from "./financeService.js";
import { normalizeRole } from "../utils/roleUtils.js";

const dateFilter = (startDate, endDate) => {
  const range = {};
  if (startDate) range.gte = new Date(`${startDate}T00:00:00.000Z`);
  if (endDate) range.lte = new Date(`${endDate}T23:59:59.999Z`);
  return Object.keys(range).length ? { attendanceDate: range } : {};
};

export const aiDataService = {
  getSchoolOverview: async ({ user, schoolId }) => {
    const resolvedSchoolId = assertSchoolAccess(user, schoolId ?? getSchoolId(user));
    const role = normalizeRole(user?.role);
    if (!studentId && ["teacher", "parent", "guardian", "student"].includes(role)) {
      throw Object.assign(new Error("A permitted student scope is required"), { statusCode: 403 });
    }
    const [students, teachers, staff, classes] = await Promise.all([
      prisma.student.count({ where: { schoolId: resolvedSchoolId } }),
      prisma.teacher.count({ where: { schoolId: resolvedSchoolId } }),
      prisma.staff.count({ where: { schoolId: resolvedSchoolId } }),
      prisma.class.count({ where: { schoolId: resolvedSchoolId } }),
    ]);
    return { schoolId: resolvedSchoolId, students, teachers, staff, classes };
  },

  getAttendanceSummary: async ({ user, schoolId, studentId, startDate, endDate }) => {
    const resolvedSchoolId = assertSchoolAccess(user, schoolId ?? getSchoolId(user));
    if (studentId) await assertStudentAccess(user, studentId, { schoolId: resolvedSchoolId });
    const rows = await prisma.studentAttendance.findMany({
      where: { schoolId: resolvedSchoolId, ...(studentId ? { studentId: String(studentId) } : {}), ...dateFilter(startDate, endDate) },
      select: { status: true },
    });
    const present = rows.filter((row) => String(row.status).toLowerCase() === "present").length;
    return { schoolId: resolvedSchoolId, studentId: studentId || null, total: rows.length, present, absent: rows.length - present, percentage: rows.length ? Math.round((present / rows.length) * 100) : 0 };
  },

  getStudentResults: async ({ user, schoolId, studentId }) => {
    const resolvedSchoolId = assertSchoolAccess(user, schoolId ?? getSchoolId(user));
    await assertStudentAccess(user, studentId, { schoolId: resolvedSchoolId });
    return prisma.result.findMany({ where: { schoolId: resolvedSchoolId, studentId: String(studentId), published: true }, select: { subject: true, score: true, maxScore: true, published: true }, orderBy: { createdAt: "desc" }, take: 50 });
  },

  getOutstandingFees: async ({ user, schoolId, studentId }) => {
    const resolvedSchoolId = assertSchoolAccess(user, schoolId ?? getSchoolId(user));
    const data = await financeService.getParentFees({ ...user, schoolId: resolvedSchoolId }, studentId ? { studentId } : {});
    return { studentId: data.student?.id || null, outstandingFees: data.summary?.outstandingFees || 0, fees: data.fees.map((fee) => ({ amount: fee.amount, outstandingBalance: fee.outstandingBalance, status: fee.status })) };
  },
};
