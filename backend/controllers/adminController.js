import { validationResult } from "express-validator";
import { prisma } from "../config/db.js";
import { syncResultsForAssessment } from "./classMarkerController.js";
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

export const syncAdminResults = async (req, res, next) => {
  try {
    const schoolId = Number(req.user?.schoolId);
    if (!Number.isInteger(schoolId) || schoolId <= 0) {
      return res.status(403).json({ success: false, message: "School context missing" });
    }

    const assessments = await prisma.assessment.findMany({
      where: {
        schoolId,
        quizlabQuizId: { not: null },
      },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
    });

    const synced = [];
    const failed = [];

    for (const assessment of assessments) {
      let statusCode = 200;
      let body = null;

      const internalRes = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(payload) {
          body = payload;
          return this;
        },
      };

      try {
        await syncResultsForAssessment(
          { params: { assessmentId: assessment.id }, body: {}, user: req.user },
          internalRes,
          (error) => {
            throw error;
          },
        );

        if (statusCode >= 400) {
          failed.push({ assessmentId: assessment.id, statusCode, message: body?.message || "Sync failed" });
        } else {
          synced.push({ assessmentId: assessment.id, processedCount: body?.processedCount ?? 0 });
        }
      } catch (error) {
        failed.push({
          assessmentId: assessment.id,
          statusCode: error?.statusCode || 500,
          message: String(error?.message || error).slice(0, 500),
        });
      }
    }

    return res.status(200).json({
      success: true,
      assessmentsChecked: assessments.length,
      synced,
      failed,
    });
  } catch (error) {
    next(error);
  }
};

export const listResults = async (req, res, next) => {
  try {
    const data = await adminService.listResults({
      user: req.user,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
