import { Router } from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import {
  createSchool,
  getDashboardStats,
  getSchool,
  listLogs,
  listSchoolUsers,
  listSchools,
  listUsers,
  updateSchool,
  updateSchoolStatus,
} from "../controllers/superAdminController.js";

const router = Router();
const requireSuperAdmin = [protect, requireRole(["super_admin"])];

router.get("/dashboard/stats", ...requireSuperAdmin, getDashboardStats);
router.get("/schools", ...requireSuperAdmin, listSchools);
router.post("/schools", ...requireSuperAdmin, createSchool);
router.get("/schools/:id", ...requireSuperAdmin, getSchool);
router.patch("/schools/:id", ...requireSuperAdmin, updateSchool);
router.patch("/schools/:id/status", ...requireSuperAdmin, updateSchoolStatus);
router.get("/users", ...requireSuperAdmin, listUsers);
router.get("/schools/:id/users", ...requireSuperAdmin, listSchoolUsers);
router.get("/logs", ...requireSuperAdmin, listLogs);

export default router;

