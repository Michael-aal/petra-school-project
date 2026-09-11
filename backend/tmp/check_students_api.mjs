import '../config/loadEnv.js';
import { studentService } from '../services/studentService.js';

(async () => {
  try {
    const res = await studentService.list({ page: 1, limit: 50 }, { schoolId: 2 });
    console.log('studentService.list returned total:', res.pagination.total);
    console.log('First students:', (res.students || []).slice(0,5));
  } catch (err) {
    console.error('Error calling studentService.list:', err.message || err);
    process.exit(1);
  }
})();
