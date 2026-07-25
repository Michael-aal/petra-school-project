import { prisma } from "../config/db.js";

export const studentModel = {
  count: (where = {}) => prisma.student.count({ where }),
  findMany: (args = {}) => prisma.student.findMany(args),
  findUnique: (where) => prisma.student.findUnique({ where }),
  findFirst: (where) => prisma.student.findFirst({ where }),
  create: (args = {}) => prisma.student.create(args),
  update: (args = {}) => prisma.student.update(args),
  delete: (where) => prisma.student.delete({ where }),
};
