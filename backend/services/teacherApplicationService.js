import crypto from "node:crypto";
import { prisma } from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";

const clean = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
};

const nullableInt = (value) => {
  const text = clean(value);
  if (!text) return null;
  const parsed = Number(text);
  return Number.isInteger(parsed) ? parsed : null;
};

const nullableDate = (value) => {
  const text = clean(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseJson = (value, fallback = []) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

const normalizeRow = (row) => ({
  ...row,
  applicationNumber: String(row.id || "").replace(/^ta_/, "TA-").toUpperCase(),
  supportingDocuments: parseJson(row.supportingDocuments),
  references: parseJson(row.references),
  submissionData: parseJson(row.submissionData, {}),
});

const makeRegistrationCode = () =>
  `PET-TEACHER-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const makeUsername = async (tx, email) => {
  const base = String(email || "teacher")
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 32) || "teacher";

  let username = base;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const existing = await tx.user.findUnique({ where: { username }, select: { id: true } });
    if (!existing) return username;
    username = `${base}-${crypto.randomBytes(2).toString("hex")}`;
  }
  return `teacher-${crypto.randomBytes(5).toString("hex")}`;
};

const subjectList = (application) => [
  application.majorSubject,
  application.minorSubject,
  ...String(application.subjects || "").split(","),
].map(clean).filter(Boolean).filter((value, index, values) => values.indexOf(value) === index);

const createApprovedTeacher = async (tx, application) => {
  const schoolId = Number(application.schoolId);
  const email = clean(application.email)?.toLowerCase();
  if (!email) throw Object.assign(new Error("Approved teacher application has no email address."), { statusCode: 400 });

  const existingUser = await tx.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingTeacher = await tx.teacher.findUnique({ where: { userId: existingUser.id } });
    if (existingTeacher && Number(existingTeacher.schoolId) === schoolId) {
      const invitation = await tx.staffInvitation.findFirst({
        where: { staffUserId: existingUser.id },
        orderBy: { generatedAt: "desc" },
      });
      if (invitation) {
        return { teacher: existingTeacher, user: existingUser, invitation };
      }
    }
    throw Object.assign(new Error("A user with this teacher's email already exists."), { statusCode: 409 });
  }

  const registrationCode = makeRegistrationCode();
  const username = await makeUsername(tx, email);
  const temporaryPassword = await hashPassword(`Pending-${crypto.randomBytes(16).toString("hex")}`);
  const fullName = [application.firstName, application.middleName, application.lastName].filter(Boolean).join(" ");
  const subjects = subjectList(application);

  const user = await tx.user.create({
    data: {
      firstName: application.firstName,
      middleName: application.middleName || null,
      lastName: application.lastName,
      fullName,
      username,
      email,
      password: temporaryPassword,
      role: "teacher",
      accountStatus: "pending",
      schoolId,
      staffRegistrationCode: registrationCode,
      staffRegistrationCodeUsed: false,
      staffRole: application.positionApplied || "Teacher",
      staffDepartment: application.specialization || "",
      staffClassAssigned: application.classLevels || null,
      staffSubjectsAssigned: subjects,
    },
  });

  const teacher = await tx.teacher.create({
    data: {
      userId: user.id,
      schoolId,
      designation: application.positionApplied || "Teacher",
      isActive: true,
    },
  });

  const invitation = await tx.staffInvitation.create({
    data: {
      staffName: fullName || "Teacher",
      email,
      role: "Teacher",
      department: application.specialization || null,
      assignedClass: application.classLevels || null,
      assignedSubjects: subjects,
      employmentStatus: "active",
      registrationCode,
      generatedBy: null,
      schoolId,
      status: "unused",
      staffUserId: user.id,
    },
  });

  return { teacher, user, invitation };
};

export const teacherApplicationService = {
  create: async ({ schoolId, payload }) => {
    const id = `ta_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const firstName = clean(payload.firstName);
    const lastName = clean(payload.lastName);
    const email = clean(payload.email)?.toLowerCase();
    const phone = clean(payload.phone);

    if (!firstName || !lastName || !email || !phone) {
      const error = new Error("First name, last name, email and phone are required.");
      error.statusCode = 400;
      throw error;
    }
    if (!payload.declarationAccepted) {
      const error = new Error("You must accept the declaration before submitting.");
      error.statusCode = 400;
      throw error;
    }

    const school = await prisma.school.findFirst({
      where: { id: Number(schoolId), isActive: true },
      select: { id: true },
    });
    if (!school) {
      const error = new Error("The selected school is not available.");
      error.statusCode = 404;
      throw error;
    }

    const duplicate = await prisma.$queryRaw`
      SELECT "id" FROM "TeacherApplication"
      WHERE "schoolId" = ${Number(schoolId)}
        AND lower("email") = lower(${email})
        AND "status" IN ('pending', 'shortlisted', 'approved')
      LIMIT 1
    `;
    if (duplicate.length) {
      const error = new Error("An active teacher application already exists for this email address.");
      error.statusCode = 409;
      throw error;
    }

    const submissionData = JSON.stringify(payload);
    const supportingDocuments = JSON.stringify(payload.supportingDocuments || []);
    const references = JSON.stringify(payload.references || []);

    await prisma.$executeRaw`
      INSERT INTO "TeacherApplication" (
        "id", "schoolId", "status", "firstName", "middleName", "lastName", "email", "phone",
        "gender", "dateOfBirth", "nationality", "stateOfOrigin", "lga", "maritalStatus", "address", "nin",
        "qualification", "institution", "course", "graduationYear", "teachingQualification", "trcnNumber",
        "specialization", "majorSubject", "minorSubject", "experienceYears", "previousSchools",
        "positionApplied", "subjects", "classLevels", "employmentType", "availableStartDate", "expectedSalary",
        "cvUrl", "supportingDocuments", "references", "declarationAccepted", "submissionData", "updatedAt"
      ) VALUES (
        ${id}, ${Number(schoolId)}, 'pending', ${firstName}, ${clean(payload.middleName)}, ${lastName}, ${email}, ${phone},
        ${clean(payload.gender)}, ${nullableDate(payload.dateOfBirth)}, ${clean(payload.nationality)}, ${clean(payload.stateOfOrigin)},
        ${clean(payload.lga)}, ${clean(payload.maritalStatus)}, ${clean(payload.address)}, ${clean(payload.nin)},
        ${clean(payload.qualification)}, ${clean(payload.institution)}, ${clean(payload.course)}, ${nullableInt(payload.graduationYear)},
        ${clean(payload.teachingQualification)}, ${clean(payload.trcnNumber)}, ${clean(payload.specialization)}, ${clean(payload.majorSubject)},
        ${clean(payload.minorSubject)}, ${nullableInt(payload.experienceYears)}, ${clean(payload.previousSchools)},
        ${clean(payload.positionApplied)}, ${clean(payload.subjects)}, ${clean(payload.classLevels)}, ${clean(payload.employmentType)},
        ${nullableDate(payload.availableStartDate)}, ${clean(payload.expectedSalary)}, ${clean(payload.cvUrl)},
        ${supportingDocuments}::jsonb, ${references}::jsonb, true, ${submissionData}::jsonb, CURRENT_TIMESTAMP
      )
    `;

    return {
      id,
      status: "pending",
      applicationNumber: id.replace(/^ta_/, "TA-").toUpperCase(),
      message: "Teacher application submitted successfully. The school will review your application.",
    };
  },

  list: async ({ status, query, limit = 200 }) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 200);
    const normalizedStatus = clean(status)?.toLowerCase();
    const search = clean(query)?.toLowerCase();

    const rows = await prisma.$queryRaw`
      SELECT * FROM "TeacherApplication"
      WHERE (${normalizedStatus || null}::text IS NULL OR lower("status") = ${normalizedStatus || null})
        AND (${search || null}::text IS NULL OR
          lower(concat_ws(' ', "firstName", "middleName", "lastName")) LIKE ${search ? `%${search}%` : null} OR
          lower("email") LIKE ${search ? `%${search}%` : null} OR
          lower("id") LIKE ${search ? `%${search}%` : null} OR
          lower("positionApplied") LIKE ${search ? `%${search}%` : null})
      ORDER BY "createdAt" DESC
      LIMIT ${safeLimit}
    `;

    return rows.map(normalizeRow);
  },

  getById: async ({ id }) => {
    const rows = await prisma.$queryRaw`
      SELECT * FROM "TeacherApplication"
      WHERE "id" = ${String(id)}
      LIMIT 1
    `;
    if (!rows.length) {
      const error = new Error("Teacher application not found.");
      error.statusCode = 404;
      throw error;
    }
    return normalizeRow(rows[0]);
  },

  updateStatus: async ({ id, status }) => {
    const allowed = new Set(["pending", "shortlisted", "rejected", "approved"]);
    const nextStatus = clean(status)?.toLowerCase();
    if (!allowed.has(nextStatus)) {
      const error = new Error("Invalid teacher application status.");
      error.statusCode = 400;
      throw error;
    }

    if (nextStatus !== "approved") {
      const rows = await prisma.$queryRaw`
        UPDATE "TeacherApplication"
        SET "status" = ${nextStatus}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${String(id)}
        RETURNING *
      `;
      if (!rows.length) {
        const error = new Error("Teacher application not found.");
        error.statusCode = 404;
        throw error;
      }
      return normalizeRow(rows[0]);
    }

    return prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw`
        SELECT * FROM "TeacherApplication"
        WHERE "id" = ${String(id)}
        FOR UPDATE
      `;
      if (!locked.length) {
        const error = new Error("Teacher application not found.");
        error.statusCode = 404;
        throw error;
      }

      const application = locked[0];
      const { teacher, invitation } = await createApprovedTeacher(tx, application);

      await tx.$executeRaw`
        UPDATE "TeacherApplication"
        SET "status" = 'approved', "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${String(id)}
      `;

      const updatedRows = await tx.$queryRaw`
        SELECT * FROM "TeacherApplication"
        WHERE "id" = ${String(id)}
        LIMIT 1
      `;

      return {
        ...normalizeRow(updatedRows[0]),
        teacherId: teacher.id,
        registrationCode: invitation.registrationCode,
        registrationPath: `/register/teacher-account?code=${encodeURIComponent(invitation.registrationCode)}`,
      };
    });
  },
};
