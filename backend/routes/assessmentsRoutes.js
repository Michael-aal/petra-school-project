import { Router } from "express";
import { startAssessmentForApplicant } from "../controllers/classMarkerController.js";

const router = Router();

// Public endpoint for applicant to start an assessment using their applicantId
router.post('/start', startAssessmentForApplicant);

export default router;
