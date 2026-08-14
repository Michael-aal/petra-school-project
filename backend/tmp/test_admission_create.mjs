import '../config/loadEnv.js';
import { admissionService } from '../services/admissionService.js';
import { prisma } from '../config/db.js';

async function run() {
  try {
    const payload = {
      applicantName: 'Test Applicant',
      intendedClass: 'JSS 1',
      parentEmail: 'test-parent@example.com',
      parentPhone1: '08000000000',
      agreeTerms: true,
    };

    console.log('Creating admission...');
    const created = await admissionService.create(payload, null);
    console.log('Created admission:', created);

    // Fetch the row via raw SQL because Prisma model expects columns that
    // don't yet exist in this database snapshot.
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM "Admission" WHERE id = $1', created.id);
    const dbRow = Array.isArray(rows) ? rows[0] : rows;
    console.log('DB row (raw):', dbRow);
    try {
      const parsed = dbRow.remarks ? JSON.parse(dbRow.remarks) : null;
      console.log('Parsed remarks JSON:', parsed);
    } catch (e) {
      // ignore
    }
  } catch (err) {
    console.error('Error during test create:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
