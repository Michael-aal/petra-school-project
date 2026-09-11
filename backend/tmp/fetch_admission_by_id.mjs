import { prisma } from '../config/db.js';

const id = process.argv[2] || 'adm_1786574204773_b964008b';

async function run() {
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM "Admission" WHERE id = $1', id);
    const row = Array.isArray(rows) ? rows[0] : rows;
    console.log('Admission row (raw):', row);
    if (row && row.remarks) {
      try { console.log('Parsed remarks:', JSON.parse(row.remarks)); } catch (e) { console.log('remarks not JSON'); }
    }
  } catch (err) {
    console.error('Error fetching admission:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
