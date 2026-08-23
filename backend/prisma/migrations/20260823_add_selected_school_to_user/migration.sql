ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "selectedSchoolId" INTEGER;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'User_selectedSchoolId_fkey'
	) THEN
		ALTER TABLE "User"
		ADD CONSTRAINT "User_selectedSchoolId_fkey"
		FOREIGN KEY ("selectedSchoolId") REFERENCES "School"("id")
		ON DELETE SET NULL ON UPDATE CASCADE;
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS "User_selectedSchoolId_idx"
ON "User"("selectedSchoolId");
