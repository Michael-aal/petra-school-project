import { Router } from "express";
import { protect, requireParent } from "../middleware/authMiddleware.js";
import { getChildHub, getLinkedChild, getLinkedChildren } from "../controllers/parentController.js";

const router = Router();

router.get("/children", protect, requireParent, getLinkedChildren);
router.get("/children/:studentId", protect, requireParent, getLinkedChild);
router.get("/children/:studentId/hub", protect, requireParent, getChildHub);

export default router;
