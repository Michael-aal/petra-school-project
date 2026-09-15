-- Developer-managed knowledge for Ask Nuvora.
-- Kept outside Prisma's model graph intentionally: Nuvora uses parameterized
-- SQL for this table so adding knowledge does not alter existing relations.

CREATE TABLE IF NOT EXISTS "NuvoraKnowledge" (
  "id" TEXT PRIMARY KEY,
  "title" VARCHAR(160) NOT NULL,
  "content" TEXT NOT NULL,
  "category" VARCHAR(80) NOT NULL DEFAULT 'general',
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "NuvoraKnowledge_enabled_updatedAt_idx"
  ON "NuvoraKnowledge" ("enabled", "updatedAt");

CREATE INDEX IF NOT EXISTS "NuvoraKnowledge_category_idx"
  ON "NuvoraKnowledge" ("category");

CREATE INDEX IF NOT EXISTS "NuvoraKnowledge_createdById_idx"
  ON "NuvoraKnowledge" ("createdById");
