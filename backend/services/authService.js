import { userModel } from "../models/userModel.js";
import { hashPassword } from "../utils/hashPassword.js";
import { comparePassword } from "../utils/comparePassword.js";
import { generateToken } from "../utils/generateToken.js";
import { normalizeRole } from "../utils/roleUtils.js";
import crypto from "crypto";

const resolvePublicRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "super_admin") {
    const error = new Error("Super Admin accounts cannot be created through public registration");
    error.statusCode = 403;
    throw error;
  }

  if (!["student", "teacher", "parent", "principal"].includes(normalizedRole)) {
    const error = new Error("Invalid role selected");
    error.statusCode = 400;
    throw error;
  }

  return normalizedRole;
};

const normalizeUsername = (username = "") =>
  String(username || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");

const splitNameParts = (input = {}) => {
  const firstName = String(input.firstName || "").trim();
  const middleName = String(input.middleName || "").trim();
  const lastName = String(input.lastName || "").trim();
  const fullName = String(input.fullName || `${firstName} ${middleName} ${lastName}`.trim())
    .replace(/\s+/g, " ")
    .trim();

  return { firstName, middleName, lastName, fullName };
};

const buildPasswordError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const validatePasswordStrength = (password = "") => {
  const value = String(password || "");
  if (value.length < 8) throw buildPasswordError("Password must be at least 8 characters long");
  if (value.length > 128) throw buildPasswordError("Password must be at most 128 characters long");
  if (!/[A-Z]/.test(value)) throw buildPasswordError("Password must include at least one uppercase letter");
  if (!/[a-z]/.test(value)) throw buildPasswordError("Password must include at least one lowercase letter");
  if (!/[0-9]/.test(value)) throw buildPasswordError("Password must include at least one number");
  if (!/[^A-Za-z0-9]/.test(value)) throw buildPasswordError("Password must include at least one special character");
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
    firstName: user.firstName || firstName,
    middleName: user.middleName || "",
    lastName: user.lastName || lastName,
    username: user.username || "",
    fullName: user.fullName || "",
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
  register: async ({
    firstName,
    middleName,
    lastName,
    username,
    fullName,
    email,
    password,
    confirmPassword,
    phone,
    institution,
    institutionType,
    state,
    city,
    hearAbout,
    role,
    ...rest
  }) => {
    const resolvedRole = resolvePublicRole(role);
    validatePasswordStrength(password);

    const normalizedUsername = normalizeUsername(username || `${String(email || "").split("@")[0]}`);
    const nameParts = splitNameParts({ firstName, middleName, lastName, fullName });
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim() || null;

    if (!nameParts.firstName || !nameParts.lastName) {
      const error = new Error("First name and last name are required");
      error.statusCode = 400;
      throw error;
    }

    if (!normalizedUsername) {
      const error = new Error("Username is required");
      error.statusCode = 400;
      throw error;
    }

    const duplicateChecks = await Promise.all([
      userModel.findByEmail(normalizedEmail),
      userModel.findByUsername(normalizedUsername),
      normalizedPhone ? userModel.findByPhone(normalizedPhone) : Promise.resolve(null),
    ]);

    if (duplicateChecks[0]) {
      const error = new Error("Email already in use");
      error.statusCode = 409;
      throw error;
    }

    if (duplicateChecks[1]) {
      const error = new Error("Username already in use");
      error.statusCode = 409;
      throw error;
    }

    if (duplicateChecks[2]) {
      const error = new Error("Phone number already in use");
      error.statusCode = 409;
      throw error;
    }

    const hashed = await hashPassword(password);
    const user = await userModel.create({
      firstName: nameParts.firstName,
      middleName: nameParts.middleName || null,
      lastName: nameParts.lastName,
      username: normalizedUsername,
      fullName: nameParts.fullName,
      email: normalizedEmail,
      password: hashed,
      phone: normalizedPhone,
      institution,
      institutionType,
      state,
      city,
      hearAbout,
      role: resolvedRole,
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
    const { firstName, lastName } = getNameParts(fullName || "");
    const user = await userModel.create({
      firstName,
      middleName: null,
      lastName: lastName || firstName,
      username: normalizeUsername(email.split("@")[0]),
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
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedStaffName = String(staffName || "").trim();

    const existingUser = await userModel.findByEmail(normalizedEmail);
    if (existingUser) {
      const error = new Error("Email already in use");
      error.statusCode = 409;
      throw error;
    }

    const existingInvitation = await userModel.findStaffInvitationByEmail(normalizedEmail);
    if (existingInvitation) {
      const error = new Error("A staff invitation already exists for this email");
      error.statusCode = 409;
      throw error;
    }

    const registrationCode = makeInvitationCode();
    const invitation = await userModel.createStaffInvitation({
      staffName: normalizedStaffName,
      email: normalizedEmail,
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

  getStaffInvitation: async (registrationCode) => {
    const invitation = await userModel.findStaffInvitationByCode(registrationCode);
    if (!invitation) {
      const error = new Error("Staff invitation not found");
      error.statusCode = 404;
      throw error;
    }

    if (invitation.status === "used") {
      const error = new Error("Registration code has already been used");
      error.statusCode = 409;
      throw error;
    }

    if (invitation.status === "revoked") {
      const error = new Error("Registration code has been revoked");
      error.statusCode = 400;
      throw error;
    }

    return invitation;
  },

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
      firstName: getNameParts(invitation.staffName).firstName,
      middleName: null,
      lastName: getNameParts(invitation.staffName).lastName,
      username: normalizeUsername(email.split("@")[0]),
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

  registerParent: async ({ fullName, email, password, phone, role }) => {
    validatePasswordStrength(password);
    const { firstName, lastName } = getNameParts(fullName);
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim() || null;
    const normalizedUsername = normalizeUsername(normalizedEmail.split("@")[0]);
    const selectedRole = normalizeRole(role || "parent");

    if (selectedRole === "super_admin") {
      const error = new Error("Super admin accounts cannot be created through public registration");
      error.statusCode = 403;
      throw error;
    }

    const duplicateChecks = await Promise.all([
      userModel.findByEmail(normalizedEmail),
      userModel.findByUsername(normalizedUsername),
      normalizedPhone ? userModel.findByPhone(normalizedPhone) : Promise.resolve(null),
    ]);
    if (duplicateChecks[0]) {
      const error = new Error("Email already in use");
      error.statusCode = 409;
      throw error;
    }
    if (duplicateChecks[1]) {
      const error = new Error("Username already in use");
      error.statusCode = 409;
      throw error;
    }
    if (duplicateChecks[2]) {
      const error = new Error("Phone number already in use");
      error.statusCode = 409;
      throw error;
    }
    const user = await userModel.create({
      firstName,
      middleName: null,
      lastName,
      username: normalizedUsername,
      fullName,
      email: normalizedEmail,
      password: await hashPassword(password),
      phone: normalizedPhone,
      role: selectedRole,
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

  updateProfile: async (userId, payload = {}) => {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const nextEmail = payload.email?.trim();
    if (nextEmail && nextEmail !== user.email) {
      const existingUser = await userModel.findByEmail(nextEmail);
      if (existingUser && existingUser.id !== userId) {
        const error = new Error("Email already in use");
        error.statusCode = 409;
        throw error;
      }
    }

    const updateData = {};
    if (payload.fullName !== undefined) updateData.fullName = payload.fullName.trim();
    if (payload.phoneNumber !== undefined) updateData.phone = payload.phoneNumber.trim();
    if (nextEmail) updateData.email = nextEmail;
    if (payload.profileImage !== undefined) updateData.profileImage = payload.profileImage.trim();
    if (payload.password) updateData.password = await hashPassword(payload.password);

    const updatedUser = await userModel.update(userId, updateData);
    return { user: safeUser(updatedUser) };
  },

  changePassword: async ({ userId, currentPassword, newPassword }) => {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      const error = new Error("Current password is incorrect");
      error.statusCode = 401;
      throw error;
    }

    await userModel.update(userId, { password: await hashPassword(newPassword) });

    return {
      message: "Password updated successfully",
    };
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
