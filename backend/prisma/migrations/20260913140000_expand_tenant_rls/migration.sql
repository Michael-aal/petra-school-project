-- Enforce tenant isolation for every table that owns a required schoolId.
-- The application sets app.current_school_id with SET LOCAL for each scoped
-- transaction; do not run the production app with a role that has BYPASSRLS.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'Campus', 'AcademicYear', 'Term', 'Department', 'Class', 'Section', 'Subject', 'Classroom',
    'Admin', 'Principal', 'VicePrincipal', 'Staff', 'Teacher', 'TeacherSubject', 'TeacherClass',
    'Student', 'Parent', 'Guardian', 'Admission', 'Enrollment', 'StudentAttendance', 'TeacherAttendance',
    'Assessment', 'Result', 'Exam', 'ClassMarkerIntegration', 'Assignment', 'GradeScale', 'Grade',
    'ReportCard', 'FeeCategory', 'FeeStructure', 'StudentFee', 'Invoice', 'Payment', 'Receipt',
    'Scholarship', 'Discount', 'Fine', 'InstallmentPlan', 'BookCategory', 'Book', 'BorrowRecord',
    'Vehicle', 'Route', 'Driver', 'StudentTransport', 'Announcement', 'Notification', 'Message',
    'EmailLog', 'Timetable', 'TimetableEntry', 'Hostel', 'Room', 'RoomAllocation',
    'PaymentIdempotency', 'Settings', 'AcademicSession', 'AcademicClass', 'AcademicSubject',
    'ExpenseCategory', 'Expense'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', table_name);
      EXECUTE format(
        'CREATE POLICY tenant_isolation ON public.%I USING ("schoolId" = NULLIF(current_setting(''app.current_school_id'', true), '''')::integer) WITH CHECK ("schoolId" = NULLIF(current_setting(''app.current_school_id'', true), '''')::integer)',
        table_name
      );
    END IF;
  END LOOP;
END $$;
