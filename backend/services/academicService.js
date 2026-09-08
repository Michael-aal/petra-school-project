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
const assertScopedRecord = async (delegate, user, id, label) => {
  const record = await delegate.findFirst({ where: { id, schoolId: getSchoolId(user) } });
  if (!record) {
    const error = new Error(`${label} not found`);
    error.statusCode = 404;
    throw error;
  }
  return record;
};
const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const academicService = {
  listSessions: async (user) =>
    prisma.academicSession.findMany({ where: { schoolId: getSchoolId(user) }, orderBy: { startsAt: "desc" } }),
  createSession: async (user, payload) =>
    safeSession(await prisma.academicSession.create({ data: {
      name: String(payload.name).trim(),
      term: String(payload.term).trim(),
      schoolId: getSchoolId(user),
      startsAt: new Date(payload.startsAt),
      endsAt: new Date(payload.endsAt),
      isActive: Boolean(payload.isActive),
    } })),
  updateSession: async (user, id, payload) => {
    await assertScopedRecord(prisma.academicSession, user, id, "Session");
    return safeSession(await prisma.academicSession.update({ where: { id }, data: {
      ...(payload.name !== undefined ? { name: String(payload.name).trim() } : {}),
      ...(payload.term !== undefined ? { term: String(payload.term).trim() } : {}),
      ...(payload.startsAt ? { startsAt: new Date(payload.startsAt) } : {}),
      ...(payload.endsAt ? { endsAt: new Date(payload.endsAt) } : {}),
      ...(payload.isActive !== undefined ? { isActive: Boolean(payload.isActive) } : {}),
    } }));
  },
  deleteSession: async (user, id) => {
    await assertScopedRecord(prisma.academicSession, user, id, "Session");
    return prisma.academicSession.delete({ where: { id } });
  },

  listClasses: async (user) => prisma.academicClass.findMany({ where: { schoolId: getSchoolId(user) }, orderBy: { name: "asc" } }),
  createClass: async (user, payload) => safeClass(await prisma.academicClass.create({ data: {
    name: String(payload.name).trim(),
    arm: payload.arm ? String(payload.arm).trim() : null,
    level: payload.level ? String(payload.level).trim() : null,
    teacherName: payload.teacherName ? String(payload.teacherName).trim() : null,
    schoolId: getSchoolId(user),
    capacity: Number(payload.capacity || 0),
  } })),
  updateClass: async (user, id, payload) => {
    await assertScopedRecord(prisma.academicClass, user, id, "Class");
    return safeClass(await prisma.academicClass.update({ where: { id }, data: {
      ...(payload.name !== undefined ? { name: String(payload.name).trim() } : {}),
      ...(payload.arm !== undefined ? { arm: payload.arm ? String(payload.arm).trim() : null } : {}),
      ...(payload.level !== undefined ? { level: payload.level ? String(payload.level).trim() : null } : {}),
      ...(payload.teacherName !== undefined ? { teacherName: payload.teacherName ? String(payload.teacherName).trim() : null } : {}),
      ...(payload.capacity !== undefined ? { capacity: Number(payload.capacity) } : {}),
    } }));
  },
  deleteClass: async (user, id) => {
    await assertScopedRecord(prisma.academicClass, user, id, "Class");
    return prisma.academicClass.delete({ where: { id } });
  },

  listSubjects: async (user) => prisma.academicSubject.findMany({ where: { schoolId: getSchoolId(user) }, orderBy: { name: "asc" } }),
  createSubject: async (user, payload) => safeSubject(await prisma.academicSubject.create({ data: {
    name: String(payload.name).trim(),
    code: payload.code ? String(payload.code).trim() : null,
    category: payload.category ? String(payload.category).trim() : null,
    schoolId: getSchoolId(user),
  } })),
  updateSubject: async (user, id, payload) => {
    await assertScopedRecord(prisma.academicSubject, user, id, "Subject");
    return safeSubject(await prisma.academicSubject.update({ where: { id }, data: {
      ...(payload.name !== undefined ? { name: String(payload.name).trim() } : {}),
      ...(payload.code !== undefined ? { code: payload.code ? String(payload.code).trim() : null } : {}),
      ...(payload.category !== undefined ? { category: payload.category ? String(payload.category).trim() : null } : {}),
    } }));
  },
  deleteSubject: async (user, id) => {
    await assertScopedRecord(prisma.academicSubject, user, id, "Subject");
    return prisma.academicSubject.delete({ where: { id } });
  },

  listTimetable: async (user) => prisma.timetableEntry.findMany({ where: { schoolId: getSchoolId(user) }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }),
  createTimetable: async (user, payload) => safeTimetable(await prisma.timetableEntry.create({ data: {
    className: String(payload.className).trim(),
    subjectName: String(payload.subjectName).trim(),
    dayOfWeek: String(payload.dayOfWeek).trim(),
    startTime: String(payload.startTime).trim(),
    endTime: String(payload.endTime).trim(),
    room: payload.room ? String(payload.room).trim() : null,
    timetableId: String(payload.timetableId).trim(),
    schoolId: getSchoolId(user),
  } })),
  updateTimetable: async (user, id, payload) => {
    await assertScopedRecord(prisma.timetableEntry, user, id, "Timetable entry");
    return safeTimetable(await prisma.timetableEntry.update({ where: { id }, data: {
      ...(payload.className !== undefined ? { className: String(payload.className).trim() } : {}),
      ...(payload.subjectName !== undefined ? { subjectName: String(payload.subjectName).trim() } : {}),
      ...(payload.dayOfWeek !== undefined ? { dayOfWeek: String(payload.dayOfWeek).trim() } : {}),
      ...(payload.startTime !== undefined ? { startTime: String(payload.startTime).trim() } : {}),
      ...(payload.endTime !== undefined ? { endTime: String(payload.endTime).trim() } : {}),
      ...(payload.room !== undefined ? { room: payload.room ? String(payload.room).trim() : null } : {}),
      ...(payload.timetableId !== undefined ? { timetableId: String(payload.timetableId).trim() } : {}),
    } }));
  },
  deleteTimetable: async (user, id) => {
    await assertScopedRecord(prisma.timetableEntry, user, id, "Timetable entry");
    return prisma.timetableEntry.delete({ where: { id } });
  },

  listAttendance: async (user, query = {}) => {
    const currentPage = Math.max(1, toNumber(query.page, 1));
    const pageSize = Math.max(1, Math.min(100, toNumber(query.limit, 25)));
    const schoolId = getSchoolId(user);
    const where = { schoolId };

    if (query.className) {
      where.student = { className: { contains: String(query.className).trim(), mode: "insensitive" } };
    }
    if (query.status) where.status = String(query.status).trim().toLowerCase();
    if (query.student) {
      const student = String(query.student).trim();
      where.student = {
        ...(where.student || {}),
        OR: [
          { name: { contains: student, mode: "insensitive" } },
          { admissionNumber: { contains: student, mode: "insensitive" } },
        ],
      };
    }
    if (query.search) {
      const search = String(query.search).trim();
      where.OR = [
        { student: { name: { contains: search, mode: "insensitive" } } },
        { student: { admissionNumber: { contains: search, mode: "insensitive" } } },
        { student: { className: { contains: search, mode: "insensitive" } } },
        { status: { contains: search, mode: "insensitive" } },
      ];
    }
    const toDateRange = (dateValue, end = false) => {
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return null;
      if (end) date.setHours(23, 59, 59, 999);
      else date.setHours(0, 0, 0, 0);
      return date;
    };
    if (query.date) {
      const start = toDateRange(query.date);
      const end = toDateRange(query.date, true);
      if (start && end) where.attendanceDate = { gte: start, lte: end };
    } else if (query.startDate || query.endDate) {
      const range = {};
      if (query.startDate) { const start = toDateRange(query.startDate); if (start) range.gte = start; }
      if (query.endDate) { const end = toDateRange(query.endDate, true); if (end) range.lte = end; }
      if (Object.keys(range).length) where.attendanceDate = range;
    }

    const [total, attendance] = await Promise.all([
      prisma.studentAttendance.count({ where }),
      prisma.studentAttendance.findMany({
        where,
        orderBy: [{ attendanceDate: "desc" }, { createdAt: "desc" }],
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        include: { student: true, class: true },
      }),
    ]);

    return {
      attendance: attendance.map((item) => ({
        ...item,
        date: item.attendanceDate,
        className: item.class?.name || item.student?.className || "",
      })),
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },
};
