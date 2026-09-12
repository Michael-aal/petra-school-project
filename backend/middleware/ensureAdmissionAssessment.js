import { prisma } from "../config/db.js";

/**
 * Admission assessments are keyed by Admission.examReference.
 * Repair older admissions that are missing their Assessment row immediately
 * before the applicant starts the exam. This must use a real active teacher
 * from the same school; it must never create a fake/system teacher.
 */
export const ensureAdmissionAssessment = async (req, res, next) => {
  try {
    const applicantId = String(req.body?.applicantId || "").trim();
    const assessmentId = String(req.body?.assessmentId || "").trim();

    if (!assessmentId) return next();

    const existing = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true },
    });

    if (existing) return next();

    const admission = await prisma.admission.findFirst({
      where: {
        OR: [
          { examReference: assessmentId },
          applicantId ? { applicantId } : undefined,
          applicantId ? { admissionCode: applicantId } : undefined,
          applicantId ? { applicationCode: applicantId } : undefined,
        ].filter(Boolean),
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
      return next(Object.assign(new Error("Admission has no valid school context"), { statusCode: 400 }));
    }

    const teacher = await prisma.teacher.findFirst({
      where: { schoolId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!teacher) {
      return next(Object.assign(
        new Error("No active teacher is configured for this school. Create a teacher using the school registration code before starting the admission exam."),
        { statusCode: 409 },
      ));
    }

    await prisma.assessment.create({
      data: {
        id: assessmentId,
        teacherId: teacher.id,
        title: `Admission Exam: ${admission.applicantName || admission.admissionCode || admission.applicationCode || assessmentId}`,
        subject: "Admission",
        className: admission.intendedClass || "Admission",
        maxScore: 100,
        date: new Date(),
        description: "Admission assessment",
        schoolId,
      },
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
