import "../config/loadEnv.js";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const main = async () => {
  try {
    console.log('Running Student schema repair...');
    await prisma.$executeRaw`
      ALTER TABLE "Student"
      ADD COLUMN IF NOT EXISTS "name" TEXT,
      ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
    `;
    console.log('Student schema repair applied successfully.');
  } catch (error) {
    console.error('Repair failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

main();
