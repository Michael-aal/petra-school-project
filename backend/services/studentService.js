import crypto from "crypto";
import { prisma } from "../config/db.js";
import { studentModel } from "../models/studentModel.js";

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

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const safeStudent = (student) => ({
  id: student.id,
  name: student.name || "",
  admissionNumber: student.admissionNumber || "",
  gender: student.gender || "",
  className: student.className || "",
  dob: student.dob,
  guardianName: student.guardianName || "",
  parentPhone: student.parentPhone || "",
  parentEmail: student.parentEmail || "",
  address: student.address || "",
  status: normalizeStatus(student.status),
  deletedAt: student.deletedAt,
  parentAccessCode: student.parentAccessCode || "",
  parentAccessCodeUsed: Boolean(student.parentAccessCodeUsed),
  parentId: student.parentId || "",
  parent: student.parent || null,
});

const buildWhere = ({ search, className, gender, status, includeDeleted = false } = {}) => {
  const where = {};
  const trimmedSearch = String(search || "").trim();

  if (!includeDeleted) {
    where.deletedAt = null;
  }

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
        orderBy: { id: "desc" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        include: { parent: true },
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
    const student = await studentModel.findUnique({ id });
    if (!student || student.deletedAt) {
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

    if (!payload.name?.trim()) {
      const error = new Error("Student name is required");
      error.statusCode = 400;
      throw error;
    }

    if (!admissionNumber) {
      const error = new Error("Admission number is required");
      error.statusCode = 400;
      throw error;
    }

    const duplicateAdmission = await studentModel.findFirst({ admissionNumber });
    if (duplicateAdmission) {
      const error = new Error("Admission number already exists");
      error.statusCode = 409;
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

    const student = await studentModel.create({
      data: {
        name: payload.name.trim(),
        admissionNumber,
        gender: normalizeGender(payload.gender),
        dob: payload.dob ? new Date(payload.dob) : null,
        className: payload.className || "",
        guardianName: payload.guardianName || "",
        parentPhone: phone || "",
        parentEmail: email || "",
        address: payload.address || "",
        status: normalizeStatus(payload.status),
        parentAccessCode: makeParentAccessCode(),
        parentAccessCodeUsed: false,
        schoolId: await resolveSchoolId(payload.schoolId),
      },
      include: { parent: true },
    });

    return safeStudent(student);
  },

  update: async (id, payload) => {
    const existing = await studentModel.findUnique({ id });
    if (!existing || existing.deletedAt) {
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
        name: payload.name?.trim(),
        gender: payload.gender ? normalizeGender(payload.gender) : undefined,
        dob: payload.dob ? new Date(payload.dob) : payload.dob === null ? null : undefined,
        className: payload.className,
        guardianName: payload.guardianName,
        parentPhone: nextPhone,
        parentEmail: nextEmail,
        address: payload.address,
        status: payload.status ? normalizeStatus(payload.status) : undefined,
      },
    });

    return safeStudent(updated);
  },

  remove: async (id) => {
    const existing = await studentModel.findUnique({ id });
    if (!existing || existing.deletedAt) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    const updated = await studentModel.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "inactive",
      },
    });

    return safeStudent(updated);
  },

  generateParentAccessCode: async (id) => {
    const existing = await studentModel.findUnique({ id });
    if (!existing || existing.deletedAt) {
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
    });

    return safeStudent(updated);
  },
};
