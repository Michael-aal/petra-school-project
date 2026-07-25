import jwt from "jsonwebtoken";
import { userModel } from "../models/userModel.js";

export const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  const cookieHeader = req.headers.cookie;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token && cookieHeader) {
    const cookieValue = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("petra_token="));
    if (cookieValue) token = cookieValue.split("=")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);

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
