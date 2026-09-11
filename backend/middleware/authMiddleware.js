import jwt from "jsonwebtoken";
import { userModel } from "../models/userModel.js";
import { hasRoleAccess, normalizeRole } from "../utils/roleUtils.js";
import { prisma, runWithSchoolContext, runWithoutSchoolContext } from "../config/db.js";
import { getJwtPublicKey } from "../utils/jwtKeys.js";

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

export const parseSchoolHeader = (value) => {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const resolveUserSchoolId = (user) => {
  if (!user) return null;

  const fallbackSchoolId =
    user.schoolId ??
    user.selectedSchoolId ??
    user.principalProfile?.schoolId ??
    user.adminProfile?.schoolId ??
    user.teacherProfile?.schoolId ??
    user.staffProfile?.schoolId ??
    user.parentProfile?.schoolId ??
    user.guardianProfile?.schoolId ??
    user.studentProfile?.schoolId ??
    null;

  return fallbackSchoolId ? Number(fallbackSchoolId) : null;
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

const populateAuthContext = async (req, res, token) => {
  try {
    const decoded = jwt.verify(token, getJwtPublicKey(), { algorithms: ["RS256"] });
    const { userId: resolvedUserId, email: resolvedEmail } = resolveTokenClaims(decoded);

    if (!resolvedUserId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid token payload",
      });
    }

    const user = await userModel.findByIdentityGlobal({
      id: resolvedUserId,
      email: resolvedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
    }

    if (user.accountStatus && user.accountStatus !== "active") {
      return res.status(401).json({
        success: false,
        message: "This account is not active",
      });
    }

    req.auth = {
      token,
      decoded,
      userId: resolvedUserId,
      email: resolvedEmail,
    };
    req.user = user;
    const normalizedRole = normalizeRole(user?.role);

    if (normalizedRole === "super_admin") {
      const requestedSchoolId = parseSchoolHeader(req.get("x-school-id"));
      let resolvedSchoolId = null;

      if (requestedSchoolId) {
        const requestedSchool = await prisma.school.findFirst({ where: { id: requestedSchoolId, isActive: true }, select: { id: true } });
        if (!requestedSchool) {
          return res.status(403).json({ success: false, message: "The requested school is not available." });
        }

        resolvedSchoolId = requestedSchool.id;
      }

      if (!resolvedSchoolId && user.selectedSchoolId) {
        const persistedSchool = await prisma.school.findFirst({ where: { id: Number(user.selectedSchoolId), isActive: true }, select: { id: true } });
        if (persistedSchool) {
          resolvedSchoolId = persistedSchool.id;
        }
      }

      req.schoolId = resolvedSchoolId;
      if (resolvedSchoolId) {
        req.user.schoolId = resolvedSchoolId;
        req.user.selectedSchoolId = resolvedSchoolId;
      }
    } else {
      const fallbackSchoolId = resolveUserSchoolId(user) ?? decoded?.schoolId ?? null;
      req.schoolId = fallbackSchoolId;
      if (fallbackSchoolId) {
        req.user.schoolId = fallbackSchoolId;
      }
    }

    return true;
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

export const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token missing",
    });
  }

  const populated = await populateAuthContext(req, res, token);
  if (populated !== true) {
    return populated;
  }

  return runWithSchoolContext(req.schoolId, next);
};

export const protectOptional = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  const populated = await populateAuthContext(req, res, token);
  if (populated !== true) {
    return populated;
  }

  return runWithSchoolContext(req.schoolId, next);
};


export const schoolGuard = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const role = normalizeRole(req.user?.role);
  const currentSchoolId = req.schoolId ?? req.user?.schoolId ?? req.user?.selectedSchoolId ?? null;

  if (role === "super_admin" && !currentSchoolId) {
    return res.status(403).json({
      success: false,
      message: "Select a school to continue.",
    });
  }

  if (role !== "super_admin" && !req.user.schoolId) {
    return res.status(403).json({
      success: false,
      message: "Select a school to continue.",
    });
  }

  req.schoolId = currentSchoolId;
  req.user.schoolId = currentSchoolId;

  next();
};

export const requirePrincipal = requireRole(["principal"]);
export const requireTeacher = requireRole(["teacher"]);
export const requireParent = requireRole(["parent"]);
export const requireStudent = requireRole(["student"]);

export { requireRole };
