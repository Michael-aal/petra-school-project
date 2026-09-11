-- The Prisma Assessment relation targets Teacher, but the legacy database
-- constraint still targets User. Align the database with the Prisma schema.
ALTER TABLE "Assessment"
  DROP CONSTRAINT IF EXISTS "Assessment_teacherId_fkey";

ALTER TABLE "Assessment"
  ADD CONSTRAINT "Assessment_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Repair admissions whose existing exam reference was persisted while the
-- legacy constraint prevented the intended Assessment upsert.
INSERT INTO "Teacher" ("id", "name", "schoolId", "createdAt", "updatedAt")
SELECT DISTINCT
  'sys_teacher_' || a."schoolId",
  'Admission System',
  a."schoolId",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Admission" a
WHERE a."examReference" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "Assessment" assessment
    WHERE assessment."id" = a."examReference"
  )
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Assessment" (
  "id", "teacherId", "title", "subject", "className", "maxScore",
  "date", "description", "createdAt", "updatedAt", "schoolId"
)
SELECT DISTINCT ON (a."examReference")
  a."examReference",
  'sys_teacher_' || a."schoolId",
  'Admission Exam: ' || COALESCE(NULLIF(a."applicantName", ''), a."admissionCode", a."applicationCode", a."examReference"),
  'Admission',
  COALESCE(NULLIF(a."intendedClass", ''), 'Admission'),
  100,
  COALESCE(a."createdAt", CURRENT_TIMESTAMP),
  'Auto-created assessment for admission',
  COALESCE(a."createdAt", CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP,
  a."schoolId"
FROM "Admission" a
WHERE a."examReference" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "Assessment" assessment
    WHERE assessment."id" = a."examReference"
  )
ORDER BY a."examReference", a."createdAt" ASC
ON CONFLICT ("id") DO NOTHING;
