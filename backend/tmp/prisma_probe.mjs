import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
console.log('has $use', typeof prisma.$use);
console.log('has $extends', typeof prisma.$extends);
console.log('has _dmmf', typeof prisma._dmmf);
console.log('modelMap keys', Object.keys(prisma._dmmf?.modelMap || {}).slice(0,20));
