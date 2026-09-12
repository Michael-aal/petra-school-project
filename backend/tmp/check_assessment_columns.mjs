import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter, log: ['error'] });

try {
  const rows = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='Assessment' ORDER BY ordinal_position`;
  console.log(JSON.stringify(rows, null, 2));
} catch (e) {
  console.log('ERROR=' + e.message);
} finally {
  await prisma.$disconnect();
}
