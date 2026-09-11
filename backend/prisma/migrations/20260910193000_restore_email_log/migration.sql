-- Restore the EmailLog table required by the existing email service.
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "dedupeKey" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailLog_dedupeKey_key" ON "EmailLog"("dedupeKey");
CREATE INDEX "EmailLog_schoolId_status_createdAt_idx" ON "EmailLog"("schoolId", "status", "createdAt");
CREATE INDEX "EmailLog_schoolId_recipient_idx" ON "EmailLog"("schoolId", "recipient");

ALTER TABLE "EmailLog"
ADD CONSTRAINT "EmailLog_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
