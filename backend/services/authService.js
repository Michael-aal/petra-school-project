import { userModel } from "../models/userModel.js";
import { hashPassword } from "../utils/hashPassword.js";
import { comparePassword } from "../utils/comparePassword.js";
import { generateToken } from "../utils/generateToken.js";
import crypto from "crypto";

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
    staffRole: user.staffRole || "",
    staffDepartment: user.staffDepartment || "",
    staffClassAssigned: user.staffClassAssigned || "",
    staffSubjectsAssigned: Array.isArray(user.staffSubjectsAssigned) ? user.staffSubjectsAssigned : [],
    accountStatus: user.accountStatus || "active",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profilePicture: user.profilePicture || "",
    profileImage: user.profileImage || user.profilePicture || "",
  };
};

const makeCode = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const makeInvitationCode = () => `PET-STAFF-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

export const authService = {
  register: async ({ fullName, email, password, phone, institution, institutionType, state, city, hearAbout, role, ...rest }) => {
    if (normalizeRole(role) === "staff") {
      const error = new Error("Staff accounts must be created through an invitation");
      error.statusCode = 403;
      throw error;
    }
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

  createStaffInvitation: async ({ staffName, email, role, department, assignedClass, assignedSubjects, employmentStatus, generatedBy }) => {
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      const error = new Error("Email already in use");
      error.statusCode = 409;
      throw error;
    }

    const existingInvitation = await userModel.findStaffInvitationByEmail(email);
    if (existingInvitation) {
      const error = new Error("A staff invitation already exists for this email");
      error.statusCode = 409;
      throw error;
    }

    const registrationCode = makeInvitationCode();
    const invitation = await userModel.createStaffInvitation({
      staffName,
      email,
      role,
      department,
      assignedClass: assignedClass || null,
      assignedSubjects: assignedSubjects || [],
      employmentStatus: employmentStatus || "active",
      registrationCode,
      generatedBy,
      status: "unused",
    });

    return invitation;
  },

  listStaffInvitations: async () => userModel.listStaffInvitations(),

  revokeStaffInvitation: async ({ registrationCode }) => {
    const invitation = await userModel.findStaffInvitationByCode(registrationCode);
    if (!invitation) {
      const error = new Error("Staff invitation not found");
      error.statusCode = 404;
      throw error;
    }
    const updated = await userModel.updateStaffInvitation(invitation.id, {
      status: "revoked",
      revokedAt: new Date(),
    });
    return updated;
  },

  regenerateStaffInvitationCode: async ({ registrationCode }) => {
    const invitation = await userModel.findStaffInvitationByCode(registrationCode);
    if (!invitation) {
      const error = new Error("Staff invitation not found");
      error.statusCode = 404;
      throw error;
    }
    if (invitation.status === "used") {
      const error = new Error("Used invitation codes cannot be regenerated");
      error.statusCode = 400;
      throw error;
    }
    const updated = await userModel.updateStaffInvitation(invitation.id, {
      registrationCode: makeInvitationCode(),
      status: "unused",
      revokedAt: null,
    });
    return updated;
  },

  activateStaff: async ({ email, password, code }) => {
    const invitation = await userModel.findStaffInvitationByCode(code);
    if (!invitation) {
      const error = new Error("Invalid registration code");
      error.statusCode = 400;
      throw error;
    }
    if (invitation.status === "revoked") {
      const error = new Error("Registration code has been revoked");
      error.statusCode = 400;
      throw error;
    }
    if (invitation.status === "used") {
      const error = new Error("Registration code has already been used");
      error.statusCode = 400;
      throw error;
    }
    if (invitation.email !== email.trim().toLowerCase()) {
      const error = new Error("Email does not match the invitation");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      const error = new Error("Email already in use");
      error.statusCode = 409;
      throw error;
    }

    const hashed = await hashPassword(password);
    const created = await userModel.create({
      fullName: invitation.staffName,
      email: invitation.email,
      password: hashed,
      role: "staff",
      accountStatus: invitation.employmentStatus === "inactive" ? "inactive" : "active",
      staffRegistrationCode: invitation.registrationCode,
      staffRegistrationCodeUsed: true,
      staffRole: invitation.role,
      staffDepartment: invitation.department,
      staffClassAssigned: invitation.assignedClass || null,
      staffSubjectsAssigned: invitation.assignedSubjects || [],
    });

    const updatedInvitation = await userModel.updateStaffInvitation(invitation.id, {
      status: "used",
      usedAt: new Date(),
      staffUserId: created.id,
    });

    return {
      invitation: updatedInvitation,
      user: safeUser(created),
      token: generateToken({ id: created.id, email: created.email, role: created.role }),
    };
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
