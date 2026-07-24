import { Router } from "express";
import { body } from "express-validator";
import { deleteUserAccount, getMe, loginUser, logoutUser, registerUser, createPendingStaff, activateStaff, registerParent, linkChild } from "../controllers/authController.js";
import { loginValidator, registerValidator } from "../validators/authValidator.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerValidator, registerUser);
router.post("/staff/pending", protect, createPendingStaff);
router.post("/staff/activate", activateStaff);
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
