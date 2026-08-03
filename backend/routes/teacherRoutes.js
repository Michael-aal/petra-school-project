import { Router } from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
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

router.get("/dashboard", protect, teacherOrAdmin, getTeacherDashboard);
router.get("/classes", protect, teacherOrAdmin, getTeacherClasses);
router.get("/classes/:id", protect, teacherOrAdmin, getTeacherClassById);
router.get("/students", protect, teacherOrAdmin, getTeacherStudents);
router.get("/profile", protect, teacherOrAdmin, getTeacherProfile);
router.put("/profile", protect, teacherOrAdmin, updateTeacherProfile);
router.get("/attendance", protect, teacherOrAdmin, getTeacherAttendance);
router.post("/attendance", protect, teacherOrAdmin, createTeacherAttendance);
router.put("/attendance/:id", protect, teacherOrAdmin, updateTeacherAttendance);
router.get("/assessments", protect, teacherOrAdmin, getTeacherAssessments);
router.post("/assessments", protect, teacherOrAdmin, createTeacherAssessment);
router.put("/assessments/:id", protect, teacherOrAdmin, updateTeacherAssessment);
router.delete("/assessments/:id", protect, teacherOrAdmin, deleteTeacherAssessment);
router.get("/results", protect, teacherOrAdmin, getTeacherResults);
router.post("/results", protect, teacherOrAdmin, createTeacherResult);
router.put("/results/:id", protect, teacherOrAdmin, updateTeacherResult);
router.get("/announcements", protect, teacherOrAdmin, getTeacherAnnouncements);
router.post("/announcements", protect, teacherOrAdmin, createTeacherAnnouncement);

export default router;
