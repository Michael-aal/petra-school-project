-- Add staff invitation workflow columns and table

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "staffRole" TEXT,
  ADD COLUMN IF NOT EXISTS "staffDepartment" TEXT,
  ADD COLUMN IF NOT EXISTS "staffClassAssigned" TEXT,
  ADD COLUMN IF NOT EXISTS "staffSubjectsAssigned" TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS "StaffInvitation" (
    "id" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "assignedClass" TEXT,
    "assignedSubjects" TEXT[] NOT NULL DEFAULT '{}',
    "employmentStatus" TEXT NOT NULL DEFAULT 'active',
    "registrationCode" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unused',
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "staffUserId" TEXT,

    CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StaffInvitation_email_key" ON "StaffInvitation"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffInvitation_registrationCode_key" ON "StaffInvitation"("registrationCode");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffInvitation_staffUserId_key" ON "StaffInvitation"("staffUserId");

ALTER TABLE "StaffInvitation"
  ADD CONSTRAINT "StaffInvitation_staffUserId_fkey"
  FOREIGN KEY ("staffUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
