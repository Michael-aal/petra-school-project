import { superAdminService } from "../services/superAdminService.js";

export const getDashboardStats = async (_req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: await superAdminService.getDashboardStats() });
  } catch (error) {
    next(error);
  }
};

export const listSchools = async (req, res, next) => {
  try {
    const data = await superAdminService.listSchools({ query: req.query });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createSchool = async (req, res, next) => {
  try {
    const school = await superAdminService.createSchool(req.body);
    return res.status(201).json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
};

export const getSchool = async (req, res, next) => {
  try {
    const school = await superAdminService.getSchoolById(req.params.id);
    return res.status(200).json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
};

export const updateSchool = async (req, res, next) => {
  try {
    const school = await superAdminService.updateSchool(req.params.id, req.body);
    return res.status(200).json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
};

export const updateSchoolStatus = async (req, res, next) => {
  try {
    const school = await superAdminService.setSchoolStatus(req.params.id, req.body.isActive);
    return res.status(200).json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const data = await superAdminService.listUsers({ query: req.query });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listSchoolUsers = async (req, res, next) => {
  try {
    const data = await superAdminService.listSchoolUsers({
      schoolId: req.params.id,
      query: req.query,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listLogs = async (req, res, next) => {
  try {
    const data = await superAdminService.listLogs({ query: req.query });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

