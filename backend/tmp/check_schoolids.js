import "../config/loadEnv.js";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.user.count();
  const missing = await prisma.user.count({ where: { schoolId: null } });
  const sample = await prisma.user.findMany({ take: 10, select: { id: true, email: true, role: true, schoolId: true } });
  console.log(JSON.stringify({ total, missing, sample }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
