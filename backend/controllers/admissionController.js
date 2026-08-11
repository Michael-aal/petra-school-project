import { admissionService } from "../services/admissionService.js";

export const listAdmissions = async (req, res, next) => {
  try {
    const result = await admissionService.list({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
      className: req.query.className,
    }, req.user);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
};

export const getAdmissionById = async (req, res, next) => {
  try {
    const admission = await admissionService.getById(req.params.id, req.user);
    return res.status(200).json({ success: true, admission });
  } catch (error) {
    return next(error);
  }
};

export const createAdmission = async (req, res, next) => {
  try {
    const admission = await admissionService.create(req.body);
    return res.status(201).json({
      success: true,
      message: "Admission application submitted successfully",
      admission,
    });
  } catch (error) {
    return next(error);
  }
};
