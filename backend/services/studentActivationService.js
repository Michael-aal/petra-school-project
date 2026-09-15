import crypto from "crypto";
import { prisma } from "../config/db.js";

const normalizeFeeName = (value) => String(value || "").trim().toLowerCase();

const isTuitionFeeName = (value) => {
  const normalized = normalizeFeeName(value);
  return (
    normalized.includes("tuition") ||
    normalized.includes("school fee") ||
    normalized.includes("school fees")
  );
};

const isApplicationFeeName = (value) =>
  normalizeFeeName(value).includes("application");

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

/**
 * A student is promoted only when the successful payment contains a tuition /
 * school-fee line AND the full configured tuition amount represented by those
 * lines has been paid. Extra fees never count toward the tuition requirement.
 */
const hasFullTuitionPayment = (payment) => {
  const lines = Array.isArray(payment?.paymentLines) ? payment.paymentLines : [];
  const tuitionLines = lines.filter((line) =>
    isTuitionFeeName(line?.feeStructure?.feeCategory?.name),
  );

  if (!tuitionLines.length) return false;

  const requiredTuitionAmount = tuitionLines.reduce(
    (total, line) => total + toNumber(line?.lineTotal),
    0,
  );

  const successfulPaymentAmount = toNumber(payment?.amount);

  // The payment may also contain extra fees, so the total payment can be
  // higher than tuition. What matters is that it covers the complete tuition
  // amount. A partial tuition payment must never activate the student.
  return requiredTuitionAmount > 0 && successfulPaymentAmount >= requiredTuitionAmount;
};

/**
 * Promote an admitted applicant into the active student/enrollment records
 * only after a verified full tuition/school-fee payment.
 *
 * This is intentionally idempotent: Paystack may retry a webhook, so an
 * already-enrolled student is left intact rather than duplicated.
 */
export const activateAdmittedStudentAfterFeePayment = async ({ schoolId, studentId, paymentReference }) => {
  if (!schoolId || !studentId || !paymentReference) {
    return { activated: false, reason: "missing_payment_context" };
  }

  const payment = await prisma.payment.findFirst({
    where: {
      reference: String(paymentReference),
      schoolId: Number(schoolId),
      studentId: String(studentId),
      status: "Successful",
    },
    select: {
      id: true,
      amount: true,
      note: true,
      reference: true,
      paymentLines: {
        include: {
          feeStructure: {
            include: { feeCategory: true },
          },
        },
      },
    },
  });

  if (!payment) {
    return { activated: false, reason: "successful_payment_not_found" };
  }

  // Never promote an applicant from an application-fee payment.
  const paymentNote = normalizeFeeName(payment.note);
  if (isApplicationFeeName(paymentNote)) {
    return { activated: false, reason: "application_fee_only" };
  }

  // Extra fees alone, or a partial tuition payment, must leave the applicant
  // exactly as-is. Only a full tuition/school-fee payment can promote them.
  if (!hasFullTuitionPayment(payment)) {
    return { activated: false, reason: "full_tuition_payment_required" };
  }

  const admission = await prisma.admission.findFirst({
    where: {
      schoolId: Number(schoolId),
      studentId: String(studentId),
      OR: [
        { status: "admission_offered" },
        { status: "passed" },
        { status: "paid" },
        { status: "pending_payment" },
        { status: "enrolled" },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!admission) {
    return { activated: false, reason: "eligible_admission_not_found" };
  }

  const result = await prisma.$transaction(async (tx) => {
    const student = await tx.student.findFirst({
      where: { id: String(studentId), schoolId: Number(schoolId) },
    });

    if (!student) {
      return { activated: false, reason: "student_not_found" };
    }

    const generatedAdmissionNumber = `STU-${Number(schoolId)}-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`.slice(0, 40);
    const derivedName =
      admission.applicantName ||
      [admission.applicantFirstName, admission.applicantMiddleName, admission.applicantLastName]
        .filter(Boolean)
        .join(" ");
    const derivedEmail = admission.parentEmail || admission.fatherEmail || admission.motherEmail || null;
    const derivedPhone = admission.parentPhone || admission.fatherPhone1 || admission.motherPhone1 || null;
    const derivedGuardian = admission.fatherName || admission.motherName || null;

    // Fill missing student-form fields from the original admission instead of
    // forcing an administrator to type the same information again.
    const studentUpdate = {
      status: "active",
      ...(student.name ? {} : derivedName ? { name: derivedName } : {}),
      ...(student.admissionNumber ? {} : { admissionNumber: generatedAdmissionNumber }),
      ...(student.className ? {} : admission.intendedClass ? { className: String(admission.intendedClass).trim() } : {}),
      ...(student.dob ? {} : admission.applicantDob ? { dob: admission.applicantDob } : {}),
      ...(student.gender ? {} : admission.applicantGender ? { gender: admission.applicantGender } : {}),
      ...(student.parentEmail ? {} : derivedEmail ? { parentEmail: derivedEmail } : {}),
      ...(student.parentPhone ? {} : derivedPhone ? { parentPhone: derivedPhone } : {}),
      ...(student.guardianName ? {} : derivedGuardian ? { guardianName: derivedGuardian } : {}),
    };

    const updatedStudent = await tx.student.update({
      where: { id: student.id },
      data: studentUpdate,
    });

    const existingProfile = await tx.studentProfile.findUnique({
      where: { studentId: student.id },
    });

    if (!existingProfile) {
      await tx.studentProfile.create({
        data: {
          studentId: student.id,
          schoolId: student.schoolId,
          admissionNumber: updatedStudent.admissionNumber || null,
          address: admission.fatherAddress || admission.motherAddress || null,
          bloodGroup: admission.bloodGroup || null,
          nationality: admission.applicantNationality || null,
          religion: admission.religion || null,
        },
      });
    } else {
      const profileUpdate = {
        ...(existingProfile.admissionNumber ? {} : updatedStudent.admissionNumber ? { admissionNumber: updatedStudent.admissionNumber } : {}),
        ...(existingProfile.address ? {} : admission.fatherAddress || admission.motherAddress ? { address: admission.fatherAddress || admission.motherAddress } : {}),
        ...(existingProfile.bloodGroup ? {} : admission.bloodGroup ? { bloodGroup: admission.bloodGroup } : {}),
        ...(existingProfile.nationality ? {} : admission.applicantNationality ? { nationality: admission.applicantNationality } : {}),
        ...(existingProfile.religion ? {} : admission.religion ? { religion: admission.religion } : {}),
      };
      if (Object.keys(profileUpdate).length) {
        await tx.studentProfile.update({ where: { studentId: student.id }, data: profileUpdate });
      }
    }

    let enrollment = await tx.enrollment.findFirst({
      where: {
        schoolId: student.schoolId,
        studentId: student.id,
      },
      orderBy: { enrolledAt: "desc" },
    });

    if (!enrollment) {
      let classRecord = null;
      if (admission.intendedClass) {
        classRecord = await tx.class.findFirst({
          where: {
            schoolId: student.schoolId,
            name: String(admission.intendedClass).trim(),
          },
        });
      }

      enrollment = await tx.enrollment.create({
        data: {
          schoolId: student.schoolId,
          studentId: student.id,
          classId: classRecord?.id || null,
          academicYearId: admission.academicYearId || null,
          termId: admission.termId || null,
          status: "active",
          enrolledAt: new Date(),
        },
      });
    } else if (enrollment.status !== "active") {
      enrollment = await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { status: "active" },
      });
    }

    const updatedAdmission = await tx.admission.update({
      where: { id: admission.id },
      data: {
        status: "enrolled",
        admissionDate: admission.admissionDate || new Date(),
        paymentReference,
        verifiedAt: new Date(),
        studentId: student.id,
      },
    });

    return {
      activated: true,
      studentId: student.id,
      enrollmentId: enrollment.id,
      admissionId: updatedAdmission.id,
      schoolId: student.schoolId,
    };
  });

  return result;
};
