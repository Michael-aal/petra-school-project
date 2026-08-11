import { prisma } from "../config/db.js";
import { classMarkerService } from "../services/classMarkerService.js";
import { sendAdmissionEmail } from "../services/emailService.js";
import crypto from "crypto";

const teacherOrAdminRole = ["teacher", "principal"];

export const createRemoteExamForAssessment = async (req, res, next) => {
  try {
    const { assessmentId } = req.body;
    if (!assessmentId) return res.status(400).json({ success: false, message: "assessmentId required" });

    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });

    // Only allow teacher who owns it or admin
    if (assessment.teacherId && assessment.teacherId !== req.user.id && !teacherOrAdminRole.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const remote = await classMarkerService.createRemoteExam(assessment);
    // remote should include an id; store metadata in assessment.description
    const meta = { remoteId: remote.id || remote.testId || remote._id || remote.remoteId || remote.identifier || remote.id };
    const newDescription = classMarkerService.embedMetaInDescription(assessment.description || "", meta);
    await prisma.assessment.update({ where: { id: assessmentId }, data: { description: newDescription } });

    return res.status(201).json({ success: true, meta, remote });
  } catch (error) {
    next(error);
  }
};

export const getLaunchLinkForAssessment = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    if (!assessmentId) return res.status(400).json({ success: false, message: "assessmentId required" });

    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });

    const meta = classMarkerService.extractMetaFromDescription(assessment.description || "");
    if (!meta || !meta.remoteId) return res.status(404).json({ success: false, message: "Remote exam not created" });

    // optional candidate info
    const candidate = req.body?.candidate || null;
    const url = await classMarkerService.createLaunchLink(meta.remoteId, candidate);
    return res.status(200).json({ success: true, url });
  } catch (error) {
    next(error);
  }
};

export const syncResultsForAssessment = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    if (!assessmentId) return res.status(400).json({ success: false, message: "assessmentId required" });

    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return res.status(404).json({ success: false, message: "Assessment not found" });

    const meta = classMarkerService.extractMetaFromDescription(assessment.description || "");
    if (!meta || !meta.remoteId) return res.status(404).json({ success: false, message: "Remote exam not created" });

    const remoteResults = await classMarkerService.fetchExamResults(meta.remoteId);
    // Expect remoteResults to be an array of candidate result objects.
    const candidates = Array.isArray(remoteResults) ? remoteResults : remoteResults.results || [];

    const created = [];
    await prisma.$transaction(async (tx) => {
      // helper: determine passing
      const isPassing = (candScore, candMax) => {
        const score = Number(candScore || 0);
        const max = Number(candMax || assessment.maxScore || 100);
        if (candScore === null || Number.isNaN(score)) return false;
        // Prefer explicit pass indicator if present
        if (cand?.passed === true) return true;
        if (typeof cand?.status === "string" && cand.status.toLowerCase() === "passed") return true;
        // default: at least 50%
        return score / Math.max(1, max) >= 0.5;
      };

      // helper: generate unique admission code (max 10 chars)
      const generateAdmissionCode = async (school) => {
        const prefix = (process.env.ADMISSION_CODE_PREFIX || (school?.name || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "ADM").slice(0, 3);
        const totalLen = Math.max(6, Number(process.env.ADMISSION_CODE_LENGTH || 10));
        const suffixLen = Math.max(1, totalLen - prefix.length);

        const existingCodes = (await tx.admission.findMany({ select: { id: true, submissionData: true, remarks: true } }));
        const hasCollision = (code) => {
          for (const a of existingCodes) {
            try {
              const sd = a.submissionData || {};
              if (sd && sd.admissionCode && sd.admissionCode === code) return true;
            } catch (e) {}
            if (a.remarks && String(a.remarks).includes(code)) return true;
          }
          return false;
        };

        for (let attempt = 0; attempt < 16; attempt++) {
          const rand = crypto.randomBytes(Math.ceil(suffixLen / 2)).toString("base36").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, suffixLen);
          const code = `${prefix}${rand}`.slice(0, Math.min(10, prefix.length + rand.length));
          if (!hasCollision(code)) return code;
        }
        // fallback: timestamp
        return `${prefix}${Date.now().toString(36).toUpperCase()}`.slice(0, 10);
      };

      for (const cand of candidates) {
        // === Student mapping and result creation/update ===
        let student = null;
        if (cand.reference) {
          student = await tx.student.findFirst({ where: { admissionNumber: String(cand.reference) } });
        }
        if (!student && cand.email) {
          student = await tx.student.findFirst({ where: { parentEmail: cand.email } });
        }

        if (student) {
          const score = typeof cand.score === "number" ? cand.score : Number(cand.score || 0);
          const maxScore = assessment.maxScore || 100;

          const existing = await tx.result.findFirst({ where: { assessmentId: assessment.id, studentId: student.id } });
          if (existing) {
            const updated = await tx.result.update({ where: { id: existing.id }, data: { score, maxScore, published: true } });
            created.push(updated);
          } else {
            const createdResult = await tx.result.create({ data: {
              teacherId: req.user.id,
              studentId: student.id,
              assessmentId: assessment.id,
              subject: assessment.subject || "",
              className: assessment.className || "",
              score: score,
              maxScore,
              published: true,
              schoolId: assessment.schoolId || req.user.schoolId || undefined,
            }});
            created.push(createdResult);
          }
        }

        // === Admission mapping and email trigger ===
        // Try to match admission by applicationCode/examReference or parent/father/mother email
        let admission = null;
        if (cand.reference) {
          admission = await tx.admission.findFirst({ where: { OR: [{ applicationCode: String(cand.reference) }, { examReference: String(cand.reference) }] } });
        }
        if (!admission && cand.email) {
          admission = await tx.admission.findFirst({ where: { OR: [{ parentEmail: cand.email }, { fatherEmail: cand.email }, { motherEmail: cand.email }] } });
        }

        if (admission) {
          const passed = isPassing(cand.score, cand.maxScore || assessment.maxScore || 100);
          if (!passed) continue;

          // inspect submissionData for existing admissionCode/emailSent
          const existingSd = admission.submissionData || {};
          if (existingSd && existingSd.admissionEmailSent) {
            // already sent, skip
            continue;
          }

          // generate or reuse admission code
          let admissionCode = (existingSd && existingSd.admissionCode) || "";
          if (!admissionCode) {
            const school = await tx.school.findUnique({ where: { id: admission.schoolId } });
            admissionCode = await generateAdmissionCode(school || { name: process.env.SCHOOL_NAME || "School" });
            const nextSd = { ...(existingSd || {}), admissionCode };
            await tx.admission.update({ where: { id: admission.id }, data: { submissionData: nextSd } });
          }

          // prepare payment URL
          const clientBase = process.env.CLIENT_URL || (await tx.school.findUnique({ where: { id: admission.schoolId }, select: { website: true } })).website || process.env.CLIENT_URL || "";
          const paymentUrl = `${clientBase.replace(/\/$/, "") || process.env.CLIENT_URL || ""}/school_Fees`;

          // send email
          const school = await tx.school.findUnique({ where: { id: admission.schoolId } });
          const emailResult = await sendAdmissionEmail({ school, admission, studentName: admission.applicantName || "", admissionCode, paymentUrl });

          // record that email was attempted/sent
          const updatedSd = { ...(admission.submissionData || {}), admissionEmailSent: emailResult?.success === true, admissionEmailResult: emailResult?.reason || (emailResult?.success ? "sent" : "unknown") };
          await tx.admission.update({ where: { id: admission.id }, data: { submissionData: updatedSd } });
        }
      }
    });

    return res.status(200).json({ success: true, createdCount: created.length, created });
  } catch (error) {
    next(error);
  }
};

export default {
  createRemoteExamForAssessment,
  getLaunchLinkForAssessment,
  syncResultsForAssessment,
};
