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
  studentId: admission.studentId,
  applicationCode: admission.applicationCode,
  admissionCode: admission.admissionCode,
  applicantName: admission.applicantName,
  intendedClass: admission.intendedClass,
  applicantGender: admission.applicantGender,
  status: admission.status,
  approvedAt: admission.approvedAt,
  approvedBy: admission.approvedBy,
  rejectedAt: admission.rejectedAt,
  rejectedBy: admission.rejectedBy,
  rejectionReason: admission.rejectionReason,
  examScore: admission.examScore,
  examCompletedAt: admission.examCompletedAt,
  examResult: admission.examResult,
  examReference: admission.examReference,
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

    return safeAdmission(admission);
  },

  approve: async (id, userId) => {
    const admission = await prisma.admission.findUnique({ where: { id } });
    if (!admission) {
      const error = new Error("Admission not found");
      error.statusCode = 404;
      throw error;
    }

    if (admission.status !== "pending") {
      const error = new Error("Only pending applications can be approved");
      error.statusCode = 400;
      throw error;
    }

    const updated = await prisma.admission.update({
      where: { id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });

    return safeAdmission(updated);
  },


  enroll: async (id, userId, payload = {}) => {
    const admission = await prisma.admission.findUnique({ where: { id } });
    if (!admission) {
      const error = new Error("Admission not found");
      error.statusCode = 404;
      throw error;
    }
    if (!["admission_offered", "passed"].includes(admission.status) && !admission.admissionCode) {
      const error = new Error("Only applicants who have been offered admission can be enrolled");
      error.statusCode = 400;
      throw error;
    }
    if (admission.studentId) {
      return safeAdmission(admission);
    }

    const schoolId = admission.schoolId;
    const className = String(payload.className || admission.intendedClass || "").trim();
    const admissionNumber = String(payload.admissionNumber || `STU-${schoolId}-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`).slice(0, 40);

    const enrolled = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          schoolId,
          name: admission.applicantName || [admission.applicantFirstName, admission.applicantMiddleName, admission.applicantLastName].filter(Boolean).join(" "),
          admissionNumber,
          className,
          dob: admission.applicantDob,
          gender: admission.applicantGender || null,
          parentEmail: admission.parentEmail || admission.fatherEmail || admission.motherEmail || null,
          parentPhone: admission.parentPhone || admission.fatherPhone1 || admission.motherPhone1 || null,
          guardianName: admission.fatherName || admission.motherName || null,
          status: "active",
        },
      });

      await tx.studentProfile.create({
        data: {
          studentId: student.id,
          schoolId,
          admissionNumber,
          address: admission.fatherAddress || admission.motherAddress || null,
          bloodGroup: admission.bloodGroup || null,
          nationality: admission.applicantNationality || null,
          religion: admission.religion || null,
        },
      });

      const parentInputs = [
        { name: admission.fatherName, email: admission.fatherEmail, phone: admission.fatherPhone1 || admission.fatherPhone2, relation: "father" },
        { name: admission.motherName, email: admission.motherEmail, phone: admission.motherPhone1 || admission.motherPhone2, relation: "mother" },
      ].filter((p) => p.name || p.email || p.phone);

      let primaryParentId = null;
      for (const parentInput of parentInputs) {
        const email = String(parentInput.email || "").trim().toLowerCase();
        let parent = email
          ? await tx.parent.findFirst({ where: { schoolId, email } })
          : null;
        if (!parent) {
          parent = await tx.parent.create({
            data: {
              schoolId,
              name: parentInput.name || "Parent/Guardian",
              email: email || null,
              phone: parentInput.phone || null,
            },
          });
        }
        await tx.studentParent.upsert({
          where: { studentId_parentId: { studentId: student.id, parentId: parent.id } },
          create: { studentId: student.id, parentId: parent.id, relation: parentInput.relation },
          update: { relation: parentInput.relation },
        });
        if (!primaryParentId) primaryParentId = parent.id;
      }

      if (primaryParentId) {
        await tx.student.update({ where: { id: student.id }, data: { parentId: primaryParentId } });
      }

      let classRecord = null;
      if (payload.classId) {
        classRecord = await tx.class.findFirst({ where: { id: String(payload.classId), schoolId } });
      } else if (className) {
        classRecord = await tx.class.findFirst({ where: { schoolId, name: className } });
      }

      const enrollment = await tx.enrollment.create({
        data: {
          schoolId,
          studentId: student.id,
          classId: classRecord?.id || null,
          sectionId: payload.sectionId || null,
          academicYearId: admission.academicYearId || null,
          termId: admission.termId || null,
          status: "active",
        },
      });

      const updatedAdmission = await tx.admission.update({
        where: { id: admission.id },
        data: { studentId: student.id, status: "enrolled", admissionDate: new Date() },
      });

      return { student, enrollment, admission: updatedAdmission };
    });

    return safeAdmission(enrolled.admission);
  },

  reject: async (id, userId, reason = "") => {
    const admission = await prisma.admission.findUnique({ where: { id } });
    if (!admission) {
      const error = new Error("Admission not found");
      error.statusCode = 404;
      throw error;
    }

    if (admission.status !== "pending") {
      const error = new Error("Only pending applications can be rejected");
      error.statusCode = 400;
      throw error;
    }

    const updated = await prisma.admission.update({
      where: { id },
      data: {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: userId,
        rejectionReason: reason || "",
      },
    });

    return safeAdmission(updated);
  },
create: async (payload) => {
  const schoolId = await resolveSchoolId(payload.schoolId);

  // Accept the current frontend field names
  // and map them to the existing Prisma/database field names.
  const applicantFirstName =
    payload.applicantFirstName || payload.firstName || "";

  const applicantMiddleName =
    payload.applicantMiddleName || payload.middleName || "";

  const applicantLastName =
    payload.applicantLastName || payload.lastName || "";

  const applicantGender =
    payload.applicantGender || payload.gender || "";

  const applicantDob =
    payload.applicantDob || payload.dob;

  const applicantPlaceOfBirth =
    payload.applicantPlaceOfBirth || payload.placeOfBirth || "";

  const applicantNationality =
    payload.applicantNationality || payload.nationality || "";

  const applicantStateOfOrigin =
    payload.applicantStateOfOrigin || payload.stateOfOrigin || "";

  const applicantLga =
    payload.applicantLga || payload.lga || "";

  const applicantLin =
    payload.applicantLin || payload.lin || "";

  const intendedClass =
    payload.intendedClass || payload.admissionClass || "";

  const studentType =
    payload.studentType || payload.studentStatus || "";

  const applicantName = String(
    payload.applicantName ||
      [
        applicantFirstName,
        applicantMiddleName,
        applicantLastName,
      ]
        .filter(Boolean)
        .join(" ")
  ).trim();

  const admission = await prisma.admission.create({
    data: {
      schoolId,
      applicationCode: makeApplicationCode(schoolId),

      // Applicant
      applicantName,
      applicantFirstName,
      applicantMiddleName,
      applicantLastName,
      applicantGender,
      applicantDob: parseDate(applicantDob),
      applicantPlaceOfBirth,
      applicantNationality,
      applicantStateOfOrigin,
      applicantLga,
      applicantLin,

      // Admission
      intendedClass,
      studentType,
      previousSchool: payload.previousSchool || "",
      religion: payload.religion || "",

      // Other applicant information
      ailments: payload.ailments || "",
      challenges: payload.challenges || "",
      bloodGroup: payload.bloodGroup || "",
      genotype: payload.genotype || "",
      maritalStatus: payload.maritalStatus || "",

      // Parent
      parentEmail:
        payload.parentEmail ||
        payload.fatherEmail ||
        payload.motherEmail ||
        "",

      parentPhone:
        payload.parentPhone1 ||
        payload.parentPhone2 ||
        payload.fatherPhone1 ||
        payload.motherPhone1 ||
        "",

      // Father
      fatherName: payload.fatherName || "",
      fatherDob: parseDate(payload.fatherDob),
      fatherAddress: payload.fatherAddress || "",
      fatherOccupation: payload.fatherOccupation || "",
      fatherJobTitle: payload.fatherJobTitle || "",
      fatherEmail: payload.fatherEmail || "",
      fatherPhone1: payload.fatherPhone1 || "",
      fatherPhone2: payload.fatherPhone2 || "",

      // Mother
      motherName: payload.motherName || "",
      motherDob: parseDate(payload.motherDob),
      motherAddress: payload.motherAddress || "",
      motherOccupation: payload.motherOccupation || "",
      motherJobTitle: payload.motherJobTitle || "",
      motherEmail: payload.motherEmail || "",
      motherPhone1: payload.motherPhone1 || "",
      motherPhone2: payload.motherPhone2 || "",

      // Application
      feePaymentMethod: payload.feePaymentMethod || "",
      referredBy: payload.referredBy || "",
      financialAwareness: Boolean(payload.financialAwareness),
      agreeTerms:
        payload.agreeTerms === true ||
        payload.agreeTerms === "true",

      submissionData: payload.submissionData || payload,

      status: "pending",
    },
  });

  return admission;
},
}