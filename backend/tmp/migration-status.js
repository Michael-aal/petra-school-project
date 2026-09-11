import "../config/loadEnv.js";
import { prisma } from '../config/db.js';

const main = async () => {
  try {
    const migrations = await prisma.$queryRaw`SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC NULLS LAST LIMIT 20`;
    console.log('MIGRATIONS', JSON.stringify(migrations, null, 2));
    const studentCols = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Student' ORDER BY ordinal_position`;
    console.log('STUDENT_COLUMNS', JSON.stringify(studentCols, null, 2));
  } catch (error) {
    console.error('ERROR', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

main();
