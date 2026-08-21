import { prisma } from "../config/db.js";

const schoolIdOf = (user) => {
  const schoolId = Number(user?.schoolId);
  if (!Number.isInteger(schoolId) || schoolId <= 0) {
    const error = new Error("School context missing");
    error.statusCode = 403;
    throw error;
  }
  return schoolId;
};

const requiredId = (value, label) => {
  const id = String(value || "").trim();
  if (!id) {
    const error = new Error(`${label} is required`);
    error.statusCode = 400;
    throw error;
  }
  return id;
};

const assertSchoolRecords = async (schoolId, ids) => {
  const [teacher, classRecord, subject] = await Promise.all([
    ids.teacherId
      ? prisma.teacher.findFirst({ where: { id: ids.teacherId, schoolId } })
      : null,
    ids.classId
      ? prisma.class.findFirst({ where: { id: ids.classId, schoolId } })
      : null,
    ids.subjectId
      ? prisma.subject.findFirst({ where: { id: ids.subjectId, schoolId } })
      : null,
  ]);

  if (ids.teacherId && !teacher)
    throw Object.assign(new Error("Teacher not found in this school"), {
      statusCode: 404,
    });
  if (ids.classId && !classRecord)
    throw Object.assign(new Error("Class not found in this school"), {
      statusCode: 404,
    });
  if (ids.subjectId && !subject)
    throw Object.assign(new Error("Subject not found in this school"), {
      statusCode: 404,
    });
};

export const schoolConnectionService = {
  listTeacherAssignments: async (user) => {
    const schoolId = schoolIdOf(user);
    return prisma.teacherClass.findMany({
      where: { schoolId },
      include: {
        teacher: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        class: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  assignTeacherClass: async (user, payload) => {
    const schoolId = schoolIdOf(user);
    const teacherId = requiredId(payload.teacherId, "teacherId");
    const classId = requiredId(payload.classId, "classId");
    await assertSchoolRecords(schoolId, { teacherId, classId });
    return prisma.teacherClass.upsert({
      where: { teacherId_classId: { teacherId, classId } },
      create: { teacherId, classId, schoolId },
      update: {},
      include: {
        teacher: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        class: true,
      },
    });
  },

  removeTeacherClass: async (user, id) => {
    const schoolId = schoolIdOf(user);
    const assignment = await prisma.teacherClass.findFirst({
      where: { id, schoolId },
    });
    if (!assignment)
      throw Object.assign(new Error("Teacher class assignment not found"), {
        statusCode: 404,
      });
    return prisma.teacherClass.delete({ where: { id } });
  },

  assignTeacherSubject: async (user, payload) => {
    const schoolId = schoolIdOf(user);
    const teacherId = requiredId(payload.teacherId, "teacherId");
    const subjectId = requiredId(payload.subjectId, "subjectId");
    await assertSchoolRecords(schoolId, { teacherId, subjectId });
    return prisma.teacherSubject.upsert({
      where: { teacherId_subjectId: { teacherId, subjectId } },
      create: { teacherId, subjectId, schoolId },
      update: {},
      include: {
        teacher: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        subject: true,
      },
    });
  },

  assignClassSubject: async (user, payload) => {
    const schoolId = schoolIdOf(user);
    const classId = requiredId(payload.classId, "classId");
    const subjectId = requiredId(payload.subjectId, "subjectId");
    await assertSchoolRecords(schoolId, { classId, subjectId });
    return prisma.subjectClass.upsert({
      where: { classId_subjectId: { classId, subjectId } },
      create: { classId, subjectId },
      update: {},
      include: { class: true, subject: true },
    });
  },

  removeClassSubject: async (user, id) => {
    const schoolId = schoolIdOf(user);
    const link = await prisma.subjectClass.findFirst({
      where: { id, class: { schoolId } },
    });
    if (!link)
      throw Object.assign(new Error("Class subject assignment not found"), {
        statusCode: 404,
      });
    return prisma.subjectClass.delete({ where: { id } });
  },

  listReportCards: async (user, query = {}) => {
    const schoolId = schoolIdOf(user);
    const where = { schoolId };
    if (query.studentId) where.studentId = String(query.studentId);
    return prisma.reportCard.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNumber: true,
            className: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  publishReportCard: async (user, id, fileUrl) => {
    const schoolId = schoolIdOf(user);
    const reportCard = await prisma.reportCard.findFirst({
      where: { id, schoolId },
    });
    if (!reportCard)
      throw Object.assign(new Error("Report card not found"), {
        statusCode: 404,
      });
    const normalizedUrl = String(fileUrl || reportCard.fileUrl || "").trim();
    if (!normalizedUrl)
      throw Object.assign(
        new Error("fileUrl is required to publish a report card"),
        { statusCode: 400 },
      );
    return prisma.reportCard.update({
      where: { id },
      data: { fileUrl: normalizedUrl },
    });
  },
};
