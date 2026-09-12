import { prisma } from "../config/db.js";

/**
 * Promote an admitted applicant into the active student/enrollment records
 * after a verified school-fee payment.
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
    select: { id: true, note: true, reference: true },
  });

  if (!payment) {
    return { activated: false, reason: "successful_payment_not_found" };
  }

  // Never promote an applicant from the application-fee payment itself.
  if (String(payment.note || "").toLowerCase().includes("application")) {
    return { activated: false, reason: "application_fee_only" };
  }

  const admission = await prisma.admission.findFirst({
    where: {
      schoolId: Number(schoolId),
      studentId: String(studentId),
      OR: [
        { status: "admission_offered" },
        { status: "passed" },
        { status: "paid" },
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

    if (student.status !== "active") {
      await tx.student.update({
        where: { id: student.id },
        data: { status: "active" },
      });
    }

    const existingProfile = await tx.studentProfile.findUnique({
      where: { studentId: student.id },
    });

    if (!existingProfile) {
      await tx.studentProfile.create({
        data: {
          studentId: student.id,
          schoolId: student.schoolId,
          admissionNumber: student.admissionNumber || null,
        },
      });
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
