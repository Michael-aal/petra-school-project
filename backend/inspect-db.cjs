require("dotenv").config();
const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  const queries = {
    admin: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Admin'
      ORDER BY ordinal_position;
    `,

    payment: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Payment'
        AND column_name = 'paymentMethodId';
    `,

    teacher: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Teacher'
        AND column_name IN (
          'name',
          'userId',
          'departmentId',
          'designation',
          'hireDate',
          'isActive',
          'createdAt',
          'updatedAt'
        )
      ORDER BY ordinal_position;
    `,

    tables: `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'Session',
          'RefreshToken',
          'Campus',
          'Department',
          'Section',
          'Classroom',
          'VicePrincipal',
          'StudentDocument',
          'Enrollment',
          'TeacherAttendance',
          'Exam',
          'ExamResult',
          'AssessmentItem',
          'Assignment',
          'AssignmentSubmission',
          'GradeScale',
          'Grade',
          'ReportCard',
          'PaymentMethod',
          'Scholarship'
        )
      ORDER BY table_name;
    `
  };

  for (const [name, sql] of Object.entries(queries)) {
    const result = await client.query(sql);

    console.log(`\n========== ${name.toUpperCase()} ==========`);
    console.table(result.rows);
  }

  await client.end();
}

main().catch(async (error) => {
  console.error("\nDATABASE INSPECTION FAILED:");
  console.error(error);
  await client.end().catch(() => {});
  process.exit(1);
});