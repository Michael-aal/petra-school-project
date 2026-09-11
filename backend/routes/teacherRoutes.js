import { Router } from "express";
import { protect, requireRole, schoolGuard } from "../middleware/authMiddleware.js";
import {
  createTeacherAnnouncement,
  createTeacherAssessment,
  createTeacherAttendance,
  createTeacherResult,
  deleteTeacherAssessment,
  getTeacherAnnouncements,
  getTeacherAssessments,
  getTeacherAttendance,
  getTeacherClasses,
  getTeacherClassById,
  getTeacherDashboard,
  getTeacherProfile,
  getTeacherResults,
  getTeacherStudents,
  updateTeacherAssessment,
  updateTeacherAttendance,
  updateTeacherProfile,
  updateTeacherResult,
} from "../controllers/teacherController.js";

const router = Router();

const teacherOrAdmin = requireRole(["teacher", "principal"]);

router.get("/dashboard", protect, schoolGuard, teacherOrAdmin, getTeacherDashboard);
router.get("/classes", protect, schoolGuard, teacherOrAdmin, getTeacherClasses);
router.get("/classes/:id", protect, schoolGuard, teacherOrAdmin, getTeacherClassById);
router.get("/students", protect, schoolGuard, teacherOrAdmin, getTeacherStudents);
router.get("/profile", protect, schoolGuard, teacherOrAdmin, getTeacherProfile);
router.put("/profile", protect, schoolGuard, teacherOrAdmin, updateTeacherProfile);
router.get("/attendance", protect, schoolGuard, teacherOrAdmin, getTeacherAttendance);
router.post("/attendance", protect, schoolGuard, teacherOrAdmin, createTeacherAttendance);
router.put("/attendance/:id", protect, schoolGuard, teacherOrAdmin, updateTeacherAttendance);
router.get("/assessments", protect, schoolGuard, teacherOrAdmin, getTeacherAssessments);
router.post("/assessments", protect, schoolGuard, teacherOrAdmin, createTeacherAssessment);
router.put("/assessments/:id", protect, schoolGuard, teacherOrAdmin, updateTeacherAssessment);
router.delete("/assessments/:id", protect, schoolGuard, teacherOrAdmin, deleteTeacherAssessment);
router.get("/results", protect, schoolGuard, teacherOrAdmin, getTeacherResults);
router.post("/results", protect, schoolGuard, teacherOrAdmin, createTeacherResult);
router.put("/results/:id", protect, schoolGuard, teacherOrAdmin, updateTeacherResult);
router.get("/announcements", protect, schoolGuard, teacherOrAdmin, getTeacherAnnouncements);
router.post("/announcements", protect, schoolGuard, teacherOrAdmin, createTeacherAnnouncement);

export default router;
