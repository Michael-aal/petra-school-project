CREATE TABLE IF NOT EXISTS "ClassMarkerIntegration" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "remoteExamId" TEXT,
  "remoteExamUrl" TEXT,
  "syncStatus" TEXT NOT NULL DEFAULT 'pending',
  "lastSyncedAt" TIMESTAMP(3),
  "lastWebhookAt" TIMESTAMP(3),
  "webhookEventRef" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassMarkerIntegration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClassMarkerIntegration_assessmentId_key" ON "ClassMarkerIntegration"("assessmentId");
CREATE UNIQUE INDEX IF NOT EXISTS "ClassMarkerIntegration_remoteExamId_key" ON "ClassMarkerIntegration"("remoteExamId");
CREATE INDEX IF NOT EXISTS "ClassMarkerIntegration_schoolId_syncStatus_idx" ON "ClassMarkerIntegration"("schoolId", "syncStatus");
CREATE INDEX IF NOT EXISTS "ClassMarkerIntegration_schoolId_lastSyncedAt_idx" ON "ClassMarkerIntegration"("schoolId", "lastSyncedAt");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'School') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClassMarkerIntegration_schoolId_fkey') THEN
    ALTER TABLE "ClassMarkerIntegration" ADD CONSTRAINT "ClassMarkerIntegration_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Assessment') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClassMarkerIntegration_assessmentId_fkey') THEN
    ALTER TABLE "ClassMarkerIntegration" ADD CONSTRAINT "ClassMarkerIntegration_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
