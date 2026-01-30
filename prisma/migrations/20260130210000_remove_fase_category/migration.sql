-- Remove category column from BigRock table
ALTER TABLE "BigRock" DROP COLUMN "category";

-- Drop the FaseCategory enum
DROP TYPE "FaseCategory";
