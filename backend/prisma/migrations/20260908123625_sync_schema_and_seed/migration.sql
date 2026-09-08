-- Keep the School table aligned with prisma/schema.prisma before creating
-- the composite uniqueness constraint used by the Prisma client.
ALTER TABLE "School"
  ADD COLUMN IF NOT EXISTS "country" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "School_name_country_key"
  ON "School"("name", "country");

CREATE TABLE IF NOT EXISTS "AcademicYear" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Term" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AcademicYear_schoolId_name_key"
  ON "AcademicYear"("schoolId", "name");
CREATE INDEX IF NOT EXISTS "AcademicYear_schoolId_isActive_idx"
  ON "AcademicYear"("schoolId", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "Term_academicYearId_name_key"
  ON "Term"("academicYearId", "name");
CREATE INDEX IF NOT EXISTS "Term_schoolId_isActive_idx"
  ON "Term"("schoolId", "isActive");

DO $$ BEGIN
  ALTER TABLE "AcademicYear"
    ADD CONSTRAINT "AcademicYear_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Term"
    ADD CONSTRAINT "Term_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Term"
    ADD CONSTRAINT "Term_academicYearId_fkey"
    FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
