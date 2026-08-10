import { enrollmentModel } from "../models/enrollmentModel.js";
import { studentModel } from "../models/studentModel.js";

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const safeEnrollment = (enrollment) => ({
  id: enrollment.id,
  schoolId: enrollment.schoolId,
  studentId: enrollment.studentId,
  student: enrollment.student
    ? {
        id: enrollment.student.id,
        name: enrollment.student.name || enrollment.student.admissionNumber || "Unknown Student",
        admissionNumber: enrollment.student.admissionNumber || "",
        className: enrollment.student.className || "",
      }
    : null,
  classId: enrollment.classId,
  sectionId: enrollment.sectionId,
  status: enrollment.status || "active",
  academicYearId: enrollment.academicYearId,
  termId: enrollment.termId,
  enrolledAt: enrollment.enrolledAt,
  createdAt: enrollment.createdAt,
  updatedAt: enrollment.updatedAt,
});

export const enrollmentService = {
  getEnrollmentStats: async (user) => {
    const schoolId = user?.schoolId;
    const where = schoolId ? { schoolId } : {};
    const [total, active, pending] = await Promise.all([
      enrollmentModel.count({ where }),
      enrollmentModel.count({ where: { ...where, status: "active" } }),
      enrollmentModel.count({ where: { ...where, status: "pending" } }),
    ]);

    const totalStudents = await studentModel.count({ where });

    return {
      totalEnrollments: total,
      activeEnrollments: active,
      pendingEnrollments: pending,
      totalStudents,
    };
  },

  list: async ({ page = 1, limit = 10, status = "", search = "" } = {}, user) => {
    const currentPage = Math.max(1, toNumber(page, 1));
    const pageSize = Math.max(1, Math.min(50, toNumber(limit, 10)));

    const where = {};
    const schoolId = user?.schoolId;
    if (schoolId) where.schoolId = schoolId;
    if (status) where.status = status;
    if (search) {
      const trimmed = String(search).trim();
      where.OR = [
        { student: { name: { contains: trimmed, mode: "insensitive" } } },
        { student: { admissionNumber: { contains: trimmed, mode: "insensitive" } } },
      ];
    }

    const [total, enrollments] = await Promise.all([
      enrollmentModel.count({ where }),
      enrollmentModel.findMany({
        where,
        orderBy: { enrolledAt: "desc" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
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
      }),
    ]);

    return {
      enrollments: enrollments.map(safeEnrollment),
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },

  getById: async (id, user) => {
    const enrollment = await enrollmentModel.findUnique({
      where: { id },
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
    });
    if (!enrollment) {
      const error = new Error("Enrollment not found");
      error.statusCode = 404;
      throw error;
    }
    const schoolId = user?.schoolId;
    if (schoolId && Number(enrollment.schoolId) !== Number(schoolId)) {
      const error = new Error("Enrollment not found");
      error.statusCode = 404;
      throw error;
    }
    return safeEnrollment(enrollment);
  },

  create: async (payload) => {
    if (!payload.studentId) {
      const error = new Error("Student ID is required");
      error.statusCode = 400;
      throw error;
    }

    const student = await studentModel.findUnique({ where: { id: payload.studentId } });
    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    const enrollment = await enrollmentModel.create({
      data: {
        schoolId: payload.schoolId,
        studentId: payload.studentId,
        classId: payload.classId || null,
        sectionId: payload.sectionId || null,
        academicYearId: payload.academicYearId || null,
        termId: payload.termId || null,
        enrolledAt: payload.enrolledAt ? new Date(payload.enrolledAt) : undefined,
        status: payload.status || "active",
      },
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
    });

    return safeEnrollment(enrollment);
  },

  update: async (id, payload, user) => {
    const existing = await enrollmentModel.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error("Enrollment not found");
      error.statusCode = 404;
      throw error;
    }
    const schoolId = user?.schoolId;
    if (schoolId && Number(existing.schoolId) !== Number(schoolId)) {
      const error = new Error("Enrollment not found");
      error.statusCode = 404;
      throw error;
    }

    const updated = await enrollmentModel.update({
      where: { id },
      data: {
        classId: payload.classId,
        sectionId: payload.sectionId,
        academicYearId: payload.academicYearId,
        termId: payload.termId,
        status: payload.status,
      },
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
    });

    return safeEnrollment(updated);
  },

  remove: async (id, user) => {
    const existing = await enrollmentModel.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error("Enrollment not found");
      error.statusCode = 404;
      throw error;
    }
    const schoolId = user?.schoolId;
    if (schoolId && Number(existing.schoolId) !== Number(schoolId)) {
      const error = new Error("Enrollment not found");
      error.statusCode = 404;
      throw error;
    }

    await enrollmentModel.delete({ where: { id } });
  },
};
