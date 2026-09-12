import crypto from "node:crypto";
import { prisma } from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";
import { generateToken } from "../utils/generateToken.js";

const makeInvitationCode = () =>
  `PET-STAFF-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const getNameParts = (fullName = "") => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Teacher",
    lastName: parts.length > 1 ? parts[parts.length - 1] : "Teacher",
  };
};

const normalizeUsername = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");

const safeUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  schoolId: user.schoolId,
  accountStatus: user.accountStatus,
});

const validatePassword = (password = "") => {
  const value = String(password || "");
  if (value.length < 8) throw Object.assign(new Error("Password must be at least 8 characters long"), { statusCode: 400 });
  if (!/[A-Z]/.test(value)) throw Object.assign(new Error("Password must include at least one uppercase letter"), { statusCode: 400 });
  if (!/[a-z]/.test(value)) throw Object.assign(new Error("Password must include at least one lowercase letter"), { statusCode: 400 });
  if (!/[0-9]/.test(value)) throw Object.assign(new Error("Password must include at least one number"), { statusCode: 400 });
  if (!/[^A-Za-z0-9]/.test(value)) throw Object.assign(new Error("Password must include at least one special character"), { statusCode: 400 });
};

export const teacherInvitationService = {
  create: async ({ staffName, role, department, assignedClass, assignedSubjects, employmentStatus, generatedBy, schoolId }) => {
    const resolvedSchoolId = Number(schoolId);
    const normalizedName = String(staffName || "").trim();

    if (!normalizedName) throw Object.assign(new Error("Teacher name is required"), { statusCode: 400 });
    if (!Number.isInteger(resolvedSchoolId) || resolvedSchoolId <= 0) {
      throw Object.assign(new Error("School context missing"), { statusCode: 403 });
    }

    const school = await prisma.school.findUnique({ where: { id: resolvedSchoolId }, select: { id: true } });
    if (!school) throw Object.assign(new Error("School not found"), { statusCode: 404 });

    const registrationCode = makeInvitationCode();
    const pendingEmail = `pending-${registrationCode.toLowerCase()}@invitation.petra.local`;

    return prisma.staffInvitation.create({
      data: {
        staffName: normalizedName,
        email: pendingEmail,
        role: role || "Teacher",
        department: department || null,
        assignedClass: assignedClass || null,
        assignedSubjects: Array.isArray(assignedSubjects) ? assignedSubjects : [],
        employmentStatus: employmentStatus || "active",
        registrationCode,
        generatedBy: generatedBy || null,
        schoolId: resolvedSchoolId,
        status: "unused",
      },
    });
  },

  activate: async ({ email, password, code }) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedCode = String(code || "").trim();
    if (!normalizedEmail) throw Object.assign(new Error("Email is required"), { statusCode: 400 });
    if (!normalizedCode) throw Object.assign(new Error("Registration code is required"), { statusCode: 400 });
    validatePassword(password);

    const invitation = await prisma.staffInvitation.findUnique({ where: { registrationCode: normalizedCode } });
    if (!invitation) throw Object.assign(new Error("Invalid registration code"), { statusCode: 400 });
    if (invitation.status === "revoked") throw Object.assign(new Error("Registration code has been revoked"), { statusCode: 400 });
    if (invitation.status === "used") throw Object.assign(new Error("Registration code has already been used"), { statusCode: 400 });
    if (!invitation.schoolId) throw Object.assign(new Error("This invitation is not linked to a school"), { statusCode: 400 });

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) throw Object.assign(new Error("Email already in use"), { statusCode: 409 });

    const usernameBase = normalizeUsername(normalizedEmail.split("@")[0]);
    let username = usernameBase || `teacher${crypto.randomBytes(3).toString("hex")}`;
    if (await prisma.user.findUnique({ where: { username } })) {
      username = `${username}-${crypto.randomBytes(2).toString("hex")}`;
    }

    const { firstName, lastName } = getNameParts(invitation.staffName);
    const hashedPassword = await hashPassword(password);

    const created = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          firstName,
          middleName: null,
          lastName,
          fullName: invitation.staffName,
          username,
          email: normalizedEmail,
          password: hashedPassword,
          role: "teacher",
          accountStatus: invitation.employmentStatus === "inactive" ? "inactive" : "active",
          staffRegistrationCode: invitation.registrationCode,
          staffRegistrationCodeUsed: true,
          staffRole: invitation.role || "Teacher",
          staffDepartment: invitation.department || "",
          staffClassAssigned: invitation.assignedClass || null,
          staffSubjectsAssigned: invitation.assignedSubjects || [],
          schoolId: invitation.schoolId,
        },
      });

      await tx.teacher.create({
        data: {
          userId: createdUser.id,
          schoolId: invitation.schoolId,
          designation: invitation.role || "Teacher",
          isActive: invitation.employmentStatus !== "inactive",
        },
      });

      await tx.staffInvitation.update({
        where: { id: invitation.id },
        data: {
          email: normalizedEmail,
          status: "used",
          usedAt: new Date(),
          staffUserId: createdUser.id,
        },
      });

      return createdUser;
    });

    return {
      user: safeUser(created),
      token: generateToken({ id: created.id, email: created.email, role: created.role, schoolId: created.schoolId }),
    };
  },
};
