-- Petra database workflow hardening.
-- Safe for existing data: new columns are nullable/defaulted and existing exam results
-- are backfilled into attempt records before the new relation is used.

ALTER TABLE "Admission" ADD COLUMN IF NOT EXISTS "admissionCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Admission_admissionCode_key" ON "Admission"("admissionCode");

-- Preserve admission codes previously stored in submissionData JSON.
UPDATE "Admission"
SET "admissionCode" = "submissionData"->>'admissionCode'
WHERE "admissionCode" IS NULL
  AND jsonb_typeof("submissionData") = 'object'
  AND COALESCE("submissionData"->>'admissionCode', '') <> '';

ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "teacherId" TEXT;
CREATE INDEX IF NOT EXISTS "Section_schoolId_teacherId_idx" ON "Section"("schoolId", "teacherId");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Section_teacherId_fkey') THEN
    ALTER TABLE "Section"
      ADD CONSTRAINT "Section_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ExamAttempt" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'in_progress',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "completionTimeSeconds" INTEGER,
  "score" DOUBLE PRECISION,
  "percentage" DOUBLE PRECISION,
  "externalResultId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExamAttempt_examId_studentId_attemptNumber_key" ON "ExamAttempt"("examId", "studentId", "attemptNumber");
CREATE INDEX IF NOT EXISTS "ExamAttempt_studentId_examId_idx" ON "ExamAttempt"("studentId", "examId");
CREATE INDEX IF NOT EXISTS "ExamAttempt_examId_status_idx" ON "ExamAttempt"("examId", "status");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExamAttempt_examId_fkey') THEN
    ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExamAttempt_studentId_fkey') THEN
    ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "ExamResult" ADD COLUMN IF NOT EXISTS "attemptId" TEXT;
ALTER TABLE "ExamResult" ADD COLUMN IF NOT EXISTS "percentage" DOUBLE PRECISION;
ALTER TABLE "ExamResult" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

-- Convert existing one-result-per-student records into attempt #1 records.
INSERT INTO "ExamAttempt" (
  "id", "examId", "studentId", "attemptNumber", "status", "startedAt", "completedAt", "score", "percentage", "createdAt", "updatedAt"
)
SELECT
  md5(er."id" || '-attempt-1'),
  er."examId",
  er."studentId",
  1,
  'completed',
  er."createdAt",
  er."updatedAt",
  er."marks",
  CASE WHEN e."totalMarks" > 0 THEN (er."marks" / e."totalMarks") * 100 ELSE NULL END,
  er."createdAt",
  er."updatedAt"
FROM "ExamResult" er
JOIN "Exam" e ON e."id" = er."examId"
WHERE er."attemptId" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "ExamAttempt" ea
    WHERE ea."examId" = er."examId" AND ea."studentId" = er."studentId" AND ea."attemptNumber" = 1
  );

UPDATE "ExamResult" er
SET "attemptId" = ea."id",
    "percentage" = COALESCE(er."percentage", ea."percentage"),
    "completedAt" = COALESCE(er."completedAt", ea."completedAt")
FROM "ExamAttempt" ea
WHERE er."attemptId" IS NULL
  AND ea."examId" = er."examId"
  AND ea."studentId" = er."studentId"
  AND ea."attemptNumber" = 1;

DROP INDEX IF EXISTS "ExamResult_examId_studentId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ExamResult_attemptId_key" ON "ExamResult"("attemptId");
CREATE INDEX IF NOT EXISTS "ExamResult_examId_studentId_idx" ON "ExamResult"("examId", "studentId");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExamResult_attemptId_fkey') THEN
    ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ClassMarkerIntegration" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "remoteExamId" TEXT,
  "remoteExamUrl" TEXT,
  "syncStatus" TEXT NOT NULL DEFAULT 'pending',
  "lastSyncedAt" TIMESTAMP(3),
  "lastWebhookAt" TIMESTAMP(3),
  "webhookEventRef" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassMarkerIntegration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClassMarkerIntegration_assessmentId_key" ON "ClassMarkerIntegration"("assessmentId");
CREATE UNIQUE INDEX IF NOT EXISTS "ClassMarkerIntegration_remoteExamId_key" ON "ClassMarkerIntegration"("remoteExamId");
CREATE INDEX IF NOT EXISTS "ClassMarkerIntegration_schoolId_syncStatus_idx" ON "ClassMarkerIntegration"("schoolId", "syncStatus");
CREATE INDEX IF NOT EXISTS "ClassMarkerIntegration_schoolId_lastSyncedAt_idx" ON "ClassMarkerIntegration"("schoolId", "lastSyncedAt");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClassMarkerIntegration_schoolId_fkey') THEN
    ALTER TABLE "ClassMarkerIntegration" ADD CONSTRAINT "ClassMarkerIntegration_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClassMarkerIntegration_assessmentId_fkey') THEN
    ALTER TABLE "ClassMarkerIntegration" ADD CONSTRAINT "ClassMarkerIntegration_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "ExpenseCategory" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "academicYearId" TEXT;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "termId" TEXT;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Expense_schoolId_fkey') THEN
    ALTER TABLE "Expense" ADD CONSTRAINT "Expense_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Expense_expenseCategoryId_fkey') THEN
    ALTER TABLE "Expense" ADD CONSTRAINT "Expense_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Expense_academicYearId_fkey') THEN
    ALTER TABLE "Expense" ADD CONSTRAINT "Expense_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Expense_termId_fkey') THEN
    ALTER TABLE "Expense" ADD CONSTRAINT "Expense_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Expense_createdById_fkey') THEN
    ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "Expense_schoolId_academicYearId_termId_idx" ON "Expense"("schoolId", "academicYearId", "termId");
CREATE INDEX IF NOT EXISTS "Expense_expenseCategoryId_occurredAt_idx" ON "Expense"("expenseCategoryId", "occurredAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseCategory_schoolId_name_key" ON "ExpenseCategory"("schoolId", "name");
