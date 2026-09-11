import { prisma } from '../config/db.js';

async function run() {
  try {
    const rows = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name ILIKE 'admission'
      ORDER BY ordinal_position
    `;
    console.log('Admission columns:');
    for (const r of rows) console.log('-', r.column_name || r.columnname || JSON.stringify(r));
  } catch (err) {
    console.error('Error listing columns:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
