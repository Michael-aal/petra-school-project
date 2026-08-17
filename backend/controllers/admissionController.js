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

export const approveAdmission = async (req, res, next) => {
  try {
    const admission = await admissionService.approve(req.params.id, req.user.id);
    return res.status(200).json({ success: true, message: "Applicant approved for entrance exam", admission });
  } catch (error) {
    return next(error);
  }
};

export const rejectAdmission = async (req, res, next) => {
  try {
    const admission = await admissionService.reject(req.params.id, req.user.id, req.body.reason || "");
    return res.status(200).json({ success: true, message: "Applicant rejected", admission });
  } catch (error) {
    return next(error);
  }
};

export const createAdmission = async (req, res, next) => {
  try {
    const created = await admissionService.create(req.body, req.user, {
      schoolHeader: req.get("x-school-id") || "",
    });
    // Return the safe admission shape (read via getById) so callers get canonical fields like admissionCode
    const admission = await admissionService.getById(created.id);
    return res.status(201).json({
      success: true,
      message: "Admission application submitted successfully",
      admission,
    });
  } catch (error) {
    return next(error);
  }
};

export const enrollAdmission = async (req, res, next) => {
  try {
    const admission = await admissionService.enroll(req.params.id, req.user.id, req.body || {});
    return res.status(200).json({ success: true, message: "Applicant enrolled successfully", admission });
  } catch (error) {
    return next(error);
  }
};

export const completeStudentRecord = async (req, res, next) => {
  try {
    const result = await admissionService.completeStudentRecord(req.params.id, req.user?.id || null);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
};
