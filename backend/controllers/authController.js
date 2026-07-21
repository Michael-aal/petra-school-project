import { validationResult } from "express-validator";
import { authService } from "../services/authService.js";

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  return null;
};

export const registerUser = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;

    const result = await authService.register(req.body);
    res.cookie("petra_token", result.token, authCookieOptions);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;

    const result = await authService.login(req.body);
    res.cookie("petra_token", result.token, authCookieOptions);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.profile(req.user.id);
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (_req, res) => {
  res.clearCookie("petra_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};
