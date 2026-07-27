import { prisma } from "../config/db.js";

export const userModel = {
  create: (data) => prisma.user.create({ data }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findByUsername: (username) => prisma.user.findUnique({ where: { username } }),
  findByPhone: (phone) => prisma.user.findUnique({ where: { phone } }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  findByIdentity: async ({ id, email } = {}) => {
    const normalizedId = id ? String(id).trim() : "";
    const normalizedEmail = email ? String(email).trim().toLowerCase() : "";

    if (normalizedId) {
      const user = await prisma.user.findUnique({ where: { id: normalizedId } });
      if (user) return user;
    }

    if (normalizedEmail) {
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (user) return user;
    }

    if (normalizedId || normalizedEmail) {
      return prisma.user.findFirst({
        where: {
          OR: [
            normalizedId ? { id: normalizedId } : undefined,
            normalizedEmail ? { email: normalizedEmail } : undefined,
          ].filter(Boolean),
        },
      });
    }

    return null;
  },
  update: (id, data) => prisma.user.update({ where: { id }, data }),
  findStaffInvitationByCode: (registrationCode) =>
    prisma.staffInvitation.findUnique({ where: { registrationCode } }),
  findStaffInvitationByEmail: (email) =>
    prisma.staffInvitation.findUnique({ where: { email } }),
  listStaffInvitations: () =>
    prisma.staffInvitation.findMany({ orderBy: { generatedAt: "desc" } }),
  createStaffInvitation: (data) => prisma.staffInvitation.create({ data }),
  updateStaffInvitation: (id, data) => prisma.staffInvitation.update({ where: { id }, data }),
  findStudentByAccessCode: (accessCode) =>
    prisma.student.findFirst({ where: { parentAccessCode: accessCode } }),
  linkParentToStudent: ({ parentId, studentId }) =>
    prisma.$transaction([
      prisma.user.update({ where: { id: parentId }, data: { linkedStudentId: studentId } }),
      prisma.student.update({ where: { id: studentId }, data: { parentAccessCodeUsed: true, parentId } }),
    ]),
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

      return tx.user.delete({ where: { id: userId } });
    });
  },
};
