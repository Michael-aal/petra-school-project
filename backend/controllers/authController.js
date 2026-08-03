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
    const issues = errors.array().map((e) => ({ param: e.param, msg: e.msg }));
    const first = issues[0];
    const topMessage = first ? `${first.param}: ${first.msg}` : "Validation failed";
    return res.status(400).json({
      success: false,
      message: topMessage,
      errors: issues,
    });
  }
  return null;
};

export const registerUser = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;

    const result = await authService.register(req.body);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const createPendingStaff = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.createPendingStaff(req.body);
    return res.status(201).json({ success: true, message: "Staff created successfully", ...result });
  } catch (error) {
    next(error);
  }
};

export const createStaffInvitation = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.createStaffInvitation({
      ...req.body,
      // store the administrative user id as the generator for reliable association
      generatedBy: req.user?.id || req.user?.email || req.user?.fullName,
    });
    return res.status(201).json({ success: true, message: "Staff invitation created successfully", invitation: result });
  } catch (error) {
    next(error);
  }
};

export const listStaffInvitations = async (_req, res, next) => {
  try {
    const invitations = await authService.listStaffInvitations();
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
    const invitation = await authService.revokeStaffInvitation({ registrationCode: req.body.registrationCode });
    return res.status(200).json({ success: true, message: "Staff invitation revoked", invitation });
  } catch (error) {
    next(error);
  }
};

export const regenerateStaffInvitationCode = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const invitation = await authService.regenerateStaffInvitationCode({ registrationCode: req.body.registrationCode });
    return res.status(200).json({ success: true, message: "Registration code regenerated", invitation });
  } catch (error) {
    next(error);
  }
};

export const activateStaff = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.activateStaff(req.body);
    return res.status(200).json({ success: true, message: "Staff account activated", ...result });
  } catch (error) {
    next(error);
  }
};

export const registerParent = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.registerParent(req.body);
    return res.status(201).json({ success: true, message: "Parent registered successfully", ...result });
  } catch (error) {
    next(error);
  }
};

export const linkChild = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.linkStudentToParent({ userId: req.user.id, accessCode: req.body.accessCode });
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

export const updateUserProfile = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;

    const result = await authService.updateProfile(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const changeUserPassword = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;

    const result = await authService.changePassword({
      userId: req.user.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserAccount = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;

    const result = await authService.deleteAccount({
      userId: req.user.id,
      password: req.body.password,
    });

    res.clearCookie("petra_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
