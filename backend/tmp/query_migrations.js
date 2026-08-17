const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT id, migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('QUERY_ERROR', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
})();
