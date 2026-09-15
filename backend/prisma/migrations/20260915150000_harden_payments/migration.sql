ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_idempotencyKey_key" ON "Payment" ("idempotencyKey");

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_idempotencyKey_key" ON "Transaction" ("idempotencyKey");

ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "actionType" TEXT;

CREATE TABLE IF NOT EXISTS "WebhookLog" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'processing',
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "WebhookLog_provider_requestId_key" ON "WebhookLog" ("provider", "requestId");
CREATE INDEX IF NOT EXISTS "WebhookLog_provider_receivedAt_idx" ON "WebhookLog" ("provider", "receivedAt");
