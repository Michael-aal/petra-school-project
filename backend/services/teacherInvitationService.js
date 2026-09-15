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
    if (invitation.role && String(invitation.role).toLowerCase() !== "teacher") {
      throw Object.assign(new Error("This registration code is not for a teacher."), { statusCode: 400 });
    }
    if (invitation.status === "revoked") throw Object.assign(new Error("Registration code has been revoked"), { statusCode: 400 });
    if (invitation.status === "used") throw Object.assign(new Error("Registration code has already been used"), { statusCode: 400 });
    if (!invitation.schoolId) throw Object.assign(new Error("This invitation is not linked to a school"), { statusCode: 400 });

    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      let user = invitation.staffUserId
        ? await tx.user.findUnique({ where: { id: invitation.staffUserId } })
        : null;

      // New approved teacher applications already have a pending User + Teacher.
      // Activate that existing identity instead of creating a duplicate Teacher.
      if (user) {
        if (Number(user.schoolId) !== Number(invitation.schoolId)) {
          throw Object.assign(new Error("Teacher registration code belongs to a different school."), { statusCode: 403 });
        }
        if (String(user.role || "").toLowerCase() !== "teacher") {
          throw Object.assign(new Error("This registration code is not linked to a teacher account."), { statusCode: 400 });
        }
        if (normalizedEmail !== String(user.email || "").toLowerCase()) {
          throw Object.assign(new Error("Use the email address attached to this teacher registration code."), { statusCode: 400 });
        }

        user = await tx.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            accountStatus: invitation.employmentStatus === "inactive" ? "inactive" : "active",
            staffRegistrationCode: invitation.registrationCode,
            staffRegistrationCodeUsed: true,
            staffRole: invitation.role || "Teacher",
            staffDepartment: invitation.department || "",
            staffClassAssigned: invitation.assignedClass || null,
            staffSubjectsAssigned: invitation.assignedSubjects || [],
          },
        });

        const teacher = await tx.teacher.findUnique({ where: { userId: user.id } });
        if (teacher) {
          await tx.teacher.update({
            where: { id: teacher.id },
            data: {
              schoolId: invitation.schoolId,
              designation: invitation.role || "Teacher",
              isActive: invitation.employmentStatus !== "inactive",
            },
          });
        } else {
          await tx.teacher.create({
            data: {
              userId: user.id,
              schoolId: invitation.schoolId,
              designation: invitation.role || "Teacher",
              isActive: invitation.employmentStatus !== "inactive",
            },
          });
        }
      } else {
        // Backwards compatibility for older staff invitations created before
        // approved teacher applications started creating the Teacher record.
        const existingUser = await tx.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) throw Object.assign(new Error("Email already in use"), { statusCode: 409 });

        const usernameBase = normalizeUsername(normalizedEmail.split("@")[0]);
        let username = usernameBase || `teacher${crypto.randomBytes(3).toString("hex")}`;
        if (await tx.user.findUnique({ where: { username } })) {
          username = `${username}-${crypto.randomBytes(2).toString("hex")}`;
        }

        const { firstName, lastName } = getNameParts(invitation.staffName);
        user = await tx.user.create({
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
            userId: user.id,
            schoolId: invitation.schoolId,
            designation: invitation.role || "Teacher",
            isActive: invitation.employmentStatus !== "inactive",
          },
        });
      }

      await tx.staffInvitation.update({
        where: { id: invitation.id },
        data: {
          email: normalizedEmail,
          status: "used",
          usedAt: new Date(),
          staffUserId: user.id,
        },
      });

      return user;
    });

    return {
      user: safeUser(result),
      token: generateToken({ id: result.id, email: result.email, role: result.role, schoolId: result.schoolId, sessionVersion: result.sessionVersion }),
    };
  },
};
