import crypto from "crypto";
import { prisma } from "../config/db.js";

const makeApplicationCode = (schoolId) => {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ADM-${schoolId}-${timestamp}-${random}`;
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveSchoolId = async (preferredSchoolId) => {
  if (preferredSchoolId) {
    const parsed = Number.parseInt(String(preferredSchoolId), 10);
    if (!Number.isNaN(parsed)) {
      const school = await prisma.school.findUnique({
        where: { id: parsed },
        select: { id: true },
      });
      if (school) return school.id;
    }
  }

  const defaultSchool = await prisma.school.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  if (!defaultSchool) {
    const error = new Error("No active school available for application submissions");
    error.statusCode = 400;
    throw error;
  }

  return defaultSchool.id;
};

const safeAdmission = (admission) => ({
  id: admission.id,
  schoolId: admission.schoolId,
  applicationCode: admission.applicationCode,
  applicantName: admission.applicantName,
  intendedClass: admission.intendedClass,
  applicantGender: admission.applicantGender,
  status: admission.status,
  createdAt: admission.createdAt,
  updatedAt: admission.updatedAt,
  parentEmail: admission.parentEmail,
  parentPhone: admission.parentPhone,
});

export const admissionService = {
  list: async ({ page = 1, limit = 25, search = "", status = "", className = "" } = {}, user) => {
    const currentPage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
    const pageSize = Math.max(1, Math.min(200, Number(limit) || 25));
    const where = {};

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { applicantName: { contains: q, mode: "insensitive" } },
        { applicationCode: { contains: q, mode: "insensitive" } },
        { parentEmail: { contains: q, mode: "insensitive" } },
        { parentPhone: { contains: q, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = String(status).trim();
    }

    if (className) {
      where.intendedClass = String(className).trim();
    }

    const [total, admissions] = await Promise.all([
      prisma.admission.count({ where }),
      prisma.admission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      admissions: admissions.map(safeAdmission),
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },

  getById: async (id, user) => {
    const admission = await prisma.admission.findUnique({ where: { id } });
    if (!admission) {
      const error = new Error("Admission not found");
      error.statusCode = 404;
      throw error;
    }

    return admission;
  },

  create: async (payload) => {
    const schoolId = await resolveSchoolId(payload.schoolId);
    const applicantName = String(
      payload.applicantName ||
        [payload.applicantFirstName, payload.applicantMiddleName, payload.applicantLastName]
          .filter(Boolean)
          .join(" "),
    ).trim();

    const admission = await prisma.admission.create({
      data: {
        schoolId,
        applicationCode: makeApplicationCode(schoolId),
        applicantName,
        applicantFirstName: payload.applicantFirstName || "",
        applicantMiddleName: payload.applicantMiddleName || "",
        applicantLastName: payload.applicantLastName || "",
        parentEmail: payload.parentEmail || "",
        parentPhone: payload.parentPhone1 || payload.parentPhone2 || "",
        intendedClass: payload.intendedClass || "",
        applicantGender: payload.applicantGender || "",
        applicantDob: parseDate(payload.applicantDob),
        applicantPlaceOfBirth: payload.applicantPlaceOfBirth || "",
        applicantNationality: payload.applicantNationality || "",
        applicantStateOfOrigin: payload.applicantStateOfOrigin || "",
        applicantLga: payload.applicantLga || "",
        applicantLin: payload.applicantLin || "",
        studentType: payload.studentType || "",
        previousSchool: payload.previousSchool || "",
        religion: payload.religion || "",
        ailments: payload.ailments || "",
        challenges: payload.challenges || "",
        bloodGroup: payload.bloodGroup || "",
        genotype: payload.genotype || "",
        maritalStatus: payload.maritalStatus || "",
        fatherName: payload.fatherName || "",
        fatherDob: parseDate(payload.fatherDob),
        fatherAddress: payload.fatherAddress || "",
        fatherOccupation: payload.fatherOccupation || "",
        fatherJobTitle: payload.fatherJobTitle || "",
        fatherEmail: payload.fatherEmail || "",
        fatherPhone1: payload.fatherPhone1 || "",
        fatherPhone2: payload.fatherPhone2 || "",
        motherName: payload.motherName || "",
        motherDob: parseDate(payload.motherDob),
        motherAddress: payload.motherAddress || "",
        motherOccupation: payload.motherOccupation || "",
        motherJobTitle: payload.motherJobTitle || "",
        motherEmail: payload.motherEmail || "",
        motherPhone1: payload.motherPhone1 || "",
        motherPhone2: payload.motherPhone2 || "",
        feePaymentMethod: payload.feePaymentMethod || "",
        referredBy: payload.referredBy || "",
        financialAwareness: Boolean(payload.financialAwareness),
        agreeTerms: Boolean(payload.agreeTerms),
        submissionData: payload.submissionData || payload,
        status: "pending",
      },
    });

    return admission;
  },
};
