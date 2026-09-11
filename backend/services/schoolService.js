import { schoolModel } from "../models/schoolModel.js";
import { normalizeRole } from "../utils/roleUtils.js";

const parseSchoolId = (id) => {
  const parsed = Number.parseInt(String(id), 10);
  if (Number.isNaN(parsed)) {
    const error = new Error("Invalid school id");
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

const getSchoolId = (user) => {
  const schoolId = user?.schoolId;
  if (schoolId === undefined || schoolId === null) {
    const error = new Error("School context missing");
    error.statusCode = 403;
    throw error;
  }
  return parseSchoolId(schoolId);
};

export const schoolService = {
  createSchool: async (data) => {
    return schoolModel.create(data);
  },

  getSchools: async () => {
    return schoolModel.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  getSchoolById: async (user, id) => {
    const requestedSchoolId = parseSchoolId(id);
    const currentSchoolId = getSchoolId(user);

    if (normalizeRole(user?.role) !== "super_admin" && requestedSchoolId !== currentSchoolId) {
      const error = new Error("Access denied for this school");
      error.statusCode = 403;
      throw error;
    }

    const school = await schoolModel.findUnique({
      where: { id: requestedSchoolId },
    });

    if (!school) {
      const error = new Error("School not found");
      error.statusCode = 404;
      throw error;
    }

    return school;
  },

  updateSchool: async (user, id, data) => {
    const requestedSchoolId = parseSchoolId(id);
    const currentSchoolId = getSchoolId(user);

    if (normalizeRole(user?.role) !== "super_admin" && requestedSchoolId !== currentSchoolId) {
      const error = new Error("Access denied for this school");
      error.statusCode = 403;
      throw error;
    }

    const school = await schoolModel.update({
      where: { id: requestedSchoolId },
      data,
    });

    return school;
  },

  deleteSchool: async (user, id) => {
    const requestedSchoolId = parseSchoolId(id);
    const currentSchoolId = getSchoolId(user);

    if (normalizeRole(user?.role) !== "super_admin" && requestedSchoolId !== currentSchoolId) {
      const error = new Error("Access denied for this school");
      error.statusCode = 403;
      throw error;
    }

    return schoolModel.delete({
      where: { id: requestedSchoolId },
    });
  },
};
