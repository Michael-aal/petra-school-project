import { prisma, runWithoutSchoolContext } from "../config/db.js";
import { logger } from "../utils/logger.js";

const userSchoolProfileIncludes = {
  principalProfile: { select: { schoolId: true } },
  adminProfile: { select: { schoolId: true } },
  teacherProfile: { select: { schoolId: true } },
  staffProfile: { select: { schoolId: true } },
  parentProfile: { select: { schoolId: true } },
  guardianProfile: { select: { schoolId: true } },
  studentProfile: { select: { schoolId: true } },
};

export const userModel = {
  create: (data) => prisma.user.create({ data }),
  findByEmail: (email) =>
    runWithoutSchoolContext(() =>
      prisma.user.findUnique({ where: { email }, include: userSchoolProfileIncludes }),
    ),
  findByUsername: (username) =>
    runWithoutSchoolContext(() =>
      prisma.user.findUnique({ where: { username }, include: userSchoolProfileIncludes }),
    ),
  findByPhone: (phone) =>
    runWithoutSchoolContext(() =>
      prisma.user.findUnique({ where: { phone }, include: userSchoolProfileIncludes }),
    ),
  findById: (id) =>
    runWithoutSchoolContext(() =>
      prisma.user.findUnique({ where: { id }, include: userSchoolProfileIncludes }),
    ),
  findByIdGlobal: (id) =>
    runWithoutSchoolContext(() =>
      prisma.user.findUnique({ where: { id }, include: userSchoolProfileIncludes }),
    ),
  findByIdentity: async ({ id, email } = {}) => {
    const normalizedId = id ? String(id).trim() : "";
    const normalizedEmail = email ? String(email).trim().toLowerCase() : "";

    if (normalizedId) {
      const user = await runWithoutSchoolContext(() =>
        prisma.user.findUnique({ where: { id: normalizedId }, include: userSchoolProfileIncludes }),
      );
      if (user) return user;
    }

    if (normalizedEmail) {
      const user = await runWithoutSchoolContext(() =>
        prisma.user.findUnique({ where: { email: normalizedEmail }, include: userSchoolProfileIncludes }),
      );
      if (user) return user;
    }

    if (normalizedId || normalizedEmail) {
      return runWithoutSchoolContext(() =>
        prisma.user.findFirst({
          where: {
            OR: [
              normalizedId ? { id: normalizedId } : undefined,
              normalizedEmail ? { email: normalizedEmail } : undefined,
            ].filter(Boolean),
          },
          include: userSchoolProfileIncludes,
        }),
      );
    }

    return null;
  },
  findByIdentityGlobal: async ({ id, email } = {}) => {
    const normalizedId = id ? String(id).trim() : "";
    const normalizedEmail = email ? String(email).trim().toLowerCase() : "";

    if (normalizedId) {
      const user = await runWithoutSchoolContext(() =>
        prisma.user.findUnique({ where: { id: normalizedId }, include: userSchoolProfileIncludes }),
      );
      if (user) return user;
    }

    if (normalizedEmail) {
      const user = await runWithoutSchoolContext(() =>
        prisma.user.findUnique({ where: { email: normalizedEmail }, include: userSchoolProfileIncludes }),
      );
      if (user) return user;
    }

    if (normalizedId || normalizedEmail) {
      return runWithoutSchoolContext(() =>
        prisma.user.findFirst({
          where: {
            OR: [
              normalizedId ? { id: normalizedId } : undefined,
              normalizedEmail ? { email: normalizedEmail } : undefined,
            ].filter(Boolean),
          },
          include: userSchoolProfileIncludes,
        }),
      );
    }

    return null;
  },
  update: (id, data) => prisma.user.update({ where: { id }, data }),
  updateGlobal: (id, data) => runWithoutSchoolContext(() => prisma.user.update({ where: { id }, data })),
  findStaffInvitationByCode: (registrationCode, schoolId = null) =>
    schoolId
      ? prisma.staffInvitation.findFirst({ where: { registrationCode, schoolId } })
      : runWithoutSchoolContext(() => prisma.staffInvitation.findUnique({ where: { registrationCode } })),
  findStaffInvitationByEmail: (email, schoolId) =>
    prisma.staffInvitation.findFirst({ where: { email, schoolId } }),
  listStaffInvitations: (schoolId) =>
    prisma.staffInvitation.findMany({ where: { schoolId }, orderBy: { generatedAt: "desc" } }),
  createStaffInvitation: (data) => prisma.staffInvitation.create({ data }),
  updateStaffInvitation: (id, data, schoolId = null) =>
    schoolId
      ? prisma.staffInvitation.updateMany({ where: { id, schoolId }, data })
      : runWithoutSchoolContext(() => prisma.staffInvitation.update({ where: { id }, data })),
  findStudentByAccessCode: (accessCode, schoolId = null) =>
    prisma.student.findFirst({ where: { parentAccessCode: accessCode, ...(schoolId ? { schoolId } : {}) } }),
  findParentRecordByUserId: (userId) => prisma.parent.findFirst({ where: { userId } }),
  findGuardianRecordByUserId: (userId) => prisma.guardian.findFirst({ where: { userId } }),
  listChildrenByParentUserId: async (userId) => {
    logger.info("listChildrenByParentUserId: start", { userId });
    const [parent, guardian, linkedStudent] = await Promise.all([
      prisma.parent.findFirst({
        where: { userId },
        include: {
          studentLinks: {
            include: { student: { include: { user: { select: { id: true, fullName: true, email: true } }, profile: true } } },
          },
        },
      }),
      prisma.guardian.findFirst({
        where: { userId },
        include: {
          studentLinks: {
            include: { student: { include: { user: { select: { id: true, fullName: true, email: true } }, profile: true } } },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          linkedStudentId: true,
          role: true,
          studentProfile: {
            select: {
              id: true,
              user: { select: { id: true, fullName: true, email: true } },
              className: true,
              admissionNumber: true,
              parentId: true,
            },
          },
        },
      }),
    ]);

    const children = [];
    const pushChild = (student) => {
      if (!student) return;
      if (children.some((item) => item.id === student.id)) return;
      const studentName =
        student.name ||
        student.user?.fullName ||
        [student.user?.firstName, student.user?.lastName].filter(Boolean).join(" ") ||
        student.admissionNumber ||
        "Unnamed learner";
      children.push({
        id: student.id,
        name: studentName,
        className: student.className || "",
        admissionNumber: student.admissionNumber || "",
        parentId: student.parentId || "",
      });
    };

    parent?.studentLinks?.forEach((link) => pushChild(link.student));
    guardian?.studentLinks?.forEach((link) => pushChild(link.student));

    if (linkedStudent?.linkedStudentId) {
      const student = await prisma.student.findFirst({
        where: { id: linkedStudent.linkedStudentId },
        include: { user: { select: { id: true, fullName: true, email: true } } },
      });
      pushChild(student);
    }

    if (children.length === 0 && linkedStudent?.studentProfile) {
      const student = linkedStudent.studentProfile;
      pushChild({
        id: student.id,
        user: student.user,
        className: student.className,
        admissionNumber: student.admissionNumber,
        parentId: student.parentId,
      });
    }

    logger.info("listChildrenByParentUserId: result", { userId, count: children.length });
    return children;
  },
  linkParentToStudent: async ({ parentUserId, studentId, relation }) => {
    logger.info("linkParentToStudent: start", { parentUserId, studentId });
    return prisma.$transaction(async (tx) => {
      const parentUser = await tx.user.findUnique({ where: { id: parentUserId } });
      if (!parentUser) {
        throw new Error("Parent user not found");
      }

      const student = await tx.student.findUnique({ where: { id: studentId } });
      if (!student) {
        throw new Error("Student not found");
      }

      if (parentUser.schoolId && Number(parentUser.schoolId) !== Number(student.schoolId)) {
        throw Object.assign(new Error("Student does not belong to the active school"), { statusCode: 403 });
      }

      let parentRecord = await tx.parent.findFirst({ where: { userId: parentUserId } });
      if (parentRecord && Number(parentRecord.schoolId) !== Number(student.schoolId)) {
        throw Object.assign(new Error("Parent cannot be linked across schools"), { statusCode: 403 });
      }
      if (!parentRecord) {
        parentRecord = await tx.parent.create({
          data: {
            userId: parentUserId,
            schoolId: student.schoolId,
            name: parentUser.fullName || parentUser.email,
            phone: parentUser.phone || null,
            email: parentUser.email,
          },
        });
      }

      const upserted = await tx.studentParent.upsert({
        where: { studentId_parentId: { studentId, parentId: parentRecord.id } },
        update: { relation: relation || null },
        create: {
          studentId,
          parentId: parentRecord.id,
          relation: relation || null,
        },
      });

      logger.info("linkParentToStudent: studentParent upserted", { parentRecordId: parentRecord.id, studentId });

      await tx.user.update({
        where: { id: parentUserId },
        data: { linkedStudentId: studentId, schoolId: student.schoolId },
      });

      await tx.student.update({
        where: { id: studentId },
        data: { parentAccessCodeUsed: true, parentId: parentUserId },
      });

      logger.info("linkParentToStudent: complete", { parentId: parentRecord.id, studentId });
      return { parentId: parentRecord.id, studentId };
    });
  },
  deleteAccount: async (userId) => {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error("User not found");
      }

      const wallet = await tx.wallet.findUnique({ where: { userId } });

      await tx.transaction.deleteMany({ where: { userId } });

      if (wallet) {
        await tx.transaction.deleteMany({ where: { walletId: wallet.id } });
        await tx.wallet.delete({ where: { userId } });
      }

      await tx.attendance.deleteMany({ where: { teacherId: userId } });
      await tx.assessment.deleteMany({ where: { teacherId: userId } });
      await tx.result.deleteMany({ where: { teacherId: userId } });
      await tx.staffInvitation.updateMany({
        where: { staffUserId: userId },
        data: { staffUserId: null, status: "unused", usedAt: null },
      });
      await tx.student.updateMany({
        where: { parentId: userId },
        data: { parentId: null, parentAccessCodeUsed: false },
      });
      await tx.studentParent.deleteMany({
        where: { parent: { userId } },
      });
      await tx.guardianStudent.deleteMany({
        where: { guardian: { userId } },
      });

      return tx.user.delete({ where: { id: userId } });
    });
  },
};
