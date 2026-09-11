import { prisma } from '../config/db.js';

async function run() {
  try {
    const rows = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name ILIKE 'admission'
      ORDER BY ordinal_position
    `;
    console.log('Admission columns details:');
    for (const r of rows) console.log('-', r.column_name, r.data_type, r.column_default, r.is_nullable);
  } catch (err) {
    console.error('Error listing columns details:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
