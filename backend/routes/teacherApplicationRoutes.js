import { Router } from "express";
import { createTeacherApplication } from "../controllers/teacherApplicationController.js";
import { requirePublicSchoolContext } from "../middleware/publicSchoolContext.js";

const router = Router();

router.post("/", requirePublicSchoolContext("body"), createTeacherApplication);

export default router;
