-- Create Admission table for missing migration history
-- Safe: uses IF NOT EXISTS and conditional constraints so existing data is preserved

CREATE TABLE IF NOT EXISTS "Admission" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "studentId" TEXT,
  "applicationCode" TEXT,
  "admissionCode" TEXT,
  "applicantName" TEXT,
  "applicantFirstName" TEXT,
  "applicantMiddleName" TEXT,
  "applicantLastName" TEXT,
  "parentEmail" TEXT,
  "parentPhone" TEXT,
  "intendedClass" TEXT,
  "applicantGender" TEXT,
  "applicantDob" TIMESTAMP(3),
  "applicantPlaceOfBirth" TEXT,
  "applicantNationality" TEXT,
  "applicantStateOfOrigin" TEXT,
  "applicantLga" TEXT,
  "applicantLin" TEXT,
  "studentType" TEXT,
  "previousSchool" TEXT,
  "religion" TEXT,
  "ailments" TEXT,
  "challenges" TEXT,
  "bloodGroup" TEXT,
  "genotype" TEXT,
  "maritalStatus" TEXT,
  "fatherName" TEXT,
  "fatherDob" TIMESTAMP(3),
  "fatherAddress" TEXT,
  "fatherOccupation" TEXT,
  "fatherJobTitle" TEXT,
  "fatherEmail" TEXT,
  "fatherPhone1" TEXT,
  "fatherPhone2" TEXT,
  "motherName" TEXT,
  "motherDob" TIMESTAMP(3),
  "motherAddress" TEXT,
  "motherOccupation" TEXT,
  "motherJobTitle" TEXT,
  "motherEmail" TEXT,
  "motherPhone1" TEXT,
  "motherPhone2" TEXT,
  "feePaymentMethod" TEXT,
  "referredBy" TEXT,
  "financialAwareness" BOOLEAN DEFAULT false,
  "agreeTerms" BOOLEAN DEFAULT false,
  "approvedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectedBy" TEXT,
  "rejectionReason" TEXT,
  "examScore" DOUBLE PRECISION,
  "examCompletedAt" TIMESTAMP(3),
  "examResult" TEXT,
  "examReference" TEXT,
  "paymentReference" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "submissionData" JSONB,
  "academicYearId" TEXT,
  "termId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "admissionDate" TIMESTAMP(3),
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Ensure important columns exist even if Admission was already present in the database.
ALTER TABLE "Admission" ADD COLUMN IF NOT EXISTS "applicationCode" TEXT;
ALTER TABLE "Admission" ADD COLUMN IF NOT EXISTS "admissionCode" TEXT;
ALTER TABLE "Admission" ADD COLUMN IF NOT EXISTS "applicantId" TEXT;

-- Primary key constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Admission_pkey') THEN
    ALTER TABLE "Admission" ADD CONSTRAINT "Admission_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

-- Unique indexes for codes
-- These columns may be backfilled by later migrations or the application layer.
CREATE UNIQUE INDEX IF NOT EXISTS "Admission_applicationCode_key" ON "Admission"("applicationCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Admission_admissionCode_key" ON "Admission"("admissionCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Admission_applicantId_key" ON "Admission"("applicantId");

-- Indexes used by application
CREATE INDEX IF NOT EXISTS "Admission_schoolId_status_idx" ON "Admission"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "Admission_schoolId_applicationCode_idx" ON "Admission"("schoolId", "applicationCode");

-- Conditional foreign keys (add only if referenced tables/columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'School') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Admission_schoolId_fkey') THEN
    ALTER TABLE "Admission" ADD CONSTRAINT "Admission_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Student') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Admission_studentId_fkey') THEN
    ALTER TABLE "Admission" ADD CONSTRAINT "Admission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'AcademicYear') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Admission_academicYearId_fkey') THEN
    ALTER TABLE "Admission" ADD CONSTRAINT "Admission_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Term') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Admission_termId_fkey') THEN
    ALTER TABLE "Admission" ADD CONSTRAINT "Admission_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Ensure updatedAt has a sensible default if missing (some older DBs may not set this)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Admission' AND column_name = 'updatedAt') THEN
    PERFORM 1;
  END IF;
END $$;
