import { prisma } from "../config/db.js";
import { classMarkerService } from "../services/classMarkerService.js";
import { quizlabService } from "../services/quizlabService.js";
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

const extractLaunchUrl = (source) => {
  if (!source) return null;
  if (typeof source === "string") return source.trim() || null;
  if (typeof source !== "object") return null;
  return (
    source.quizUrl ||
    source.launchUrl ||
    source.launch_url ||
    source.launchURL ||
    source.url ||
    source.startUrl ||
    source.start_url ||
    source.startURL ||
    source.accessUrl ||
    source.access_url ||
    source.accessURL ||
    source.inviteUrl ||
    source.invite_url ||
    source.inviteURL ||
    source.candidateUrl ||
    source.candidate_url ||
    source.candidateURL ||
    null
  );
};

const findLaunchUrlDeep = (value, path = [], seen = new WeakSet()) => {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return /^https?:\/\//i.test(trimmed) ? { url: trimmed, path: path.join(".") || "(root)" } : null;
  }
  if (typeof value !== "object") return null;
  if (seen.has(value)) return null;
  seen.add(value);

  const direct = extractLaunchUrl(value);
  if (direct) return { url: direct, path: path.join(".") || "(root)" };

  for (const [key, nested] of Object.entries(value)) {
    if (typeof nested === "string") {
      const trimmed = nested.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        return { url: trimmed, path: [...path, key].join(".") };
      }
    }
    if (nested && typeof nested === "object") {
      const found = findLaunchUrlDeep(nested, [...path, key], seen);
      if (found) return found;
    }
  }

  return null;
};

const safeLogQuizlab = (label, value) => {
  try {
    const summary = Array.isArray(value)
      ? {
          type: "array",
          length: value.length,
          firstKeys: value[0] && typeof value[0] === "object" ? Object.keys(value[0]).slice(0, 20) : undefined,
        }
      : value && typeof value === "object"
        ? {
            type: "object",
            keys: Object.keys(value).slice(0, 30),
          }
        : {
            type: typeof value,
          };
    console.log(`[QuizLab Debug] ${label}`, summary);
  } catch (error) {
    console.log(`[QuizLab Debug] ${label} <unprintable>`);
  }
};

const quizlabResponseHint = (value) => {
  if (!value || typeof value !== "object") return "No object payload returned";
  const keys = Object.keys(value);
  const textHints = keys
    .filter((key) => /url|link|launch|access|invite|candidate|attempt|session|token|id/i.test(key))
    .join(", ");
  return `keys: ${keys.slice(0, 30).join(", ")}${textHints ? `; hints: ${textHints}` : ""}`;
};

const buildQuizlabLaunchUrl = (value) => {
  const direct = findLaunchUrlDeep(value);
  if (direct?.url) return direct;
  const token = value?.token || value?.access_token || value?.invite_token || value?.candidate_token || null;
  if (token) {
    return {
      url: `https://quizlab.in/quiz/${String(token).trim()}/register`,
      path: "token",
    };
  }
  return null;
};

const makeStepError = (step, message, statusCode = 400, details = {}) => {
  const error = new Error(message);
  error.step = step;
  error.statusCode = statusCode;
  error.details = details;
  return error;
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

    // Use QuizLab to create or verify a quiz for this assessment
    let remote = null;
    try {
      // Try to find existing quiz mapping first
      if (assessment.quizlabQuizId) {
        try {
          remote = await quizlabService.getQuiz(assessment.quizlabQuizId);
        } catch (e) {
          remote = null;
        }
      }
      if (!remote) {
        // Create a quiz on QuizLab using basic metadata
        const payload = { title: assessment.title, maxScore: assessment.maxScore || 100, description: assessment.description || '', metadata: { petraAssessmentId: assessment.id } };
        const created = await quizlabService.createQuiz(payload);
        const quizId = created?.quizId || created?.id || created?.quiz_id || null;
        if (!quizId) throw new Error('QuizLab did not return a quiz id');
        await quizlabService.publishQuiz(quizId);
        remote = await quizlabService.getQuiz(quizId);

        await prisma.assessment.update({
          where: { id: assessment.id },
          data: { quizlabQuizId: quizId },
        });

        // Keep legacy mapping writes isolated from the active start flow.
        try {
          await prisma.classMarkerIntegration.upsert({
            where: { assessmentId },
            create: {
              schoolId: assessment.schoolId,
              assessmentId,
              remoteExamId: quizId,
              remoteExamUrl: remote?.launchUrl || remote?.url || null,
              syncStatus: 'created',
            },
            update: {
              remoteExamId: quizId,
              remoteExamUrl: remote?.launchUrl || remote?.url || undefined,
              syncStatus: 'created',
              lastError: null,
            },
          });
        } catch (error) {
          if (String(error?.code || "") !== "P2021" && !/ClassMarkerIntegration/i.test(String(error?.message || ""))) {
            throw error;
          }
        }
      }
    } catch (err) {
      return next(err);
    }
    return res.status(201).json({ success: true, remote });
  } catch (error) {
    next(error);
  }
};

export const getLaunchLinkForAssessment = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });

    const quizId = assessment.quizlabQuizId;
    if (!quizId) {
      return res.status(404).json({ success: false, message: "Remote quiz not created" });
    }

    // Ensure remote quiz exists and create an invitation for the candidate
    const candidate = req.body?.candidate || null;
    try {
      const quiz = await quizlabService.getQuiz(quizId);
      // Create or reuse invitation
      const inv = await quizlabService.createInvitation(quizId, candidate || {});
      const launchUrl = inv?.launchUrl || inv?.url || quiz?.launchUrl || quiz?.url || null;
      if (!launchUrl) throw new Error('QuizLab did not return a launch URL');
      return res.status(200).json({ success: true, url: launchUrl });
    } catch (err) {
      return next(err);
    }
  } catch (error) {
    next(error);
  }
};

export const launchForCandidate = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const candidate = req.body?.candidate || req.body || null;
    if (!candidate || !candidate.reference) return res.status(400).json({ success: false, message: 'candidate.reference required' });

    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    const quizId = assessment.quizlabQuizId;
    if (!quizId) return res.status(404).json({ success: false, message: 'Remote quiz not created' });

    // Validate candidate.reference matches an Admission for this school
    const reference = String(candidate.reference).trim();
    const admission = await prisma.admission.findFirst({
      where: {
        schoolId: assessment.schoolId,
        OR: [{ admissionCode: reference }, { applicationCode: reference }, { examReference: reference }, { applicantId: reference }],
      },
    });
    if (!admission) return res.status(400).json({ success: false, message: 'Invalid applicant ID' });

    try {
      // Create or reuse invitation for the quiz with reference set to applicantId
      const inv = await quizlabService.createInvitation(quizId, { reference, email: candidate.email || admission.parentEmail || null, name: candidate.name || admission.applicantName || null });
      const launchUrl = inv?.launchUrl || inv?.url || null;
      if (!launchUrl) throw new Error('QuizLab did not return a launch URL');
      return res.status(200).json({ success: true, url: launchUrl });
    } catch (err) {
      return next(err);
    }
  } catch (error) {
    return next(error);
  }
};

export const startAssessmentForApplicant = async (req, res, next) => {
  try {
    const { applicantId, assessmentId } = req.body || {};
    if (!applicantId || !assessmentId) throw makeStepError("request_validation", "applicantId and assessmentId required", 400);

    let assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw makeStepError("assessment_lookup", "Assessment not found", 404);

    let quizId = assessment.quizlabQuizId;
    if (!quizId) {
      try {
        const quizzes = await quizlabService.listQuizzes({ status: "published" });
        const quizList = Array.isArray(quizzes) ? quizzes : (quizzes?.assessments || quizzes?.quizzes || []);
        const candidates = Array.isArray(quizList) ? quizList : [];
        const matched =
          candidates.find((quiz) => String(quiz?.title || "").toLowerCase() === String(assessment.title || "").toLowerCase()) ||
          candidates.find((quiz) => String(quiz?.title || "").toLowerCase().includes("exam")) ||
          candidates[0] ||
          null;
        quizId = matched?.id || matched?.quiz_id || matched?.quizId || null;
        if (!quizId) throw new Error("No published QuizLab quiz matched the assessment");
        await prisma.assessment.update({
          where: { id: assessment.id },
          data: { quizlabQuizId: String(quizId) },
        });
        assessment = { ...assessment, quizlabQuizId: String(quizId) };
      } catch (e) {
        throw makeStepError("assessment_mapping", `No QuizLab quiz is configured for this assessment: ${e.message || e}`, 404);
      }
    }

    // Validate applicant exists for this school
    const admission = await prisma.admission.findFirst({ where: { schoolId: assessment.schoolId, OR: [{ applicantId: applicantId }, { applicationCode: applicantId }, { admissionCode: applicantId }, { examReference: applicantId }] } });
    if (!admission) throw makeStepError("applicant_lookup", "Applicant not found", 400);

    try {
      // Try to find existing invitation for this applicant
      let inv = null;
      try {
        const list = await quizlabService.listInvitations(quizId, { reference: applicantId });
        safeLogQuizlab("listInvitations response", list);
        const items = Array.isArray(list) ? list : (list?.invitations || []);
        if (items && items.length) inv = items[0];
      } catch (e) {
        throw makeStepError("quizlab_list_invitations", `QuizLab invitation lookup failed: ${e.message || e}`, 502, { quizId });
      }

      if (!inv) {
        try {
          inv = await quizlabService.createInvitation(quizId, { reference: applicantId, email: admission.parentEmail || null, name: admission.applicantName || null });
          safeLogQuizlab("createInvitation response", inv);
        } catch (e) {
          throw makeStepError("quizlab_create_invitation", `QuizLab candidate access creation failed: ${e.message || e}`, 502, { quizId });
        }
      }

      let quiz;
      try {
        quiz = await quizlabService.getQuiz(quizId);
        safeLogQuizlab("getQuiz response", quiz);
      } catch (e) {
        throw makeStepError("quizlab_get_quiz", `QuizLab quiz lookup failed: ${e.message || e}`, 502, { quizId });
      }

      const inviteLaunch = buildQuizlabLaunchUrl(inv);
      const quizLaunch = buildQuizlabLaunchUrl(quiz);
      let atsAssessment = null;
      if (!inviteLaunch && !quizLaunch) {
        try {
          atsAssessment = await quizlabService.createAssessment({
            quiz_id: Number.isNaN(Number(quizId)) ? quizId : Number(quizId),
            candidate_email: admission.parentEmail || admission.fatherEmail || admission.motherEmail || null,
            candidate_name: admission.applicantName || null,
            external_id: applicantId,
          });
          safeLogQuizlab("createAssessment response", atsAssessment);
        } catch (e) {
          console.log("[QuizLab Debug] createAssessment fallback failed", {
            message: e?.message,
            status: e?.status,
            responseKeys: e?.response && typeof e.response === "object" ? Object.keys(e.response).slice(0, 20) : undefined,
          });
        }
      }

      const atsLaunch = buildQuizlabLaunchUrl(atsAssessment);
      const resolvedLaunch = inviteLaunch || quizLaunch || atsLaunch;
      const resolvedLaunchUrl = resolvedLaunch?.url || null;
      if (!resolvedLaunchUrl) {
        const inviteHint = quizlabResponseHint(inv);
        const quizHint = quizlabResponseHint(quiz);
        const atsHint = quizlabResponseHint(atsAssessment);
        throw makeStepError("quizlab_launch_url", `QuizLab did not return a launch URL. invitation ${inviteHint}; quiz ${quizHint}; ats ${atsHint}`, 502, { inviteHint, quizHint, atsHint });
      }
      if (resolvedLaunch?.path) {
        console.log(`[QuizLab Debug] launch url resolved from ${resolvedLaunch.path}`);
      }
      return res.status(200).json({ success: true, quizUrl: resolvedLaunchUrl, url: resolvedLaunchUrl });
    } catch (err) {
      console.error("[QuizLab Debug] startAssessmentForApplicant failed", {
        message: err?.message,
        quizId,
        applicantId,
        assessmentId,
        step: err?.step,
      });
      if (err?.step) {
        return res.status(err.statusCode || 500).json({ success: false, message: err.message, step: err.step });
      }
      return next(err);
    }
  } catch (error) {
    if (error?.step) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message, step: error.step });
    }
    next(error);
  }
};

export const syncResultsForAssessment = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });

    const quizId = assessment.quizlabQuizId;
    if (!quizId) {
      return res.status(404).json({ success: false, message: "Remote exam not created" });
    }

    let candidates = [];
    try {
      const attempts = await quizlabService.listAttempts(quizId);
      candidates = Array.isArray(attempts) ? attempts : (attempts?.attempts || []);
    } catch (error) {
      try {
        await prisma.classMarkerIntegration.update({ where: { assessmentId }, data: { syncStatus: 'error', lastError: String(error.message || error).slice(0, 2000) } });
      } catch (updateError) {
        if (String(updateError?.code || "") !== "P2021" && !/ClassMarkerIntegration/i.test(String(updateError?.message || ""))) {
          throw updateError;
        }
      }
      throw error;
    }
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

    try {
      await prisma.classMarkerIntegration.update({
        where: { assessmentId },
        data: { syncStatus: "synced", lastSyncedAt: new Date(), lastError: null },
      });
    } catch (updateError) {
      if (String(updateError?.code || "") !== "P2021" && !/ClassMarkerIntegration/i.test(String(updateError?.message || ""))) {
        throw updateError;
      }
    }

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
