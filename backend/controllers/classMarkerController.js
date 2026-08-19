import { prisma } from "../config/db.js";
// import { classMarkerService } from "../services/classMarkerService.js";
import { quizlabService } from "../services/quizlabService.js";
import { sendAdmissionEmail } from "../services/emailService.js";
import crypto from "crypto";

const teacherOrAdminRole = ["teacher", "principal"];

const normalizeRemoteId = (remote) =>
  String(
    remote?.id ??
      remote?.testId ??
      remote?._id ??
      remote?.remoteId ??
      remote?.identifier ??
      ""
  ).trim();

const buildAdmissionCode = (schoolName = "School") => {
  const prefix = (
    process.env.ADMISSION_CODE_PREFIX ||
    String(schoolName).replace(/[^A-Za-z0-9]/g, "").slice(0, 3) ||
    "ADM"
  )
    .toUpperCase()
    .slice(0, 3);

  const length = Math.max(
    6,
    Math.min(20, Number(process.env.ADMISSION_CODE_LENGTH || 10))
  );

  const suffixLength = Math.max(3, length - prefix.length);

  const suffix = crypto
    .randomBytes(Math.ceil(suffixLength / 2))
    .toString("hex")
    .toUpperCase()
    .slice(0, suffixLength);

  return `${prefix}${suffix}`.slice(0, length);
};

const resolvePassingThreshold = (candidate, assessment) => {
  const sources = [
    candidate?.passing_percent,
    candidate?.passingPercent,
    candidate?.passPercent,
    candidate?.cutoff_percent,
    candidate?.cutoffPercent,
    candidate?.cutoff,
    assessment?.passingPercent,
    assessment?.passing_percent,
    assessment?.passPercent,
    assessment?.pass_mark,
    assessment?.passMark,
    assessment?.pass_percentage,
  ];

  for (const value of sources) {
    const numeric = Number(value);

    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric > 1 ? numeric : numeric * 100;
    }
  }

  return null;
};

const isPassing = (candidate, assessment, fallbackMax) => {
  if (candidate?.passed === true) return true;

  if (
    typeof candidate?.status === "string" &&
    candidate.status.toLowerCase() === "passed"
  ) {
    return true;
  }

  const score = Number(candidate?.score);
  const max = Number(candidate?.maxScore ?? fallbackMax ?? 100);
  const threshold = resolvePassingThreshold(candidate, assessment);

  if (
    !Number.isFinite(score) ||
    !Number.isFinite(max) ||
    max <= 0
  ) {
    return false;
  }

  const percentage = (score / max) * 100;

  if (Number.isFinite(threshold)) {
    return percentage >= threshold;
  }

  return percentage >= 50;
};

const extractLaunchUrl = (source) => {
  if (!source) return null;

  if (typeof source === "string") {
    return source.trim() || null;
  }

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

const findLaunchUrlDeep = (
  value,
  path = [],
  seen = new WeakSet()
) => {
  if (!value) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();

    return /^https?:\/\//i.test(trimmed)
      ? {
          url: trimmed,
          path: path.join(".") || "(root)",
        }
      : null;
  }

  if (typeof value !== "object") return null;

  if (seen.has(value)) return null;

  seen.add(value);

  const direct = extractLaunchUrl(value);

  if (direct) {
    return {
      url: direct,
      path: path.join(".") || "(root)",
    };
  }

  for (const [key, nested] of Object.entries(value)) {
    if (typeof nested === "string") {
      const trimmed = nested.trim();

      if (/^https?:\/\//i.test(trimmed)) {
        return {
          url: trimmed,
          path: [...path, key].join("."),
        };
      }
    }

    if (nested && typeof nested === "object") {
      const found = findLaunchUrlDeep(
        nested,
        [...path, key],
        seen
      );

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
          firstKeys:
            value[0] && typeof value[0] === "object"
              ? Object.keys(value[0]).slice(0, 20)
              : undefined,
          firstSample:
            value[0] && typeof value[0] === "object"
              ? Object.fromEntries(
                  Object.entries(value[0])
                    .slice(0, 12)
                    .map(([key, entry]) => [
                      key,
                      typeof entry === "string"
                        ? entry.length > 80
                          ? `${entry.slice(0, 80)}…`
                          : entry
                        : typeof entry === "number" ||
                            typeof entry === "boolean" ||
                            entry === null
                          ? entry
                          : Array.isArray(entry)
                            ? { type: "array", length: entry.length }
                            : entry && typeof entry === "object"
                              ? { type: "object", keys: Object.keys(entry).slice(0, 10) }
                              : typeof entry,
                    ])
                )
              : undefined,
        }
      : value && typeof value === "object"
        ? {
            type: "object",
            keys: Object.keys(value).slice(0, 30),
            sample: Object.fromEntries(
              Object.entries(value)
                .slice(0, 12)
                .map(([key, entry]) => [
                  key,
                  typeof entry === "string"
                    ? entry.length > 80
                      ? `${entry.slice(0, 80)}…`
                      : entry
                    : typeof entry === "number" ||
                        typeof entry === "boolean" ||
                        entry === null
                      ? entry
                      : Array.isArray(entry)
                        ? { type: "array", length: entry.length }
                        : entry && typeof entry === "object"
                          ? { type: "object", keys: Object.keys(entry).slice(0, 10) }
                          : typeof entry,
                ])
            ),
          }
        : {
          type: typeof value,
        };

    console.log(`[QuizLab Debug] ${label}`, {
      type: summary.type,
      length: summary.length,
      keys: summary.keys || summary.firstKeys,
    });
  } catch (error) {
    console.log(
      `[QuizLab Debug] ${label} <unprintable>`
    );
  }
};

const quizlabResponseHint = (value) => {
  if (!value || typeof value !== "object") {
    return "No object payload returned";
  }

  const keys = Object.keys(value);

  const textHints = keys
    .filter((key) =>
      /url|link|launch|access|invite|candidate|attempt|session|token|id/i.test(
        key
      )
    )
    .join(", ");

  return `keys: ${keys.slice(0, 30).join(", ")}${
    textHints ? `; hints: ${textHints}` : ""
  }`;
};

const buildQuizlabLaunchUrl = (value) => {
  const direct = findLaunchUrlDeep(value);

  if (direct?.url) return direct;

  const token =
    value?.token ||
    value?.access_token ||
    value?.invite_token ||
    value?.candidate_token ||
    null;

  if (token) {
    return {
      url: `https://quizlab.in/quiz/${String(token).trim()}/register`,
      path: "token",
    };
  }

  return null;
};

const makeStepError = (
  step,
  message,
  statusCode = 400,
  details = {}
) => {
  const error = new Error(message);

  error.step = step;
  error.statusCode = statusCode;
  error.details = details;

  return error;
};

const normalizeRemoteIdentifier = (value) =>
  String(value ?? "").trim();

const normalizeEmail = (value) =>
  String(value ?? "").trim().toLowerCase();

const pickFirstString = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
};

const pickFirstNumber = (...values) => {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
};

const getQuizlabCandidateEmail = (value) =>
  normalizeEmail(
    pickFirstString(
      value?.candidate_email,
      value?.candidateEmail,
      value?.email,
      value?.applicantEmail,
      value?.parentEmail,
      value?.parent_email,
      value?.candidate?.email,
      value?.invitation?.candidate_email,
      value?.invitation?.email
    )
  );

const flattenAttemptItems = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const nested = payload?.attempts || payload?.items || payload?.results || payload?.data || payload?.content;
  if (Array.isArray(nested)) return nested;
  if (nested && typeof nested === "object") return [nested];
  if (payload && typeof payload === "object") return [payload];
  return [];
};

const normalizeQuizLabAttempt = (raw) => {
  const attempt = raw?.attempt ?? raw?.result ?? raw?.data ?? raw?.payload ?? raw;
  if (!attempt || typeof attempt !== "object" || attempt.error) return null;

  const reference = pickFirstString(
    attempt.reference,
    attempt.applicantReference,
    attempt.applicant_reference,
    attempt.candidateReference,
    attempt.candidate_reference,
    attempt.userReference,
    attempt.user_reference,
    attempt.externalId,
    attempt.external_id,
    attempt.metadata?.reference,
    attempt.metadata?.applicantReference,
    attempt.metadata?.applicantId,
    attempt.metadata?.applicant_id,
    attempt.metadata?.applicationCode,
    attempt.metadata?.application_code,
    attempt.metadata?.admissionCode,
    attempt.metadata?.admission_code,
    attempt.metadata?.examReference,
    attempt.metadata?.exam_reference,
    attempt.metadata?.externalId,
    attempt.metadata?.external_id,
    attempt.invitation?.reference,
    attempt.invitation?.metadata?.reference,
    attempt.invitation?.metadata?.applicantId,
    attempt.invitation?.metadata?.applicant_id,
    attempt.invitation?.metadata?.applicationCode,
    attempt.invitation?.metadata?.application_code,
    attempt.invitation?.metadata?.admissionCode,
    attempt.invitation?.metadata?.admission_code,
    attempt.invitation?.metadata?.examReference,
    attempt.invitation?.metadata?.exam_reference
  );

  const invitationId = pickFirstString(
    attempt.invitationId,
    attempt.invitation_id,
    attempt.inviteId,
    attempt.invite_id,
    attempt.invitation?.id,
    attempt.invitation?.invitationId,
    attempt.invitation?.invitation_id
  );

  const attemptId = pickFirstString(
    attempt.attemptId,
    attempt.attempt_id
  ) ?? pickFirstNumber(
    attempt.attemptId,
    attempt.attempt_id,
    attempt.id,
    attempt.resultAttemptId,
    attempt.result_attempt_id
  );

  const resultId = pickFirstString(
    attempt.resultId,
    attempt.result_id,
    attempt.result?.id,
    attempt.externalResultId,
    attempt.external_result_id
  ) ?? pickFirstNumber(attempt.resultId, attempt.result_id, attempt.id, attempt.result?.id, attempt.externalResultId, attempt.external_result_id);

  const score = pickFirstNumber(
    attempt.score,
    attempt.marksObtained,
    attempt.marks_obtained,
    attempt.obtainedScore,
    attempt.obtained_score,
    attempt.totalScore,
    attempt.total_score
  );

  const maxScore = pickFirstNumber(
    attempt.maxScore,
    attempt.max_score,
    attempt.maximumScore,
    attempt.maximum_score,
    attempt.totalMarks,
    attempt.total_marks,
    attempt.max_marks,
    attempt.total
  );

  const percentage = pickFirstNumber(
    attempt.percentage,
    attempt.percent,
    attempt.scorePercentage,
    attempt.score_percentage
  );

  const completedAt = pickFirstString(
    attempt.completedAt,
    attempt.completed_at,
    attempt.completionDate,
    attempt.completion_date,
    attempt.submittedAt,
    attempt.submitted_at,
    attempt.updatedAt,
    attempt.updated_at
  );

  const status = pickFirstString(
    attempt.status,
    attempt.completionStatus,
    attempt.completion_status,
    attempt.resultStatus,
    attempt.result_status
  );

  const quizId = pickFirstString(
    attempt.quizId,
    attempt.quiz_id,
    attempt.assessmentId,
    attempt.assessment_id,
    attempt.examId,
    attempt.exam_id,
    attempt.invitation?.quizId,
    attempt.invitation?.quiz_id
  );

  return {
    raw: attempt,
    reference,
    invitationId,
    attemptId,
    resultId,
    score,
    maxScore,
    percentage,
    completedAt,
    status,
    quizId,
    email: getQuizlabCandidateEmail(attempt) || null,
    name: pickFirstString(attempt.name, attempt.applicantName, attempt.applicant_name, attempt.candidateName, attempt.candidate_name),
    startedAt: pickFirstString(attempt.startedAt, attempt.started_at, attempt.beginAt, attempt.begin_at),
    completionTimeSeconds: pickFirstNumber(attempt.completionTimeSeconds, attempt.completion_time_seconds, attempt.durationSeconds),
    passed: typeof attempt.passed === "boolean" ? attempt.passed : null,
  };
};

const isCompletedQuizlabAttempt = (attempt) => {
  const status = String(attempt?.status || "").trim().toLowerCase();

  return ["completed", "submitted", "graded", "passed", "failed", "finished"].includes(status);
};

const getQuizlabAttemptTime = (attempt) => {
  const value = attempt?.completedAt || attempt?.startedAt || null;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const admissionIdentitySelect = {
  id: true,
  schoolId: true,
  studentId: true,
  status: true,
  examScore: true,
  examCompletedAt: true,
  examResult: true,
  admissionCode: true,
  applicantId: true,
  applicationCode: true,
  examReference: true,
  applicantName: true,
  applicantFirstName: true,
  applicantMiddleName: true,
  applicantLastName: true,
  intendedClass: true,
  parentEmail: true,
  parentPhone: true,
  fatherEmail: true,
  fatherPhone1: true,
  fatherName: true,
  motherEmail: true,
  motherPhone1: true,
  motherName: true,
  remarks: true,
  submissionData: true,
};

const getAdmissionStoredData = (admission) => {
  const stored = {};

  for (const value of [admission?.submissionData, admission?.remarks]) {
    if (!value) continue;
    if (typeof value === "object") {
      Object.assign(stored, value);
      continue;
    }

    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        Object.assign(stored, parsed);
      }
    } catch {
      // Legacy text remarks are not identity metadata.
    }
  }

  return stored;
};

const getAdmissionCandidateEmails = (admission) => {
  const stored = getAdmissionStoredData(admission);

  return [
    admission?.parentEmail,
    admission?.fatherEmail,
    admission?.motherEmail,
    stored.parentEmail,
    stored.fatherEmail,
    stored.motherEmail,
  ]
    .map(normalizeEmail)
    .filter(Boolean);
};

const findUniqueAdmissionByReference = async (
  tx,
  schoolId,
  reference
) => {
  if (!reference) return null;

  const matches = await tx.admission.findMany({
    where: {
      schoolId,
      OR: [
        { applicantId: reference },
        { applicationCode: reference },
        { admissionCode: reference },
        { examReference: reference },
      ],
    },
    select: admissionIdentitySelect,
    take: 2,
  });

  return matches.length === 1 ? matches[0] : null;
};

const findUniqueAdmissionByIdentity = async (tx, schoolId, { reference, email }) => {
  if (reference) {
    const admission = await findUniqueAdmissionByReference(tx, schoolId, reference);
    if (admission) return admission;
  }

  if (email) {
    const matches = await tx.admission.findMany({
      where: {
        schoolId,
        OR: [{ parentEmail: email }, { fatherEmail: email }, { motherEmail: email }],
      },
      select: admissionIdentitySelect,
      take: 2,
    });
    if (matches.length === 1) return matches[0];

    if (matches.length === 0) {
      const storedDataMatches = await tx.admission.findMany({
        where: {
          schoolId,
        },
        select: admissionIdentitySelect,
      });
      const matchingAdmissions = storedDataMatches.filter((admission) =>
        getAdmissionCandidateEmails(admission).includes(email)
      );

      if (matchingAdmissions.length === 1) {
        return matchingAdmissions[0];
      }
    }
  }

  return null;
};

const getUniqueAdmissionEmail = async (tx, schoolId, admission) => {
  const candidateEmails = getAdmissionCandidateEmails(admission);

  for (const email of [...new Set(candidateEmails)]) {
    const matchedAdmission = await findUniqueAdmissionByIdentity(tx, schoolId, {
      reference: null,
      email,
    });

    if (matchedAdmission?.id === admission.id) {
      return email;
    }
  }

  return null;
};

const resolveQuizlabAttemptNumber = async (
  tx,
  { examId, studentId, externalResultId, requestedAttemptNumber }
) => {
  const requested = Math.max(1, Number(requestedAttemptNumber) || 1);

  // QuizLab's attempt ID is the stable idempotency key. Reusing it must update,
  // not create a duplicate local attempt on a later sync.
  if (!externalResultId) {
    return requested;
  }

  const externalId = String(externalResultId);
  const existingByExternalId = await tx.examAttempt.findFirst({
    where: {
      examId,
      studentId,
      externalResultId: externalId,
    },
    select: {
      attemptNumber: true,
    },
  });

  if (existingByExternalId) {
    return existingByExternalId.attemptNumber;
  }

  const requestedAttempt = await tx.examAttempt.findUnique({
    where: {
      examId_studentId_attemptNumber: {
        examId,
        studentId,
        attemptNumber: requested,
      },
    },
    select: {
      id: true,
    },
  });

  if (!requestedAttempt) {
    return requested;
  }

  const latestAttempt = await tx.examAttempt.findFirst({
    where: {
      examId,
      studentId,
    },
    orderBy: {
      attemptNumber: "desc",
    },
    select: {
      attemptNumber: true,
    },
  });

  return Math.max(requested, Number(latestAttempt?.attemptNumber || 0) + 1);
};

const ensureAssessmentQuiz = async (assessment) => {
  if (assessment?.quizlabQuizId) {
    try {
      const remote = await quizlabService.getQuiz(
        assessment.quizlabQuizId
      );

      return {
        quizId: String(assessment.quizlabQuizId),
        remote,
        created: false,
      };
    } catch (error) {
      throw makeStepError(
        "quizlab_quiz_lookup",
        `Configured QuizLab quiz could not be found remotely: ${
          error.message || error
        }`,
        502,
        {
          quizId: assessment.quizlabQuizId,
          assessmentId: assessment.id,
        }
      );
    }
  }

  const payload = {
    title: assessment.title,
    maxScore: assessment.maxScore || 100,
    description: assessment.description || "",
    metadata: {
      petraAssessmentId: assessment.id,
    },
  };

  const created = await quizlabService.createQuiz(payload);
  const quizId =
    created?.quizId ||
    created?.id ||
    created?.quiz_id ||
    null;

  if (!quizId) {
    throw new Error("QuizLab did not return a quiz id");
  }

  await quizlabService.publishQuiz(quizId);
  const remote = await quizlabService.getQuiz(quizId);

  await prisma.assessment.update({
    where: {
      id: assessment.id,
    },

    data: {
      quizlabQuizId: String(quizId),
    },
  });

  try {
    await prisma.classMarkerIntegration.upsert({
      where: {
        assessmentId: assessment.id,
      },

      create: {
        schoolId: assessment.schoolId,
        assessmentId: assessment.id,
        remoteExamId: String(quizId),
        remoteExamUrl: remote?.launchUrl || remote?.url || null,
        syncStatus: "created",
      },

      update: {
        remoteExamId: String(quizId),
        remoteExamUrl: remote?.launchUrl || remote?.url || undefined,
        syncStatus: "created",
        lastError: null,
      },
    });
  } catch (error) {
    if (
      String(error?.code || "") !== "P2021" &&
      !/ClassMarkerIntegration/i.test(String(error?.message || ""))
    ) {
      throw error;
    }
  }

  return {
    quizId: String(quizId),
    remote,
    created: true,
  };
};

/**
 * Create or retrieve a remote QuizLab exam for an Assessment.
 */
export const createRemoteExamForAssessment = async (
  req,
  res,
  next
) => {
  try {
    const { assessmentId } = req.body;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "assessmentId required",
      });
    }

    const assessment = await prisma.assessment.findUnique({
      where: {
        id: assessmentId,
      },
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    if (
      assessment.teacherId &&
      assessment.teacherId !== req.user.id &&
      !teacherOrAdminRole.includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    let remote = null;

    try {
      if (assessment.quizlabQuizId) {
        try {
          remote = await quizlabService.getQuiz(
            assessment.quizlabQuizId
          );
        } catch (e) {
          remote = null;
        }
      }

      if (!remote) {
        const payload = {
          title: assessment.title,
          maxScore: assessment.maxScore || 100,
          description: assessment.description || "",
          metadata: {
            petraAssessmentId: assessment.id,
          },
        };

        const created =
          await quizlabService.createQuiz(payload);

        const quizId =
          created?.quizId ||
          created?.id ||
          created?.quiz_id ||
          null;

        if (!quizId) {
          throw new Error(
            "QuizLab did not return a quiz id"
          );
        }

        await quizlabService.publishQuiz(quizId);

        remote =
          await quizlabService.getQuiz(quizId);

        await prisma.assessment.update({
          where: {
            id: assessment.id,
          },

          data: {
            quizlabQuizId: String(quizId),
          },
        });

        try {
          await prisma.classMarkerIntegration.upsert({
            where: {
              assessmentId,
            },

            create: {
              schoolId: assessment.schoolId,
              assessmentId,
              remoteExamId: String(quizId),

              remoteExamUrl:
                remote?.launchUrl ||
                remote?.url ||
                null,

              syncStatus: "created",
            },

            update: {
              remoteExamId: String(quizId),

              remoteExamUrl:
                remote?.launchUrl ||
                remote?.url ||
                undefined,

              syncStatus: "created",
              lastError: null,
            },
          });
        } catch (error) {
          if (
            String(error?.code || "") !== "P2021" &&
            !/ClassMarkerIntegration/i.test(
              String(error?.message || "")
            )
          ) {
            throw error;
          }
        }
      }
    } catch (err) {
      return next(err);
    }

    return res.status(201).json({
      success: true,
      remote,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a launch link for an assessment.
 */
export const getLaunchLinkForAssessment = async (
  req,
  res,
  next
) => {
  try {
    const { assessmentId } = req.params;

    const assessment =
      await prisma.assessment.findUnique({
        where: {
          id: assessmentId,
        },
      });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    const quizId = assessment.quizlabQuizId;

    if (!quizId) {
      return res.status(404).json({
        success: false,
        message: "Remote quiz not created",
      });
    }

    const candidate =
      req.body?.candidate || null;

    try {
      const quiz =
        await quizlabService.getQuiz(quizId);

      const inv =
        await quizlabService.createInvitation(
          quizId,
          candidate || {}
        );

      const launchUrl =
        inv?.launchUrl ||
        inv?.url ||
        (inv?.token
          ? `https://quizlab.in/quiz/${String(inv.token).trim()}/register`
          : null) ||
        quiz?.launchUrl ||
        quiz?.url ||
        null;

      if (!launchUrl) {
        throw new Error(
          "QuizLab did not return a launch URL"
        );
      }

      return res.status(200).json({
        success: true,
        url: launchUrl,
      });
    } catch (err) {
      return next(err);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Launch a QuizLab exam for a candidate.
 */
export const launchForCandidate = async (
  req,
  res,
  next
) => {
  try {
    const { assessmentId } = req.params;

    const candidate =
      req.body?.candidate ||
      req.body ||
      null;

    if (
      !candidate ||
      !candidate.reference
    ) {
      return res.status(400).json({
        success: false,
        message: "candidate.reference required",
      });
    }

    const assessment =
      await prisma.assessment.findUnique({
        where: {
          id: assessmentId,
        },
      });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    const quizId =
      assessment.quizlabQuizId;

    if (!quizId) {
      return res.status(404).json({
        success: false,
        message: "Remote quiz not created",
      });
    }

    const reference =
      String(candidate.reference).trim();

    const admission =
      await prisma.admission.findFirst({
        where: {
          schoolId: assessment.schoolId,

          OR: [
            {
              admissionCode: reference,
            },
            {
              applicationCode: reference,
            },
            {
              examReference: reference,
            },
            {
              applicantId: reference,
            },
          ],
        },
      });

    if (!admission) {
      return res.status(400).json({
        success: false,
        message: "Invalid applicant ID",
      });
    }

    const invitationEmail = await getUniqueAdmissionEmail(
      prisma,
      assessment.schoolId,
      admission
    );

    if (!invitationEmail) {
      return res.status(400).json({
        success: false,
        message: "A unique applicant email is required before a QuizLab invitation can be created",
      });
    }

    try {
      const invitations = await quizlabService.listInvitations(quizId);
      const items = Array.isArray(invitations)
        ? invitations
        : invitations?.invitations || [];
      let inv = items.find(
        (item) => getQuizlabCandidateEmail(item) === invitationEmail
      );

      if (!inv) {
        inv = await quizlabService.createInvitation(quizId, {
          email: invitationEmail,
          full_name: admission.applicantName || null,
        });
      }

      const launchUrl =
        inv?.launchUrl ||
        inv?.url ||
        (inv?.token
          ? `https://quizlab.in/quiz/${String(inv.token).trim()}/register`
          : null) ||
        null;

      if (!launchUrl) {
        throw new Error(
          "QuizLab did not return a launch URL"
        );
      }

      return res.status(200).json({
        success: true,
        url: launchUrl,
      });
    } catch (err) {
      return next(err);
    }
  } catch (error) {
    return next(error);
  }
};

/**
 * Start assessment for applicant.
 */
export const startAssessmentForApplicant = async (
  req,
  res,
  next
) => {
  try {
    const {
      applicantId,
      assessmentId,
    } = req.body || {};

    if (!applicantId || !assessmentId) {
      throw makeStepError(
        "request_validation",
        "applicantId and assessmentId required",
        400
      );
    }

    let assessment =
      await prisma.assessment.findUnique({
        where: {
          id: assessmentId,
        },
      });

    if (!assessment) {
      throw makeStepError(
        "assessment_lookup",
        "Assessment not found",
        404
      );
    }

    let quizId;

    try {
      const resolved = await ensureAssessmentQuiz(assessment);
      quizId = resolved.quizId;
      console.log("[QuizLab Debug] resolved assessment quiz", {
        assessmentId,
        quizlabQuizId: quizId,
        source: resolved.created ? "created_for_assessment" : "assessment",
      });
    } catch (e) {
      if (e?.step) {
        throw e;
      }

      throw makeStepError(
        "assessment_mapping",
        `No QuizLab quiz is configured for this assessment: ${
          e.message || e
        }`,
        404
      );
    }

    /**
     * Find applicant/admission.
     */
    const admission =
      await prisma.admission.findFirst({
        where: {
          schoolId: assessment.schoolId,

          OR: [
            {
              applicantId,
            },
            {
              applicationCode: applicantId,
            },
            {
              admissionCode: applicantId,
            },
            {
              examReference: applicantId,
            },
          ],
        },
      });

    if (!admission) {
      throw makeStepError(
        "applicant_lookup",
        "Applicant not found",
        400
      );
    }

    const invitationEmail = await getUniqueAdmissionEmail(
      prisma,
      assessment.schoolId,
      admission
    );

    if (!invitationEmail) {
      throw makeStepError(
        "applicant_correlation",
        "A unique applicant email is required before a QuizLab invitation can be created",
        400
      );
    }

    try {
      let inv = null;

      /**
       * First try to find an existing invitation.
       */
      try {
        const list = await quizlabService.listInvitations(quizId);

        safeLogQuizlab(
          "listInvitations response",
          list
        );

        const items =
          Array.isArray(list)
            ? list
            : list?.invitations || [];

        inv =
          items.find(
            (item) => getQuizlabCandidateEmail(item) === invitationEmail
          ) || null;
      } catch (e) {
        throw makeStepError(
          "quizlab_list_invitations",
          `QuizLab invitation lookup failed: ${
            e.message || e
          }`,
          502,
          {
            quizId,
          }
        );
      }

      /**
       * Create invitation if none exists.
       */
      if (!inv) {
        try {
          inv =
            await quizlabService.createInvitation(
              quizId,
              {
                email: invitationEmail,
                full_name: admission.applicantName || null,
              }
            );

          safeLogQuizlab(
            "createInvitation response",
            inv
          );
        } catch (e) {
          throw makeStepError(
            "quizlab_create_invitation",
            `QuizLab candidate access creation failed: ${
              e.message || e
            }`,
            502,
            {
              quizId,
            }
          );
        }
      }

      console.log("[QuizLab Debug] applicant invitation resolved", {
        assessmentId,
        quizlabQuizId: quizId,
        applicantId,
        invitationId:
          inv?.id ||
          inv?.invitationId ||
          inv?.candidateId ||
          null,
      });

      /**
       * Fetch QuizLab quiz.
       */
      let quiz;

      try {
        quiz =
          await quizlabService.getQuiz(
            quizId
          );

        safeLogQuizlab(
          "getQuiz response",
          quiz
        );
      } catch (e) {
        throw makeStepError(
          "quizlab_get_quiz",
          `QuizLab quiz lookup failed: ${
            e.message || e
          }`,
          502,
          {
            quizId,
          }
        );
      }

      const inviteLaunch =
        buildQuizlabLaunchUrl(inv);

      const quizLaunch =
        buildQuizlabLaunchUrl(quiz);

      let atsAssessment = null;

      /**
       * Fallback to QuizLab assessment creation
       * if neither invitation nor quiz has a URL.
       */
      if (!inviteLaunch && !quizLaunch) {
        try {
          atsAssessment =
            await quizlabService.createAssessment({
              quiz_id: Number.isNaN(
                Number(quizId)
              )
                ? quizId
                : Number(quizId),

              candidate_email:
                admission.parentEmail ||
                admission.fatherEmail ||
                admission.motherEmail ||
                null,

              candidate_name:
                admission.applicantName ||
                null,

              external_id: applicantId,
            });

          safeLogQuizlab(
            "createAssessment response",
            atsAssessment
          );
        } catch (e) {
          console.log(
            "[QuizLab Debug] createAssessment fallback failed",
            {
              message: e?.message,
              status: e?.status,

              responseKeys:
                e?.response &&
                typeof e.response === "object"
                  ? Object.keys(
                      e.response
                    ).slice(0, 20)
                  : undefined,
            }
          );
        }
      }

      const atsLaunch =
        buildQuizlabLaunchUrl(
          atsAssessment
        );

      const resolvedLaunch =
        inviteLaunch ||
        quizLaunch ||
        atsLaunch;

      const resolvedLaunchUrl =
        resolvedLaunch?.url || null;

      if (!resolvedLaunchUrl) {
        const inviteHint =
          quizlabResponseHint(inv);

        const quizHint =
          quizlabResponseHint(quiz);

        const atsHint =
          quizlabResponseHint(
            atsAssessment
          );

        throw makeStepError(
          "quizlab_launch_url",
          `QuizLab did not return a launch URL. invitation ${inviteHint}; quiz ${quizHint}; ats ${atsHint}`,
          502,
          {
            inviteHint,
            quizHint,
            atsHint,
          }
        );
      }

      if (resolvedLaunch?.path) {
        console.log(
          `[QuizLab Debug] launch url resolved from ${resolvedLaunch.path}`
        );
      }

      return res.status(200).json({
        success: true,
        quizUrl: resolvedLaunchUrl,
        url: resolvedLaunchUrl,
      });
    } catch (err) {
      console.error(
        "[QuizLab Debug] startAssessmentForApplicant failed",
        {
          message: err?.message,
          quizId,
          applicantId,
          assessmentId,
          step: err?.step,
        }
      );

      if (err?.step) {
        return res.status(
          err.statusCode || 500
        ).json({
          success: false,
          message: err.message,
          step: err.step,
        });
      }

      return next(err);
    }
  } catch (error) {
    if (error?.step) {
      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message: error.message,
        step: error.step,
      });
    }

    next(error);
  }
};

/**
 * Sync QuizLab results into Petra.
 *
 * IMPORTANT FLOW:
 *
 * QuizLab Attempt
 *       ↓
 * Student lookup
 *       ↓
 * ExamAttempt
 *       ↓
 * ExamResult
 *       ↓
 * Legacy Result
 *       ↓
 * Admission update
 */
export const syncResultsForAssessment = async (
  req,
  res,
  next
) => {
  try {
    const { assessmentId } = req.params;

    const assessment =
      await prisma.assessment.findUnique({
        where: {
          id: assessmentId,
        },
      });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    const quizId =
      assessment.quizlabQuizId;

    if (!quizId) {
      return res.status(404).json({
        success: false,
        message: "Remote exam not created",
      });
    }

    /**
     * Get remote QuizLab attempts.
     */
    let candidates = [];
    let remoteQuiz = null;

    try {
      const [quiz, attempts] = await Promise.all([
        quizlabService.getQuiz(quizId),
        quizlabService.listAttempts(quizId),
      ]);
      remoteQuiz = quiz;
      safeLogQuizlab("quiz_get response", remoteQuiz);
      safeLogQuizlab("result_list_attempts response", attempts);
      candidates = flattenAttemptItems(attempts);
    } catch (error) {
      try {
        await prisma.classMarkerIntegration.upsert({
          where: {
            assessmentId,
          },

          create: {
            schoolId: assessment.schoolId,
            assessmentId,
            remoteExamId: String(quizId),
            syncStatus: "error",
            lastError: String(
              error.message || error
            ).slice(0, 2000),
          },

          update: {
            syncStatus: "error",

            lastError: String(
              error.message || error
            ).slice(0, 2000),
          },
        });
      } catch (updateError) {
        if (
          String(
            updateError?.code || ""
          ) !== "P2021" &&
          !/ClassMarkerIntegration/i.test(
            String(
              updateError?.message || ""
            )
          )
        ) {
          throw updateError;
        }
      }

      throw error;
    }

    const processed = [];
    const emails = [];

    /**
     * Ensure there is a canonical Exam
     * for this Assessment.
     */
    const exam = await prisma.exam.upsert({
      where: {
        assessmentId: assessment.id,
      },

      create: {
        schoolId: assessment.schoolId,

        teacherId:
          assessment.teacherId || null,

        subjectId:
          assessment.subjectId || null,

        assessmentId: assessment.id,

        title: assessment.title,

        examDate: assessment.date,

        totalMarks:
          assessment.maxScore || 100,

        description:
          assessment.description || null,
      },

      update: {
        title: assessment.title,

        examDate: assessment.date,

        totalMarks:
          assessment.maxScore || 100,

        description:
          assessment.description || null,
      },
    });

    /**
     * Normalize first, then process oldest to newest. This keeps the legacy
     * compatibility record aligned with the latest valid QuizLab attempt.
     */
    const completedCandidates = [];

    for (const candidate of candidates) {
      const normalized = normalizeQuizLabAttempt(candidate);

      if (!normalized) {
        console.warn("[QuizLab Sync] Skipping unidentifiable attempt", {
          quizId,
          candidateKeys:
            candidate && typeof candidate === "object"
              ? Object.keys(candidate).slice(0, 20)
              : [],
        });
        continue;
      }

      if (normalized.attemptId) {
        try {
          const detailedAttempt = await quizlabService.getAttempt(quizId, normalized.attemptId);
          safeLogQuizlab("result_get_attempt response", detailedAttempt);
          const detailedNormalized = normalizeQuizLabAttempt(detailedAttempt);
          if (detailedNormalized) {
            for (const [key, value] of Object.entries(detailedNormalized)) {
              if (key === "raw") {
                normalized.raw = { ...normalized.raw, ...value };
              } else if (value !== null && value !== undefined && value !== "") {
                normalized[key] = value;
              }
            }
          }
        } catch (detailError) {
          console.warn("[QuizLab Sync] result_get_attempt failed", {
            quizId,
            attemptId: normalized.attemptId,
            message: String(detailError?.message || detailError).slice(0, 300),
          });
        }
      }

      if (!isCompletedQuizlabAttempt(normalized)) {
        console.log("[QuizLab Sync] Skipping incomplete attempt", {
          quizId,
          attemptId: normalized.attemptId,
          status: normalized.status || null,
        });
        continue;
      }

      completedCandidates.push(normalized);
    }

    completedCandidates.sort(
      (left, right) => getQuizlabAttemptTime(left) - getQuizlabAttemptTime(right)
    );

    for (const normalized of completedCandidates) {

      const reference = normalizeRemoteIdentifier(normalized.reference);
      const email = normalizeEmail(normalized.email);

      /**
       * Score information.
       */
      const score = Number(normalized.score ?? 0);
      const maxScore = Number(normalized.maxScore ?? assessment.maxScore ?? 100);

      const percentage =
        maxScore > 0
          ? Number(
              (
                (score / maxScore) *
                100
              ).toFixed(2)
            )
          : 0;

      const passed = normalized.passed === true
        ? true
        : isPassing(
            {
              ...normalized.raw,
              score,
              maxScore,
              passing_percent:
                normalized.raw?.passing_percent ??
                remoteQuiz?.passing_percent,
            },
            assessment,
            assessment.maxScore
          );

      /**
       * External QuizLab result identifier.
       */
      const externalResultId =
        normalized.resultId ??
        normalized.attemptId ??
        null;

      /**
       * Attempt number.
       */
      const requestedAttemptNumber = Math.max(
        1,
        Number.parseInt(
          String(normalized.raw?.attemptNumber ?? normalized.raw?.attempt_no ?? normalized.raw?.attemptIndex ?? 1),
          10
        ) || 1
      );

      /**
       * Completion timestamp.
       */
      const completedAt =
        normalized.completedAt &&
        !Number.isNaN(new Date(normalized.completedAt).getTime())
          ? new Date(normalized.completedAt)
          : new Date();

      const result =
        await prisma.$transaction(
          async (tx) => {
            /**
             * -------------------------------------------------
             * 1. FIND STUDENT
             * -------------------------------------------------
             */
            let student = null;

            const admission = await findUniqueAdmissionByIdentity(tx, assessment.schoolId, { reference, email });

            if (!admission) {
              console.warn("[Exam Result Sync] Skipping unverified candidate", {
                quizId,
                assessmentId: assessment.id,
                hasReference: Boolean(reference),
                hasEmail: Boolean(email),
                reason: reference || email
                  ? "ambiguous_or_missing_identity"
                  : "missing_identity",
              });

              return {
                savedResult: null,
                savedExamResult: null,
                savedAttempt: null,
                admission: null,
                passed,
              };
            }

            if (admission.studentId) {
              student = await tx.student.findUnique({ where: { id: admission.studentId } });
            }

            let savedResult = null;
            let savedExamResult = null;
            let savedAttempt = null;

            /**
             * -------------------------------------------------
             * 2. ONLY CREATE EXAM ATTEMPT / RESULT IF STUDENT
             *    WAS IDENTIFIED
             * -------------------------------------------------
             */
            if (student) {
              const attemptNumber = await resolveQuizlabAttemptNumber(tx, {
                examId: exam.id,
                studentId: student.id,
                externalResultId,
                requestedAttemptNumber,
              });

              /**
               * ------------------------------------------------
               * 2A. LEGACY RESULT
               * ------------------------------------------------
               *
               * Keep this because existing Petra code may still
               * consume the old Result table.
               */
              const existing =
                await tx.result.findFirst({
                  where: {
                    assessmentId:
                      assessment.id,

                    studentId:
                      student.id,
                  },
                });

              const legacyResultData = {
                teacherId:
                  req.user?.id ||
                  assessment.teacherId ||
                  null,

                studentId:
                  student.id,

                assessmentId:
                  assessment.id,

                subject:
                  assessment.subject || "",

                className:
                  assessment.className || "",

                score,

                maxScore,

                published: true,

                schoolId:
                  assessment.schoolId,
              };

              if (existing) {
                savedResult =
                  await tx.result.update({
                    where: {
                      id: existing.id,
                    },

                    data:
                      legacyResultData,
                  });
              } else {
                savedResult =
                  await tx.result.create({
                    data:
                      legacyResultData,
                  });
              }

              /**
               * ------------------------------------------------
               * 2B. EXAM ATTEMPT
               * ------------------------------------------------
               *
               * This MUST happen BEFORE ExamResult because
               * ExamResult.attemptId references ExamAttempt.id.
               */
              savedAttempt =
                await tx.examAttempt.upsert({
                  where: {
                    examId_studentId_attemptNumber:
                      {
                        examId:
                          exam.id,

                        studentId:
                          student.id,

                        attemptNumber,
                      },
                  },

                  create: {
                    examId:
                      exam.id,

                    studentId:
                      student.id,

                    attemptNumber,

                    status:
                      "completed",

                    startedAt:
                      normalized.startedAt &&
                      !Number.isNaN(
                        new Date(
                          normalized.startedAt
                        ).getTime()
                      )
                        ? new Date(
                            normalized.startedAt
                          )
                        : completedAt,

                    completedAt,

                    completionTimeSeconds:
                      Number.isFinite(
                        Number(
                          normalized.completionTimeSeconds
                        )
                      )
                        ? Number(
                            normalized.completionTimeSeconds
                          )
                        : null,

                    score,

                    percentage,

                    externalResultId:
                      externalResultId
                        ? String(
                            externalResultId
                          )
                        : null,
                  },

                  update: {
                    status:
                      "completed",

                    completedAt,

                    completionTimeSeconds:
                      Number.isFinite(
                        Number(
                          normalized.completionTimeSeconds
                        )
                      )
                        ? Number(
                            normalized.completionTimeSeconds
                          )
                        : undefined,

                    score,

                    percentage,

                    externalResultId:
                      externalResultId
                        ? String(
                            externalResultId
                          )
                        : undefined,
                  },
                });

              /**
               * ------------------------------------------------
               * 2C. CANONICAL EXAM RESULT
               * ------------------------------------------------
               *
               * CRITICAL:
               *
               * attemptId comes from savedAttempt.
               *
               * We do NOT reference `attempt` before it exists.
               */
              savedExamResult =
                await tx.examResult.upsert({
                  where: {
                    attemptId:
                      savedAttempt.id,
                  },

                  create: {
                    examId:
                      exam.id,

                    studentId:
                      student.id,

                    attemptId:
                      savedAttempt.id,

                    marks:
                      score,

                    percentage,

                    grade:
                      passed
                        ? "Pass"
                        : "Fail",

                    remarks:
                      null,

                    completedAt,
                  },

                  update: {
                    examId:
                      exam.id,

                    studentId:
                      student.id,

                    marks:
                      score,

                    percentage,

                    grade:
                      passed
                        ? "Pass"
                        : "Fail",

                    remarks:
                      null,

                    completedAt,
                  },
                });

              console.log(
                "[Exam Result Sync] ExamResult saved",
                {
                  examResultId:
                    savedExamResult.id,

                  examId:
                    exam.id,

                  studentId:
                    student.id,

                  attemptId:
                    savedAttempt.id,

                  attemptNumber,

                  marks:
                    score,

                  percentage,

                  grade:
                    passed
                      ? "Pass"
                      : "Fail",
                }
                );
            } else if (admission) {
              /**
               * ------------------------------------------------
               * 2D. CREATE A STUDENT FROM THE REAL ADMISSION
               * ------------------------------------------------
               *
               * Fresh applicants may not yet be enrolled as a
               * Student when the exam completes. To keep the
               * real admission connected to the result flow,
               * create the minimal Student record here and link
               * it back to the Admission.
               */
              const studentAdmissionNumber =
                admission.admissionCode ||
                admission.applicationCode ||
                admission.applicantId ||
                reference ||
                email ||
                `APP-${assessment.schoolId}-${Date.now()}`;

              const existingStudentByAdmissionNumber =
                await tx.student.findFirst({
                  where: {
                    schoolId: assessment.schoolId,
                    admissionNumber: String(
                      studentAdmissionNumber
                    ),
                  },
                });

              student =
                existingStudentByAdmissionNumber ||
                (await tx.student.create({
                  data: {
                    schoolId: assessment.schoolId,
                    admissionNumber: String(
                      studentAdmissionNumber
                    ),
                    name:
                      admission.applicantName ||
                      [
                        admission.applicantFirstName,
                        admission.applicantMiddleName,
                        admission.applicantLastName,
                      ]
                        .filter(Boolean)
                        .join(" ")
                        .trim() ||
                      "Unknown Applicant",
                    className:
                      assessment.className ||
                      admission.intendedClass ||
                      null,
                    parentEmail:
                      admission.parentEmail ||
                      admission.fatherEmail ||
                      admission.motherEmail ||
                      null,
                    parentPhone:
                      admission.parentPhone ||
                      admission.fatherPhone1 ||
                      admission.motherPhone1 ||
                      null,
                    guardianName:
                      admission.fatherName ||
                      admission.motherName ||
                      null,
                    status: "active",
                  },
                }));

              const attemptNumber = await resolveQuizlabAttemptNumber(tx, {
                examId: exam.id,
                studentId: student.id,
                externalResultId,
                requestedAttemptNumber,
              });

              if (admission.studentId !== student.id) {
                await tx.admission.update({
                  where: {
                    id: admission.id,
                  },

                  data: {
                    studentId: student.id,
                  },
                });
              }

              const existing =
                await tx.result.findFirst({
                  where: {
                    assessmentId: assessment.id,
                    studentId: student.id,
                  },
                });

              const legacyResultData = {
                teacherId:
                  req.user?.id ||
                  assessment.teacherId ||
                  null,

                studentId: student.id,

                assessmentId: assessment.id,

                subject: assessment.subject || "",

                className: assessment.className || "",

                score,

                maxScore,

                published: true,

                schoolId: assessment.schoolId,
              };

              if (existing) {
                savedResult = await tx.result.update({
                  where: {
                    id: existing.id,
                  },

                  data: legacyResultData,
                });
              } else {
                savedResult = await tx.result.create({
                  data: legacyResultData,
                });
              }

              savedAttempt =
                await tx.examAttempt.upsert({
                  where: {
                    examId_studentId_attemptNumber: {
                      examId: exam.id,
                      studentId: student.id,
                      attemptNumber,
                    },
                  },

                  create: {
                    examId: exam.id,
                    studentId: student.id,
                    attemptNumber,
                    status: "completed",
                    startedAt:
                      normalized.startedAt &&
                      !Number.isNaN(
                        new Date(
                          normalized.startedAt
                        ).getTime()
                      )
                        ? new Date(normalized.startedAt)
                        : completedAt,
                    completedAt,
                    completionTimeSeconds:
                      Number.isFinite(
                        Number(
                          normalized.completionTimeSeconds
                        )
                      )
                        ? Number(
                            normalized.completionTimeSeconds
                          )
                        : null,
                    score,
                    percentage,
                    externalResultId:
                      externalResultId
                        ? String(externalResultId)
                        : null,
                  },

                  update: {
                    status: "completed",
                    completedAt,
                    completionTimeSeconds:
                      Number.isFinite(
                        Number(
                          normalized.completionTimeSeconds
                        )
                      )
                        ? Number(
                            normalized.completionTimeSeconds
                          )
                        : undefined,
                    score,
                    percentage,
                    externalResultId:
                      externalResultId
                        ? String(externalResultId)
                        : undefined,
                  },
                });

              savedExamResult =
                await tx.examResult.upsert({
                  where: {
                    attemptId: savedAttempt.id,
                  },

                  create: {
                    examId: exam.id,
                    studentId: student.id,
                    attemptId: savedAttempt.id,
                    marks: score,
                    percentage,
                    grade: passed ? "Pass" : "Fail",
                    remarks: null,
                    completedAt,
                  },

                  update: {
                    examId: exam.id,
                    studentId: student.id,
                    marks: score,
                    percentage,
                    grade: passed ? "Pass" : "Fail",
                    remarks: null,
                    completedAt,
                  },
                });

              console.log(
                "[Exam Result Sync] Minimal student created and ExamResult saved",
                {
                  examResultId: savedExamResult.id,
                  examId: exam.id,
                  studentId: student.id,
                  attemptId: savedAttempt.id,
                  attemptNumber,
                  marks: score,
                  percentage,
                  grade: passed ? "Pass" : "Fail",
                }
              );
            } else {
              /**
               * Student was not found.
               *
               * Do NOT attempt to create ExamAttempt or
               * ExamResult because both require studentId.
               */
              console.warn(
                "[Exam Result Sync] Student not found",
                {
                  assessmentId:
                    assessment.id,

                  hasReference: Boolean(reference),

                  hasEmail: Boolean(email),
                }
              );
            }

            /**
             * -------------------------------------------------
             * 3. UPDATE ADMISSION
             * -------------------------------------------------
             */
            let admissionCode =
              admission.admissionCode;

            /**
             * Generate admission code when the student passes.
             */
            if (
              passed &&
              !admissionCode
            ) {
              const school =
                await tx.school.findUnique({
                  where: {
                    id:
                      admission.schoolId,
                  },

                  select: {
                    name: true,
                  },
                });

              let created = false;

              for (
                let attempt = 0;
                attempt < 10 &&
                !created;
                attempt += 1
              ) {
                const candidateCode =
                  buildAdmissionCode(
                    school?.name
                  );

                try {
                  await tx.admission.update({
                    where: {
                      id:
                        admission.id,
                    },

                    data: {
                      studentId: student?.id,
                      admissionCode:
                        candidateCode,

                      examScore:
                        score,

                      examCompletedAt:
                        completedAt,

                      examResult:
                        "passed",

                      status:
                        "admission_offered",
                    },
                  });

                  admissionCode =
                    candidateCode;

                  created = true;
                } catch (error) {
                  if (
                    error?.code !==
                    "P2002"
                  ) {
                    throw error;
                  }
                }
              }

              if (!created) {
                throw new Error(
                  "Unable to generate a unique admission code"
                );
              }
            } else {
              /**
               * Existing admission code or failed applicant.
               */
              await tx.admission.update({
                where: {
                  id:
                    admission.id,
                },

                data: {
                  studentId: student?.id,
                  examScore:
                    score,

                  examCompletedAt:
                    completedAt,

                  examResult:
                    passed
                      ? "passed"
                      : "failed",

                  status:
                    passed
                      ? admission.status ===
                        "enrolled"
                        ? "enrolled"
                        : "admission_offered"
                      : "failed",
                },
              });
            }

            /**
             * -------------------------------------------------
             * 5. QUEUE ADMISSION EMAIL
             * -------------------------------------------------
             */
            if (
              passed &&
              admissionCode
            ) {
              const fresh = await tx.admission.findUnique({
                where: {
                  id: admission.id,
                },
              });

              if (fresh) emails.push({ admission: fresh, admissionCode });
            }

            return {
              savedResult,

              savedExamResult,

              savedAttempt,

              admission:
                admission.id,

              passed,
            };
          }
        );

      /**
       * -------------------------------------------------------
       * 6. ADD TO PROCESSED RESPONSE
       * -------------------------------------------------------
       */
      processed.push({
        reference,

        studentFound:
          Boolean(result.savedResult),

        examAttemptSaved:
          Boolean(result.savedAttempt),

        examAttemptId:
          result.savedAttempt?.id ||
          null,

        examResultSaved:
          Boolean(
            result.savedExamResult
          ),

        examResultId:
          result.savedExamResult?.id ||
          null,

        admissionId:
          result.admission,

        passed:
          result.passed,
      });
    }

    /**
     * ---------------------------------------------------------
     * 7. MARK INTEGRATION AS SYNCED
     * ---------------------------------------------------------
     */
    try {
      await prisma.classMarkerIntegration.upsert({
        where: {
          assessmentId,
        },

        create: {
          schoolId: assessment.schoolId,
          assessmentId,
          remoteExamId: String(quizId),
          syncStatus: "synced",
          lastSyncedAt: new Date(),
          lastError: null,
        },

        update: {
          syncStatus:
            "synced",

          lastSyncedAt:
            new Date(),

          lastError:
            null,
        },
      });
    } catch (updateError) {
      if (
        String(
          updateError?.code || ""
        ) !== "P2021" &&
        !/ClassMarkerIntegration/i.test(
          String(
            updateError?.message || ""
          )
        )
      ) {
        throw updateError;
      }
    }

    /**
     * ---------------------------------------------------------
     * 8. SEND ADMISSION EMAILS
     * ---------------------------------------------------------
     */
    for (const item of emails) {
      try {
        const school =
          await prisma.school.findUnique({
            where: {
              id:
                item.admission.schoolId,
            },
          });

        const base =
          school?.website ||
          process.env.CLIENT_URL ||
          "";

        const dedupeKey =
          `admission-offer:${item.admission.id}:${item.admissionCode}`;

        const emailResult =
          await sendAdmissionEmail({
            school,

            admission:
              item.admission,

            studentName:
              item.admission
                .applicantName ||
              "",

            admissionCode:
              item.admissionCode,

            paymentUrl:
              `${base.replace(/\/$/, "")}/school_Fees`,

            dedupeKey,
          });
      } catch (emailError) {
        console.error(
          "Admission email delivery failed:",
          emailError
        );
      }
    }

    /**
     * ---------------------------------------------------------
     * 9. RESPONSE
     * ---------------------------------------------------------
     */
    return res.status(200).json({
      success: true,

      processedCount:
        processed.length,

      processed,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createRemoteExamForAssessment,
  getLaunchLinkForAssessment,
  launchForCandidate,
  startAssessmentForApplicant,
  syncResultsForAssessment,
};
