import { userModel } from "../models/userModel.js";
import { prisma } from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";
import { comparePassword } from "../utils/comparePassword.js";
import { generateToken } from "../utils/generateToken.js";
import { normalizeRole } from "../utils/roleUtils.js";
import crypto from "crypto";
import { logger } from "../utils/logger.js";
import { normalizeParentEmail } from "../utils/parentLinking.js";
import { logAudit } from "../utils/auditLog.js";

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

const normalizeUsername = (username = "") => String(username || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
const splitNameParts = (input = {}) => {
  const firstName = String(input.firstName || "").trim();
  const middleName = String(input.middleName || "").trim();
  const lastName = String(input.lastName || "").trim();
  const fullName = String(input.fullName || `${firstName} ${middleName} ${lastName}`.trim()).replace(/\s+/g, " ").trim();
  return { firstName, middleName, lastName, fullName };
};
const buildPasswordError = (message) => { const error = new Error(message); error.statusCode = 400; return error; };
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
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  return { firstName: parts[0], lastName: parts.length > 1 ? parts[parts.length - 1] : "" };
};
const safeUser = (user) => {
  const { firstName, lastName } = getNameParts(user.fullName || "");
  const fallbackSchoolId = user.schoolId || user.principalProfile?.schoolId || user.adminProfile?.schoolId || user.teacherProfile?.schoolId || user.staffProfile?.schoolId || user.parentProfile?.schoolId || user.guardianProfile?.schoolId || user.studentProfile?.schoolId || null;
  return { id: user.id, firstName: user.firstName || firstName, middleName: user.middleName || "", lastName: user.lastName || lastName, username: user.username || "", fullName: user.fullName || "", email: user.email, role: normalizeRole(user.role), phone: user.phone || "", institution: user.institution || "", institutionType: user.institutionType || "", state: user.state || "", city: user.city || "", hearAbout: user.hearAbout || "", staffRole: user.staffRole || "", staffDepartment: user.staffDepartment || "", staffClassAssigned: user.staffClassAssigned || "", staffSubjectsAssigned: Array.isArray(user.staffSubjectsAssigned) ? user.staffSubjectsAssigned : [], accountStatus: user.accountStatus || "active", schoolId: fallbackSchoolId, selectedSchoolId: user.selectedSchoolId || null, profilePicture: user.profilePicture || "", profileImage: user.profileImage || user.profilePicture || "", linkedStudentId: user.linkedStudentId || null };
};
const mapChild = (student) => ({ id: student.id, name: student.name || student.user?.fullName || [student.user?.firstName, student.user?.lastName].filter(Boolean).join(" ") || student.admissionNumber || "Unnamed learner", className: student.className || "", admissionNumber: student.admissionNumber || "", gender: student.gender || "", status: student.profile?.status || "active", parentId: student.parentId || "" });
const makeCode = (prefix) => `${prefix}-${crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase()}`;
const makeInvitationCode = () => `PET-STAFF-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

export const authService = {
  register: async ({ firstName, middleName, lastName, username, fullName, email, password, confirmPassword, phone, institution, institutionType, state, city, hearAbout, role }) => {
    const resolvedRole = resolvePublicRole(role);
    validatePasswordStrength(password);
    const normalizedUsername = normalizeUsername(username || `${String(email || "").split("@")[0]}`);
    const nameParts = splitNameParts({ firstName, middleName, lastName, fullName });
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim() || null;
    if (!nameParts.firstName || !nameParts.lastName) throw buildPasswordError("First name and last name are required");
    if (!normalizedUsername) throw buildPasswordError("Username is required");
    const duplicateChecks = await Promise.all([userModel.findByEmail(normalizedEmail), userModel.findByUsername(normalizedUsername), normalizedPhone ? userModel.findByPhone(normalizedPhone) : Promise.resolve(null)]);
    if (duplicateChecks[0]) { const error = new Error("Email already in use"); error.statusCode = 409; throw error; }
    if (duplicateChecks[1]) { const error = new Error("Username already in use"); error.statusCode = 409; throw error; }
    if (duplicateChecks[2]) { const error = new Error("Phone number already in use"); error.statusCode = 409; throw error; }
    const schoolName = String(institution || "").trim();
    let adoptableSchoolId = null;
    if (resolvedRole === "principal") {
      if (!schoolName) throw buildPasswordError("Institution name is required to register as a school administrator");
      const existingSchool = await prisma.school.findFirst({ where: { name: { equals: schoolName, mode: "insensitive" } }, select: { id: true } });
      if (existingSchool) {
        const principalCount = await prisma.principal.count({ where: { schoolId: existingSchool.id, isActive: true } });
        if (principalCount > 0) { const error = new Error("A school with this name already exists. Ask your school administrator for an invitation instead."); error.statusCode = 409; throw error; }
        adoptableSchoolId = existingSchool.id;
      }
    }
    const hashed = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      let schoolId = null;
      if (resolvedRole === "principal") {
        if (adoptableSchoolId) schoolId = adoptableSchoolId;
        else {
          const school = await tx.school.create({ data: { name: schoolName, address: "Not provided", state: state || null, city: city || null, email: normalizedEmail, phone: normalizedPhone, isActive: true } });
          schoolId = school.id;
        }
        await tx.$executeRaw`SELECT set_config('app.current_school_id', ${String(schoolId)}, true)`;
      }
      const createdUser = await tx.user.create({ data: { firstName: nameParts.firstName, middleName: nameParts.middleName || null, lastName: nameParts.lastName, username: normalizedUsername, fullName: nameParts.fullName, email: normalizedEmail, password: hashed, phone: normalizedPhone, institution, institutionType, state, city, hearAbout, role: resolvedRole, schoolId } });
      if (resolvedRole === "principal" && schoolId) await tx.principal.create({ data: { userId: createdUser.id, schoolId, designation: "Principal", isActive: true } });
      return createdUser;
    });
    return { user: safeUser(user), token: generateToken({ id: user.id, email: user.email, role: user.role, schoolId: user.schoolId || null, sessionVersion: user.sessionVersion }) };
  },

  registerParent: async ({ firstName, middleName, lastName, fullName, username, email, password, phone, schoolId, institution, city, state } = {}) => {
    const normalizedEmail = normalizeParentEmail(email);
    const normalizedPhone = String(phone || "").trim() || null;
    const resolvedSchoolId = Number.parseInt(String(schoolId ?? ""), 10);
    const nameParts = splitNameParts({ firstName, middleName, lastName, fullName });
    const fallbackParts = getNameParts(nameParts.fullName);
    const finalFirstName = nameParts.firstName || fallbackParts.firstName;
    const finalLastName = nameParts.lastName || fallbackParts.lastName;
    const finalFullName = nameParts.fullName || [finalFirstName, nameParts.middleName, finalLastName].filter(Boolean).join(" ");

    if (!normalizedEmail) throw buildPasswordError("Email is required");
    if (!password) throw buildPasswordError("Password is required");
    validatePasswordStrength(password);
    if (!Number.isInteger(resolvedSchoolId) || resolvedSchoolId <= 0) throw buildPasswordError("A valid school is required");
    if (!finalFirstName || !finalLastName) throw buildPasswordError("First name and last name are required");

    const school = await prisma.school.findUnique({ where: { id: resolvedSchoolId }, select: { id: true } });
    if (!school) throw buildPasswordError("School not found");

    const normalizedUsername = normalizeUsername(username || normalizedEmail.split("@")[0]);
    if (!normalizedUsername) throw buildPasswordError("Username is required");

    const [existingEmail, existingUsername, existingPhone] = await Promise.all([
      userModel.findByEmail(normalizedEmail),
      userModel.findByUsername(normalizedUsername),
      normalizedPhone ? userModel.findByPhone(normalizedPhone) : Promise.resolve(null),
    ]);
    if (existingEmail) { const error = new Error("Email already in use"); error.statusCode = 409; throw error; }
    if (existingUsername) { const error = new Error("Username already in use"); error.statusCode = 409; throw error; }
    if (existingPhone) { const error = new Error("Phone number already in use"); error.statusCode = 409; throw error; }

    const hashed = await hashPassword(password);
    const parentCode = makeCode("PAR");
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          firstName: finalFirstName,
          middleName: nameParts.middleName || null,
          lastName: finalLastName,
          fullName: finalFullName,
          username: normalizedUsername,
          email: normalizedEmail,
          password: hashed,
          phone: normalizedPhone,
          institution: institution || null,
          city: city || null,
          state: state || null,
          role: "parent",
          schoolId: resolvedSchoolId,
          parentAccessCode: parentCode,
          parentAccessCodeUsed: false,
          accountStatus: "active",
        },
      });

      await tx.parent.create({
        data: {
          userId: createdUser.id,
          schoolId: resolvedSchoolId,
          name: finalFullName,
          phone: normalizedPhone,
          email: normalizedEmail,
        },
      });

      return createdUser;
    });

    return {
      user: safeUser(user),
      token: generateToken({ id: user.id, email: user.email, role: user.role, schoolId: resolvedSchoolId, sessionVersion: user.sessionVersion }),
      parentAccessCode: parentCode,
    };
  },

  listStaffInvitations: async (schoolId) => {
    const resolvedSchoolId = Number.parseInt(String(schoolId ?? ""), 10);
    if (!Number.isInteger(resolvedSchoolId) || resolvedSchoolId <= 0) throw buildPasswordError("A valid school is required");
    return userModel.listStaffInvitations(resolvedSchoolId);
  },

  login: async ({ email, password }) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");
    if (!normalizedEmail) { const error = new Error("Email is required"); error.statusCode = 400; throw error; }
    if (!normalizedPassword) { const error = new Error("Password is required"); error.statusCode = 400; throw error; }
    const user = await userModel.findByEmail(normalizedEmail);
    if (!user) { const error = new Error("Invalid email or password"); error.statusCode = 401; throw error; }
    const isMatch = await comparePassword(normalizedPassword, user.password);
    if (!isMatch) { const error = new Error("Invalid email or password"); error.statusCode = 401; throw error; }
    logger.info("authService.login: user authenticated", { userId: user.id, role: user.role });
    await logAudit({ userId: user.id, schoolId: user.schoolId, action: "auth.login", entity: "User" });
    return { user: safeUser(user), token: generateToken({ id: user.id, email: user.email, role: user.role, schoolId: user.schoolId || null, sessionVersion: user.sessionVersion }) };
  },

  selectSchool: async ({ userId, schoolId }) => {
    const resolvedSchoolId = Number.parseInt(String(schoolId ?? ""), 10);
    if (!Number.isInteger(resolvedSchoolId) || resolvedSchoolId <= 0) {
      throw buildPasswordError("A valid school is required");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || normalizeRole(user.role) !== "super_admin") {
      const error = new Error("Only Super Admin can select a school");
      error.statusCode = 403;
      throw error;
    }

    const school = await prisma.school.findUnique({
      where: { id: resolvedSchoolId },
      select: {
        id: true,
        name: true,
        address: true,
        email: true,
        phone: true,
        website: true,
        country: true,
        state: true,
        city: true,
        timezone: true,
        logo: true,
        isActive: true,
      },
    });

    if (!school) {
      const error = new Error("School not found");
      error.statusCode = 404;
      throw error;
    }

    if (!school.isActive) {
      const error = new Error("Cannot select an inactive school");
      error.statusCode = 403;
      throw error;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { selectedSchoolId: school.id },
      select: { id: true, selectedSchoolId: true },
    });

    return {
      selectedSchool: school,
      selectedSchoolId: updatedUser.selectedSchoolId,
    };
  },

  profile: async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) { const error = new Error("User not found"); error.statusCode = 404; throw error; }
    let school = null;
    let selectedSchool = null;
    const fallbackSchoolId = user.schoolId || user.principalProfile?.schoolId || user.adminProfile?.schoolId || user.teacherProfile?.schoolId || user.staffProfile?.schoolId || user.parentProfile?.schoolId || user.guardianProfile?.schoolId || user.studentProfile?.schoolId || null;
    try {
      if (fallbackSchoolId) school = await prisma.school.findUnique({ where: { id: Number(fallbackSchoolId) } });
      if (user.selectedSchoolId) selectedSchool = await prisma.school.findUnique({ where: { id: Number(user.selectedSchoolId) } });
    } catch (err) {
      logger.warn?.("Failed to load school info for user profile", { error: err.message });
    }
    let children = [];
    if (["parent", "guardian"].includes(String(user.role || "").toLowerCase())) {
      try { children = (await userModel.listChildrenByParentUserId(userId)).map(mapChild); }
      catch (childError) { logger.error("authService.profile: failed to load children", { userId, error: childError.message }); }
    }
    const base = safeUser(user);
    return { ...base, school: school ? { id: school.id, name: school.name } : null, selectedSchool: selectedSchool ? { id: selectedSchool.id, name: selectedSchool.name } : null, children, linkedStudentId: user.linkedStudentId || null, primaryChildId: children[0]?.id || user.linkedStudentId || null, childCount: children.length };
  }
};
