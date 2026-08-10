import { prisma } from "../config/db.js";

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getSchoolId = (user) => {
  if (!user || user?.schoolId === undefined || user?.schoolId === null) {
    const err = new Error("School context missing");
    err.statusCode = 403;
    throw err;
  }
  return Number(user.schoolId);
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
  staffSubjectsAssigned: Array.isArray(user.staffSubjectsAssigned) ? user.staffSubjectsAssigned : [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const adminService = {
  getDashboard: async (user) => {
    const schoolId = getSchoolId(user);
    const [users, students, teachers, staff, roles, recentAuditLogs] = await Promise.all([
      prisma.user.count({ where: { schoolId } }),
      prisma.student.count({ where: { schoolId } }),
      prisma.teacher.count({ where: { schoolId } }),
      prisma.staff.count({ where: { schoolId } }),
      prisma.role.count({ where: { schoolId } }),
      prisma.auditLog.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: { select: { id: true, fullName: true, email: true } } },
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
        { label: "Manage Users", href: "/dashboard/staff/management" },
        { label: "View Students", href: "/dashboard/students" },
        { label: "Open Finance", href: "/dashboard/finance" },
        { label: "Review Audit Logs", href: "/dashboard/communication/notifications" },
      ],
      recentActivities: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity || "",
        details: log.details || "",
        createdAt: log.createdAt,
        user: log.user || null,
      })),
    };
  },

  listUsers: async ({ user, query = {} }) => {
    const schoolId = getSchoolId(user);
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 10)));
    const where = { schoolId };

    if (query.role) where.role = String(query.role).trim().toLowerCase();
    if (query.search) {
      const search = String(query.search).trim();
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * limit,
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
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 10)));
    const where = {
      schoolId,
      OR: [{ role: "staff" }, { role: "principal" }],
    };
    if (query.search) {
      const search = String(query.search).trim();
      where.AND = [
        {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ fullName: "asc" }],
        skip: (page - 1) * limit,
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
      where: { schoolId, OR: [{ role: "principal" }, { role: "admin" }] },
      orderBy: [{ createdAt: "desc" }],
    });

    return admins.map(safeUser);
  },

  listStaffAttendance: async ({ user, query = {} }) => {
    const schoolId = getSchoolId(user);
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 10)));
    const where = { schoolId };

    if (query.search) {
      const search = String(query.search).trim();
      where.OR = [
        { teacher: { user: { fullName: { contains: search, mode: "insensitive" } } } },
        { teacher: { user: { email: { contains: search, mode: "insensitive" } } } },
        { status: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, attendance] = await Promise.all([
      prisma.teacherAttendance.count({ where }),
      prisma.teacherAttendance.findMany({
        where,
        include: {
          teacher: { include: { user: true } },
          school: true,
        },
        orderBy: [{ attendanceDate: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      attendance: attendance.map((item) => ({
        id: item.id,
        attendanceDate: item.attendanceDate,
        status: item.status,
        checkInTime: item.checkInTime || "",
        checkOutTime: item.checkOutTime || "",
        teacher: item.teacher?.user ? safeUser(item.teacher.user) : null,
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
      where: { OR: [{ schoolId }, { isSystem: true }] },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });
  },

  listAuditLogs: async ({ user, query = {} }) => {
    const schoolId = getSchoolId(user);
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 10)));
    const where = { schoolId };
    if (query.search) {
      const search = String(query.search).trim();
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
      ];
    }
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return {
      logs: logs.map((log) => ({
        ...log,
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
};
