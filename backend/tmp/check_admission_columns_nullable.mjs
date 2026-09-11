import '../config/loadEnv.js';
import { prisma } from '../config/db.js';
(async ()=>{
  try {
    const rows = await prisma.$queryRaw`SELECT column_name,is_nullable FROM information_schema.columns WHERE lower(table_name) = 'admission' AND lower(column_name) = 'studentid'`;
    console.log(rows);
  } catch (err) {
    console.error('err', err);
  } finally {
    await prisma.$disconnect();
  }
})();
