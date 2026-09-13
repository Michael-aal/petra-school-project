-- Protect tenant-owned detail and join tables that do not carry schoolId.
-- Each predicate follows the owning record(s), including WITH CHECK so a
-- caller cannot create a cross-school link by guessing foreign-key values.
DO $$
DECLARE
  tenant_expression text := 'NULLIF(current_setting(''app.current_school_id'', true), '''')::integer';
  rule record;
BEGIN
  FOR rule IN
    SELECT * FROM (VALUES
      ('SubjectClass', 'EXISTS (SELECT 1 FROM "Class" c WHERE c.id = "classId" AND c."schoolId" = %s) AND EXISTS (SELECT 1 FROM "Subject" s WHERE s.id = "subjectId" AND s."schoolId" = %s)'),
      ('StudentParent', 'EXISTS (SELECT 1 FROM "Student" s WHERE s.id = "studentId" AND s."schoolId" = %s) AND EXISTS (SELECT 1 FROM "Parent" p WHERE p.id = "parentId" AND p."schoolId" = %s)'),
      ('GuardianStudent', 'EXISTS (SELECT 1 FROM "Student" s WHERE s.id = "studentId" AND s."schoolId" = %s) AND EXISTS (SELECT 1 FROM "Guardian" g WHERE g.id = "guardianId" AND g."schoolId" = %s)'),
      ('StudentProfile', 'EXISTS (SELECT 1 FROM "Student" s WHERE s.id = "studentId" AND s."schoolId" = %s) AND ("schoolId" IS NULL OR "schoolId" = %s)'),
      ('StudentMedicalInfo', 'EXISTS (SELECT 1 FROM "Student" s WHERE s.id = "studentId" AND s."schoolId" = %s)'),
      ('StudentDocument', 'EXISTS (SELECT 1 FROM "Student" s WHERE s.id = "studentId" AND s."schoolId" = %s)'),
      ('Attendance', 'EXISTS (SELECT 1 FROM "Student" s WHERE s.id = "studentId" AND s."schoolId" = %s) AND EXISTS (SELECT 1 FROM "AcademicYear" y WHERE y.id = "academicYearId" AND y."schoolId" = %s) AND EXISTS (SELECT 1 FROM "Term" t WHERE t.id = "termId" AND t."schoolId" = %s)'),
      ('ExamAttempt', 'EXISTS (SELECT 1 FROM "Exam" e WHERE e.id = "examId" AND e."schoolId" = %s) AND EXISTS (SELECT 1 FROM "Student" s WHERE s.id = "studentId" AND s."schoolId" = %s)'),
      ('ExamResult', 'EXISTS (SELECT 1 FROM "Exam" e WHERE e.id = "examId" AND e."schoolId" = %s) AND EXISTS (SELECT 1 FROM "Student" s WHERE s.id = "studentId" AND s."schoolId" = %s)'),
      ('AssignmentSubmission', 'EXISTS (SELECT 1 FROM "Assignment" a WHERE a.id = "assignmentId" AND a."schoolId" = %s) AND EXISTS (SELECT 1 FROM "Student" s WHERE s.id = "studentId" AND s."schoolId" = %s)'),
      ('InvoiceItem', 'EXISTS (SELECT 1 FROM "Invoice" i WHERE i.id = "invoiceId" AND i."schoolId" = %s)'),
      ('PaymentLine', 'EXISTS (SELECT 1 FROM "Payment" p WHERE p.id = "paymentId" AND p."schoolId" = %s)'),
      ('InstallmentPayment', 'EXISTS (SELECT 1 FROM "InstallmentPlan" p WHERE p.id = "planId" AND p."schoolId" = %s)')
    ) AS policies(table_name, predicate)
  LOOP
    IF to_regclass(format('public.%I', rule.table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rule.table_name);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', rule.table_name);
      EXECUTE format('DROP POLICY IF EXISTS tenant_relation_isolation ON public.%I', rule.table_name);
      EXECUTE format(
        'CREATE POLICY tenant_relation_isolation ON public.%1$I USING (%2$s) WITH CHECK (%2$s)',
        rule.table_name,
        replace(rule.predicate, '%s', tenant_expression)
      );
    END IF;
  END LOOP;
END $$;
