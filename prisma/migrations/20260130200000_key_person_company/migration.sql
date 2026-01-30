-- Add companyId to KeyPerson
ALTER TABLE "KeyPerson" ADD COLUMN "companyId" TEXT;

-- Migrate existing KeyPerson: set companyId based on their user's currentCompanyId
UPDATE "KeyPerson" kp
SET "companyId" = u."currentCompanyId"
FROM "User" u
WHERE kp."userId" = u."id" AND u."currentCompanyId" IS NOT NULL;

-- Create index for companyId
CREATE INDEX "KeyPerson_companyId_idx" ON "KeyPerson"("companyId");

-- Add foreign key constraint
ALTER TABLE "KeyPerson" ADD CONSTRAINT "KeyPerson_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
