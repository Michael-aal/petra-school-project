import fs from 'fs';
import { fileURLToPath } from 'url';
import '../config/loadEnv.js';
import { prisma } from '../config/db.js';

async function run() {
  try {
    const fileUrl = new URL('../prisma/migrations/20260813_add_applicantid/migration.sql', import.meta.url);
    const file = fileURLToPath(fileUrl);
    const sql = fs.readFileSync(file, 'utf8');
    const parts = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (const stmt of parts) {
      console.log('Executing:', stmt.split('\n')[0].slice(0,200));
      await prisma.$executeRawUnsafe(stmt);
    }
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
