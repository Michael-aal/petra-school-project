-- Repair the Section -> Teacher relation expected by the current Prisma schema.
-- Some existing databases have Section without teacherId, which causes Prisma
-- to fail when Student -> Enrollment -> Section is loaded.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Section') THEN
    ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "teacherId" TEXT;

    -- Recreate the schema relation only when the Teacher table exists.
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Teacher')
       AND NOT EXISTS (
         SELECT 1 FROM pg_constraint WHERE conname = 'Section_teacherId_fkey'
       ) THEN
      ALTER TABLE "Section"
        ADD CONSTRAINT "Section_teacherId_fkey"
        FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id")
        ON DELETE NO ACTION ON UPDATE CASCADE;
    END IF;

    CREATE INDEX IF NOT EXISTS "Section_teacherId_idx"
      ON "Section"("teacherId");
  END IF;
END $$;
