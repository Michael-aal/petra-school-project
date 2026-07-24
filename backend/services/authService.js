import { userModel } from "../models/userModel.js";
import { hashPassword } from "../utils/hashPassword.js";
import { comparePassword } from "../utils/comparePassword.js";
import { generateToken } from "../utils/generateToken.js";

const normalizeRole = (role = "") => {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "admin" || normalized === "principal") return "principal";
  if (normalized === "teacher" || normalized === "staff") return "staff";
  if (normalized === "parent" || normalized === "student") return "parent";
  return "parent";
};

const getNameParts = (fullName = "") => {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts[parts.length - 1] : "",
  };
};

const safeUser = (user) => {
  const { firstName, lastName } = getNameParts(user.fullName || "");

  return {
    id: user.id,
    fullName: user.fullName || "",
    firstName: user.firstName || firstName,
    lastName: user.lastName || lastName,
    email: user.email,
    role: normalizeRole(user.role),
    phone: user.phone || "",
    institution: user.institution || "",
    institutionType: user.institutionType || "",
    state: user.state || "",
    city: user.city || "",
    hearAbout: user.hearAbout || "",
    profilePicture: user.profilePicture || "",
    profileImage: user.profileImage || user.profilePicture || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const makeCode = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const authService = {
  register: async ({ fullName, email, password, phone, institution, institutionType, state, city, hearAbout, role, ...rest }) => {
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      const error = new Error("Email already in use");
      error.statusCode = 409;
      throw error;
    }

    const hashed = await hashPassword(password);
    const user = await userModel.create({
      fullName,
      email,
      password: hashed,
      phone,
      institution,
      institutionType,
      state,
      city,
      hearAbout,
      role: normalizeRole(role),
      ...rest,
    });

    return {
      user: safeUser(user),
      token: generateToken({ id: user.id, email: user.email, role: user.role }),
    };
  },

  login: async ({ email, password }) => {
    const user = await userModel.findByEmail(email);
    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    return {
      user: safeUser(user),
      token: generateToken({ id: user.id, email: user.email, role: user.role }),
    };
  },

  createPendingStaff: async ({ fullName, email, position, department }) => {
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      const error = new Error("Email already in use");
      error.statusCode = 409;
      throw error;
    }

    const staffRegistrationCode = makeCode("PET-STAFF");
    const user = await userModel.create({
      fullName,
      email,
      password: await hashPassword(makeCode("TEMP-PASS")),
      role: "staff",
      accountStatus: "pending",
      staffPosition: position,
      staffDepartment: department || "",
      staffRegistrationCode,
      staffRegistrationCodeUsed: false,
    });

    return { user: safeUser(user), staffRegistrationCode, registrationLink: "/staff/register" };
  },

  activateStaff: async ({ email, password, code }) => {
    const user = await userModel.findByEmail(email);
    if (!user || user.role !== "staff" || user.accountStatus !== "pending") {
      const error = new Error("Staff account not found or not pending");
      error.statusCode = 404;
      throw error;
    }
    if (user.staffRegistrationCodeUsed) {
      const error = new Error("Registration code has already been used");
      error.statusCode = 400;
      throw error;
    }
    if (user.staffRegistrationCode !== code) {
      const error = new Error("Invalid registration code");
      error.statusCode = 400;
      throw error;
    }
    const hashed = await hashPassword(password);
    const updated = await userModel.update(user.id, {
      password: hashed,
      accountStatus: "active",
      staffRegistrationCodeUsed: true,
    });
    return { user: safeUser(updated), token: generateToken({ id: updated.id, email: updated.email, role: updated.role }) };
  },

  registerParent: async ({ fullName, email, password, phone }) => {
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      const error = new Error("Email already in use");
      error.statusCode = 409;
      throw error;
    }
    const user = await userModel.create({
      fullName,
      email,
      password: await hashPassword(password),
      phone,
      role: "parent",
      accountStatus: "active",
    });
    return { user: safeUser(user), token: generateToken({ id: user.id, email: user.email, role: user.role }) };
  },

  profile: async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return safeUser(user);
  },

  deleteAccount: async ({ userId, password }) => {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      const error = new Error("Current password is incorrect");
      error.statusCode = 401;
      throw error;
    }

    await userModel.deleteAccount(userId);

    return {
      message: "Account deleted successfully",
    };
  },

  linkStudentToParent: async ({ userId, accessCode }) => {
    const student = await userModel.findStudentByAccessCode(accessCode);
    if (!student || student.parentAccessCodeUsed) {
      const error = new Error("Invalid or used Parent Access Code");
      error.statusCode = 400;
      throw error;
    }
    await userModel.linkParentToStudent({ parentId: userId, studentId: student.id });
    return { message: "Child linked successfully" };
  },
};
