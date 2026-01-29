-- CreateTable
CREATE TABLE "OpenMonth" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpenMonth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpenMonth_userId_idx" ON "OpenMonth"("userId");

-- CreateIndex
CREATE INDEX "OpenMonth_month_idx" ON "OpenMonth"("month");

-- CreateIndex
CREATE UNIQUE INDEX "OpenMonth_month_userId_key" ON "OpenMonth"("month", "userId");

-- AddForeignKey
ALTER TABLE "OpenMonth" ADD CONSTRAINT "OpenMonth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
