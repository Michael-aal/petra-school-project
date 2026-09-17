-- Restore the canonical teacher/staff attendance table when historical migration
-- snapshots were skipped or marked applied without creating the table.
-- This migration is additive and safe for databases where the table already exists.

CREATE TABLE IF NOT EXISTS "TeacherAttendance" (
    "id" TEXT NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'present',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeacherAttendance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeacherAttendance_schoolId_attendanceDate_idx"
    ON "TeacherAttendance"("schoolId", "attendanceDate");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TeacherAttendance_schoolId_fkey'
      AND conrelid = 'public."TeacherAttendance"'::regclass
  ) THEN
    ALTER TABLE "TeacherAttendance"
      ADD CONSTRAINT "TeacherAttendance_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TeacherAttendance_teacherId_fkey'
      AND conrelid = 'public."TeacherAttendance"'::regclass
  ) THEN
    ALTER TABLE "TeacherAttendance"
      ADD CONSTRAINT "TeacherAttendance_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
