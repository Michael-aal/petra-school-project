import { prisma } from "../config/db.js";
import { normalizeRole } from "../utils/roleUtils.js";

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

const safeUser = (user) => ({
  id: user.id,
  firstName: user.firstName || "",
  middleName: user.middleName || "",
  lastName: user.lastName || "",
  username: user.username || "",
  fullName: user.fullName || "",
  email: user.email || "",
  role: normalizeRole(user.role),
  accountStatus: user.accountStatus || "active",
  schoolId: user.schoolId ?? null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const safeSchool = (school) => ({
  id: school.id,
  name: school.name,
  address: school.address || "",
  email: school.email || "",
  phone: school.phone || "",
  website: school.website || "",
  country: school.country || "",
  state: school.state || "",
  city: school.city || "",
  timezone: school.timezone || "UTC",
  logo: school.logo || "",
  isActive: Boolean(school.isActive),
  createdAt: school.createdAt,
  updatedAt: school.updatedAt,
});

const getSchoolStats = async (schoolId) => {
  const [students, teachers, staff, parents, classes, subjects] = await Promise.all([
    prisma.student.count({ where: { schoolId } }),
    prisma.teacher.count({ where: { schoolId } }),
    prisma.staff.count({ where: { schoolId } }),
    prisma.parent.count({ where: { schoolId } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.subject.count({ where: { schoolId } }),
  ]);

  return { students, teachers, staff, parents, classes, subjects };
};

export const superAdminService = {
  getDashboardStats: async () => {
    const [totalSchools, activeSchools, totalUsers, totalStudents, totalTeachers, totalStaff, recentSchools, recentLogs] =
      await Promise.all([
        prisma.school.count(),
        prisma.school.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.student.count(),
        prisma.teacher.count(),
        prisma.staff.count(),
        prisma.school.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            _count: {
              select: {
                students: true,
                teachers: true,
                staff: true,
              },
            },
          },
        }),
        prisma.activityLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          include: { user: { select: { id: true, fullName: true, email: true, role: true } }, school: true },
        }),
      ]);

    return {
      totalSchools,
      activeSchools,
      inactiveSchools: Math.max(0, totalSchools - activeSchools),
      totalUsers,
      totalStudents,
      totalTeachers,
      totalStaff,
      recentSchools: recentSchools.map((school) => ({
        ...safeSchool(school),
        users: 0,
        students: school._count?.students || 0,
        teachers: school._count?.teachers || 0,
        staff: school._count?.staff || 0,
      })),
      recentActivity: recentLogs.map((log) => ({
        id: log.id,
        date: log.createdAt,
        user: log.user ? safeUser(log.user) : null,
        action: log.activity,
        entity: "Activity",
        school: log.school ? safeSchool(log.school) : null,
        details: typeof log.metadata === "object" && log.metadata ? JSON.stringify(log.metadata) : "",
      })),
    };
  },

  listSchools: async ({ query = {} }) => {
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 20)));
    const where = {};

    if (query.search) {
      const search = String(query.search).trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
      ];
    }

    if (query.status === "active") where.isActive = true;
    if (query.status === "inactive") where.isActive = false;

    const [total, schools] = await Promise.all([
      prisma.school.count({ where }),
      prisma.school.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      schools: schools.map(safeSchool),
      pagination: buildPagination(page, limit, total),
    };
  },

  createSchool: async (payload = {}) => {
    const school = await prisma.school.create({
      data: {
        name: payload.name,
        address: payload.address || null,
        email: payload.email || null,
        phone: payload.phone || null,
        website: payload.website || null,
        country: payload.country || null,
        state: payload.state || null,
        city: payload.city || null,
        timezone: payload.timezone || "UTC",
        logo: payload.logo || null,
        isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
      },
    });

    return safeSchool(school);
  },

  getSchoolById: async (id) => {
    const school = await prisma.school.findUnique({
      where: { id: Number(id) },
    });

    if (!school) {
      const error = new Error("School not found");
      error.statusCode = 404;
      throw error;
    }

    const stats = await getSchoolStats(school.id);
    return { ...safeSchool(school), stats };
  },

  updateSchool: async (id, payload = {}) => {
    const school = await prisma.school.update({
      where: { id: Number(id) },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.address !== undefined ? { address: payload.address } : {}),
        ...(payload.email !== undefined ? { email: payload.email } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
        ...(payload.website !== undefined ? { website: payload.website } : {}),
        ...(payload.country !== undefined ? { country: payload.country } : {}),
        ...(payload.state !== undefined ? { state: payload.state } : {}),
        ...(payload.city !== undefined ? { city: payload.city } : {}),
        ...(payload.timezone !== undefined ? { timezone: payload.timezone } : {}),
        ...(payload.logo !== undefined ? { logo: payload.logo } : {}),
      },
    });

    return safeSchool(school);
  },

  setSchoolStatus: async (id, isActive) => {
    const school = await prisma.school.update({
      where: { id: Number(id) },
      data: { isActive: Boolean(isActive) },
    });

    return safeSchool(school);
  },

  listUsers: async ({ query = {} }) => {
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 20)));
    const where = {};

    if (query.search) {
      const search = String(query.search).trim();
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (query.role) where.role = normalizeRole(query.role);
    if (query.status) where.accountStatus = String(query.status).trim().toLowerCase();
    if (query.schoolId) where.schoolId = Number(query.schoolId);

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const schoolIds = [...new Set(users.map((user) => user.schoolId).filter((id) => id !== null && id !== undefined))];
    const schools = schoolIds.length
      ? await prisma.school.findMany({ where: { id: { in: schoolIds } } })
      : [];
    const schoolById = new Map(schools.map((school) => [school.id, safeSchool(school)]));

    return {
      users: users.map((user) => ({
        ...safeUser(user),
        school: user.schoolId ? schoolById.get(user.schoolId) || null : null,
      })),
      pagination: buildPagination(page, limit, total),
    };
  },

  listSchoolUsers: async ({ schoolId, query = {} }) => {
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 20)));
    const resolvedSchoolId = Number(schoolId);
    const where = { schoolId: resolvedSchoolId };

    if (query.search) {
      const search = String(query.search).trim();
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (query.role) where.role = normalizeRole(query.role);
    if (query.status) where.accountStatus = String(query.status).trim().toLowerCase();

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const schoolIds = [...new Set(users.map((user) => user.schoolId).filter((id) => id !== null && id !== undefined))];
    const schools = schoolIds.length
      ? await prisma.school.findMany({ where: { id: { in: schoolIds } } })
      : [];
    const schoolById = new Map(schools.map((school) => [school.id, safeSchool(school)]));

    return {
      users: users.map((user) => ({
        ...safeUser(user),
        school: user.schoolId ? schoolById.get(user.schoolId) || null : null,
      })),
      pagination: buildPagination(page, limit, total),
    };
  },

  listLogs: async ({ query = {} }) => {
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 20)));
    const where = {};

    if (query.search) {
      const search = String(query.search).trim();
      where.OR = [
        { activity: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
      ];
    }

    if (query.schoolId) where.schoolId = Number(query.schoolId);

    const [total, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } },
          school: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        date: log.createdAt,
        user: log.user || null,
        action: log.activity,
        entity: log.entity || "Activity",
        school: log.school || null,
        details: log.details || "",
      })),
      pagination: buildPagination(page, limit, total),
    };
  },
};

