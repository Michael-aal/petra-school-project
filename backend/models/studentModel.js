import { prisma } from "../config/db.js";

const normalizeArgs = (args = {}) => {
  if (!args || typeof args !== "object" || Array.isArray(args)) return { where: args };
  if (args.where || args.include || args.select || args.orderBy || args.skip || args.take || args.cursor || args.distinct || args._count || args.data) {
    return args;
  }
  return { where: args };
};

export const studentModel = {
  count: (args = {}) => prisma.student.count(normalizeArgs(args)),
  findMany: (args = {}) => prisma.student.findMany(normalizeArgs(args)),
  findUnique: (args = {}) => prisma.student.findUnique(normalizeArgs(args)),
  findFirst: (args = {}) => prisma.student.findFirst(normalizeArgs(args)),
  create: (args = {}) => prisma.student.create(args),
  update: (args = {}) => prisma.student.update(args),
  delete: (args = {}) => prisma.student.delete(normalizeArgs(args)),
};
