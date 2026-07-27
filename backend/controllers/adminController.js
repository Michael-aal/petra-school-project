import { validationResult } from "express-validator";
import { adminService } from "../services/adminService.js";

const validate = (req, res) => {
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

export const getAdminDashboard = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: await adminService.getDashboard(req.user) });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const data = await adminService.listUsers({ user: req.user, query: req.query });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listTeachers = async (req, res, next) => {
  try {
    const data = await adminService.listTeachers({ user: req.user, query: req.query });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listAdmins = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, admins: await adminService.listAdmins({ user: req.user }) });
  } catch (error) {
    next(error);
  }
};

export const listStaffAttendance = async (req, res, next) => {
  try {
    const invalid = validate(req, res);
    if (invalid) return invalid;
    const data = await adminService.listStaffAttendance({ user: req.user, query: req.query });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listRoles = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, roles: await adminService.listRoles({ user: req.user }) });
  } catch (error) {
    next(error);
  }
};

export const listAuditLogs = async (req, res, next) => {
  try {
    const data = await adminService.listAuditLogs({ user: req.user, query: req.query });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
