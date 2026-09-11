import { schoolService } from "../services/schoolService.js";

export const createSchool = async (req, res, next) => {
  try {
    const school = await schoolService.createSchool(req.body);
    return res.status(201).json({
      success: true,
      message: "School created successfully",
      data: school,
    });
  } catch (error) {
    next(error);
  }
};

export const getSchools = async (_req, res, next) => {
  try {
    const schools = await schoolService.getSchools();
    return res.status(200).json({
      success: true,
      data: schools,
    });
  } catch (error) {
    next(error);
  }
};

export const getSchool = async (req, res, next) => {
  try {
    const school = await schoolService.getSchoolById(req.user, req.params.id);
    return res.status(200).json({
      success: true,
      data: school,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSchool = async (req, res, next) => {
  try {
    const school = await schoolService.updateSchool(req.user, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "School updated successfully",
      data: school,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSchool = async (req, res, next) => {
  try {
    await schoolService.deleteSchool(req.user, req.params.id);
    return res.status(200).json({
      success: true,
      message: "School deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
