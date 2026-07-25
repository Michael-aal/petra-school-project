import { Router } from "express";
import { body } from "express-validator";
import { deleteUserAccount, getMe, loginUser, logoutUser, registerUser, createPendingStaff, activateStaff, registerParent, linkChild, createStaffInvitation, listStaffInvitations, revokeStaffInvitation, regenerateStaffInvitationCode } from "../controllers/authController.js";
import { loginValidator, registerValidator, staffInvitationValidator, staffActivationValidator } from "../validators/authValidator.js";
import { protect, requirePrincipal } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerValidator, registerUser);
router.post("/staff/pending", protect, createPendingStaff);
router.post("/staff/activate", staffActivationValidator, activateStaff);
router.get("/staff/invitations", protect, requirePrincipal, listStaffInvitations);
router.post("/staff/invitations", protect, requirePrincipal, staffInvitationValidator, createStaffInvitation);
router.post("/staff/invitations/revoke", protect, requirePrincipal, body("registrationCode").notEmpty().withMessage("Registration code is required"), revokeStaffInvitation);
router.post("/staff/invitations/regenerate", protect, requirePrincipal, body("registrationCode").notEmpty().withMessage("Registration code is required"), regenerateStaffInvitationCode);
router.post("/parent/register", registerParent);
router.post("/parent/link-child", protect, body("accessCode").notEmpty().withMessage("Parent access code is required"), linkChild);
router.post("/login", loginValidator, loginUser);
router.get("/me", protect, getMe);
router.post("/logout", protect, logoutUser);
router.delete(
  "/account",
  protect,
  body("password").notEmpty().withMessage("Current password is required"),
  deleteUserAccount,
);

export default router;
