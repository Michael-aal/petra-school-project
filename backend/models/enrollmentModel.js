import { prisma } from "../config/db.js";

const normalizeArgs = (args = {}) => {
  if (!args || typeof args !== "object" || Array.isArray(args)) return { where: args };
  if (
    args.where ||
    args.include ||
    args.select ||
    args.orderBy ||
    args.skip ||
    args.take ||
    args.cursor ||
    args.distinct ||
    args._count ||
    args.data
  ) {
    return args;
  }
  return { where: args };
};

export const enrollmentModel = {
  count: (args = {}) => prisma.enrollment.count(normalizeArgs(args)),
  findMany: (args = {}) => prisma.enrollment.findMany(normalizeArgs(args)),
  findUnique: (args = {}) => prisma.enrollment.findUnique(normalizeArgs(args)),
  findFirst: (args = {}) => prisma.enrollment.findFirst(normalizeArgs(args)),
  create: (args = {}) => prisma.enrollment.create(args),
  update: (args = {}) => prisma.enrollment.update(args),
  delete: (args = {}) => prisma.enrollment.delete(normalizeArgs(args)),
};
