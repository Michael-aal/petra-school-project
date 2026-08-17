import { Router } from "express";
import { startAssessmentForApplicant } from "../controllers/classMarkerController.js";
import { protect, requirePrincipal } from "../middleware/authMiddleware.js";

const router = Router();

// Principal-only endpoint to create the QuizLab exam and return a launch URL.
router.post("/start", protect, requirePrincipal, startAssessmentForApplicant);

export default router;
