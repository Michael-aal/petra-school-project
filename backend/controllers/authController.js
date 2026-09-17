import { validationResult } from "express-validator";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { authService } from "../services/authService.js";
import { teacherInvitationService } from "../services/teacherInvitationService.js";
import { teacherManagementService } from "../services/teacherManagementService.js";
import { linkParentToMatchingChildren } from "../utils/parentLinking.js";
import { sessionModel } from "../models/sessionModel.js";
import { userModel } from "../models/userModel.js";
import { sessionService } from "../services/sessionService.js";
import { logAudit } from "../utils/auditLog.js";

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 15 * 60 * 1000,
  path: "/",
};
const refreshCookieOptions = { ...authCookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 };

const isTabAuthRequest = (req) => req.get("x-petra-tab-auth") === "1";

const issueSession = async (req, res, result) => {
  const user = result?.user;
  if (!user?.id) return result;
  const currentUser = await userModel.findById(user.id);
  if (!currentUser) return result;

  const { session, token: accessToken } = await sessionService.create({ user: currentUser, req });
  // Bind the refresh credential to the exact session that created it. This
  // lets a tab refresh rotate only its own session instead of accumulating
  // new sessions or revoking another tab's session.
  const refreshTokenSecret = crypto.randomBytes(48).toString("base64url");
  const refreshToken = `${session.id}.${refreshTokenSecret}`;
  const now = Date.now();
  await sessionModel.createRefreshToken({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(now + refreshCookieOptions.maxAge),
  });

  res.cookie("petra_session", accessToken, authCookieOptions);
  res.cookie("petra_refresh", refreshToken, refreshCookieOptions);

  const authenticated = { ...result, token: undefined };
  if (isTabAuthRequest(req)) {
    authenticated.tabSession = { accessToken, refreshToken };
  }
  return authenticated;
};

const sendAuthenticated = async (req, res, status, message, result) => {
  const authenticated = await issueSession(req, res, result);
  const { token: _token, ...data } = authenticated || {};
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
    return sendAuthenticated(req, res, 201, "User registered successfully", result);
  } catch (error) { next(error); }
};

export const createPendingStaff = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.createPendingStaff({ ...req.body, schoolId: req.schoolId });
    return res.status(201).json({ success: true, message: "Staff created successfully", ...result });
  } catch (error) { next(error); }
};

export const createStaffInvitation = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await teacherInvitationService.create({ ...req.body, generatedBy: req.user?.id || null, schoolId: req.schoolId });
    return res.status(201).json({ success: true, message: "Teacher invitation created successfully", invitation: result });
  } catch (error) { next(error); }
};

export const listStaffInvitations = async (req, res, next) => {
  try {
    const invitations = await authService.listStaffInvitations(req.schoolId);
    return res.status(200).json({ success: true, invitations });
  } catch (error) { next(error); }
};

export const getStaffInvitation = async (req, res, next) => {
  try {
    const invitation = await authService.getStaffInvitation(req.params.token);
    return res.status(200).json({ success: true, invitation });
  } catch (error) { next(error); }
};

export const revokeStaffInvitation = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const invitation = await authService.revokeStaffInvitation({ registrationCode: req.body.registrationCode, schoolId: req.schoolId });
    return res.status(200).json({ success: true, message: "Teacher invitation revoked", invitation });
  } catch (error) { next(error); }
};

export const regenerateStaffInvitationCode = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const invitation = await authService.regenerateStaffInvitationCode({ registrationCode: req.body.registrationCode, schoolId: req.schoolId });
    return res.status(200).json({ success: true, message: "Registration code regenerated", invitation });
  } catch (error) { next(error); }
};

export const listManagedTeachers = async (req, res, next) => {
  try {
    const teachers = await teacherManagementService.list({ user: req.user, schoolId: req.schoolId });
    return res.status(200).json({ success: true, teachers });
  } catch (error) { next(error); }
};

export const deactivateManagedTeacher = async (req, res, next) => {
  try {
    const result = await teacherManagementService.deactivate({ user: req.user, schoolId: req.schoolId, teacherUserId: req.params.teacherUserId });
    return res.status(200).json({ success: true, message: "Teacher deactivated successfully", teacher: result });
  } catch (error) { next(error); }
};

export const reactivateManagedTeacher = async (req, res, next) => {
  try {
    const result = await teacherManagementService.reactivate({ user: req.user, schoolId: req.schoolId, teacherUserId: req.params.teacherUserId });
    return res.status(200).json({ success: true, message: "Teacher reactivated successfully", teacher: result });
  } catch (error) { next(error); }
};

export const activateStaff = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await teacherInvitationService.activate(req.body);
    return sendAuthenticated(req, res, 200, "Teacher account activated", result);
  } catch (error) { next(error); }
};

export const registerParent = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.registerParent(req.body);
    const linked = await linkParentToMatchingChildren({ parentUserId: result?.user?.id, schoolId: result?.user?.schoolId || req.body?.schoolId, email: req.body?.email });
    return sendAuthenticated(req, res, 201, "Parent registered successfully", { ...result, linkedChildren: linked.linkedChildren });
  } catch (error) { next(error); }
};

export const linkChild = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.linkStudentToParent({ userId: req.user.id, accessCode: req.body.accessCode, schoolId: req.schoolId });
    return res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

export const loginUser = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.login(req.body);
    return sendAuthenticated(req, res, 200, "Login successful", result);
  } catch (error) { next(error); }
};

const readCookie = (req, name) => {
  const item = String(req.get("cookie") || "")
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
};

const readBearerSessionId = (req) => {
  const header = String(req.get("authorization") || "");
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  try {
    return jwt.decode(token)?.sid || jwt.decode(token)?.sessionId || null;
  } catch {
    return null;
  }
};

const readRefreshSessionId = (refreshToken) => {
  const candidate = String(refreshToken || "").split(".")[0];
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate) ? candidate : null;
};

export const refreshSession = async (req, res, next) => {
  try {
    const tabRefreshToken = req.get("x-petra-tab-refresh");
    const tabRequest = Boolean(tabRefreshToken);
    const refreshToken = tabRefreshToken || readCookie(req, "petra_refresh");
    if (!refreshToken) return res.status(401).json({ success: false, message: "Refresh token missing" });

    const storedToken = await sessionModel.findActiveRefreshToken(refreshToken);
    if (!storedToken) return res.status(401).json({ success: false, message: "Refresh token expired or revoked" });

    await sessionModel.revokeRefreshToken(storedToken.id);

    // Tab refreshes must rotate only the session that owns this refresh
    // credential. Never revoke all sessions for a tab refresh.
    if (tabRequest) {
      const oldSessionId = readBearerSessionId(req) || readRefreshSessionId(refreshToken);
      if (oldSessionId) await sessionService.revoke({ id: oldSessionId, userId: storedToken.userId });
    } else {
      await sessionService.revokeAll(storedToken.userId);
    }

    const user = await authService.profile(storedToken.userId);
    if (tabRequest) req.headers["x-petra-tab-auth"] = "1";
    const authenticated = await issueSession(req, res, { user });
    const response = { success: true, user };
    if (authenticated?.tabSession) response.tabSession = authenticated.tabSession;
    return res.status(200).json(response);
  } catch (error) { return next(error); }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.profile(req.user.id);
    return res.status(200).json({ success: true, user });
  } catch (error) { next(error); }
};

export const revokeSession = async (req, res, next) => {
  const tabRequest = req.get("x-petra-tab-auth") === "1";
  try {
    if (req.auth?.sessionId) await sessionService.revoke({ id: req.auth.sessionId, userId: req.user.id });
    if (!tabRequest) await sessionModel.revokeAllRefreshTokens(req.user.id);
    await logAudit({ userId: req.user.id, schoolId: req.schoolId, action: "auth.logout", actionType: "LOGOUT", entity: "Session", resourceId: req.auth?.sessionId });
  } catch (error) { return next(error); }
  if (!tabRequest) {
    res.clearCookie("petra_session", authCookieOptions);
    res.clearCookie("petra_refresh", refreshCookieOptions);
  }
  return res.status(200).json({ success: true, message: "Logout successful" });
};

export const logoutUser = revokeSession;

export const revokeAllSessions = async (req, res, next) => {
  try {
    await sessionService.revokeAll(req.user.id);
    await sessionModel.revokeAllRefreshTokens(req.user.id);
    await logAudit({ userId: req.user.id, schoolId: req.schoolId, action: "auth.logout_all", actionType: "LOGOUT", entity: "Session" });
    res.clearCookie("petra_session", authCookieOptions);
    res.clearCookie("petra_refresh", refreshCookieOptions);
    return res.status(200).json({ success: true, message: "All sessions revoked" });
  } catch (error) { return next(error); }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.updateProfile(req.user.id, req.body);
    return res.status(200).json({ success: true, message: "Profile updated successfully", ...result });
  } catch (error) { next(error); }
};

export const changeUserPassword = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.changePassword({ userId: req.user.id, currentPassword: req.body.currentPassword, newPassword: req.body.newPassword });
    await sessionService.revoke({ id: req.auth.sessionId, userId: req.user.id });
    await sessionModel.revokeAllRefreshTokens(req.user.id);
    const user = await authService.profile(req.user.id);
    await issueSession(req, res, { user });
    return res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

export const deleteUserAccount = async (req, res, next) => {
  try {
    const validationResponse = handleValidation(req, res);
    if (validationResponse) return validationResponse;
    const result = await authService.deleteAccount({ userId: req.user.id, password: req.body.password });
    res.clearCookie("petra_session", authCookieOptions);
    res.clearCookie("petra_refresh", refreshCookieOptions);
    return res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

export const selectSchool = async (req, res, next) => {
  try {
    const result = await authService.selectSchool({ userId: req.user.id, schoolId: req.body.schoolId });
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};
