import jwt from "jsonwebtoken";
import { userModel } from "../models/userModel.js";

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
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

export const requirePrincipal = (req, res, next) => {
  if (req.user?.role !== "principal") {
    return res.status(403).json({
      success: false,
      message: "Not authorized, insufficient permissions",
    });
  }

  return next();
};

export const requireTeacher = (req, res, next) => {
  if (req.user?.role !== "staff") {
    return res.status(403).json({
      success: false,
      message: "Not authorized, teacher access required",
    });
  }

  return next();
};
