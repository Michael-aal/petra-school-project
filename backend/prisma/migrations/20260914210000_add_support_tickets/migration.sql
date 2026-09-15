CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER,
  "createdById" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'General',
  "priority" TEXT NOT NULL DEFAULT 'Medium',
  "status" TEXT NOT NULL DEFAULT 'Open',
  "assignedToId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTicketMessage" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isInternal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportTicket_schoolId_createdAt_idx" ON "SupportTicket"("schoolId", "createdAt");
CREATE INDEX "SupportTicket_createdById_createdAt_idx" ON "SupportTicket"("createdById", "createdAt");
CREATE INDEX "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority");
CREATE INDEX "SupportTicketMessage_ticketId_createdAt_idx" ON "SupportTicketMessage"("ticketId", "createdAt");

ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
