import { Router } from "express";
import { startAssessmentForApplicant } from "../controllers/classMarkerController.js";
import { ensureAdmissionAssessment } from "../middleware/ensureAdmissionAssessment.js";
import { publicWorkflowRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Public endpoint for applicants to start an admission assessment.
// Repair the Assessment <-> Admission mapping first for legacy admissions.
router.post('/start', publicWorkflowRateLimiter, ensureAdmissionAssessment, startAssessmentForApplicant);

export default router;
