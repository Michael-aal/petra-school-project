import { prisma } from "../config/db.js";

const normalizeUserId = (value) => String(value || "").trim();
const normalizeStudentId = (value) => String(value || "").trim();

const childInclude = {
  user: {
    select: { id: true, fullName: true, email: true, profileImage: true },
  },
  profile: true,
  medicalInfo: true,
  documents: { orderBy: { createdAt: "desc" } },
  enrollments: {
    include: { class: true, section: true, academicYear: true, term: true },
    orderBy: { createdAt: "desc" },
    take: 1,
  },
};

const toSummary = (student) => {
  const enrollment = student.enrollments?.[0];
  return {
    id: student.id,
    name:
      student.name ||
      student.user?.fullName ||
      student.admissionNumber ||
      "Student",
    email: student.user?.email || "",
    photo: student.user?.profileImage || "",
    admissionNumber: student.admissionNumber || "",
    className: student.className || enrollment?.class?.name || "",
    sectionName: enrollment?.section?.name || "",
    level: enrollment?.class?.level || "",
    status: student.parentAccessCodeUsed ? "Linked" : "Active",
    profile: student.profile || null,
  };
};

const buildAuthorizedStudentWhere = (userId, studentId, schoolId) => ({
  id: studentId,
  ...(schoolId ? { schoolId } : {}),
  OR: [
    { parentId: userId },
    { parents: { some: { parent: { userId, ...(schoolId ? { schoolId } : {}) } } } },
    { guardians: { some: { guardian: { userId, ...(schoolId ? { schoolId } : {}) } } } },
  ],
});

export const parentAccessService = {
  listChildren: async (userId, schoolId = null) => {
    const normalizedUserId = normalizeUserId(userId);
    if (!normalizedUserId) return [];

    const [parent, guardian, linkedUser] = await Promise.all([
      prisma.parent.findFirst({
        where: { userId: normalizedUserId, ...(schoolId ? { schoolId } : {}) },
        include: {
          studentLinks: {
            include: {
              student: {
                include: childInclude,
              },
            },
          },
        },
      }),
      prisma.guardian.findFirst({
        where: { userId: normalizedUserId, ...(schoolId ? { schoolId } : {}) },
        include: {
          studentLinks: {
            include: {
              student: {
                include: childInclude,
              },
            },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: normalizedUserId },
        select: { linkedStudentId: true },
      }),
    ]);

    const children = [];
    const pushStudent = (student) => {
      if (!student || children.some((item) => item.id === student.id)) return;
      children.push(toSummary(student));
    };

    parent?.studentLinks?.forEach((link) => pushStudent(link.student));
    guardian?.studentLinks?.forEach((link) => pushStudent(link.student));

    if (linkedUser?.linkedStudentId) {
      const linkedStudent = await prisma.student.findUnique({
        where: { id: linkedUser.linkedStudentId, ...(schoolId ? { schoolId } : {}) },
        include: childInclude,
      });
      pushStudent(linkedStudent);
    }

    return children;
  },

  assertStudentAccess: async (userId, studentId, schoolId = null) => {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedStudentId = normalizeStudentId(studentId);
    const student = await prisma.student.findFirst({
      where: buildAuthorizedStudentWhere(normalizedUserId, normalizedStudentId, schoolId),
      include: childInclude,
    });

    if (!student) {
      const error = new Error(
        "You are not authorized to access this student's records",
      );
      error.statusCode = 403;
      throw error;
    }

    return toSummary(student);
  },

  getStudentHub: async (userId, studentId, schoolId = null) => {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedStudentId = normalizeStudentId(studentId);
    const student = await prisma.student.findFirst({
      where: buildAuthorizedStudentWhere(normalizedUserId, normalizedStudentId, schoolId),
      include: childInclude,
    });

    if (!student) {
      const error = new Error(
        "You are not authorized to access this student's records",
      );
      error.statusCode = 403;
      throw error;
    }

    const [
      fees,
      invoices,
      payments,
      attendance,
      results,
      reportCards,
      notifications,
      assignments,
      timetableEntries,
      messages,
      teachers,
    ] = await Promise.all([
      prisma.studentFee.findMany({
        where: { studentId: student.id, ...(schoolId ? { schoolId } : {}) },
        include: { feeStructure: { include: { feeCategory: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.findMany({
        where: { studentId: student.id, ...(schoolId ? { schoolId } : {}) },
        include: { items: true, payments: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        where: { studentId: student.id, ...(schoolId ? { schoolId } : {}) },
        include: { receipt: true, invoice: { include: { items: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.studentAttendance.findMany({
        where: { studentId: student.id, ...(schoolId ? { schoolId } : {}) },
        include: { class: true },
        orderBy: { attendanceDate: "desc" },
        take: 30,
      }),
      prisma.result.findMany({
        // Parents should only see results that a teacher has published.
        where: { studentId: student.id, ...(schoolId ? { schoolId } : {}), published: true },
        include: {
          teacher: {
            include: { user: { select: { id: true, fullName: true } } },
          },
          subjectRef: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.reportCard.findMany({
        // A report becomes parent-visible only after the school publishes its file.
        where: { studentId: student.id, ...(schoolId ? { schoolId } : {}), fileUrl: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.findMany({
        where: { userId: normalizedUserId, schoolId: student.schoolId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.assignment.findMany({
        where: { ...(schoolId ? { schoolId } : {}), OR: [{ studentId: student.id }, { studentId: null }] },
        include: {
          teacher: {
            include: { user: { select: { id: true, fullName: true } } },
          },
          subject: true,
        },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),
      prisma.timetableEntry.findMany({
        where: {
          ...(schoolId ? { schoolId } : {}),
          className:
            student.className || student.enrollments?.[0]?.class?.name || "",
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        take: 20,
      }),
      prisma.message.findMany({
        where: {
          ...(schoolId ? { schoolId } : {}),
          OR: [
            { senderId: normalizedUserId },
            { recipientId: normalizedUserId },
          ],
        },
        orderBy: { sentAt: "desc" },
        take: 20,
      }),
      prisma.teacher.findMany({
        where: { schoolId: student.schoolId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
            },
          },
        },
        take: 20,
      }),
    ]);

    const attendanceTotal = attendance.length;
    const presentCount = attendance.filter(
      (entry) => String(entry.status).toLowerCase() === "present",
    ).length;
    const attendancePercentage = attendanceTotal
      ? Math.round((presentCount / attendanceTotal) * 100)
      : 0;
    const performanceAverage = results.length
      ? Math.round(
          (results.reduce(
            (sum, item) =>
              sum +
              (Number(item.score || 0) /
                Math.max(1, Number(item.maxScore || 100))) *
                100,
            0,
          ) /
            results.length) *
            10,
        ) / 10
      : 0;
    const outstandingFees = fees.reduce(
      (sum, fee) => sum + Number(fee.outstandingBalance || 0),
      0,
    );

    return {
      student: toSummary(student),
      profile: student.profile,
      medicalInfo: student.medicalInfo,
      documents: student.documents || [],
      academic: {
        enrollments: student.enrollments || [],
        results,
        performanceAverage,
      },
      reportCards,
      announcements: notifications,
      attendance: {
        history: attendance,
        percentage: attendancePercentage,
      },
      assignments,
      timetableEntries,
      teachers,
      fees,
      invoices,
      payments,
      messages,
      summary: {
        outstandingFees,
        attendancePercentage,
        performanceAverage,
      },
    };
  },
};
