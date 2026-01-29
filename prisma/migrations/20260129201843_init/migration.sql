-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'SUPERVISOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "FaseCategory" AS ENUM ('FOCUS', 'ATENCION', 'SISTEMAS', 'ENERGIA');

-- CreateEnum
CREATE TYPE "BigRockStatus" AS ENUM ('PLANIFICADO', 'EN_PROGRESO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "TarStatus" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('SEMANAL', 'DIARIA');

-- CreateEnum
CREATE TYPE "MedalType" AS ENUM ('CONSTANCIA', 'CLARIDAD', 'EJECUCION', 'MEJORA_CONTINUA');

-- CreateEnum
CREATE TYPE "MedalLevel" AS ENUM ('BRONCE', 'PLATA', 'ORO', 'DIAMANTE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "supervisorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BigRock" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "FaseCategory" NOT NULL,
    "indicator" TEXT NOT NULL,
    "numTars" INTEGER NOT NULL,
    "status" "BigRockStatus" NOT NULL DEFAULT 'PLANIFICADO',
    "month" TEXT NOT NULL,
    "aiScore" INTEGER,
    "aiObservations" TEXT,
    "aiRecommendations" TEXT,
    "aiRisks" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BigRock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TAR" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TarStatus" NOT NULL DEFAULT 'PENDIENTE',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "bigRockId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TAR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ActivityType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "week" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "tarId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyPerson" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT,
    "contact" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyMeeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "outcome" TEXT,
    "bigRockId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gamification" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "bigRocksCreated" INTEGER NOT NULL DEFAULT 0,
    "tarsCompleted" INTEGER NOT NULL DEFAULT 0,
    "weeklyReviews" INTEGER NOT NULL DEFAULT 0,
    "dailyLogs" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gamification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medal" (
    "id" TEXT NOT NULL,
    "type" "MedalType" NOT NULL,
    "level" "MedalLevel" NOT NULL,
    "gamificationId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_KeyPersonToTAR" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KeyPersonToTAR_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_supervisorId_idx" ON "User"("supervisorId");

-- CreateIndex
CREATE INDEX "BigRock_userId_idx" ON "BigRock"("userId");

-- CreateIndex
CREATE INDEX "BigRock_month_idx" ON "BigRock"("month");

-- CreateIndex
CREATE INDEX "BigRock_category_idx" ON "BigRock"("category");

-- CreateIndex
CREATE INDEX "TAR_bigRockId_idx" ON "TAR"("bigRockId");

-- CreateIndex
CREATE INDEX "Activity_tarId_idx" ON "Activity"("tarId");

-- CreateIndex
CREATE INDEX "Activity_date_idx" ON "Activity"("date");

-- CreateIndex
CREATE INDEX "Activity_week_idx" ON "Activity"("week");

-- CreateIndex
CREATE INDEX "KeyPerson_userId_idx" ON "KeyPerson"("userId");

-- CreateIndex
CREATE INDEX "KeyMeeting_bigRockId_idx" ON "KeyMeeting"("bigRockId");

-- CreateIndex
CREATE INDEX "KeyMeeting_date_idx" ON "KeyMeeting"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Gamification_userId_key" ON "Gamification"("userId");

-- CreateIndex
CREATE INDEX "Gamification_userId_idx" ON "Gamification"("userId");

-- CreateIndex
CREATE INDEX "Gamification_points_idx" ON "Gamification"("points");

-- CreateIndex
CREATE INDEX "Medal_gamificationId_idx" ON "Medal"("gamificationId");

-- CreateIndex
CREATE INDEX "Medal_type_idx" ON "Medal"("type");

-- CreateIndex
CREATE INDEX "Medal_level_idx" ON "Medal"("level");

-- CreateIndex
CREATE INDEX "_KeyPersonToTAR_B_index" ON "_KeyPersonToTAR"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BigRock" ADD CONSTRAINT "BigRock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TAR" ADD CONSTRAINT "TAR_bigRockId_fkey" FOREIGN KEY ("bigRockId") REFERENCES "BigRock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_tarId_fkey" FOREIGN KEY ("tarId") REFERENCES "TAR"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyPerson" ADD CONSTRAINT "KeyPerson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyMeeting" ADD CONSTRAINT "KeyMeeting_bigRockId_fkey" FOREIGN KEY ("bigRockId") REFERENCES "BigRock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gamification" ADD CONSTRAINT "Gamification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medal" ADD CONSTRAINT "Medal_gamificationId_fkey" FOREIGN KEY ("gamificationId") REFERENCES "Gamification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KeyPersonToTAR" ADD CONSTRAINT "_KeyPersonToTAR_A_fkey" FOREIGN KEY ("A") REFERENCES "KeyPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KeyPersonToTAR" ADD CONSTRAINT "_KeyPersonToTAR_B_fkey" FOREIGN KEY ("B") REFERENCES "TAR"("id") ON DELETE CASCADE ON UPDATE CASCADE;
