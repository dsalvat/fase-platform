-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ES', 'CA', 'EN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'ES';
