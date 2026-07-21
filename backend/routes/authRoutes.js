import { Router } from "express";
import { getMe, loginUser, logoutUser, registerUser } from "../controllers/authController.js";
import { loginValidator, registerValidator } from "../validators/authValidator.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerValidator, registerUser);
router.post("/login", loginValidator, loginUser);
router.get("/me", protect, getMe);
router.post("/logout", protect, logoutUser);

export default router;
