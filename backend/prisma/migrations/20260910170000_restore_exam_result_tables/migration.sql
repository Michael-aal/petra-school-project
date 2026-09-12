-- Restore the canonical Exam and ExamResult models missing from migration history.
-- This migration is additive and preserves the legacy Result table.

CREATE TABLE IF NOT EXISTS "Exam" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "teacherId" TEXT,
  "subjectId" TEXT,
  "assessmentId" TEXT,
  "title" TEXT NOT NULL,
  "examDate" TIMESTAMP(3) NOT NULL,
  "totalMarks" INTEGER NOT NULL DEFAULT 100,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Exam_assessmentId_key"
  ON "Exam"("assessmentId");

CREATE INDEX IF NOT EXISTS "Exam_schoolId_examDate_idx"
  ON "Exam"("schoolId", "examDate");

CREATE INDEX IF NOT EXISTS "Exam_schoolId_subjectId_examDate_idx"
  ON "Exam"("schoolId", "subjectId", "examDate");

CREATE TABLE IF NOT EXISTS "ExamResult" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "attemptId" TEXT,
  "marks" DOUBLE PRECISION NOT NULL,
  "grade" TEXT,
  "remarks" TEXT,
  "percentage" DOUBLE PRECISION,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExamResult_attemptId_key"
  ON "ExamResult"("attemptId");

CREATE INDEX IF NOT EXISTS "ExamResult_examId_studentId_idx"
  ON "ExamResult"("examId", "studentId");

-- Create one canonical Exam for each existing Assessment.
-- The legacy Result table is intentionally not copied or changed.
INSERT INTO "Exam" (
  "id",
  "schoolId",
  "teacherId",
  "subjectId",
  "assessmentId",
  "title",
  "examDate",
  "totalMarks",
  "description",
  "createdAt",
  "updatedAt"
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
  SELECT 1
  FROM "Exam" e
  WHERE e."assessmentId" = a."id"
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Exam_schoolId_fkey'
  ) THEN
    ALTER TABLE "Exam"
      ADD CONSTRAINT "Exam_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Exam_teacherId_fkey'
  ) THEN
    ALTER TABLE "Exam"
      ADD CONSTRAINT "Exam_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Exam_subjectId_fkey'
  ) THEN
    ALTER TABLE "Exam"
      ADD CONSTRAINT "Exam_subjectId_fkey"
      FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Exam_assessmentId_fkey'
  ) THEN
    ALTER TABLE "Exam"
      ADD CONSTRAINT "Exam_assessmentId_fkey"
      FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id")
      ON DELETE NO ACTION ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ExamAttempt_examId_fkey'
  ) THEN
    ALTER TABLE "ExamAttempt"
      ADD CONSTRAINT "ExamAttempt_examId_fkey"
      FOREIGN KEY ("examId") REFERENCES "Exam"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ExamAttempt_studentId_fkey'
  ) THEN
    ALTER TABLE "ExamAttempt"
      ADD CONSTRAINT "ExamAttempt_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "Student"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ExamResult_examId_fkey'
  ) THEN
    ALTER TABLE "ExamResult"
      ADD CONSTRAINT "ExamResult_examId_fkey"
      FOREIGN KEY ("examId") REFERENCES "Exam"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ExamResult_studentId_fkey'
  ) THEN
    ALTER TABLE "ExamResult"
      ADD CONSTRAINT "ExamResult_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "Student"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ExamResult_attemptId_fkey'
  ) THEN
    ALTER TABLE "ExamResult"
      ADD CONSTRAINT "ExamResult_attemptId_fkey"
      FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id")
      ON DELETE NO ACTION ON UPDATE CASCADE;
  END IF;
END $$;
