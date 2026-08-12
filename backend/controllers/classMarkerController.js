import { prisma } from "../config/db.js";
import { classMarkerService } from "../services/classMarkerService.js";
import { sendAdmissionEmail } from "../services/emailService.js";
import crypto from "crypto";

const teacherOrAdminRole = ["teacher", "principal"];

const normalizeRemoteId = (remote) => String(
  remote?.id ?? remote?.testId ?? remote?._id ?? remote?.remoteId ?? remote?.identifier ?? ""
).trim();

const buildAdmissionCode = (schoolName = "School") => {
  const prefix = (process.env.ADMISSION_CODE_PREFIX || String(schoolName).replace(/[^A-Za-z0-9]/g, "").slice(0, 3) || "ADM")
    .toUpperCase()
    .slice(0, 3);
  const length = Math.max(6, Math.min(20, Number(process.env.ADMISSION_CODE_LENGTH || 10)));
  const suffixLength = Math.max(3, length - prefix.length);
  const suffix = crypto.randomBytes(Math.ceil(suffixLength / 2)).toString("hex").toUpperCase().slice(0, suffixLength);
  return `${prefix}${suffix}`.slice(0, length);
};

const isPassing = (candidate, fallbackMax) => {
  if (candidate?.passed === true) return true;
  if (typeof candidate?.status === "string" && candidate.status.toLowerCase() === "passed") return true;

  const score = Number(candidate?.score);
  const max = Number(candidate?.maxScore ?? fallbackMax ?? 100);
  if (!Number.isFinite(score) || !Number.isFinite(max) || max <= 0) return false;
  return score / max >= 0.5;
};

export const createRemoteExamForAssessment = async (req, res, next) => {
  try {
    const { assessmentId } = req.body;
    if (!assessmentId) return res.status(400).json({ success: false, message: "assessmentId required" });

    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });

    if (assessment.teacherId && assessment.teacherId !== req.user.id && !teacherOrAdminRole.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const remote = await classMarkerService.createRemoteExam(assessment);
    const remoteExamId = normalizeRemoteId(remote);
    if (!remoteExamId) {
      return res.status(502).json({ success: false, message: "ClassMarker did not return a remote exam ID" });
    }

    const integration = await prisma.classMarkerIntegration.upsert({
      where: { assessmentId },
      create: {
        schoolId: assessment.schoolId,
        assessmentId,
        remoteExamId,
        remoteExamUrl: remote.url || remote.examUrl || null,
        syncStatus: "created",
      },
      update: {
        remoteExamId,
        remoteExamUrl: remote.url || remote.examUrl || undefined,
        syncStatus: "created",
        lastError: null,
      },
    });

    return res.status(201).json({ success: true, integration, remote });
  } catch (error) {
    next(error);
  }
};

export const getLaunchLinkForAssessment = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });

    const integration = await prisma.classMarkerIntegration.findUnique({ where: { assessmentId } });
    if (!integration?.remoteExamId) {
      return res.status(404).json({ success: false, message: "Remote exam not created" });
    }

    const url = await classMarkerService.createLaunchLink(integration.remoteExamId, req.body?.candidate || null);
    return res.status(200).json({ success: true, url });
  } catch (error) {
    next(error);
  }
};

export const syncResultsForAssessment = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });

    const integration = await prisma.classMarkerIntegration.findUnique({ where: { assessmentId } });
    if (!integration?.remoteExamId) {
      return res.status(404).json({ success: false, message: "Remote exam not created" });
    }

    let remoteResults;
    try {
      remoteResults = await classMarkerService.fetchExamResults(integration.remoteExamId);
    } catch (error) {
      await prisma.classMarkerIntegration.update({
        where: { assessmentId },
        data: { syncStatus: "error", lastError: String(error.message || error).slice(0, 2000) },
      });
      throw error;
    }

    const candidates = Array.isArray(remoteResults) ? remoteResults : (remoteResults?.results || []);
    const processed = [];
    const emails = [];

    // Ensure the database has a canonical Exam for this Assessment.
    const exam = await prisma.exam.upsert({
      where: { assessmentId: assessment.id },
      create: {
        schoolId: assessment.schoolId,
        teacherId: assessment.teacherId || null,
        subjectId: assessment.subjectId || null,
        assessmentId: assessment.id,
        title: assessment.title,
        examDate: assessment.date,
        totalMarks: assessment.maxScore || 100,
        description: assessment.description || null,
      },
      update: {
        title: assessment.title,
        examDate: assessment.date,
        totalMarks: assessment.maxScore || 100,
        description: assessment.description || null,
      },
    });

    for (const candidate of candidates) {
      const reference = candidate?.reference == null ? "" : String(candidate.reference).trim();
      const email = candidate?.email ? String(candidate.email).trim().toLowerCase() : "";

      const result = await prisma.$transaction(async (tx) => {
        let student = null;
        if (reference) {
          student = await tx.student.findFirst({
            where: { admissionNumber: reference, schoolId: assessment.schoolId },
          });
        }
        if (!student && email) {
          student = await tx.student.findFirst({
            where: { schoolId: assessment.schoolId, parentEmail: email },
          });
        }

        let savedResult = null;
        let savedExamResult = null;
        const score = Number(candidate?.score ?? 0);
        const maxScore = Number(candidate?.maxScore ?? assessment.maxScore ?? 100);
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
        const passed = isPassing(candidate, assessment.maxScore);
        const externalResultId = candidate?.resultId ?? candidate?.id ?? candidate?.result?.id ?? null;
        const attemptNumber = Math.max(1, Number.parseInt(String(candidate?.attemptNumber ?? 1), 10) || 1);
        const completedAt = candidate?.completedAt ? new Date(candidate.completedAt) : new Date();

        if (student) {
          const existing = await tx.result.findFirst({
            where: { assessmentId: assessment.id, studentId: student.id },
          });
          const data = {
            teacherId: req.user.id,
            studentId: student.id,
            assessmentId: assessment.id,
            subject: assessment.subject || "",
            className: assessment.className || "",
            score,
            maxScore,
            published: true,
            schoolId: assessment.schoolId,
          };
          savedResult = existing
            ? await tx.result.update({ where: { id: existing.id }, data })
            : await tx.result.create({ data });

          const attempt = await tx.examAttempt.upsert({
            where: { examId_studentId_attemptNumber: { examId: exam.id, studentId: student.id, attemptNumber } },
            create: {
              examId: exam.id,
              studentId: student.id,
              attemptNumber,
              status: "completed",
              startedAt: completedAt,
              completedAt,
              completionTimeSeconds: Number.isFinite(Number(candidate?.completionTimeSeconds)) ? Number(candidate.completionTimeSeconds) : null,
              score,
              percentage,
              externalResultId: externalResultId ? String(externalResultId) : null,
            },
            update: {
              status: "completed",
              completedAt,
              completionTimeSeconds: Number.isFinite(Number(candidate?.completionTimeSeconds)) ? Number(candidate.completionTimeSeconds) : undefined,
              score,
              percentage,
              externalResultId: externalResultId ? String(externalResultId) : undefined,
            },
          });

          savedExamResult = await tx.examResult.upsert({
            where: { attemptId: attempt.id },
            create: {
              examId: exam.id,
              studentId: student.id,
              attemptId: attempt.id,
              marks: score,
              percentage,
              completedAt,
              grade: passed ? "Pass" : "Fail",
            },
            update: {
              marks: score,
              percentage,
              completedAt,
              grade: passed ? "Pass" : "Fail",
            },
          });
        }

        let admission = null;
        if (reference) {
          admission = await tx.admission.findFirst({
            where: {
              schoolId: assessment.schoolId,
              OR: [{ applicationCode: reference }, { examReference: reference }],
            },
          });
        }
        if (!admission && email) {
          admission = await tx.admission.findFirst({
            where: {
              schoolId: assessment.schoolId,
              OR: [{ parentEmail: email }, { fatherEmail: email }, { motherEmail: email }],
            },
          });
        }

        if (!admission) return { savedResult, admission: null, passed: false };

        let admissionCode = admission.admissionCode;
        if (passed && !admissionCode) {
          const school = await tx.school.findUnique({ where: { id: admission.schoolId }, select: { name: true } });
          let created = false;
          for (let attempt = 0; attempt < 10 && !created; attempt += 1) {
            const candidateCode = buildAdmissionCode(school?.name);
            try {
              await tx.admission.update({
                where: { id: admission.id },
                data: {
                  admissionCode: candidateCode,
                  examScore: score,
                  examCompletedAt: new Date(),
                  examResult: "passed",
                  status: "admission_offered",
                },
              });
              admissionCode = candidateCode;
              created = true;
            } catch (error) {
              if (error?.code !== "P2002") throw error;
            }
          }
          if (!created) throw new Error("Unable to generate a unique admission code");
        } else {
          await tx.admission.update({
            where: { id: admission.id },
            data: {
              examScore: score,
              examCompletedAt: new Date(),
              examResult: passed ? "passed" : "failed",
              status: passed ? (admission.status === "enrolled" ? "enrolled" : "admission_offered") : "failed",
            },
          });
        }

        if (passed && admissionCode) {
          const fresh = await tx.admission.findUnique({ where: { id: admission.id } });
          if (fresh) emails.push({ admission: fresh, admissionCode });
        }

        return { savedResult, admission: admission.id, passed };
      });

      processed.push({ reference, studentFound: Boolean(result.savedResult), admissionId: result.admission, passed: result.passed });
    }

    await prisma.classMarkerIntegration.update({
      where: { assessmentId },
      data: { syncStatus: "synced", lastSyncedAt: new Date(), lastError: null },
    });

    for (const item of emails) {
      try {
        const school = await prisma.school.findUnique({ where: { id: item.admission.schoolId } });
        const base = school?.website || process.env.CLIENT_URL || "";
        const paymentUrl = `${base.replace(/\/$/, "")}/school_Fees`;
        const recipients = [item.admission.fatherEmail, item.admission.motherEmail, item.admission.parentEmail]
          .filter(Boolean)
          .map((value) => String(value).trim().toLowerCase());
        const dedupeKey = `admission-offer:${item.admission.id}:${item.admissionCode}`;
        const existingLog = await prisma.emailLog.findUnique({ where: { dedupeKey } });
        if (existingLog?.status === "sent") continue;

        const log = existingLog
          ? await prisma.emailLog.update({
              where: { id: existingLog.id },
              data: { attempts: { increment: 1 }, lastAttemptAt: new Date(), status: "sending", errorMessage: null },
            })
          : await prisma.emailLog.create({
              data: {
                schoolId: item.admission.schoolId,
                recipient: recipients.join(","),
                subject: "Admission Offer",
                status: "sending",
                dedupeKey,
                attempts: 1,
                lastAttemptAt: new Date(),
              },
            });

        const emailResult = await sendAdmissionEmail({
          school,
          admission: item.admission,
          studentName: item.admission.applicantName || "",
          admissionCode: item.admissionCode,
          paymentUrl,
        });

        await prisma.emailLog.update({
          where: { id: log.id },
          data: {
            status: emailResult?.success === true ? "sent" : "failed",
            errorMessage: emailResult?.success === true ? null : String(emailResult?.reason || "Email delivery failed").slice(0, 2000),
          },
        });
      } catch (emailError) {
        console.error("Admission email delivery failed:", emailError);
      }
    }

    return res.status(200).json({ success: true, processedCount: processed.length, processed });
  } catch (error) {
    next(error);
  }
};

export default {
  createRemoteExamForAssessment,
  getLaunchLinkForAssessment,
  syncResultsForAssessment,
};
