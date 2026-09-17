import crypto from "crypto";
import { recordAuditMutation } from "../middleware/audit.js";
import { prisma } from "../config/db.js";
import { getSchoolId } from "../utils/authorization.js";

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

export const resolveSchoolId = async (preferredSchoolId, user = null) => {
  const authenticatedSchoolId = getSchoolId(user);
  if (authenticatedSchoolId) {
    return authenticatedSchoolId;
  }

  const parsedSchoolId = Number.parseInt(String(preferredSchoolId ?? ""), 10);
  if (!Number.isInteger(parsedSchoolId) || parsedSchoolId <= 0) {
    const error = new Error("A valid school context is required for admission submission");
    error.statusCode = 400;
    throw error;
  }

  const school = await prisma.school.findUnique({
    where: { id: parsedSchoolId },
    select: { id: true },
  });

  if (!school) {
    const error = new Error("The requested school could not be found");
    error.statusCode = 400;
    throw error;
  }

  return school.id;
};

const safeAdmission = (admission) => {
  const remarks = parseRemarks(admission) || {};

  const applicantName =
    admission.applicantName ||
    remarks.applicantName ||
    [remarks.applicantFirstName, remarks.applicantMiddleName, remarks.applicantLastName]
      .filter(Boolean)
      .join(" ") ||
    null;

  const intendedClass = admission.intendedClass || remarks.intendedClass || remarks.admissionClass || null;
  const applicantGender = admission.applicantGender || remarks.applicantGender || remarks.gender || null;
  const parentEmail = admission.parentEmail || remarks.parentEmail || remarks.fatherEmail || remarks.motherEmail || null;
  const parentPhone = admission.parentPhone || remarks.parentPhone || remarks.fatherPhone1 || remarks.motherPhone1 || null;

  const guardianName =
    admission.guardianName || remarks.guardianName || remarks.fatherName || remarks.motherName || null;

  const applicationCode = admission.applicationCode || remarks.applicationCode || null;
  const admissionCode = admission.admissionCode || remarks.admissionCode || null;
  const applicantId = admission.applicantId || remarks.applicantId || null;

  const createdAt = admission.createdAt || parseDate(remarks._generatedAt) || admission.updatedAt || null;

  return {
    id: admission.id,
    schoolId: admission.schoolId,
    studentId: admission.studentId,
    applicantId,
    applicationCode,
    admissionCode,
    applicantName,
    intendedClass,
    applicantGender,
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
    createdAt,
    updatedAt: admission.updatedAt,
    parentEmail,
    parentPhone,
    guardianName,
  };
};

const parseRemarks = (admission) => {
  if (!admission) return null;

  const parseValue = (value) => {
    if (!value) return {};
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch (e) {
      return {};
    }
  };

  const submissionData = parseValue(admission.submissionData);
  const remarks = parseValue(admission.remarks);
  return { ...submissionData, ...remarks };
};

const getAdmissionForUser = async (id, user) => {
  const schoolId = Number(user?.schoolId);
  const admission = Number.isInteger(schoolId) && schoolId > 0
    ? await prisma.admission.findFirst({ where: { id, schoolId } })
    : await prisma.admission.findUnique({ where: { id } });
  if (!admission) {
    const error = new Error("Admission not found");
    error.statusCode = 404;
    throw error;
  }
  return admission;
};

let _admissionColumnsCache = null;
const getAdmissionColumns = async () => {
  if (_admissionColumnsCache) return _admissionColumnsCache;
  try {
    const rows = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name ILIKE 'admission' AND column_name IN ('applicationCode','admissionCode','examReference','applicantId')
    `;
    const cols = (rows || []).map((r) => String(r.column_name || r.columnname || '').toLowerCase());
    _admissionColumnsCache = new Set(cols);
    return _admissionColumnsCache;
  } catch (err) {
    _admissionColumnsCache = new Set();
    return _admissionColumnsCache;
  }
};

const getAllAdmissionColumns = async () => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name ILIKE 'admission'
      ORDER BY ordinal_position
    `;
    return new Set((rows || []).map((r) => String(r.column_name || r.columnname || '').toLowerCase()));
  } catch (err) {
    return new Set();
  }
};

export const admissionService = {
  list: async ({ page = 1, limit = 25, search = "", status = "", className = "" } = {}, user) => {
    const currentPage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
    const pageSize = Math.max(1, Math.min(200, Number(limit) || 25));
    const where = Number(user?.schoolId) > 0 ? { schoolId: Number(user.schoolId) } : {};

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { applicantName: { contains: q, mode: "insensitive" } },
        { applicationCode: { contains: q, mode: "insensitive" } },
        { applicantId: { contains: q, mode: "insensitive" } },
        { examReference: { contains: q, mode: "insensitive" } },
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
    return safeAdmission(await getAdmissionForUser(id, user));
  },

  approve: async (id, userId, schoolId) => {
    const admission = await getAdmissionForUser(id, { schoolId });

    if (admission.status !== "pending") {
      const error = new Error("Only pending applications can be approved");
      error.statusCode = 400;
      throw error;
    }

    const updated = await prisma.admission.update({
      where: { id: admission.id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });
    await recordAuditMutation({ user: { id: userId }, schoolId: updated.schoolId, entity: "Admission", entityId: updated.id, action: "APPROVE", actionType: "ADMISSION", before: admission, after: updated });

    return safeAdmission(updated);
  },

  enroll: async (id, userId, payload = {}, schoolId) => {
    const admission = await getAdmissionForUser(id, { schoolId });
    if (!["approved", "admission_offered", "passed"].includes(admission.status)) {
      const error = new Error("Only approved applicants can be enrolled");
      error.statusCode = 400;
      throw error;
    }
    if (admission.studentId) {
      return safeAdmission(admission);
    }

    const effectiveSchoolId = Number(admission.schoolId ?? schoolId);
    if (!Number.isInteger(effectiveSchoolId) || effectiveSchoolId <= 0) {
      const error = new Error("A valid school context is required for enrollment");
      error.statusCode = 400;
      throw error;
    }

    const remarks = parseRemarks(admission) || {};
    const firstName = admission.applicantFirstName || remarks.applicantFirstName || remarks.firstName || null;
    const middleName = admission.applicantMiddleName || remarks.applicantMiddleName || remarks.middleName || null;
    const lastName = admission.applicantLastName || remarks.applicantLastName || remarks.lastName || null;
    const applicantName =
      admission.applicantName ||
      remarks.applicantName ||
      [firstName, middleName, lastName].filter(Boolean).join(" ") ||
      null;
    const className = String(
      payload.className || admission.intendedClass || remarks.intendedClass || remarks.admissionClass || "",
    ).trim();
    const applicantDob = admission.applicantDob || parseDate(remarks.applicantDob || remarks.dob);
    const applicantGender = admission.applicantGender || remarks.applicantGender || remarks.gender || null;
    const parentEmail = String(
      admission.parentEmail || remarks.parentEmail || admission.fatherEmail || remarks.fatherEmail || admission.motherEmail || remarks.motherEmail || "",
    ).trim().toLowerCase() || null;
    const parentPhone =
      admission.parentPhone || remarks.parentPhone || admission.fatherPhone1 || remarks.fatherPhone1 || admission.motherPhone1 || remarks.motherPhone1 || null;
    const guardianName =
      admission.guardianName || remarks.guardianName || admission.fatherName || remarks.fatherName || admission.motherName || remarks.motherName || null;
    const address =
      admission.fatherAddress || remarks.fatherAddress || admission.motherAddress || remarks.motherAddress || remarks.address || null;
    const nationality = admission.applicantNationality || remarks.applicantNationality || remarks.nationality || null;
    const religion = admission.religion || remarks.religion || null;
    const bloodGroup = admission.bloodGroup || remarks.bloodGroup || null;
    const fatherName = admission.fatherName || remarks.fatherName || null;
    const fatherEmail = String(admission.fatherEmail || remarks.fatherEmail || "").trim().toLowerCase() || null;
    const fatherPhone = admission.fatherPhone1 || remarks.fatherPhone1 || admission.fatherPhone2 || remarks.fatherPhone2 || null;
    const motherName = admission.motherName || remarks.motherName || null;
    const motherEmail = String(admission.motherEmail || remarks.motherEmail || "").trim().toLowerCase() || null;
    const motherPhone = admission.motherPhone1 || remarks.motherPhone1 || admission.motherPhone2 || remarks.motherPhone2 || null;
    const admissionNumber = String(
      payload.admissionNumber ||
        `STU-${effectiveSchoolId}-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    ).slice(0, 40);

    const enrolled = await prisma.$transaction(async (tx) => {
      // Serialize enrollment attempts for the same admission. This prevents two
      // concurrent clicks/webhooks from both observing studentId as null.
      await tx.$queryRaw`
        SELECT "id" FROM "Admission"
        WHERE "id" = ${admission.id} AND "schoolId" = ${effectiveSchoolId}
        FOR UPDATE
      `;

      const lockedAdmission = await tx.admission.findFirst({
        where: { id: admission.id, schoolId: effectiveSchoolId },
      });

      if (!lockedAdmission) {
        const error = new Error("Admission not found");
        error.statusCode = 404;
        throw error;
      }

      if (lockedAdmission.studentId) {
        return { admission: lockedAdmission, alreadyEnrolled: true };
      }

      let student = await tx.student.create({
        data: {
          schoolId: effectiveSchoolId,
          name: applicantName,
          admissionNumber,
          className: className || null,
          dob: applicantDob,
          gender: applicantGender,
          parentEmail,
          parentPhone,
          guardianName,
          status: "pending",
        },
      });

      const existingProfile = await tx.studentProfile.findUnique({ where: { studentId: student.id } });
      if (!existingProfile) {
        await tx.studentProfile.create({
          data: {
            studentId: student.id,
            schoolId: effectiveSchoolId,
            admissionNumber,
            address,
            bloodGroup,
            nationality,
            religion,
          },
        });
      }

      const parentInputs = [
        { name: fatherName, email: fatherEmail, phone: fatherPhone, relation: "father" },
        { name: motherName, email: motherEmail, phone: motherPhone, relation: "mother" },
      ].filter((parent) => parent.name || parent.email || parent.phone);

      let primaryParentId = null;
      for (const parentInput of parentInputs) {
        let parent = null;
        if (parentInput.email) {
          parent = await tx.parent.findFirst({
            where: { schoolId: effectiveSchoolId, email: parentInput.email },
          });
        }
        if (!parent && parentInput.phone) {
          parent = await tx.parent.findFirst({
            where: { schoolId: effectiveSchoolId, phone: String(parentInput.phone).trim() },
          });
        }
        if (!parent) {
          parent = await tx.parent.create({
            data: {
              schoolId: effectiveSchoolId,
              name: parentInput.name || "Parent/Guardian",
              email: parentInput.email,
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
        student = await tx.student.update({
          where: { id: student.id },
          data: { parentId: primaryParentId },
        });
      }

      let classRecord = null;
      if (payload.classId) {
        classRecord = await tx.class.findFirst({
          where: { id: String(payload.classId), schoolId: effectiveSchoolId },
        });
      } else if (className) {
        classRecord = await tx.class.findFirst({
          where: { schoolId: effectiveSchoolId, name: className },
        });
      }

      let enrollment = await tx.enrollment.findFirst({
        where: { schoolId: effectiveSchoolId, studentId: student.id },
        orderBy: { createdAt: "desc" },
      });

      if (enrollment) {
        enrollment = await tx.enrollment.update({
          where: { id: enrollment.id },
          data: {
            classId: classRecord?.id || enrollment.classId || null,
            sectionId: payload.sectionId || enrollment.sectionId || null,
            academicYearId: lockedAdmission.academicYearId || enrollment.academicYearId || null,
            termId: lockedAdmission.termId || enrollment.termId || null,
            status: "pending",
          },
        });
      } else {
        enrollment = await tx.enrollment.create({
          data: {
            schoolId: effectiveSchoolId,
            studentId: student.id,
            classId: classRecord?.id || null,
            sectionId: payload.sectionId || null,
            academicYearId: lockedAdmission.academicYearId || null,
            termId: lockedAdmission.termId || null,
            status: "pending",
          },
        });
      }

      const updatedAdmission = await tx.admission.update({
        where: { id: lockedAdmission.id },
        data: {
          studentId: student.id,
          status: "pending_payment",
          admissionDate: lockedAdmission.admissionDate || new Date(),
        },
      });

      return { student, enrollment, admission: updatedAdmission, alreadyEnrolled: false };
    });

    await recordAuditMutation({ user: { id: userId }, schoolId: effectiveSchoolId, entity: "Admission", entityId: enrolled.admission.id, action: "ENROLL_PENDING_PAYMENT", actionType: "ADMISSION", before: admission, after: enrolled.admission });
    return safeAdmission(enrolled.admission);
  },

  reject: async (id, userId, reason = "", schoolId) => {
    const admission = await getAdmissionForUser(id, { schoolId });

    if (admission.status !== "pending") {
      const error = new Error("Only pending applications can be rejected");
      error.statusCode = 400;
      throw error;
    }

    const updated = await prisma.admission.update({
      where: { id: admission.id },
      data: {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: userId,
        rejectionReason: reason || "",
      },
    });

    await recordAuditMutation({ user: { id: userId }, schoolId: updated.schoolId, entity: "Admission", entityId: updated.id, action: "REJECT", actionType: "ADMISSION", before: admission, after: updated });

    return safeAdmission(updated);
  },
  completeStudentRecord: async (id, userId = null, schoolId) => {
    const admission = await getAdmissionForUser(id, { schoolId });

    if (!admission.studentId) {
      const error = new Error("Admission has no linked student to complete");
      error.statusCode = 400;
      throw error;
    }

    const student = await prisma.student.findFirst({ where: { id: admission.studentId, schoolId: admission.schoolId } });
    if (!student) {
      const error = new Error("Linked student not found");
      error.statusCode = 404;
      throw error;
    }

    const remarks = parseRemarks(admission) || {};

    const created = {
      studentProfile: false,
      parents: [],
    };

    await prisma.$transaction(async (tx) => {
      const existingProfile = await tx.studentProfile.findUnique({ where: { studentId: student.id } });
      if (!existingProfile) {
        await tx.studentProfile.create({
          data: {
            studentId: student.id,
            schoolId: student.schoolId,
            admissionNumber: student.admissionNumber || null,
            address: remarks.fatherAddress || remarks.motherAddress || null,
            bloodGroup: remarks.bloodGroup || null,
            nationality: remarks.applicantNationality || remarks.nationality || null,
            religion: remarks.religion || null,
          },
        });
        created.studentProfile = true;
      }

      const parentCandidates = [];
      if (remarks.fatherName || remarks.fatherEmail || remarks.fatherPhone1) {
        parentCandidates.push({ name: remarks.fatherName, email: remarks.fatherEmail, phone: remarks.fatherPhone1, relation: 'father' });
      }
      if (remarks.motherName || remarks.motherEmail || remarks.motherPhone1) {
        parentCandidates.push({ name: remarks.motherName, email: remarks.motherEmail, phone: remarks.motherPhone1, relation: 'mother' });
      }

      for (const p of parentCandidates) {
        let parent = null;
        if (p.email) parent = await tx.parent.findFirst({ where: { schoolId: student.schoolId, email: String(p.email).trim().toLowerCase() } });
        if (!parent && p.phone) parent = await tx.parent.findFirst({ where: { schoolId: student.schoolId, phone: String(p.phone).trim() } });

        if (!parent) {
          parent = await tx.parent.create({ data: { schoolId: student.schoolId, name: p.name || 'Parent/Guardian', email: p.email || null, phone: p.phone || null, address: null } });
          created.parents.push({ parentId: parent.id, created: true });
        } else {
          created.parents.push({ parentId: parent.id, created: false });
        }

        await tx.studentParent.upsert({
          where: { studentId_parentId: { studentId: student.id, parentId: parent.id } },
          create: { studentId: student.id, parentId: parent.id, relation: p.relation },
          update: { relation: p.relation },
        });
      }
    });

    return { success: true, created };
  },
  create: async (payload, user = null) => {
    const schoolId = await resolveSchoolId(payload.schoolId, user);

    const applicantFirstName = payload.applicantFirstName || payload.firstName || "";
    const applicantMiddleName = payload.applicantMiddleName || payload.middleName || "";
    const applicantLastName = payload.applicantLastName || payload.lastName || "";
    const applicantGender = payload.applicantGender || payload.gender || "";
    const applicantDob = payload.applicantDob || payload.dob;
    const applicantPlaceOfBirth = payload.applicantPlaceOfBirth || payload.placeOfBirth || "";
    const applicantNationality = payload.applicantNationality || payload.nationality || "";
    const applicantStateOfOrigin = payload.applicantStateOfOrigin || payload.stateOfOrigin || "";
    const applicantLga = payload.applicantLga || payload.lga || "";
    const applicantLin = payload.applicantLin || payload.lin || "";
    const intendedClass = payload.intendedClass || payload.admissionClass || "";
    const studentType = payload.studentType || payload.studentStatus || "";

    const applicantName = String(
      payload.applicantName ||
        [applicantFirstName, applicantMiddleName, applicantLastName].filter(Boolean).join(" "),
    ).trim();

    const code = makeApplicationCode(schoolId);
    const applicantId = `APP-${schoolId}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const admissionColumns = await getAdmissionColumns();
    const allCols = await getAllAdmissionColumns();
    const baseSubmissionData = payload.submissionData || payload;
    const examRef = `EXM-${schoolId}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const payloadWithCodes = Object.assign({}, baseSubmissionData, { applicationCode: code, admissionCode: code, examReference: examRef, _generatedAt: new Date().toISOString() });
    payloadWithCodes.applicantId = applicantId;

    const createData = {
      schoolId,
      status: "pending",
      remarks: JSON.stringify(payloadWithCodes),
    };

    if (payload.academicYearId) createData.academicYearId = payload.academicYearId;
    if (payload.termId) createData.termId = payload.termId;

    const canonicalFields = {
      applicantName: applicantName || null,
      applicantFirstName: applicantFirstName || null,
      applicantMiddleName: applicantMiddleName || null,
      applicantLastName: applicantLastName || null,
      applicantGender: applicantGender || null,
      applicantDob: parseDate(applicantDob),
      applicantPlaceOfBirth: applicantPlaceOfBirth || null,
      applicantNationality: applicantNationality || null,
      applicantStateOfOrigin: applicantStateOfOrigin || null,
      applicantLga: applicantLga || null,
      applicantLin: applicantLin || null,
      intendedClass: intendedClass || null,
      studentType: studentType || null,
      previousSchool: payload.previousSchool || null,
      religion: payload.religion || null,
      fatherName: payload.fatherName || null,
      fatherAddress: payload.fatherAddress || null,
      fatherOccupation: payload.fatherOccupation || null,
      fatherJobTitle: payload.fatherJobTitle || null,
      fatherEmail: String(payload.fatherEmail || "").trim().toLowerCase() || null,
      fatherPhone1: payload.fatherPhone1 || null,
      fatherPhone2: payload.fatherPhone2 || null,
      motherName: payload.motherName || null,
      motherAddress: payload.motherAddress || null,
      motherOccupation: payload.motherOccupation || null,
      motherJobTitle: payload.motherJobTitle || null,
      motherEmail: String(payload.motherEmail || "").trim().toLowerCase() || null,
      motherPhone1: payload.motherPhone1 || null,
      motherPhone2: payload.motherPhone2 || null,
      parentEmail: String(payload.parentEmail || payload.fatherEmail || payload.motherEmail || "").trim().toLowerCase() || null,
      parentPhone: payload.parentPhone || payload.fatherPhone1 || payload.motherPhone1 || null,
      feePaymentMethod: payload.feePaymentMethod || null,
      agreeTerms: payload.agreeTerms === true || String(payload.agreeTerms || "").toLowerCase() === "true",
    };

    for (const [field, value] of Object.entries(canonicalFields)) {
      if (allCols.has(field.toLowerCase())) {
        createData[field] = value;
      }
    }

    if (admissionColumns.has("admissioncode")) {
      createData.admissionCode = code;
    } else if (admissionColumns.has("applicationcode")) {
      createData.applicationCode = code;
    } else {
      createData.submissionData = Object.assign({}, baseSubmissionData, { applicationCode: code, admissionCode: code });
    }
    if (admissionColumns.has("examreference")) {
      createData.examReference = examRef;
    } else {
      createData.submissionData = Object.assign(createData.submissionData || {}, { examReference: examRef });
    }
    if (admissionColumns.has('applicantid')) {
      createData.applicantId = applicantId;
    } else {
      createData.submissionData = Object.assign(createData.submissionData || {}, { applicantId });
    }

    const needsRawInsert = !allCols.has('applicantname');

    console.log('admission.create data keys:', Object.keys(createData), 'allCols count:', allCols.size);

    if (needsRawInsert) {
      const idValue = `adm_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const now = new Date().toISOString();
      const colsToInsert = ['id', 'schoolId', 'status', 'updatedAt', 'remarks'];
      const params = [idValue, createData.schoolId, createData.status, now, createData.remarks];
      if (admissionColumns.has('applicantid')) {
        colsToInsert.push('applicantId');
        params.push(applicantId);
      }
      if (admissionColumns.has('admissioncode')) {
        colsToInsert.push('admissionCode');
        params.push(code);
      } else if (admissionColumns.has('applicationcode')) {
        colsToInsert.push('applicationCode');
        params.push(code);
      }
      if (admissionColumns.has('examreference')) {
        colsToInsert.push('examReference');
        params.push(examRef);
      }
      if (createData.academicYearId) {
        colsToInsert.push('academicYearId');
        params.push(createData.academicYearId);
      }
      if (createData.termId) {
        colsToInsert.push('termId');
        params.push(createData.termId);
      }
      const colList = colsToInsert.map((c) => `"${c}"`).join(',');
      const placeholders = params.map((_, i) => `$${i + 1}`).join(',');
      const sql = `INSERT INTO "Admission" (${colList}) VALUES (${placeholders}) RETURNING *;`;
      const rows = await prisma.$queryRawUnsafe(sql, ...params);
      const created = Array.isArray(rows) ? rows[0] : rows;

      try {
        if (examRef) {
          let teacherIdToUse = null;
          if (user && user.id) {
            const t = await prisma.teacher.findFirst({ where: { userId: user.id, schoolId } });
            if (t) teacherIdToUse = t.id;
          }
          if (!teacherIdToUse) {
            teacherIdToUse = `sys_teacher_${schoolId}`;
            await prisma.teacher.upsert({ where: { id: teacherIdToUse }, create: { id: teacherIdToUse, schoolId }, update: {} });
          }
          await prisma.assessment.upsert({
            where: { id: examRef },
            create: { id: examRef, teacherId: teacherIdToUse, title: `Admission Exam: ${applicantName || code}`, subject: "Admission", className: intendedClass || "Admission", maxScore: 100, date: new Date(), schoolId, description: "Auto-created assessment for admission" },
            update: { title: `Admission Exam: ${applicantName || code}`, className: intendedClass || "Admission", maxScore: 100, date: new Date() },
          });
        }
      } catch (err) {
        console.error('Auto-create assessment failed:', err);
      }

      return created;
    }

    const admission = await prisma.admission.create({ data: createData });
    try {
      if (examRef) {
        let teacherIdToUse = null;
        if (user && user.id) {
          const t = await prisma.teacher.findFirst({ where: { userId: user.id, schoolId } });
          if (t) teacherIdToUse = t.id;
        }
        if (!teacherIdToUse) {
          teacherIdToUse = `sys_teacher_${schoolId}`;
          await prisma.teacher.upsert({ where: { id: teacherIdToUse }, create: { id: teacherIdToUse, schoolId }, update: {} });
        }
        await prisma.assessment.upsert({
          where: { id: examRef },
          create: { id: examRef, teacherId: teacherIdToUse, title: `Admission Exam: ${applicantName || code}`, subject: "Admission", className: intendedClass || "Admission", maxScore: 100, date: new Date(), schoolId, description: "Auto-created assessment for admission" },
          update: { title: `Admission Exam: ${applicantName || code}`, className: intendedClass || "Admission", maxScore: 100, date: new Date() },
        });
      }
    } catch (err) {
      console.error('Auto-create assessment failed:', err);
    }

    return admission;
  },
}
