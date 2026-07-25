import { prisma } from "../config/db.js";

export const userModel = {
  create: (data) => prisma.user.create({ data }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
  findStaffInvitationByCode: (registrationCode) =>
    prisma.staffInvitation.findUnique({ where: { registrationCode }, include: { staffUser: true } }),
  findStaffInvitationByEmail: (email) =>
    prisma.staffInvitation.findUnique({ where: { email }, include: { staffUser: true } }),
  listStaffInvitations: () =>
    prisma.staffInvitation.findMany({ orderBy: { generatedAt: "desc" }, include: { staffUser: true } }),
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
      const wallet = await tx.wallet.findUnique({ where: { userId } });

      await tx.transaction.deleteMany({ where: { userId } });

      if (wallet) {
        await tx.transaction.deleteMany({ where: { walletId: wallet.id } });
        await tx.wallet.delete({ where: { userId } });
      }

      return tx.user.delete({ where: { id: userId } });
    });
  },
};
