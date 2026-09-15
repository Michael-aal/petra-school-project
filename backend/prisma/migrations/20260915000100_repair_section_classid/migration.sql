-- Repair the Section -> Class relation used by the current Prisma schema.
-- Some existing databases have Section without classId, which causes any
-- Prisma query that traverses Student -> Enrollment -> Section to fail.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Section') THEN
    ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "classId" TEXT;

    -- Recover the relation where an existing section name matches a class
    -- in the same school. Do not invent a class assignment for unmatched rows.
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Class') THEN
      UPDATE "Section" s
      SET "classId" = c."id"
      FROM "Class" c
      WHERE s."classId" IS NULL
        AND c."schoolId" = s."schoolId"
        AND LOWER(TRIM(c."name")) = LOWER(TRIM(s."name"));
    END IF;

    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Class')
       AND NOT EXISTS (
         SELECT 1 FROM pg_constraint WHERE conname = 'Section_classId_fkey'
       ) THEN
      ALTER TABLE "Section"
        ADD CONSTRAINT "Section_classId_fkey"
        FOREIGN KEY ("classId") REFERENCES "Class"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    CREATE INDEX IF NOT EXISTS "Section_schoolId_classId_idx"
      ON "Section"("schoolId", "classId");

    -- Match the Prisma schema's required field when all existing rows have
    -- been safely recovered. Otherwise keep the column nullable so the
    -- repair never invents incorrect class assignments or destroys data.
    IF NOT EXISTS (SELECT 1 FROM "Section" WHERE "classId" IS NULL) THEN
      ALTER TABLE "Section" ALTER COLUMN "classId" SET NOT NULL;
    END IF;
  END IF;
END $$;
