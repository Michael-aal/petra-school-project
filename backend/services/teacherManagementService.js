import { prisma } from "../config/db.js";
import { normalizeRole } from "../utils/roleUtils.js";

const assertPrincipal = (user) => {
  if (!user || !["principal", "super_admin"].includes(normalizeRole(user.role))) {
    const error = new Error("Only an administrator can manage teachers");
    error.statusCode = 403;
    throw error;
  }
};

const resolveSchoolId = (schoolId) => {
  const value = Number(schoolId);
  if (!Number.isInteger(value) || value <= 0) {
    const error = new Error("A valid school is required");
    error.statusCode = 403;
    throw error;
  }
  return value;
};

const mapTeacher = (teacher) => ({
  id: teacher.id,
  userId: teacher.userId,
  fullName: teacher.user?.fullName || [teacher.user?.firstName, teacher.user?.lastName].filter(Boolean).join(" ") || "Teacher",
  email: teacher.user?.email || "",
  designation: teacher.designation || teacher.user?.staffRole || "Teacher",
  department: teacher.user?.staffDepartment || "",
  accountStatus: teacher.user?.accountStatus || "active",
  isActive: teacher.isActive,
  createdAt: teacher.createdAt,
});

export const teacherManagementService = {
  list: async ({ user, schoolId }) => {
    assertPrincipal(user);
    const resolvedSchoolId = resolveSchoolId(schoolId);
    const teachers = await prisma.teacher.findMany({
      where: {
        schoolId: resolvedSchoolId,
        user: { role: "teacher" },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            accountStatus: true,
            staffRole: true,
            staffDepartment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return teachers.map(mapTeacher);
  },

  deactivate: async ({ user, schoolId, teacherUserId }) => {
    assertPrincipal(user);
    const resolvedSchoolId = resolveSchoolId(schoolId);
    const targetUserId = String(teacherUserId || "").trim();
    if (!targetUserId) {
      const error = new Error("Teacher user ID is required");
      error.statusCode = 400;
      throw error;
    }
    if (targetUserId === String(user.id)) {
      const error = new Error("You cannot deactivate your own administrator account here");
      error.statusCode = 400;
      throw error;
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: targetUserId,
        schoolId: resolvedSchoolId,
        user: { role: "teacher" },
      },
      select: { id: true, userId: true, isActive: true },
    });

    if (!teacher) {
      const error = new Error("Teacher not found in this school");
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id: teacher.id },
        data: { isActive: false },
      });

      return tx.user.update({
        where: { id: teacher.userId },
        data: {
          accountStatus: "inactive",
          sessionVersion: { increment: 1 },
        },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          accountStatus: true,
          staffRole: true,
          staffDepartment: true,
        },
      });
    });

    return {
      id: teacher.id,
      userId: updated.id,
      fullName: updated.fullName || [updated.firstName, updated.lastName].filter(Boolean).join(" ") || "Teacher",
      email: updated.email || "",
      accountStatus: updated.accountStatus,
      isActive: false,
      designation: updated.staffRole || "Teacher",
      department: updated.staffDepartment || "",
    };
  },

  reactivate: async ({ user, schoolId, teacherUserId }) => {
    assertPrincipal(user);
    const resolvedSchoolId = resolveSchoolId(schoolId);
    const targetUserId = String(teacherUserId || "").trim();
    const teacher = await prisma.teacher.findFirst({
      where: { userId: targetUserId, schoolId: resolvedSchoolId, user: { role: "teacher" } },
      select: { id: true, userId: true },
    });
    if (!teacher) {
      const error = new Error("Teacher not found in this school");
      error.statusCode = 404;
      throw error;
    }

    await prisma.$transaction([
      prisma.teacher.update({ where: { id: teacher.id }, data: { isActive: true } }),
      prisma.user.update({ where: { id: teacher.userId }, data: { accountStatus: "active", sessionVersion: { increment: 1 } } }),
    ]);

    return { userId: teacher.userId, isActive: true, accountStatus: "active" };
  },
};
