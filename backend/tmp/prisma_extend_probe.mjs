import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
console.log('prisma.$extends exists', typeof prisma.$extends);
try {
  const extended = prisma.$extends({});
  console.log('extended type', typeof extended, 'has $use', typeof extended.$use);
  console.log('extended keys', Object.keys(extended).slice(0,20));
} catch (err) {
  console.error('extend error', err.message);
}
