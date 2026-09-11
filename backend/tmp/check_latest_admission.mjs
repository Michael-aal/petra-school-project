import '../config/loadEnv.js';
import { prisma, runWithoutSchoolContext } from '../config/db.js';

(async () => {
  try {
    await runWithoutSchoolContext(async () => {
      // 1) Inspect admission table columns to avoid Prisma model mismatches
      const colsRes = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name ILIKE 'admission' ORDER BY ordinal_position`;
      const cols = (colsRes || []).map(r => String(r.column_name || r.columnname || '').toLowerCase());
      console.log('Admission table columns:', cols.join(', '));

      // Select the latest admission row using a raw SELECT * to avoid schema mapping errors
      const sql = `SELECT * FROM "Admission" ORDER BY COALESCE("createdAt", "updatedAt") DESC LIMIT 1`;
      const rows = await prisma.$queryRawUnsafe(sql);
      const admissionRow = Array.isArray(rows) ? rows[0] : rows;

      if (!admissionRow) {
        console.log('No admissions found in the database.');
        return;
      }

      console.log('Admission row (raw):');
      console.log(admissionRow);

      // Access fields case-insensitively in the returned row object
      const rowKeys = Object.keys(admissionRow || {});
      const getField = (names) => {
        for (const n of names) {
          const found = rowKeys.find(k => k.toLowerCase() === n.toLowerCase());
          if (found) return admissionRow[found];
        }
        return null;
      };

      const admissionId = getField(['id']);
      const studentId = getField(['studentId', 'studentid']);
      const remarksRaw = getField(['remarks']);
      let remarks = null;
      try { remarks = remarksRaw ? JSON.parse(remarksRaw) : null; } catch(e) { remarks = null; }

      const createdAt = getField(['createdAt','createdat','created_at']);
      const updatedAt = getField(['updatedAt','updatedat','updated_at']);
      console.log('Parsed summary:', {
        id: admissionId,
        applicationCode: admissionRow.applicationcode || admissionRow.admissioncode || (remarks && (remarks.applicationCode || remarks.admissionCode)) || null,
        applicantName: admissionRow.applicantname || (remarks && (remarks.firstName || remarks.applicantName)) || null,
        status: admissionRow.status,
        createdAt,
        updatedAt,
      });

      if (!studentId) {
        console.log('-> No Student record linked to this admission (studentId is null).');
        return;
      }

      // Query student record and related tables via raw SQL (safe columns)
      const studentRows = await prisma.$queryRawUnsafe('SELECT * FROM "Student" WHERE id = $1', studentId);
      const student = Array.isArray(studentRows) ? studentRows[0] : studentRows;
      if (!student) {
        console.log('-> studentId present but no Student row found for id =', studentId);
        return;
      }

      console.log('-> Student record:', student);

      // StudentProfile
      const profileRows = await prisma.$queryRawUnsafe('SELECT * FROM "StudentProfile" WHERE "studentId" = $1', studentId);
      const profile = Array.isArray(profileRows) ? profileRows[0] : profileRows;
      console.log('  - StudentProfile:', profile || 'missing');

      // StudentParent links and Parent rows
      const spRows = await prisma.$queryRawUnsafe(`SELECT sp.*, p.* FROM "StudentParent" sp LEFT JOIN "Parent" p ON p.id = sp."parentId" WHERE sp."studentId" = $1`, studentId);
      console.log('  - StudentParent links:', (spRows && spRows.length) ? spRows : 'none');

      // GuardianStudent links
      const gsRows = await prisma.$queryRawUnsafe(`SELECT gs.*, g.* FROM "GuardianStudent" gs LEFT JOIN "Guardian" g ON g.id = gs."guardianId" WHERE gs."studentId" = $1`, studentId);
      console.log('  - GuardianStudent links:', (gsRows && gsRows.length) ? gsRows : 'none');

      // Enrollments
      const enrollRows = await prisma.$queryRawUnsafe('SELECT * FROM "Enrollment" WHERE "studentId" = $1 ORDER BY "createdAt" DESC', studentId);
      console.log('  - Enrollments:', (enrollRows && enrollRows.length) ? enrollRows : 'none');
    });
  } catch (err) {
    console.error('Error checking latest admission:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
