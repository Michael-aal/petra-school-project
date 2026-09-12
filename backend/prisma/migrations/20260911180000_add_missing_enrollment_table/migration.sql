-- Prepare a minimal Prisma migration for the missing Enrollment table.
-- This file is intentionally create-only and is not applied to the database.

CREATE TABLE IF NOT EXISTS "Enrollment" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "studentId" TEXT NOT NULL,
  "classId" TEXT,
  "sectionId" TEXT,
  "academicYearId" TEXT,
  "termId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Enrollment_schoolId_status_idx"
  ON "Enrollment"("schoolId", "status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Enrollment_schoolId_fkey') THEN
    ALTER TABLE "Enrollment"
      ADD CONSTRAINT "Enrollment_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Enrollment_studentId_fkey') THEN
    ALTER TABLE "Enrollment"
      ADD CONSTRAINT "Enrollment_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "Student"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Enrollment_classId_fkey') THEN
    ALTER TABLE "Enrollment"
      ADD CONSTRAINT "Enrollment_classId_fkey"
      FOREIGN KEY ("classId") REFERENCES "Class"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Enrollment_sectionId_fkey') THEN
    ALTER TABLE "Enrollment"
      ADD CONSTRAINT "Enrollment_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "Section"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Enrollment_academicYearId_fkey') THEN
    ALTER TABLE "Enrollment"
      ADD CONSTRAINT "Enrollment_academicYearId_fkey"
      FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Enrollment_termId_fkey') THEN
    ALTER TABLE "Enrollment"
      ADD CONSTRAINT "Enrollment_termId_fkey"
      FOREIGN KEY ("termId") REFERENCES "Term"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
