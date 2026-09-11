import { prisma } from "../config/db.js";

export const walletModel = {
  findByUserId: (userId) =>
    prisma.wallet.findUnique({
      where: { userId },
    }),

  findByAccountNumber: (accountNumber) =>
    prisma.wallet.findUnique({
      where: { accountNumber },
    }),

  findTransactionByReference: (reference) =>
    prisma.transaction.findUnique({
      where: { reference },
    }),

  create: (data) => prisma.wallet.create({ data }),

  update: (where, data) => prisma.wallet.update({ where, data }),

  findRecentTransactions: (userId, limit = 8) =>
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),

  findTransactions: ({ userId, startDate, endDate } = {}) => {
    const where = {
      userId,
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    return prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  },

  createTransaction: (data) => prisma.transaction.create({ data }),
};
