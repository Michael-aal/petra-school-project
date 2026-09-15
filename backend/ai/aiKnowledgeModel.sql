-- Applied through Prisma migration. Kept here as a migration reference only.
CREATE TABLE IF NOT EXISTS "AIKnowledge" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdById" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AIKnowledge_enabled_category_idx" ON "AIKnowledge" ("enabled", "category");
