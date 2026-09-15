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

  createTransaction: async (data) => {
    if (data?.idempotencyKey) {
      const existing = await prisma.transaction.findUnique({ where: { idempotencyKey: String(data.idempotencyKey) } });
      if (existing) {
        const error = new Error("Duplicate transaction request");
        error.statusCode = 409;
        throw error;
      }
    }
    try {
      return await prisma.transaction.create({ data });
    } catch (error) {
      if (error?.code === "P2002" && data?.idempotencyKey) {
        const duplicate = new Error("Duplicate transaction request");
        duplicate.statusCode = 409;
        throw duplicate;
      }
      throw error;
    }
  },
};
