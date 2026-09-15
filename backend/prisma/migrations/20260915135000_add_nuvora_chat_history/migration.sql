CREATE TABLE "NuvoraConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" INTEGER,
    "title" TEXT NOT NULL DEFAULT 'New chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NuvoraConversation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "NuvoraConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NuvoraConversation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "NuvoraMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NuvoraMessage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "NuvoraMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "NuvoraConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NuvoraConversation_userId_updatedAt_idx" ON "NuvoraConversation"("userId", "updatedAt");
CREATE INDEX "NuvoraConversation_schoolId_idx" ON "NuvoraConversation"("schoolId");
CREATE INDEX "NuvoraMessage_conversationId_createdAt_idx" ON "NuvoraMessage"("conversationId", "createdAt");
