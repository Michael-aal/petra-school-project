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

    const where = {
      exam: {
        schoolId,
      },
    };

    const [total, results] = await Promise.all([
      prisma.examResult.count({
        where,
      }),

      prisma.examResult.findMany({
        where,

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

        skip,
        take: limit,
      }),
    ]);

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
            studentId: true,
            admissionCode: true,
            status: true,
            examResult: true,
          },
        })
      : [];

    const admissionByStudentId = new Map(
      admissions
        .filter((item) => item.studentId)
        .map((item) => [item.studentId, item])
    );

    return {
      results: results.map((result) => {
        const totalMarks = Number(result.exam?.totalMarks || 0);

        const percentage =
          result.percentage !== null &&
          result.percentage !== undefined
            ? Number(result.percentage)
            : calculatePercentage(result.marks, totalMarks);

        return {
          id: result.id,

          examId: result.examId,

          studentId: result.studentId,

          studentName: getStudentName(result.student),

          examTitle: result.exam?.title || "Untitled Exam",

          subject: result.exam?.subject?.name || "Unknown Subject",

          marks: Number(result.marks || 0),

          totalMarks,

          percentage,

          grade: result.grade || "",

          remarks: result.remarks || "",

          completedAt: result.completedAt,

          createdAt: result.createdAt,

          attemptStatus: result.attempt?.status || null,

          admissionCode:
            admissionByStudentId.get(result.studentId)
              ?.admissionCode || null,

          admissionStatus:
            admissionByStudentId.get(result.studentId)
              ?.status || null,
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
