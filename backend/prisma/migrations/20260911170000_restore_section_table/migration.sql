-- Restore the Section table before Enrollment references it.
-- The authoritative Prisma schema requires Section, while older migration history
-- can reach the Enrollment migration without creating the table. This migration
-- is additive and safe when Section already exists.

CREATE TABLE IF NOT EXISTS "Section" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "classId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "teacherId" TEXT,
  "capacity" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Section_classId_name_key"
  ON "Section"("classId", "name");

CREATE INDEX IF NOT EXISTS "Section_schoolId_classId_idx"
  ON "Section"("schoolId", "classId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Section_schoolId_fkey') THEN
    ALTER TABLE "Section"
      ADD CONSTRAINT "Section_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Section_classId_fkey') THEN
    ALTER TABLE "Section"
      ADD CONSTRAINT "Section_classId_fkey"
      FOREIGN KEY ("classId") REFERENCES "Class"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Section_teacherId_fkey') THEN
    ALTER TABLE "Section"
      ADD CONSTRAINT "Section_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id")
      ON DELETE NO ACTION ON UPDATE CASCADE;
  END IF;
END $$;
