import { Router } from "express";
import { validationResult } from "express-validator";
import { protect, requirePrincipal, schoolGuard } from "../middleware/authMiddleware.js";
import { authorizeStudentResource } from "../middleware/authorizeResource.js";
import {
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  regenerateStudentAccessCode,
  updateStudent,
} from "../controllers/studentController.js";
import {
  createStudentValidator,
  listStudentsValidator,
  studentIdValidator,
  updateStudentValidator,
} from "../validators/studentValidator.js";

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  return next();
};

router.get("/", protect, schoolGuard, requirePrincipal, listStudentsValidator, validate, listStudents);
router.get("/:id", protect, schoolGuard, requirePrincipal, studentIdValidator, validate, authorizeStudentResource({ source: "params" }), getStudentById);
router.post("/", protect, schoolGuard, requirePrincipal, createStudentValidator, validate, createStudent);
router.patch("/:id", protect, schoolGuard, requirePrincipal, updateStudentValidator, validate, authorizeStudentResource({ source: "params" }), updateStudent);
router.delete("/:id", protect, schoolGuard, requirePrincipal, studentIdValidator, validate, authorizeStudentResource({ source: "params" }), deleteStudent);
router.post("/:id/access-code", protect, schoolGuard, requirePrincipal, studentIdValidator, validate, authorizeStudentResource({ source: "params" }), regenerateStudentAccessCode);

export default router;

