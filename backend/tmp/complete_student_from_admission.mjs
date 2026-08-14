import '../config/loadEnv.js';
import { admissionService } from '../services/admissionService.js';
import { prisma } from '../config/db.js';

const admissionId = process.argv[2] || 'adm_1786575578338_92fb4418';
(async () => {
  try {
    console.log('Running completion for admission:', admissionId);
    const result = await admissionService.completeStudentRecord(admissionId, 'script-runner');
    console.log('Success:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
  } finally {
    try { await prisma.$disconnect(); } catch (e) {}
    process.exit(0);
  }
})();
