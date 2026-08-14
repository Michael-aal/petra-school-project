import { prisma } from '../config/db.js';

(async () => {
  try {
    const rows = await prisma.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Admission' ORDER BY ordinal_position");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('QUERY_ERROR', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
})();
