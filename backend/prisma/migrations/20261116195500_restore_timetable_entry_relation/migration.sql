-- Restore the timetable relation omitted by the intentionally skipped
-- historical 20260911070535_add_admin_user_relation migration.
--
-- Existing entries predate the Timetable relation, so preserve them by
-- assigning them to an existing timetable for their school or creating one
-- default timetable per school before making the relation required.

ALTER TABLE "TimetableEntry"
  ADD COLUMN IF NOT EXISTS "timetableId" TEXT;

INSERT INTO "Timetable" (
  "id",
  "schoolId",
  "name",
  "description",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy-' || md5(random()::text || clock_timestamp()::text || schools."schoolId"::text),
  schools."schoolId",
  'Default Timetable',
  'Automatically created to retain timetable entries created before timetable grouping was introduced.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "schoolId"
  FROM "TimetableEntry"
  WHERE "timetableId" IS NULL
) AS schools
WHERE NOT EXISTS (
  SELECT 1
  FROM "Timetable" AS existing
  WHERE existing."schoolId" = schools."schoolId"
);

UPDATE "TimetableEntry" AS entry
SET "timetableId" = (
  SELECT timetable."id"
  FROM "Timetable" AS timetable
  WHERE timetable."schoolId" = entry."schoolId"
  ORDER BY timetable."createdAt" ASC, timetable."id" ASC
  LIMIT 1
)
WHERE entry."timetableId" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "TimetableEntry"
    WHERE "timetableId" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot enforce TimetableEntry.timetableId: one or more entries could not be assigned to a timetable.';
  END IF;
END $$;

ALTER TABLE "TimetableEntry"
  ALTER COLUMN "timetableId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TimetableEntry_timetableId_fkey'
      AND conrelid = '"TimetableEntry"'::regclass
  ) THEN
    ALTER TABLE "TimetableEntry"
      ADD CONSTRAINT "TimetableEntry_timetableId_fkey"
      FOREIGN KEY ("timetableId")
      REFERENCES "Timetable"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
