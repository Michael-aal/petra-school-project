import { prisma } from "../config/db.js";

const normalizeClassList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeRole = (value) => (value === "staff" ? "staff" : "staff");

const buildTeacherScope = (user) => {
  const classNames = normalizeClassList(user?.staffClassAssigned || user?.assignedClass || user?.classAssigned);
  const subjects = normalizeClassList(user?.staffSubjectsAssigned || user?.assignedSubjects || user?.subjectsAssigned);
  return { classNames, subjects };
};

const buildTodaySchedule = (classNames = [], subjects = []) => {
  if (!classNames.length || !subjects.length) {
    return [];
  }

  return classNames.slice(0, 3).flatMap((className, index) => {
    const subject = subjects[index] || subjects[0];
    return [
      {
        time: `${index + 8}:00 AM`,
        subject,
        className,
        room: `Room ${index + 1}`,
      },
    ];
  });
};

const safeStudent = (student) => ({
  id: student.id,
  name: student.name,
  admissionNumber: student.admissionNumber || "",
  gender: student.gender || "",
  className: student.className || "",
  guardianName: student.guardianName || "",
  parentPhone: student.parentPhone || "",
  parentEmail: student.parentEmail || "",
  status: student.status || "active",
});

const safeProfile = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone || "",
  profileImage: user.profileImage || user.profilePicture || "",
  role: normalizeRole(user.role),
  department: user.staffDepartment || user.institution || "",
  accountStatus: user.accountStatus || "active",
  createdAt: user.createdAt,
  classAssigned: user.staffClassAssigned || "",
  subjectsAssigned: normalizeClassList(user.staffSubjectsAssigned || []),
});

export const teacherService = {
  getDashboard: async (user) => {
    const scope = buildTeacherScope(user);
    const studentsPromise = scope.classNames.length
      ? prisma.student.findMany({
          where: {
            schoolId: user.schoolId ? Number(user.schoolId) : undefined,
            className: { in: scope.classNames },
          },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]);

    const [students, assessments, attendance, announcements] = await Promise.all([
      studentsPromise,
      prisma.assessment.findMany({
        where: {
          teacherId: user.id,
        },
        orderBy: { date: "desc" },
        take: 5,
      }),
      prisma.attendance.findMany({
        where: {
          teacherId: user.id,
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.$queryRaw`SELECT title, description, createdAt FROM (SELECT 'School announcement'::text AS title, 'Check the latest school notice'::text AS description, CURRENT_TIMESTAMP AS createdAt) AS announcements`.then((rows) => rows),
    ]);

    const visibleStudents = scope.classNames.length ? students : [];

    return {
      teacherName: user.fullName,
      role: normalizeRole(user.role),
      department: user.staffDepartment || user.institution || "",
      assignedClasses: scope.classNames,
      assignedSubjects: scope.subjects,
      stats: {
        assignedStudents: visibleStudents.length,
        assignedSubjects: scope.subjects.length,
        attendanceStatus: attendance.length ? `${attendance.length} marked today` : "No attendance yet",
        pendingAssessments: assessments.length,
      },
      todaySchedule: buildTodaySchedule(scope.classNames, scope.subjects),
      recentAnnouncements: announcements,
      students: visibleStudents.map(safeStudent),
    };
  },

  listClasses: async (user) => {
    const scope = buildTeacherScope(user);
    if (!scope.classNames.length) {
      return [];
    }

    const students = await prisma.student.findMany({
      where: {
        schoolId: user.schoolId ? Number(user.schoolId) : undefined,
        className: { in: scope.classNames },
      },
      orderBy: { name: "asc" },
    });

    const grouped = scope.classNames.map((className) => {
      const classStudents = students.filter((student) => student.className === className);
      return {
        id: className,
        name: className,
        studentCount: classStudents.length,
        subjectsTaught: scope.subjects,
        teacherStatus: "Assigned",
      };
    });

    return grouped;
  },

  getClassById: async (user, classId) => {
    const scope = buildTeacherScope(user);
    if (!scope.classNames.includes(classId)) {
      const error = new Error("Class not assigned to this teacher");
      error.statusCode = 403;
      throw error;
    }

    const [students, attendance, assessments] = await Promise.all([
      prisma.student.findMany({
        where: { className: classId, schoolId: user.schoolId ? Number(user.schoolId) : undefined },
        orderBy: { name: "asc" },
      }),
      prisma.attendance.findMany({
        where: { teacherId: user.id, className: classId },
        orderBy: { date: "desc" },
        take: 5,
      }),
      prisma.assessment.findMany({
        where: { teacherId: user.id, className },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

    return {
      id: classId,
      name: classId,
      students: students.map(safeStudent),
      subjects: scope.subjects,
      recentAttendance: attendance,
      upcomingAssessments: assessments,
      teacherStatus: "Assigned",
    };
  },

  listStudents: async (user) => {
    const scope = buildTeacherScope(user);
    if (!scope.classNames.length) {
      return [];
    }

    const students = await prisma.student.findMany({
      where: {
        schoolId: user.schoolId ? Number(user.schoolId) : undefined,
        className: { in: scope.classNames },
      },
      orderBy: { name: "asc" },
    });

    return students.map(safeStudent);
  },

  getProfile: async (user) => safeProfile(user),

  updateProfile: async (userId, payload) => {
    const data = {};
    if (payload.phone) data.phone = payload.phone;
    if (payload.password) data.password = payload.password;
    if (payload.profileImage) data.profileImage = payload.profileImage;
    if (Object.keys(data).length === 0) return safeProfile(await prisma.user.findUnique({ where: { id: userId } }));
    const updated = await prisma.user.update({ where: { id: userId }, data });
    return safeProfile(updated);
  },

  listAttendance: async (user, query = {}) => {
    const scope = buildTeacherScope(user);
    const className = query.className || scope.classNames[0] || "";
    const date = query.date ? new Date(query.date) : new Date();
    const attendances = await prisma.attendance.findMany({
      where: {
        teacherId: user.id,
        className,
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
      },
      include: { student: true },
      orderBy: { createdAt: "desc" },
    });
    return attendances.map((item) => ({
      id: item.id,
      studentName: item.student?.name || "",
      className: item.className,
      status: item.status,
      date: item.date,
    }));
  },

  createAttendance: async (user, payload) => {
    const className = payload.className;
    const scope = buildTeacherScope(user);
    if (!scope.classNames.includes(className)) {
      const error = new Error("Class not assigned to this teacher");
      error.statusCode = 403;
      throw error;
    }
    const attendance = await prisma.attendance.create({
      data: {
        teacherId: user.id,
        studentId: payload.studentId,
        className,
        date: payload.date ? new Date(payload.date) : new Date(),
        status: payload.status,
      },
    });
    return attendance;
  },

  updateAttendance: async (user, id, payload) => {
    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing || existing.teacherId !== user.id) {
      const error = new Error("Attendance record not found");
      error.statusCode = 404;
      throw error;
    }
    const updated = await prisma.attendance.update({ where: { id }, data: { status: payload.status } });
    return updated;
  },

  listAssessments: async (user) => {
    const assessments = await prisma.assessment.findMany({
      where: { teacherId: user.id },
      orderBy: { date: "desc" },
    });
    return assessments;
  },

  createAssessment: async (user, payload) => {
    const assessment = await prisma.assessment.create({
      data: {
        teacherId: user.id,
        title: payload.title,
        subject: payload.subject,
        className: payload.className,
        maxScore: Number(payload.maxScore || 100),
        date: payload.date ? new Date(payload.date) : new Date(),
        description: payload.description || "",
      },
    });
    return assessment;
  },

  updateAssessment: async (user, id, payload) => {
    const existing = await prisma.assessment.findUnique({ where: { id } });
    if (!existing || existing.teacherId !== user.id) {
      const error = new Error("Assessment not found");
      error.statusCode = 404;
      throw error;
    }
    const updated = await prisma.assessment.update({ where: { id }, data: { ...payload, maxScore: payload.maxScore ? Number(payload.maxScore) : undefined } });
    return updated;
  },

  deleteAssessment: async (user, id) => {
    const existing = await prisma.assessment.findUnique({ where: { id } });
    if (!existing || existing.teacherId !== user.id) {
      const error = new Error("Assessment not found");
      error.statusCode = 404;
      throw error;
    }
    return prisma.assessment.delete({ where: { id } });
  },

  listResults: async (user) => {
    const results = await prisma.result.findMany({
      where: { teacherId: user.id },
      include: { student: true },
      orderBy: { createdAt: "desc" },
    });
    return results.map((item) => ({
      id: item.id,
      studentName: item.student?.name || "",
      subject: item.subject,
      className: item.className,
      score: item.score,
      maxScore: item.maxScore,
      published: item.published,
    }));
  },

  createResult: async (user, payload) => {
    const result = await prisma.result.create({
      data: {
        teacherId: user.id,
        studentId: payload.studentId,
        assessmentId: payload.assessmentId || null,
        subject: payload.subject,
        className: payload.className,
        score: Number(payload.score),
        maxScore: Number(payload.maxScore || 100),
        published: Boolean(payload.published),
      },
    });
    return result;
  },

  updateResult: async (user, id, payload) => {
    const existing = await prisma.result.findUnique({ where: { id } });
    if (!existing || existing.teacherId !== user.id) {
      const error = new Error("Result not found");
      error.statusCode = 404;
      throw error;
    }
    return prisma.result.update({ where: { id }, data: { ...payload, score: payload.score ? Number(payload.score) : undefined, maxScore: payload.maxScore ? Number(payload.maxScore) : undefined } });
  },

  listAnnouncements: async (user) => {
    const announcements = await prisma.$queryRaw`SELECT title, description, createdAt FROM (SELECT 'School announcement'::text AS title, 'Class update available'::text AS description, CURRENT_TIMESTAMP AS createdAt) AS announcements`;
    return announcements;
  },

  createAnnouncement: async (user, payload) => {
    return { title: payload.title, description: payload.description, createdAt: new Date() };
  },
};
