-- Final workflow hardening. Existing data is preserved; new fields are nullable/defaulted.
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "assessmentId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Exam_assessmentId_key" ON "Exam"("assessmentId");
CREATE INDEX IF NOT EXISTS "Exam_schoolId_subjectId_examDate_idx" ON "Exam"("schoolId", "subjectId", "examDate");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Exam_assessmentId_fkey') THEN
    ALTER TABLE "Exam" ADD CONSTRAINT "Exam_assessmentId_fkey"
      FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "EmailLog" ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT;
ALTER TABLE "EmailLog" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EmailLog" ADD COLUMN IF NOT EXISTS "lastAttemptAt" TIMESTAMP(3);
ALTER TABLE "EmailLog" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "EmailLog_dedupeKey_key" ON "EmailLog"("dedupeKey");
CREATE INDEX IF NOT EXISTS "EmailLog_schoolId_status_createdAt_idx" ON "EmailLog"("schoolId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "EmailLog_schoolId_recipient_idx" ON "EmailLog"("schoolId", "recipient");

CREATE INDEX IF NOT EXISTS "StudentAttendance_schoolId_studentId_attendanceDate_idx"
  ON "StudentAttendance"("schoolId", "studentId", "attendanceDate");


-- Migrate legacy student attendance rows into the canonical StudentAttendance model.
-- The legacy Attendance table is intentionally retained for backward compatibility/data safety.
INSERT INTO "StudentAttendance" (
  "id", "schoolId", "studentId", "classId", "attendanceDate", "status", "markedById", "createdAt", "updatedAt"
)
SELECT
  md5(a."id" || '-student-attendance'),
  s."schoolId",
  a."studentId",
  c."id",
  a."date",
  lower(a."status"),
  a."teacherId",
  a."createdAt",
  a."updatedAt"
FROM "Attendance" a
JOIN "Student" s ON s."id" = a."studentId"
LEFT JOIN "Class" c ON c."schoolId" = s."schoolId" AND lower(c."name") = lower(a."className")
WHERE NOT EXISTS (
  SELECT 1 FROM "StudentAttendance" sa WHERE sa."id" = md5(a."id" || '-student-attendance')
);

-- Create canonical Exam records for existing Assessments that do not yet have one.
INSERT INTO "Exam" (
  "id", "schoolId", "teacherId", "subjectId", "assessmentId", "title", "examDate", "totalMarks", "description", "createdAt", "updatedAt"
)
SELECT
  md5(a."id" || '-exam'),
  a."schoolId",
  a."teacherId",
  a."subjectId",
  a."id",
  a."title",
  a."date",
  a."maxScore",
  a."description",
  a."createdAt",
  a."updatedAt"
FROM "Assessment" a
WHERE NOT EXISTS (
  SELECT 1 FROM "Exam" e WHERE e."assessmentId" = a."id"
);
