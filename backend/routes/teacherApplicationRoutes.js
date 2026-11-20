import { Router } from "express";
import { protect, requireRole, schoolGuard } from "../middleware/authMiddleware.js";
import { requirePublicSchoolContext } from "../middleware/publicSchoolContext.js";
import { prisma } from "../config/db.js";
import { createApplicationLinkToken, verifyApplicationLinkToken } from "../utils/applicationLinkToken.js";
import {
  createTeacherApplication,
  listTeacherApplications,
  getTeacherApplication,
  updateTeacherApplicationStatus,
} from "../controllers/teacherApplicationController.js";

const router = Router();
const schoolAdmin = requireRole(["admin", "principal", "school_admin", "school_administrator", "super_admin", "superadmin"]);

// Return school-scoped links only to an authenticated school administrator.
router.get("/links", protect, schoolGuard, schoolAdmin, async (req, res, next) => {
  try {
    const school = await prisma.school.findFirst({
      where: { id: Number(req.schoolId), isActive: true },
      select: { id: true, name: true, logo: true },
    });
    if (!school) return res.status(404).json({ success: false, message: "School not found." });
    return res.json({
      success: true,
      school,
      links: {
        student: createApplicationLinkToken({ schoolId: school.id, type: "student" }),
        teacher: createApplicationLinkToken({ schoolId: school.id, type: "teacher" }),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Resolve school branding from a signed public application link.
router.get("/public/:token", async (req, res, next) => {
  try {
    const context = verifyApplicationLinkToken(req.params.token);
    if (!context) return res.status(403).json({ success: false, message: "This application link is invalid." });
    const school = await prisma.school.findFirst({
      where: { id: context.schoolId, isActive: true },
      select: { id: true, name: true, logo: true, address: true, email: true, phone: true, website: true },
    });
    if (!school) return res.status(404).json({ success: false, message: "This school application portal is unavailable." });
    return res.json({ success: true, type: context.type, school });
  } catch (error) {
    return next(error);
  }
});

// Public application submission. The signed token determines the school.
router.post("/", requirePublicSchoolContext("body", "teacher"), createTeacherApplication);

// School administration review workflow.
router.get("/", protect, schoolGuard, schoolAdmin, listTeacherApplications);
router.get("/:id", protect, schoolGuard, schoolAdmin, getTeacherApplication);
router.patch("/:id/status", protect, schoolGuard, schoolAdmin, updateTeacherApplicationStatus);

export default router;
