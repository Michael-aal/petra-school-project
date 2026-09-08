ALTER TABLE IF EXISTS "Attendance" DROP CONSTRAINT IF EXISTS "Attendance_studentId_fkey";
ALTER TABLE IF EXISTS "Attendance" DROP CONSTRAINT IF EXISTS "Attendance_teacherId_fkey";
ALTER TABLE IF EXISTS "Attendance"
  ADD CONSTRAINT "Attendance_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS "Attendance"
  ADD CONSTRAINT "Attendance_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
DO $$ BEGIN
  IF to_regclass('public."Attendance"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date");
  END IF;
END $$;

ALTER TABLE IF EXISTS "StudentAttendance" DROP CONSTRAINT IF EXISTS "StudentAttendance_studentId_fkey";
ALTER TABLE IF EXISTS "StudentAttendance"
  ADD CONSTRAINT "StudentAttendance_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE IF EXISTS "Grade" DROP CONSTRAINT IF EXISTS "Grade_schoolId_fkey";
ALTER TABLE IF EXISTS "Grade" DROP CONSTRAINT IF EXISTS "Grade_subjectId_fkey";
ALTER TABLE IF EXISTS "Grade"
  ADD CONSTRAINT "Grade_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS "Grade"
  ADD CONSTRAINT "Grade_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
DO $$ BEGIN
  IF to_regclass('public."Grade"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "Grade_schoolId_subjectId_idx" ON "Grade"("schoolId", "subjectId");
  END IF;
END $$;

ALTER TABLE IF EXISTS "StudentFee" DROP CONSTRAINT IF EXISTS "StudentFee_schoolId_fkey";
ALTER TABLE IF EXISTS "StudentFee" DROP CONSTRAINT IF EXISTS "StudentFee_studentId_fkey";
ALTER TABLE IF EXISTS "StudentFee"
  ADD CONSTRAINT "StudentFee_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS "StudentFee"
  ADD CONSTRAINT "StudentFee_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
DO $$ BEGIN
  IF to_regclass('public."StudentFee"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "StudentFee_schoolId_status_idx" ON "StudentFee"("schoolId", "status");
  END IF;
END $$;

ALTER TABLE IF EXISTS "Payment" DROP CONSTRAINT IF EXISTS "Payment_schoolId_fkey";
ALTER TABLE IF EXISTS "Payment" DROP CONSTRAINT IF EXISTS "Payment_studentId_fkey";
ALTER TABLE IF EXISTS "Payment"
  ADD CONSTRAINT "Payment_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE IF EXISTS "Payment"
  ADD CONSTRAINT "Payment_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
