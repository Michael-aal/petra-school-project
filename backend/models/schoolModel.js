import { prisma } from "../config/db.js";

export const schoolModel = {
  create: (data) => prisma.school.create({ data }),
  findMany: (args = {}) => prisma.school.findMany(args),
  findUnique: (args = {}) => prisma.school.findUnique(args),
  findFirst: (args = {}) => prisma.school.findFirst(args),
  update: (args = {}) => prisma.school.update(args),
  delete: (args = {}) => prisma.school.delete(args),
};

