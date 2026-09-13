SELECT
  migration_name,
  finished_at,
  rolled_back_at,
  logs
FROM "_prisma_migrations"
WHERE migration_name = '20260911130000SELECT column_name
FROM information_schema.columns
WHERE table_name = 'Admin'
ORDER BY ordinal_position;

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'Payment'
  AND column_name = 'paymentMethodId';

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'Teacher'
  AND column_name IN ('name', 'userId', 'departmentId', 'designation', 'hireDate', 'isActive', 'createdAt', 'updatedAt');

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
ORDER BY table_name;_add_payment_paymentmethodid';