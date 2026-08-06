import jwt from "jsonwebtoken";
import { userModel } from "../models/userModel.js";
import { hasRoleAccess, normalizeRole } from "../utils/roleUtils.js";
import { setCurrentSchoolId, clearCurrentSchoolId } from "../config/db.js";

const extractToken = (req) => {
  const authHeader = req.get("authorization") || "";
  const cookieHeader = req.get("cookie") || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  if (cookieHeader) {
    const cookieValue = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("petra_token="));

    if (cookieValue) {
      return decodeURIComponent(cookieValue.split("=")[1] || "");
    }
  }

  return "";
};

const normalizeId = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const resolveTokenClaims = (decoded = {}) => {
  if (!decoded || typeof decoded !== "object") {
    return { userId: "", email: "" };
  }

  const userId = normalizeId(
    decoded.id ||
      decoded.userId ||
      decoded.sub ||
      decoded.user?.id ||
      decoded.user?.userId ||
      decoded.data?.id ||
      decoded.data?.userId,
  );
  const email = normalizeId(decoded.email || decoded.user?.email || decoded.data?.email);

  return { userId, email };
};

const requireRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, user not found",
    });
  }

  if (!hasRoleAccess(req.user, allowedRoles)) {
    return res.status(403).json({
      success: false,
      message: "Not authorized, insufficient permissions",
    });
  }

  return next();
};

export const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token missing",
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId: resolvedUserId, email: resolvedEmail } = resolveTokenClaims(decoded);

    if (!resolvedUserId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid token payload",
      });
    }

    const user = await userModel.findByIdentity({
      id: resolvedUserId,
      email: resolvedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
    }

    req.auth = {
      token,
      decoded,
      userId: resolvedUserId,
      email: resolvedEmail,
    };
    req.user = user;
    // Set tenant context for Prisma middleware to enforce school scoping
    try {
      setCurrentSchoolId(user?.schoolId ?? null);
      res.on("finish", () => clearCurrentSchoolId());
      res.on("close", () => clearCurrentSchoolId());
    } catch (e) {
      // Ignore middleware errors; we still attach req.user
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

export const requirePrincipal = requireRole(["principal"]);
export const requireTeacher = requireRole(["teacher"]);
export const requireParent = requireRole(["parent"]);
export const requireStudent = requireRole(["student"]);

export { requireRole };
