-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastVisitedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ChatMessage" ADD COLUMN "messageType" TEXT NOT NULL DEFAULT 'ASSISTANT';

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_isRead_idx" ON "ChatMessage"("conversationId", "isRead");
