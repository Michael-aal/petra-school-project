import crypto from "crypto";
import { prisma } from "../config/db.js";
import { studentModel } from "../models/studentModel.js";
import { logger } from "../utils/logger.js";

const normalizeStatus = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["active", "inactive", "suspended"].includes(normalized)) return normalized;
  return "active";
};

const normalizeGender = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "male") return "Male";
  if (normalized === "female") return "Female";
  return value || "";
};

const makeParentAccessCode = () => `PET-PARENT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
const makeAdmissionNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `PET-${year}-`;
  const latest = await prisma.student.findFirst({
    where: { admissionNumber: { startsWith: prefix } },
    orderBy: { admissionNumber: "desc" },
    select: { admissionNumber: true },
  });
  const current = latest?.admissionNumber?.match(/-(\d+)$/)?.[1];
  const next = String((Number(current) || 0) + 1).padStart(4, "0");
  return `${prefix}${next}`;
};

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const safeStudent = (student) => ({
  id: student.id,
  name:
    student.name ||
    student.user?.fullName ||
    [student.user?.firstName, student.user?.lastName].filter(Boolean).join(" ") ||
    student.admissionNumber ||
    `Student ${String(student.id || "").slice(-4)}`,
  admissionNumber: student.admissionNumber || "",
  status: student.status || "active",
  gender: student.gender || "",
  className: student.className || "",
  dob: student.dob,
  guardianName: student.guardianName || "",
  parentPhone: student.parentPhone || "",
  parentEmail: student.parentEmail || "",
  parentAccessCode: student.parentAccessCode || "",
  parentAccessCodeUsed: Boolean(student.parentAccessCodeUsed),
  parentId: student.parentId || "",
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
  profile: student.profile || null,
  medicalInfo: student.medicalInfo || null,
  parent: student.parent || null,
});

const buildWhere = ({ search, className, gender, status, includeDeleted = false } = {}) => {
  const where = {};
  const trimmedSearch = String(search || "").trim();

  if (className) {
    where.className = className;
  }

  if (gender) {
    where.gender = gender;
  }

  if (status) {
    where.status = normalizeStatus(status);
  }

  if (trimmedSearch) {
    where.OR = [
      { name: { contains: trimmedSearch, mode: "insensitive" } },
      { admissionNumber: { contains: trimmedSearch, mode: "insensitive" } },
      { guardianName: { contains: trimmedSearch, mode: "insensitive" } },
      { parentPhone: { contains: trimmedSearch, mode: "insensitive" } },
    ];
  }

  return where;
};

const resolveSchoolId = async (preferredSchoolId) => {
  if (preferredSchoolId) {
    const parsed = Number.parseInt(String(preferredSchoolId), 10);
    if (!Number.isNaN(parsed)) {
      const school = await prisma.school.findUnique({ where: { id: parsed } });
      if (school) return school.id;
    }
  }

  const existingSchool = await prisma.school.findFirst({ orderBy: { id: "asc" } });
  if (existingSchool) return existingSchool.id;

  const createdSchool = await prisma.school.create({
    data: {
      name: "Petra School",
      address: "Main Campus",
    },
  });

  return createdSchool.id;
};

export const studentService = {
  list: async ({ page = 1, limit = 10, search = "", className = "", gender = "", status = "" } = {}) => {
    const currentPage = Math.max(1, toNumber(page, 1));
    const pageSize = Math.max(1, Math.min(50, toNumber(limit, 10)));
    const where = buildWhere({ search, className, gender, status });
    const [total, students] = await Promise.all([
      studentModel.count(where),
      studentModel.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
          profile: true,
          medicalInfo: true,
        },
      }),
    ]);

    return {
      students: students.map(safeStudent),
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },

  search: async ({ q = "", page = 1, limit = 10 } = {}) =>
    studentService.list({ search: q, page, limit }),

  filter: async ({ className = "", gender = "", status = "", page = 1, limit = 10 } = {}) =>
    studentService.list({ className, gender, status, page, limit }),

  getById: async (id) => {
    const student = await studentModel.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        profile: true,
        medicalInfo: true,
      },
    });
    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }
    return safeStudent(student);
  },

  create: async (payload) => {
    const admissionNumber = String(payload.admissionNumber || "").trim();
    const email = String(payload.parentEmail || "").trim().toLowerCase();
    const phone = String(payload.parentPhone || "").trim();
    const altPhone = String(payload.parentAltPhone || "").trim();
    const studentName = String(payload.name || "").trim();
    const parentName = String(payload.parentName || "").trim();

    if (!studentName) {
      const error = new Error("Student name is required");
      error.statusCode = 400;
      throw error;
    }

    if (!parentName) {
      const error = new Error("Parent name is required");
      error.statusCode = 400;
      throw error;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const error = new Error("Valid parent email is required");
      error.statusCode = 400;
      throw error;
    }

    if (phone && !/^[+()\-.\d\s]{7,20}$/.test(phone)) {
      const error = new Error("Valid parent phone number is required");
      error.statusCode = 400;
      throw error;
    }
    if (altPhone && !/^[+()\-.\d\s]{7,20}$/.test(altPhone)) {
      const error = new Error("Valid alternative phone number is required");
      error.statusCode = 400;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const resolvedAdmissionNumber = admissionNumber || (await makeAdmissionNumber());
      const duplicateAdmission = await tx.student.findFirst({ where: { admissionNumber: resolvedAdmissionNumber } });
      if (duplicateAdmission) {
        const error = new Error("Admission number already exists");
        error.statusCode = 409;
        throw error;
      }

      const schoolId = await resolveSchoolId(payload.schoolId);
      const student = await tx.student.create({
        data: {
          name: studentName,
          admissionNumber: resolvedAdmissionNumber,
          status: normalizeStatus(payload.status),
          gender: normalizeGender(payload.gender),
          dob: payload.dob ? new Date(payload.dob) : null,
          className: payload.className || "",
          guardianName: parentName,
          parentPhone: phone || "",
          parentEmail: email || "",
          schoolId,
          parentAccessCode: makeParentAccessCode(),
          parentAccessCodeUsed: false,
        },
      });
      const studentProfile = await tx.studentProfile.create({
        data: {
          studentId: student.id,
          schoolId,
          admissionNumber: resolvedAdmissionNumber,
          address: payload.studentAddress || "",
          bloodGroup: payload.bloodGroup || "",
          nationality: payload.nationality || "",
          religion: payload.religion || "",
        },
      });
      logger.info("studentService.create: student created", { studentId: student.id, admissionNumber: resolvedAdmissionNumber });

      await tx.student.update({
        where: { id: student.id },
        data: {
          parentId: null,
        },
      });

      const adminUsers = await tx.admin.findMany({
        where: { schoolId },
        select: { userId: true },
      });
      await Promise.all([
        ...adminUsers.map((admin) =>
          tx.notification.create({
            data: {
              schoolId,
              userId: admin.userId,
              title: "Student admitted successfully",
              body: `A new student, ${studentName}, has been admitted. Guardian details were stored for future parent registration.`,
            },
          }),
        ),
      ]);

      return safeStudent({
        ...student,
        name: studentName,
        status: normalizeStatus(payload.status),
        parentEmail: email,
        parentPhone: phone,
        parentAccessCodeUsed: false,
        parentId: null,
        profile: studentProfile,
      });
    });
  },

  update: async (id, payload) => {
    const existing = await studentModel.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    const nextEmail = payload.parentEmail ? String(payload.parentEmail).trim().toLowerCase() : undefined;
    const nextPhone = payload.parentPhone ? String(payload.parentPhone).trim() : undefined;

    if (nextEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      const error = new Error("Valid parent email is required");
      error.statusCode = 400;
      throw error;
    }

    if (nextPhone && !/^[+()\-.\d\s]{7,20}$/.test(nextPhone)) {
      const error = new Error("Valid parent phone number is required");
      error.statusCode = 400;
      throw error;
    }

    const updated = await studentModel.update({
      where: { id },
      data: {
        name: payload.name ? String(payload.name).trim() : undefined,
        status: payload.status ? normalizeStatus(payload.status) : undefined,
        gender: payload.gender ? normalizeGender(payload.gender) : undefined,
        dob: payload.dob ? new Date(payload.dob) : payload.dob === null ? null : undefined,
        className: payload.className,
        guardianName: payload.guardianName,
        parentPhone: nextPhone,
        parentEmail: nextEmail,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        profile: true,
        medicalInfo: true,
      },
    });

    return safeStudent(updated);
  },

  remove: async (id) => {
    const existing = await studentModel.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      await tx.studentParent.deleteMany({ where: { studentId: id } });
      await tx.guardianStudent.deleteMany({ where: { studentId: id } });
      await tx.studentFee.deleteMany({ where: { studentId: id } });
      await tx.invoice.deleteMany({ where: { studentId: id } });
      await tx.payment.deleteMany({ where: { studentId: id } });
      await tx.installmentPlan.deleteMany({ where: { studentId: id } });
      await tx.reportCard.deleteMany({ where: { studentId: id } });
      await tx.assignment.updateMany({ where: { studentId: id }, data: { studentId: null } });
      await tx.examResult.deleteMany({ where: { studentId: id } });
      await tx.studentAttendance.deleteMany({ where: { studentId: id } });
      await tx.studentProfile.deleteMany({ where: { studentId: id } });
      await tx.studentMedicalInfo.deleteMany({ where: { studentId: id } });

      const deleted = await tx.student.delete({ where: { id } });

      return safeStudent(deleted);
    });
  },

  generateParentAccessCode: async (id) => {
    const existing = await studentModel.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    let code = makeParentAccessCode();
    let duplicate = await studentModel.findFirst({ parentAccessCode: code });
    while (duplicate) {
      code = makeParentAccessCode();
      duplicate = await studentModel.findFirst({ parentAccessCode: code });
    }

    const updated = await studentModel.update({
      where: { id },
      data: {
        parentAccessCode: code,
        parentAccessCodeUsed: false,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        profile: true,
        medicalInfo: true,
      },
    });

    return safeStudent(updated);
  },
};
