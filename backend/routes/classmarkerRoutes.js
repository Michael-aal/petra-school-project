import { Router } from "express";
import { protect, schoolGuard, requireRole } from "../middleware/authMiddleware.js";
import {
  createRemoteExamForAssessment,
  getLaunchLinkForAssessment,
  syncResultsForAssessment,
  quizlabWebhookHandler,
} from "../controllers/classMarkerController.js";
import { launchForCandidate } from "../controllers/classMarkerController.js";
import { publicWorkflowRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

const teacherOrAdmin = requireRole(["teacher", "principal"]);

router.post("/webhook", publicWorkflowRateLimiter, quizlabWebhookHandler);
router.post("/exams", protect, schoolGuard, teacherOrAdmin, createRemoteExamForAssessment);
router.get("/exams/:assessmentId/launch", protect, schoolGuard, teacherOrAdmin, getLaunchLinkForAssessment);
// Public student launch: validate admission/application code and return ClassMarker launch URL
router.post("/exams/:assessmentId/launch-student", publicWorkflowRateLimiter, launchForCandidate);
router.post("/exams/:assessmentId/sync-results", protect, schoolGuard, teacherOrAdmin, syncResultsForAssessment);

export default router;
