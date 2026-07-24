import { prisma } from "../config/db.js";

export const userModel = {
  create: (data) => prisma.user.create({ data }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
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
