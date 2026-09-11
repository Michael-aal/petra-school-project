-- Restore the unique constraint required by FeeCategory @@unique([schoolId, name]).
DO $$
DECLARE
  duplicate_details TEXT;
BEGIN
  SELECT string_agg(
    format('schoolId=%s, name=%L, ids=%s', "schoolId", name, ids),
    E'\n'
  )
  INTO duplicate_details
  FROM (
    SELECT
      "schoolId",
      name,
      string_agg(id, ', ' ORDER BY id) AS ids
    FROM "FeeCategory"
    GROUP BY "schoolId", name
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_details IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot create FeeCategory school/name unique index; duplicates found:\n%', duplicate_details;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "FeeCategory_schoolId_name_key"
ON "FeeCategory"("schoolId", "name");
