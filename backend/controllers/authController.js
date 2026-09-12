import { validationResult } from "express-validator";
import { authService } from "../services/authService.js";
import { teacherInvitationService } from "../services/teacherInvitationService.js";

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 8 * 60 * 60 * 1000,
};

const sendAuthenticated = (res, status, message, result) => {
  const { token, ...data } = result || {};
  if (token) res.cookie("petra_token", token, authCookieOptions);
  return res.status(status).json({ success: true, message, ...data });
};

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const issues = errors.array().map((e) => ({ param: e.param, msg: e.msg }));
    const first = issues[0];
    const topMessage = first ? `${first.param}: ${first.msg}` : "Validation failed";
    return res.status(400).json({ success: false, message: topMessage, errors: issues });
  }
  return null;
};

export const registerUser = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.register(req.body);
    return sendAuthenticated(res, 201, "User registered successfully", result);
  } catch (error) {
    next(error);
  }
};

export const createPendingStaff = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.createPendingStaff({ ...req.body, schoolId: req.schoolId });
    return res.status(201).json({ success: true, message: "Staff created successfully", ...result });
  } catch (error) {
    next(error);
  }
};

export const createStaffInvitation = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await teacherInvitationService.create({
      ...req.body,
      generatedBy: req.user?.id || null,
      schoolId: req.schoolId,
    });
    return res.status(201).json({ success: true, message: "Teacher invitation created successfully", invitation: result });
  } catch (error) {
    next(error);
  }
};

export const listStaffInvitations = async (req, res, next) => {
  try {
    const invitations = await authService.listStaffInvitations(req.schoolId);
    return res.status(200).json({ success: true, invitations });
  } catch (error) {
    next(error);
  }
};

export const getStaffInvitation = async (req, res, next) => {
  try {
    const invitation = await authService.getStaffInvitation(req.params.token);
    return res.status(200).json({ success: true, invitation });
  } catch (error) {
    next(error);
  }
};

export const revokeStaffInvitation = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const invitation = await authService.revokeStaffInvitation({ registrationCode: req.body.registrationCode, schoolId: req.schoolId });
    return res.status(200).json({ success: true, message: "Staff invitation revoked", invitation });
  } catch (error) {
    next(error);
  }
};

export const regenerateStaffInvitationCode = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const invitation = await authService.regenerateStaffInvitationCode({ registrationCode: req.body.registrationCode, schoolId: req.schoolId });
    return res.status(200).json({ success: true, message: "Registration code regenerated", invitation });
  } catch (error) {
    next(error);
  }
};

export const activateStaff = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await teacherInvitationService.activate(req.body);
    return sendAuthenticated(res, 200, "Teacher account activated", result);
  } catch (error) {
    next(error);
  }
};

export const registerParent = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.registerParent(req.body);
    return sendAuthenticated(res, 201, "Parent registered successfully", result);
  } catch (error) {
    next(error);
  }
};

export const linkChild = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.linkStudentToParent({ userId: req.user.id, accessCode: req.body.accessCode, schoolId: req.schoolId });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.login(req.body);
    return sendAuthenticated(res, 200, "Login successful", result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.profile(req.user.id);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (_req, res) => {
  res.clearCookie("petra_token", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return res.status(200).json({ success: true, message: "Logout successful" });
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.updateProfile(req.user.id, req.body);
    return res.status(200).json({ success: true, message: "Profile updated successfully", ...result });
  } catch (error) {
    next(error);
  }
};

export const changeUserPassword = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.changePassword({ userId: req.user.id, currentPassword: req.body.currentPassword, newPassword: req.body.newPassword });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const deleteUserAccount = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.deleteAccount({ userId: req.user.id, password: req.body.password });
    res.clearCookie("petra_token", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const selectSchool = async (req, res, next) => {
  try {
    const result = await authService.selectSchool({ userId: req.user.id, schoolId: req.body.schoolId });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
