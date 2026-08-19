import { prisma } from "../config/db.js";

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getSchoolId = (user) => {
  if (!user || user.schoolId === undefined || user.schoolId === null) {
    const err = new Error("School context missing");
    err.statusCode = 403;
    throw err;
  }

  const schoolId = Number(user.schoolId);

  if (!Number.isInteger(schoolId) || schoolId <= 0) {
    const err = new Error("Invalid school context");
    err.statusCode = 403;
    throw err;
  }

  return schoolId;
};

const getPagination = (query = {}) => {
  const page = Math.max(1, toNumber(query.page, 1));
  const limit = Math.max(1, Math.min(50, toNumber(query.limit, 10)));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const safeUser = (user) => ({
  id: user.id,
  firstName: user.firstName || "",
  middleName: user.middleName || "",
  lastName: user.lastName || "",
  username: user.username || "",
  fullName: user.fullName || "",
  email: user.email || "",
  phone: user.phone || "",
  role: user.role || "",
  accountStatus: user.accountStatus || "active",
  staffDepartment: user.staffDepartment || "",
  staffRole: user.staffRole || "",
  staffClassAssigned: user.staffClassAssigned || "",
  staffSubjectsAssigned: Array.isArray(user.staffSubjectsAssigned)
    ? user.staffSubjectsAssigned
    : [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getStudentName = (student) => {
  if (!student) return "Unknown Student";

  return (
    student.name ||
    student.fullName ||
    [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    student.admissionNumber ||
    "Unknown Student"
  );
};

const calculatePercentage = (marks, totalMarks) => {
  const numericMarks = Number(marks);
  const numericTotal = Number(totalMarks);

  if (
    !Number.isFinite(numericMarks) ||
    !Number.isFinite(numericTotal) ||
    numericTotal <= 0
  ) {
    return 0;
  }

  return Number(((numericMarks / numericTotal) * 100).toFixed(2));
};

const toFiniteNumber = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const getRecordTime = (record) => {
  const value =
    record?.completedAt ||
    record?.updatedAt ||
    record?.createdAt ||
    record?.startedAt ||
    null;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const isNewerRecord = (candidate, current) => {
  if (!current) return true;

  const candidateTime = getRecordTime(candidate);
  const currentTime = getRecordTime(current);

  if (candidateTime !== currentTime) {
    return candidateTime > currentTime;
  }

  const candidateAttemptNumber = Number(
    candidate?.attemptNumber ?? candidate?.attempt?.attemptNumber ?? 0
  );
  const currentAttemptNumber = Number(
    current?.attemptNumber ?? current?.attempt?.attemptNumber ?? 0
  );

  return candidateAttemptNumber > currentAttemptNumber;
};

const getExamStudentKey = (examId, studentId) =>
  examId && studentId ? `${examId}:${studentId}` : null;

const isPassingGrade = (grade) =>
  ["pass", "passed"].includes(String(grade || "").trim().toLowerCase());

export const adminService = {
  getDashboard: async (user) => {
    const schoolId = getSchoolId(user);

    const [
      users,
      students,
      teachers,
      staff,
      roles,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({
        where: { schoolId },
      }),

      prisma.student.count({
        where: { schoolId },
      }),

      prisma.teacher.count({
        where: { schoolId },
      }),

      prisma.staff.count({
        where: { schoolId },
      }),

      prisma.role.count({
        where: { schoolId },
      }),

      prisma.auditLog.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      schoolId,

      stats: {
        users,
        students,
        teachers,
        staff,
        roles,
      },

      quickActions: [
        {
          label: "Manage Users",
          href: "/dashboard/staff/management",
        },
        {
          label: "View Students",
          href: "/dashboard/students",
        },
        {
          label: "Open Finance",
          href: "/dashboard/finance",
        },
        {
          label: "Review Audit Logs",
          href: "/dashboard/communication/notifications",
        },
      ],

      recentActivities: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action || "",
        entity: log.entity || "",
        details: log.details || "",
        createdAt: log.createdAt,
        user: log.user || null,
      })),
    };
  },

  listUsers: async ({ user, query = {} }) => {
    const schoolId = getSchoolId(user);
    const { page, limit, skip } = getPagination(query);

    const where = {
      schoolId,
    };

    if (query.role) {
      where.role = String(query.role).trim().toLowerCase();
    }

    if (query.search) {
      const search = String(query.search).trim();

      if (search) {
        where.OR = [
          {
            fullName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            username: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];
      }
    }

    const [total, users] = await Promise.all([
      prisma.user.count({
        where,
      }),

      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    return {
      users: users.map(safeUser),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  listTeachers: async ({ user, query = {} }) => {
    const schoolId = getSchoolId(user);
    const { page, limit, skip } = getPagination(query);

    const where = {
      schoolId,
      OR: [
        { role: "staff" },
        { role: "principal" },
      ],
    };

    if (query.search) {
      const search = String(query.search).trim();

      if (search) {
        where.AND = [
          {
            OR: [
              {
                fullName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                firstName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                username: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          },
        ];
      }
    }

    const [total, users] = await Promise.all([
      prisma.user.count({
        where,
      }),

      prisma.user.findMany({
        where,
        orderBy: [{ fullName: "asc" }],
        skip,
        take: limit,
      }),
    ]);

    return {
      users: users.map(safeUser),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  listAdmins: async ({ user }) => {
    const schoolId = getSchoolId(user);

    const admins = await prisma.user.findMany({
      where: {
        schoolId,
        OR: [
          { role: "principal" },
          { role: "admin" },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return admins.map(safeUser);
  },

  listStaffAttendance: async ({ user, query = {} }) => {
    const schoolId = getSchoolId(user);
    const { page, limit, skip } = getPagination(query);

    const where = {
      schoolId,
    };

    if (query.search) {
      const search = String(query.search).trim();

      if (search) {
        where.OR = [
          {
            teacher: {
              user: {
                fullName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            teacher: {
              user: {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            status: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];
      }
    }

    const [total, attendance] = await Promise.all([
      prisma.teacherAttendance.count({
        where,
      }),

      prisma.teacherAttendance.findMany({
        where,
        include: {
          teacher: {
            include: {
              user: true,
            },
          },
        },
        orderBy: [
          {
            attendanceDate: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        skip,
        take: limit,
      }),
    ]);

    return {
      attendance: attendance.map((item) => ({
        id: item.id,
        attendanceDate: item.attendanceDate,
        status: item.status || "",
        checkInTime: item.checkInTime || "",
        checkOutTime: item.checkOutTime || "",
        teacher: item.teacher?.user
          ? safeUser(item.teacher.user)
          : null,
      })),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  listRoles: async ({ user }) => {
    const schoolId = getSchoolId(user);

    return prisma.role.findMany({
      where: {
        OR: [
          { schoolId },
          { isSystem: true },
        ],
      },
      orderBy: [
        {
          isSystem: "desc",
        },
        {
          name: "asc",
        },
      ],
    });
  },

  listAuditLogs: async ({ user, query = {} }) => {
    const schoolId = getSchoolId(user);
    const { page, limit, skip } = getPagination(query);

    const where = {
      schoolId,
    };

    if (query.search) {
      const search = String(query.search).trim();

      if (search) {
        where.OR = [
          {
            action: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            entity: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            details: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];
      }
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({
        where,
      }),

      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action || "",
        entity: log.entity || "",
        details: log.details || "",
        createdAt: log.createdAt,
        user: log.user || null,
      })),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  listResults: async ({ user, query = {} }) => {
    const schoolId = getSchoolId(user);
    const { page, limit, skip } = getPagination(query);

    const [examResults, incompleteAttempts, legacyResults] = await Promise.all([
      prisma.examResult.findMany({
        where: {
          exam: {
            schoolId,
          },
        },

        include: {
          exam: {
            include: {
              subject: true,
            },
          },

          student: true,

          attempt: true,
        },

        orderBy: [
          {
            completedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      }),

      prisma.examAttempt.findMany({
        where: {
          exam: {
            schoolId,
          },
          result: {
            is: null,
          },
        },

        include: {
          exam: {
            include: {
              subject: true,
            },
          },
          student: true,
        },

        orderBy: [
          {
            completedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      }),

      prisma.result.findMany({
        where: {
          schoolId,
        },

        include: {
          assessment: {
            include: {
              exam: {
                include: {
                  subject: true,
                },
              },
            },
          },

          student: true,
          teacher: true,
        },

        orderBy: [
          {
            createdAt: "desc",
          },
        ],
      }),
    ]);

    const latestLegacyByExamStudent = new Map();

    for (const result of legacyResults) {
      const key = getExamStudentKey(
        result.assessment?.exam?.id,
        result.studentId
      );

      if (key && isNewerRecord(result, latestLegacyByExamStudent.get(key))) {
        latestLegacyByExamStudent.set(key, result);
      }
    }

    const latestExamResultsByStudentExam = new Map();

    for (const result of examResults) {
      const key = getExamStudentKey(result.examId, result.studentId);

      if (
        key &&
        isNewerRecord(
          result,
          latestExamResultsByStudentExam.get(key)
        )
      ) {
        latestExamResultsByStudentExam.set(key, result);
      }
    }

    const latestIncompleteAttemptsByStudentExam = new Map();

    for (const attempt of incompleteAttempts) {
      const key = getExamStudentKey(attempt.examId, attempt.studentId);

      if (key && isNewerRecord(attempt, latestIncompleteAttemptsByStudentExam.get(key))) {
        latestIncompleteAttemptsByStudentExam.set(key, attempt);
      }
    }

    const combined = [];

    for (const [studentExamKey, result] of latestExamResultsByStudentExam) {
      const legacyResult = latestLegacyByExamStudent.get(studentExamKey);
      const legacyMaxScore = toFiniteNumber(legacyResult?.maxScore);
      const examTotalMarks = toFiniteNumber(result.exam?.totalMarks, 0);
      const totalMarks = legacyMaxScore && legacyMaxScore > 0
        ? legacyMaxScore
        : examTotalMarks;
      const marks = toFiniteNumber(result.marks, 0);
      const percentage = toFiniteNumber(
        result.percentage,
        calculatePercentage(marks, totalMarks)
      );
      const passed = isPassingGrade(result.grade);

      combined.push({
        kind: "exam_result",
        key: `exam:${result.id}`,
        id: result.id,
        resultId: result.id,
        attemptId: result.attemptId || result.attempt?.id || null,
        externalResultId: result.attempt?.externalResultId || null,
        attemptNumber: result.attempt?.attemptNumber || null,
        resultState: "completed",
        examId: result.examId,
        assessmentId: result.exam?.assessmentId || legacyResult?.assessmentId || null,
        studentId: result.studentId,
        studentName: getStudentName(result.student),
        examTitle: result.exam?.title || "Untitled Exam",
        subject: result.exam?.subject?.name || "Unknown Subject",
        marks,
        score: marks,
        totalMarks,
        totalQuestions: null,
        percentage,
        grade: result.grade || "",
        passed,
        passStatus: passed ? "pass" : "fail",
        remarks: result.remarks || "",
        completedAt: result.completedAt,
        createdAt: result.createdAt,
        attemptStatus: result.attempt?.status || null,
      });
    }

    for (const [studentExamKey, attempt] of latestIncompleteAttemptsByStudentExam) {
      const finalResult = latestExamResultsByStudentExam.get(studentExamKey);

      // A newer attempt without an ExamResult must be visible as pending.
      if (finalResult && !isNewerRecord(attempt, finalResult)) {
        continue;
      }

      const marks = toFiniteNumber(attempt.score);
      const totalMarks = toFiniteNumber(attempt.exam?.totalMarks, 0);
      const percentage = toFiniteNumber(
        attempt.percentage,
        marks === null ? null : calculatePercentage(marks, totalMarks)
      );

      combined.push({
        kind: "exam_attempt",
        key: `attempt:${attempt.id}`,
        id: attempt.id,
        resultId: null,
        attemptId: attempt.id,
        externalResultId: attempt.externalResultId || null,
        attemptNumber: attempt.attemptNumber || null,
        resultState: "pending",
        examId: attempt.examId,
        assessmentId: attempt.exam?.assessmentId || null,
        studentId: attempt.studentId,
        studentName: getStudentName(attempt.student),
        examTitle: attempt.exam?.title || "Untitled Exam",
        subject: attempt.exam?.subject?.name || "Unknown Subject",
        marks,
        score: marks,
        totalMarks,
        totalQuestions: null,
        percentage,
        grade: "Pending",
        passed: null,
        passStatus: "pending",
        remarks: "The attempt is stored, but its final result has not been created yet.",
        completedAt: attempt.completedAt,
        createdAt: attempt.createdAt,
        attemptStatus: attempt.status || "in_progress",
      });
    }

    const displayedStudentExamKeys = new Set(
      combined
        .map((result) => getExamStudentKey(result.examId, result.studentId))
        .filter(Boolean)
    );

    for (const result of legacyResults) {
      const examId = result.assessment?.exam?.id || null;
      const existingKey = getExamStudentKey(examId, result.studentId);

      if (
        existingKey &&
        (displayedStudentExamKeys.has(existingKey) ||
          latestLegacyByExamStudent.get(existingKey)?.id !== result.id)
      ) {
        continue;
      }

      const key = `legacy:${result.id}`;
      const totalMarks = toFiniteNumber(
        result.maxScore,
        toFiniteNumber(result.assessment?.exam?.totalMarks, 0)
      );
      const marks = toFiniteNumber(result.score, 0);

      combined.push({
        kind: "legacy",
        key,
        id: result.id,
        resultId: result.id,
        attemptId: null,
        externalResultId: null,
        attemptNumber: null,
        resultState: "completed",
        examId,
        assessmentId: result.assessmentId || null,
        studentId: result.studentId,
        studentName: getStudentName(result.student),
        examTitle: result.assessment?.exam?.title || result.assessment?.title || "Untitled Exam",
        subject: result.assessment?.exam?.subject?.name || result.subject || "Unknown Subject",
        marks,
        score: marks,
        totalMarks,
        totalQuestions: null,
        percentage: totalMarks > 0 ? calculatePercentage(marks, totalMarks) : null,
        grade: result.published ? "Published" : "",
        passed: null,
        passStatus: null,
        remarks: "",
        completedAt: result.updatedAt || result.createdAt,
        createdAt: result.createdAt,
        attemptStatus: result.published ? "published" : null,
      });
    }

    combined.sort((a, b) => {
      const aTime = new Date(a.completedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.completedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    const total = combined.length;
    const results = combined.slice(skip, skip + limit);

    const studentIds = results
      .map((result) => result.studentId)
      .filter(Boolean);

    const admissions = studentIds.length
      ? await prisma.admission.findMany({
          where: {
            schoolId,
            studentId: {
              in: studentIds,
            },
          },
          select: {
            id: true,
            studentId: true,
            applicantName: true,
            applicantId: true,
            applicationCode: true,
            admissionCode: true,
            status: true,
            examResult: true,
            examScore: true,
            examCompletedAt: true,
            examReference: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        })
      : [];

    const admissionByStudentId = new Map();

    for (const admission of admissions) {
      if (admission.studentId && !admissionByStudentId.has(admission.studentId)) {
        admissionByStudentId.set(admission.studentId, admission);
      }
    }

    return {
      results: results.map((result) => {
        const admission = admissionByStudentId.get(result.studentId) || null;

        return {
          ...result,
          admissionId: admission?.id || null,
          admissionCode: admission?.admissionCode || null,
          applicationCode: admission?.applicationCode || null,
          applicantName: admission?.applicantName || null,
          applicantId: admission?.applicantId || null,
          schoolCode: admission?.admissionCode || admission?.applicationCode || null,
          admissionStatus: admission?.status || null,
          examReference: admission?.examReference || null,
          source: result.kind,
        };
      }),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },
};
