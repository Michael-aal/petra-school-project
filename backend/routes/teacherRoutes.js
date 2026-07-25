import { Router } from "express";
import { protect, requireTeacher } from "../middleware/authMiddleware.js";
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

router.get("/dashboard", protect, requireTeacher, getTeacherDashboard);
router.get("/classes", protect, requireTeacher, getTeacherClasses);
router.get("/classes/:id", protect, requireTeacher, getTeacherClassById);
router.get("/students", protect, requireTeacher, getTeacherStudents);
router.get("/profile", protect, requireTeacher, getTeacherProfile);
router.put("/profile", protect, requireTeacher, updateTeacherProfile);
router.get("/attendance", protect, requireTeacher, getTeacherAttendance);
router.post("/attendance", protect, requireTeacher, createTeacherAttendance);
router.put("/attendance/:id", protect, requireTeacher, updateTeacherAttendance);
router.get("/assessments", protect, requireTeacher, getTeacherAssessments);
router.post("/assessments", protect, requireTeacher, createTeacherAssessment);
router.put("/assessments/:id", protect, requireTeacher, updateTeacherAssessment);
router.delete("/assessments/:id", protect, requireTeacher, deleteTeacherAssessment);
router.get("/results", protect, requireTeacher, getTeacherResults);
router.post("/results", protect, requireTeacher, createTeacherResult);
router.put("/results/:id", protect, requireTeacher, updateTeacherResult);
router.get("/announcements", protect, requireTeacher, getTeacherAnnouncements);
router.post("/announcements", protect, requireTeacher, createTeacherAnnouncement);

export default router;
