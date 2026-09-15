CREATE TABLE IF NOT EXISTS "NuvoraKnowledge" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuvoraKnowledge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NuvoraKnowledge_enabled_category_idx"
  ON "NuvoraKnowledge"("enabled", "category");

CREATE INDEX IF NOT EXISTS "NuvoraKnowledge_updatedAt_idx"
  ON "NuvoraKnowledge"("updatedAt");
