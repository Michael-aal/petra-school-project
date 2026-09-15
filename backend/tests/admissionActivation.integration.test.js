import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { prisma, runWithSchoolContext, runWithoutSchoolContext } from "../config/db.js";
import { admissionService } from "../services/admissionService.js";
import { activateAdmittedStudentAfterFeePayment } from "../services/studentActivationService.js";

const enabled = Boolean(process.env.DATABASE_URL) && (process.env.RUN_INTEGRATION_TESTS === "true" || process.env.CI === "true");

test("admission enrollment stays pending until verified school-fee activation", {
  skip: enabled ? false : "Set RUN_INTEGRATION_TESTS=true (or CI=true) with DATABASE_URL to run activation-path proof.",
}, async () => {
  const suffix = crypto.randomBytes(6).toString("hex");
  let school;
  try {
    school = await runWithoutSchoolContext(() => prisma.school.create({ data: { name: `Activation ${suffix}` } }));
    const admission = await runWithSchoolContext(school.id, () => prisma.admission.create({
      data: {
        schoolId: school.id,
        status: "approved",
        applicantName: "Pending Applicant",
        parentEmail: `parent-${suffix}@example.test`,
      },
    }));

    const enrolled = await runWithSchoolContext(school.id, () => admissionService.enroll(
      admission.id,
      "test-admin",
      {},
      school.id,
    ));
    const pendingStudent = await runWithSchoolContext(school.id, () => prisma.student.findFirst({ where: { schoolId: school.id, id: enrolled.studentId } }));
    const pendingEnrollment = await runWithSchoolContext(school.id, () => prisma.enrollment.findFirst({ where: { schoolId: school.id, studentId: enrolled.studentId } }));

    assert.equal(pendingStudent.status, "pending");
    assert.equal(pendingEnrollment.status, "pending");
    assert.equal(enrolled.status, "pending_payment");

    const academicYear = await runWithSchoolContext(school.id, () => prisma.academicYear.create({ data: { schoolId: school.id, name: `Year ${suffix}`, startsAt: new Date("2025-09-01"), endsAt: new Date("2026-07-31") } }));
    const term = await runWithSchoolContext(school.id, () => prisma.term.create({ data: { schoolId: school.id, academicYearId: academicYear.id, name: `Term ${suffix}`, startsAt: new Date("2025-09-01"), endsAt: new Date("2025-12-31") } }));
    const category = await runWithSchoolContext(school.id, () => prisma.feeCategory.create({ data: { schoolId: school.id, name: `Application Fee ${suffix}` } }));
    const fee = await runWithSchoolContext(school.id, () => prisma.feeStructure.create({ data: { schoolId: school.id, feeCategoryId: category.id, amount: 100 } }));
    const payment = await runWithSchoolContext(school.id, () => prisma.payment.create({
      data: {
        schoolId: school.id,
        studentId: enrolled.studentId,
        academicYearId: academicYear.id,
        termId: term.id,
        method: "Paystack",
        status: "Successful",
        amount: 100,
        paidAt: new Date(),
        reference: `APP-${suffix}`,
        note: "Application Fee",
        paymentLines: { create: { feeStructureId: fee.id, quantity: 1, unitAmount: 100, lineTotal: 100 } },
      },
    }));

    const activation = await runWithSchoolContext(school.id, () => activateAdmittedStudentAfterFeePayment({
      schoolId: school.id,
      studentId: enrolled.studentId,
      paymentReference: payment.reference,
    }));
    assert.equal(activation.activated, false);
    assert.equal(activation.reason, "application_fee_only");

    const unchangedStudent = await runWithSchoolContext(school.id, () => prisma.student.findUnique({ where: { id: enrolled.studentId } }));
    const unchangedEnrollment = await runWithSchoolContext(school.id, () => prisma.enrollment.findFirst({ where: { schoolId: school.id, studentId: enrolled.studentId } }));
    assert.equal(unchangedStudent.status, "pending");
    assert.equal(unchangedEnrollment.status, "pending");

    const tuitionCategory = await runWithSchoolContext(school.id, () => prisma.feeCategory.create({ data: { schoolId: school.id, name: `School Fees ${suffix}` } }));
    const tuitionFee = await runWithSchoolContext(school.id, () => prisma.feeStructure.create({ data: { schoolId: school.id, feeCategoryId: tuitionCategory.id, amount: 500 } }));
    const tuitionPayment = await runWithSchoolContext(school.id, () => prisma.payment.create({
      data: {
        schoolId: school.id,
        studentId: enrolled.studentId,
        academicYearId: academicYear.id,
        termId: term.id,
        method: "Paystack",
        status: "Successful",
        amount: 500,
        paidAt: new Date(),
        reference: `TUITION-${suffix}`,
        note: "School Fees",
        paymentLines: { create: { feeStructureId: tuitionFee.id, quantity: 1, unitAmount: 500, lineTotal: 500 } },
      },
    }));

    const firstActivation = await runWithSchoolContext(school.id, () => activateAdmittedStudentAfterFeePayment({
      schoolId: school.id,
      studentId: enrolled.studentId,
      paymentReference: tuitionPayment.reference,
    }));
    const replayActivation = await runWithSchoolContext(school.id, () => activateAdmittedStudentAfterFeePayment({
      schoolId: school.id,
      studentId: enrolled.studentId,
      paymentReference: tuitionPayment.reference,
    }));
    assert.equal(firstActivation.activated, true);
    assert.equal(replayActivation.activated, true);

    const activeStudent = await runWithSchoolContext(school.id, () => prisma.student.findUnique({ where: { id: enrolled.studentId } }));
    const activeEnrollment = await runWithSchoolContext(school.id, () => prisma.enrollment.findFirst({ where: { schoolId: school.id, studentId: enrolled.studentId } }));
    assert.equal(activeStudent.status, "active");
    assert.equal(activeEnrollment.status, "active");
  } finally {
    if (school) {
      await runWithSchoolContext(school.id, async () => {
        await prisma.payment.deleteMany({ where: { schoolId: school.id } });
      }).catch(() => undefined);
      await runWithoutSchoolContext(() => prisma.school.delete({ where: { id: school.id } })).catch(() => undefined);
    }
  }
});
