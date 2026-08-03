import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const main = async () => {
  try {
    const studentCols = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Student' ORDER BY ordinal_position`;
    const userCols = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User' ORDER BY ordinal_position`;
    const studentIndexes = await prisma.$queryRaw`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Student' ORDER BY indexname`;
    console.log('STUDENT_COLUMNS', JSON.stringify(studentCols, null, 2));
    console.log('USER_COLUMNS', JSON.stringify(userCols, null, 2));
    console.log('STUDENT_INDEXES', JSON.stringify(studentIndexes, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

main();
