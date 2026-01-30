-- CreateEnum
CREATE TYPE "FeedbackTargetType" AS ENUM ('BIG_ROCK', 'MONTH_PLANNING');

-- AlterTable
ALTER TABLE "OpenMonth" ADD COLUMN     "isPlanningConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "planningConfirmedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "targetType" "FeedbackTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "rating" INTEGER,
    "supervisorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_supervisorId_idx" ON "Feedback"("supervisorId");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_targetType_targetId_idx" ON "Feedback"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_targetType_targetId_key" ON "Feedback"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
