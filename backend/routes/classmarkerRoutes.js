import { Router } from "express";
import { protect, schoolGuard, requireRole } from "../middleware/authMiddleware.js";
import {
  createRemoteExamForAssessment,
  getLaunchLinkForAssessment,
  syncResultsForAssessment,
} from "../controllers/classMarkerController.js";

const router = Router();

const teacherOrAdmin = requireRole(["teacher", "principal"]);

router.post("/exams", protect, schoolGuard, teacherOrAdmin, createRemoteExamForAssessment);
router.get("/exams/:assessmentId/launch", protect, schoolGuard, teacherOrAdmin, getLaunchLinkForAssessment);
router.post("/exams/:assessmentId/sync-results", protect, schoolGuard, teacherOrAdmin, syncResultsForAssessment);

export default router;
