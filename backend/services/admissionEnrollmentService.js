import crypto from "crypto";
import { prisma } from "../config/db.js";

const getAdmissionForSchool = async (id, schoolId) => {
  const parsedSchoolId = Number(schoolId);
  if (!Number.isInteger(parsedSchoolId) || parsedSchoolId <= 0) {
    const error = new Error("A valid school context is required");
    error.statusCode = 400;
    throw error;
  }

  const admission = await prisma.admission.findFirst({
    where: { id, schoolId: parsedSchoolId },
  });

  if (!admission) {
    const error = new Error("Admission not found");
    error.statusCode = 404;
    throw error;
  }

  return admission;
};

/**
 * Creates the records required for the school-fee payment flow without
 * activating the student. Verified Paystack payment is the only path that
 * promotes the pending records to active status.
 */
export const prepareAdmissionForFeePayment = async (id, payload = {}, schoolId) => {
  const admission = await getAdmissionForSchool(id, schoolId);

  if (!["admission_offered", "passed"].includes(admission.status) && !admission.admissionCode) {
    const error = new Error("Only applicants who have been offered admission can be prepared for enrollment");
    error.statusCode = 400;
    throw error;
  }

  if (admission.studentId) {
    return admission;
  }

  const effectiveSchoolId = admission.schoolId ?? Number(schoolId);
  const className = String(payload.className || admission.intendedClass || "").trim();
  const admissionNumber = String(
    payload.admissionNumber ||
      `STU-${effectiveSchoolId}-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
  ).slice(0, 40);

  const prepared = await prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        schoolId: effectiveSchoolId,
        name:
          admission.applicantName ||
          [admission.applicantFirstName, admission.applicantMiddleName, admission.applicantLastName]
            .filter(Boolean)
            .join(" "),
        admissionNumber,
        className,
        dob: admission.applicantDob,
        gender: admission.applicantGender || null,
        parentEmail: admission.parentEmail || admission.fatherEmail || admission.motherEmail || null,
        parentPhone: admission.parentPhone || admission.fatherPhone1 || admission.motherPhone1 || null,
        guardianName: admission.fatherName || admission.motherName || null,
        status: "pending",
      },
    });

    await tx.studentProfile.create({
      data: {
        studentId: student.id,
        schoolId: effectiveSchoolId,
        admissionNumber,
        address: admission.fatherAddress || admission.motherAddress || null,
        bloodGroup: admission.bloodGroup || null,
        nationality: admission.applicantNationality || null,
        religion: admission.religion || null,
      },
    });

    const parentInputs = [
      {
        name: admission.fatherName,
        email: admission.fatherEmail,
        phone: admission.fatherPhone1 || admission.fatherPhone2,
        relation: "father",
      },
      {
        name: admission.motherName,
        email: admission.motherEmail,
        phone: admission.motherPhone1 || admission.motherPhone2,
        relation: "mother",
      },
    ].filter((parent) => parent.name || parent.email || parent.phone);

    let primaryParentId = null;
    for (const parentInput of parentInputs) {
      const email = String(parentInput.email || "").trim().toLowerCase();
      let parent = email
        ? await tx.parent.findFirst({ where: { schoolId: effectiveSchoolId, email } })
        : null;

      if (!parent) {
        parent = await tx.parent.create({
          data: {
            schoolId: effectiveSchoolId,
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
      await tx.student.update({
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

    await tx.enrollment.create({
      data: {
        schoolId: effectiveSchoolId,
        studentId: student.id,
        classId: classRecord?.id || null,
        sectionId: payload.sectionId || null,
        academicYearId: admission.academicYearId || null,
        termId: admission.termId || null,
        status: "pending",
      },
    });

    return tx.admission.update({
      where: { id: admission.id },
      data: { studentId: student.id },
    });
  });

  return prepared;
};
