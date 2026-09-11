import { admissionService } from '../services/admissionService.js';
import { runWithSchoolContext } from '../config/db.js';

(async () => {
  try {
    // Use schoolId 2 which was used by the test submission above
    await runWithSchoolContext(2, async () => {
      const res = await admissionService.list({ page: 1, limit: 10 });
      console.log('Found', res.pagination.total, 'admissions');
      console.log(JSON.stringify(res.admissions.slice(0,5), null, 2));
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
