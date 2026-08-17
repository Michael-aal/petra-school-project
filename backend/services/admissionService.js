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
    remarks.guardianName || remarks.fatherName || remarks.motherName || null;

  const applicationCode = admission.applicationCode || remarks.applicationCode || null;
  const admissionCode = admission.admissionCode || remarks.admissionCode || null;
  const applicantId = admission.applicantId || remarks.applicantId || null;

  // Prefer DB createdAt, then a generated timestamp stored in remarks, then updatedAt
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
  const raw = admission.remarks || (admission.submissionData && typeof admission.submissionData === 'string' ? admission.submissionData : null);
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return null;
  }
};

// Cache admission column presence for this process to avoid repeated queries
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
    const where = {};

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
    // Use raw SQL for Admission row to avoid Prisma model vs DB column mismatches
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM "Admission" WHERE id = $1', id);
    const admission = Array.isArray(rows) ? rows[0] : rows;
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
  completeStudentRecord: async (id, userId = null) => {
    // Use raw SQL to fetch Admission to avoid Prisma model <> DB column mismatches
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM "Admission" WHERE id = $1', id);
    const admission = Array.isArray(rows) ? rows[0] : rows;
    if (!admission) {
      const error = new Error("Admission not found");
      error.statusCode = 404;
      throw error;
    }

    // We will not create a Student here; only complete missing related records
    if (!admission.studentId) {
      const error = new Error("Admission has no linked student to complete");
      error.statusCode = 400;
      throw error;
    }

    const student = await prisma.student.findUnique({ where: { id: admission.studentId } });
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
      // Create StudentProfile if missing
      const existingProfile = await tx.studentProfile.findUnique({ where: { studentId: student.id } });
      if (!existingProfile) {
        const profile = await tx.studentProfile.create({
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

      // Create parents and studentParent links for father and mother if data present
      const parentCandidates = [];
      if (remarks.fatherName || remarks.fatherEmail || remarks.fatherPhone1) {
        parentCandidates.push({ name: remarks.fatherName, email: remarks.fatherEmail, phone: remarks.fatherPhone1, relation: 'father' });
      }
      if (remarks.motherName || remarks.motherEmail || remarks.motherPhone1) {
        parentCandidates.push({ name: remarks.motherName, email: remarks.motherEmail, phone: remarks.motherPhone1, relation: 'mother' });
      }

      for (const p of parentCandidates) {
        // find existing parent by email or phone
        let parent = null;
        if (p.email) parent = await tx.parent.findFirst({ where: { schoolId: student.schoolId, email: String(p.email).trim().toLowerCase() } });
        if (!parent && p.phone) parent = await tx.parent.findFirst({ where: { schoolId: student.schoolId, phone: String(p.phone).trim() } });

        if (!parent) {
          parent = await tx.parent.create({ data: { schoolId: student.schoolId, name: p.name || 'Parent/Guardian', email: p.email || null, phone: p.phone || null, address: null } });
          created.parents.push({ parentId: parent.id, created: true });
        } else {
          created.parents.push({ parentId: parent.id, created: false });
        }

        // upsert studentParent link
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

  const code = makeApplicationCode(schoolId);
  // Generate persistent applicant ID
  const applicantId = `APP-${schoolId}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const admissionColumns = await getAdmissionColumns();
  const allCols = await getAllAdmissionColumns();

  const baseSubmissionData = payload.submissionData || payload;

  // The current database is missing many Admission columns. Persist a minimal
  // Admission row and serialize the full submission into `remarks` so the
  // application data is not lost while we reconcile migrations.
  const examRef = `EXM-${schoolId}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const payloadWithCodes = Object.assign({}, baseSubmissionData, { applicationCode: code, admissionCode: code, examReference: examRef, _generatedAt: new Date().toISOString() });
  // include applicantId in submission data for compatibility
  payloadWithCodes.applicantId = applicantId;

  const createData = {
    schoolId,
    status: "pending",
    remarks: JSON.stringify(payloadWithCodes),
  };

  if (payload.academicYearId) createData.academicYearId = payload.academicYearId;
  if (payload.termId) createData.termId = payload.termId;

  // Persist the same applicant identity used to issue the QuizLab invitation.
  // `remarks` remains a compatibility copy for installations with schema drift.
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
    parentEmail: String(
      payload.parentEmail || payload.fatherEmail || payload.motherEmail || ""
    )
      .trim()
      .toLowerCase() || null,
    parentPhone: payload.parentPhone || payload.fatherPhone1 || payload.motherPhone1 || null,
    feePaymentMethod: payload.feePaymentMethod || null,
    agreeTerms:
      payload.agreeTerms === true || String(payload.agreeTerms || "").toLowerCase() === "true",
  };

  for (const [field, value] of Object.entries(canonicalFields)) {
    if (allCols.has(field.toLowerCase())) {
      createData[field] = value;
    }
  }

  // Prefer canonical `admissionCode` if the DB has that column.
  if (admissionColumns.has("admissioncode")) {
    createData.admissionCode = code;
  } else if (admissionColumns.has("applicationcode")) {
    createData.applicationCode = code;
  } else {
    createData.submissionData = Object.assign({}, baseSubmissionData, { applicationCode: code, admissionCode: code });
  }
  // Persist examReference if the column exists, otherwise keep it in submissionData/remarks
  if (admissionColumns.has("examreference")) {
    createData.examReference = examRef;
  } else {
    createData.submissionData = Object.assign(createData.submissionData || {}, { examReference: examRef });
  }
  // Persist applicantId if DB has the column, otherwise keep in submissionData/remarks
  if (admissionColumns.has('applicantid')) {
    createData.applicantId = applicantId;
  } else {
    createData.submissionData = Object.assign(createData.submissionData || {}, { applicantId });
  }

  // If the database is missing many Admission columns (classic drift), Prisma
  // may attempt to insert all model columns and fail. Detect that case and
  // perform a raw INSERT that only writes safe columns.
  const needsRawInsert = !allCols.has('applicantname');

  console.log('admission.create data keys:', Object.keys(createData), 'allCols count:', allCols.size);

  if (needsRawInsert) {
    const idValue = `adm_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    // NOTE: Previously we created a minimal Student record here to satisfy a
    // NOT NULL constraint on Admission.studentId. That created Student entries
    // prematurely whenever the admission form was submitted. Instead, we
    // should insert an Admission without a studentId. Make sure the DB has
    // been migrated to allow NULL studentId before applying this change.

    const colsToInsert = ['id', 'schoolId', 'status', 'updatedAt', 'remarks'];
    const params = [idValue, createData.schoolId, createData.status, now, createData.remarks];
    // include applicantId column when present
    if (admissionColumns.has('applicantid')) {
      colsToInsert.push('applicantId');
      params.push(applicantId);
    }
    // Include admission/application code column when available so the generated code is persisted
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
    // Try to create a minimal Assessment using the examReference as its id so
    // admins can use the generated examReference directly as an assessment id.
    try {
      if (examRef) {
        // Prefer the submitting user's Teacher record when available
        let teacherIdToUse = null;
        if (user && user.id) {
          const t = await prisma.teacher.findFirst({ where: { userId: user.id, schoolId } });
          if (t) teacherIdToUse = t.id;
        }

        // Fallback to a system teacher for the school
        if (!teacherIdToUse) {
          teacherIdToUse = `sys_teacher_${schoolId}`;
          await prisma.teacher.upsert({
            where: { id: teacherIdToUse },
            create: { id: teacherIdToUse, schoolId },
            update: {},
          });
        }

        await prisma.assessment.upsert({
          where: { id: examRef },
          create: {
            id: examRef,
            teacherId: teacherIdToUse,
            title: `Admission Exam: ${applicantName || code}`,
            subject: "Admission",
            className: intendedClass || "Admission",
            maxScore: 100,
            date: new Date(),
            schoolId,
            description: "Auto-created assessment for admission",
          },
          update: {
            title: `Admission Exam: ${applicantName || code}`,
            className: intendedClass || "Admission",
            maxScore: 100,
            date: new Date(),
          },
        });
      }
    } catch (err) {
      // Do not fail admission creation if assessment creation fails.
      console.error('Auto-create assessment failed:', err);
    }

    return created;
  }

  const admission = await prisma.admission.create({ data: createData });
  // After creating admission, try to auto-create a minimal Assessment using examRef
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
        create: {
          id: examRef,
          teacherId: teacherIdToUse,
          title: `Admission Exam: ${applicantName || code}`,
          subject: "Admission",
          className: intendedClass || "Admission",
          maxScore: 100,
          date: new Date(),
          schoolId,
          description: "Auto-created assessment for admission",
        },
        update: {
          title: `Admission Exam: ${applicantName || code}`,
          className: intendedClass || "Admission",
          maxScore: 100,
          date: new Date(),
        },
      });
    }
  } catch (err) {
    console.error('Auto-create assessment failed:', err);
  }

  return admission;
},
}
