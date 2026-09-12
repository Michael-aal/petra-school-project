import { prisma } from "../config/db.js";

/**
 * Admission assessments are keyed by the admission examReference.
 * Older admissions can exist without their corresponding Assessment row
 * because assessment creation used to be best-effort. Repair that mapping
 * immediately before the applicant starts the exam.
 */
export const ensureAdmissionAssessment = async (req, res, next) => {
  try {
    const applicantId = String(req.body?.applicantId || "").trim();
    const assessmentId = String(req.body?.assessmentId || "").trim();

    if (!applicantId || !assessmentId) {
      return next();
    }

    const existing = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true },
    });

    if (existing) {
      return next();
    }

    const admission = await prisma.admission.findFirst({
      where: {
        OR: [
          { applicantId },
          { examReference: assessmentId },
          { admissionCode: applicantId },
          { applicationCode: applicantId },
        ],
      },
      select: {
        id: true,
        schoolId: true,
        applicantId: true,
        applicantName: true,
        admissionCode: true,
        applicationCode: true,
        intendedClass: true,
        examReference: true,
      },
    });

    if (!admission || String(admission.examReference || "").trim() !== assessmentId) {
      return next();
    }

    const schoolId = Number(admission.schoolId);
    if (!Number.isInteger(schoolId) || schoolId <= 0) {
      const error = new Error("Admission has no valid school context");
      error.statusCode = 400;
      return next(error);
    }

    const teacherId = `sys_teacher_${schoolId}`;

    await prisma.teacher.upsert({
      where: { id: teacherId },
      create: { id: teacherId, schoolId },
      update: {},
    });

    await prisma.assessment.upsert({
      where: { id: assessmentId },
      create: {
        id: assessmentId,
        teacherId,
        title: `Admission Exam: ${admission.applicantName || admission.admissionCode || admission.applicationCode || assessmentId}`,
        subject: "Admission",
        className: admission.intendedClass || "Admission",
        maxScore: 100,
        date: new Date(),
        description: "Auto-created assessment for admission",
        schoolId,
      },
      update: {},
    });

    return next();
  } catch (error) {
    console.error("[Admission Assessment] ensure failed", {
      message: error?.message,
      code: error?.code,
      applicantId: req.body?.applicantId,
      assessmentId: req.body?.assessmentId,
    });
    return next(error);
  }
};
