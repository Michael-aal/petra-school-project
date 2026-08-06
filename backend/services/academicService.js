import { prisma } from "../config/db.js";

const getSchoolId = (user) => {
  if (!user || user?.schoolId === undefined || user?.schoolId === null) {
    const err = new Error("School context missing");
    err.statusCode = 403;
    throw err;
  }
  return Number(user.schoolId);
};

const safeSession = (item) => ({ ...item, schoolId: item.schoolId });
const safeClass = (item) => ({ ...item, schoolId: item.schoolId });
const safeSubject = (item) => ({ ...item, schoolId: item.schoolId });
const safeTimetable = (item) => ({ ...item, schoolId: item.schoolId });
const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const academicService = {
  listSessions: async (user) =>
    prisma.academicSession.findMany({ where: { schoolId: getSchoolId(user) }, orderBy: { startsAt: "desc" } }),
  createSession: async (user, payload) =>
    safeSession(await prisma.academicSession.create({ data: { ...payload, schoolId: getSchoolId(user), startsAt: new Date(payload.startsAt), endsAt: new Date(payload.endsAt), isActive: Boolean(payload.isActive) } })),
  updateSession: async (user, id, payload) =>
    safeSession(await prisma.academicSession.update({ where: { id }, data: { ...payload, startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined, endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined } })),
  deleteSession: async (_user, id) => prisma.academicSession.delete({ where: { id } }),

  listClasses: async (user) => prisma.academicClass.findMany({ where: { schoolId: getSchoolId(user) }, orderBy: { name: "asc" } }),
  createClass: async (user, payload) => safeClass(await prisma.academicClass.create({ data: { ...payload, schoolId: getSchoolId(user), capacity: Number(payload.capacity || 0) } })),
  updateClass: async (_user, id, payload) => safeClass(await prisma.academicClass.update({ where: { id }, data: { ...payload, capacity: payload.capacity !== undefined ? Number(payload.capacity) : undefined } })),
  deleteClass: async (_user, id) => prisma.academicClass.delete({ where: { id } }),

  listSubjects: async (user) => prisma.academicSubject.findMany({ where: { schoolId: getSchoolId(user) }, orderBy: { name: "asc" } }),
  createSubject: async (user, payload) => safeSubject(await prisma.academicSubject.create({ data: { ...payload, schoolId: getSchoolId(user) } })),
  updateSubject: async (_user, id, payload) => safeSubject(await prisma.academicSubject.update({ where: { id }, data: payload })),
  deleteSubject: async (_user, id) => prisma.academicSubject.delete({ where: { id } }),

  listTimetable: async (user) => prisma.timetableEntry.findMany({ where: { schoolId: getSchoolId(user) }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }),
  createTimetable: async (user, payload) => safeTimetable(await prisma.timetableEntry.create({ data: { ...payload, schoolId: getSchoolId(user) } })),
  updateTimetable: async (_user, id, payload) => safeTimetable(await prisma.timetableEntry.update({ where: { id }, data: payload })),
  deleteTimetable: async (_user, id) => prisma.timetableEntry.delete({ where: { id } }),

  listAttendance: async (user, query = {}) => {
    const currentPage = Math.max(1, toNumber(query.page, 1));
    const pageSize = Math.max(1, Math.min(100, toNumber(query.limit, 25)));
    const schoolId = getSchoolId(user);
    const and = [
      {
        OR: [
          { teacher: { schoolId } },
          { student: { schoolId } },
        ],
      },
    ];

    if (query.className) and.push({ className: { contains: String(query.className).trim(), mode: "insensitive" } });
    if (query.status) and.push({ status: String(query.status).trim() });
    if (query.student) {
      const student = String(query.student).trim();
      and.push({
        student: {
          OR: [
            { name: { contains: student, mode: "insensitive" } },
            { admissionNumber: { contains: student, mode: "insensitive" } },
          ],
        },
      });
    }
    if (query.teacher) {
      const teacher = String(query.teacher).trim();
      and.push({
        teacher: {
          OR: [
            { fullName: { contains: teacher, mode: "insensitive" } },
            { email: { contains: teacher, mode: "insensitive" } },
          ],
        },
      });
    }
    if (query.subject) and.push({ OR: [{ className: { contains: String(query.subject).trim(), mode: "insensitive" } }] });
    if (query.search) {
      const search = String(query.search).trim();
      and.push({
        OR: [
          { student: { name: { contains: search, mode: "insensitive" } } },
          { student: { admissionNumber: { contains: search, mode: "insensitive" } } },
          { className: { contains: search, mode: "insensitive" } },
          { status: { contains: search, mode: "insensitive" } },
          { teacher: { fullName: { contains: search, mode: "insensitive" } } },
        ],
      });
    }
    if (query.date) {
      const date = new Date(query.date);
      and.push({ date: { gte: new Date(date.setHours(0, 0, 0, 0)), lt: new Date(date.setHours(23, 59, 59, 999)) } });
    }
    if (query.startDate || query.endDate) {
      const range = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        range.gte = new Date(start.setHours(0, 0, 0, 0));
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        range.lte = new Date(end.setHours(23, 59, 59, 999));
      }
      and.push({ date: range });
    }

    const where = { AND: and };

    const [total, attendance] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        include: { student: true, teacher: true },
      }),
    ]);

    return {
      attendance,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },
};
