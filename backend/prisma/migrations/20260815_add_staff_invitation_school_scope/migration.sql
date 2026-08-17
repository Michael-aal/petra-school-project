-- Scope staff invitations to the school that issued them.
ALTER TABLE "StaffInvitation" ADD COLUMN IF NOT EXISTS "schoolId" INTEGER;

-- Invitations created by the current application store the issuing user's id.
-- Older rows that cannot be attributed remain usable only with their existing
-- registration code and are not visible in a school's invitation management UI.
UPDATE "StaffInvitation" AS invitation
SET "schoolId" = issuer."schoolId"
FROM "User" AS issuer
WHERE invitation."schoolId" IS NULL
  AND invitation."generatedBy" = issuer."id"
  AND issuer."schoolId" IS NOT NULL;

DROP INDEX IF EXISTS "StaffInvitation_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS "StaffInvitation_schoolId_email_key"
  ON "StaffInvitation"("schoolId", "email");
CREATE INDEX IF NOT EXISTS "StaffInvitation_schoolId_generatedAt_idx"
  ON "StaffInvitation"("schoolId", "generatedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StaffInvitation_schoolId_fkey'
  ) THEN
    ALTER TABLE "StaffInvitation"
      ADD CONSTRAINT "StaffInvitation_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
