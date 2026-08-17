-- Migration: drop NOT NULL constraint on Admission.studentId
-- Purpose: Allow Admission rows to be created without an associated Student.
-- IMPORTANT: Review before applying. Do NOT run this on production without backup.

BEGIN;

-- Make Admission.studentId nullable so an applicant can exist without a Student record.
ALTER TABLE "Admission" ALTER COLUMN "studentId" DROP NOT NULL;

COMMIT;
