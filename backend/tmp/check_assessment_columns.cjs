const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter, log: ['error'] });

(async () => {
  try {
    const rows = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='Assessment' ORDER BY ordinal_position`;
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.log('ERROR=' + e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
