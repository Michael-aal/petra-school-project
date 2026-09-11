import fs from 'fs';
import path from 'path';
import '../config/loadEnv.js';
import { prisma } from '../config/db.js';

async function run() {
  try {
    await prisma.$connect();
    console.log('Connected to DB');

    const backupDir = path.resolve('./backend/backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    console.log('Backing up Admission rows...');
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM "Admission"');
    fs.writeFileSync(path.join(backupDir, 'admission_backup_before_migration.json'), JSON.stringify(rows || [], null, 2));
    console.log(`Wrote ${rows?.length || 0} rows to ${path.join(backupDir, 'admission_backup_before_migration.json')}`);

    console.log('Applying ALTER TABLE to drop NOT NULL on Admission.studentId...');
    await prisma.$executeRawUnsafe('ALTER TABLE "Admission" ALTER COLUMN "studentId" DROP NOT NULL');
    console.log('ALTER applied');

    const info = await prisma.$queryRawUnsafe("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='Admission' AND column_name='studentId';");
    console.log('Column info:', info);

    console.log('Testing INSERT without studentId...');
    const now = new Date().toISOString();
    const id = `adm_test_${Date.now()}`;
    const res = await prisma.$queryRawUnsafe('INSERT INTO "Admission" (id, "schoolId", status, "updatedAt", remarks, "admissionCode", "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, "studentId", "admissionCode"', id, 1, 'pending', now, 'test-migration', 'TESTCODE_MIG', now);
    console.log('Insert result:', res);

    console.log('Done');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
