-- CreateTable: UserCompany (Many-to-Many relationship between User and Company)
CREATE TABLE "UserCompany" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCompany_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserCompany_userId_idx" ON "UserCompany"("userId");
CREATE INDEX "UserCompany_companyId_idx" ON "UserCompany"("companyId");
CREATE UNIQUE INDEX "UserCompany_userId_companyId_key" ON "UserCompany"("userId", "companyId");

-- AddForeignKey
ALTER TABLE "UserCompany" ADD CONSTRAINT "UserCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCompany" ADD CONSTRAINT "UserCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing User.companyId to UserCompany
INSERT INTO "UserCompany" ("id", "userId", "companyId", "createdAt")
SELECT gen_random_uuid()::text, "id", "companyId", NOW()
FROM "User"
WHERE "companyId" IS NOT NULL;

-- Add currentCompanyId to User (for navigation/session)
ALTER TABLE "User" ADD COLUMN "currentCompanyId" TEXT;

-- Set currentCompanyId from existing companyId
UPDATE "User" SET "currentCompanyId" = "companyId" WHERE "companyId" IS NOT NULL;

-- Add companyId to BigRock
ALTER TABLE "BigRock" ADD COLUMN "companyId" TEXT;

-- Add isConfirmed to BigRock
ALTER TABLE "BigRock" ADD COLUMN "isConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- Set BigRock.companyId based on User's companyId (use first company if user has multiple)
UPDATE "BigRock" br
SET "companyId" = u."companyId"
FROM "User" u
WHERE br."userId" = u."id" AND u."companyId" IS NOT NULL;

-- CreateIndex on BigRock
CREATE INDEX "BigRock_companyId_idx" ON "BigRock"("companyId");
CREATE INDEX "BigRock_userId_companyId_idx" ON "BigRock"("userId", "companyId");

-- AddForeignKey for BigRock.companyId
ALTER TABLE "BigRock" ADD CONSTRAINT "BigRock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop the old companyId column and index from User
DROP INDEX IF EXISTS "User_companyId_idx";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_companyId_fkey";
ALTER TABLE "User" DROP COLUMN "companyId";

-- Create index for currentCompanyId
CREATE INDEX "User_currentCompanyId_idx" ON "User"("currentCompanyId");

-- Remove KeyPerson-TAR relationship (drop the join table if exists)
DROP TABLE IF EXISTS "_KeyPersonToTAR";
