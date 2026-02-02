-- Migration: unify_big_rock_status
-- This migration unifies the Big Rock status system
-- Works around PostgreSQL enum limitations by using text conversion

-- Step 1: Create new enum type with all values
CREATE TYPE "BigRockStatus_new" AS ENUM ('CREADO', 'CONFIRMADO', 'FEEDBACK_RECIBIDO', 'EN_PROGRESO', 'FINALIZADO');

-- Step 2: Add a temporary text column to store status
ALTER TABLE "BigRock" ADD COLUMN "status_temp" TEXT;

-- Step 3: Copy and transform data to temp column
UPDATE "BigRock"
SET "status_temp" = CASE
    WHEN status = 'PLANIFICADO' AND "isConfirmed" = false THEN 'CREADO'
    WHEN status = 'PLANIFICADO' AND "isConfirmed" = true THEN 'CONFIRMADO'
    ELSE status::TEXT
END;

-- Step 4: Drop the old status column
ALTER TABLE "BigRock" DROP COLUMN "status";

-- Step 5: Add new status column with the new enum type
ALTER TABLE "BigRock" ADD COLUMN "status" "BigRockStatus_new" NOT NULL DEFAULT 'CREADO';

-- Step 6: Copy data from temp column to new status column
UPDATE "BigRock" SET "status" = "status_temp"::"BigRockStatus_new";

-- Step 7: Drop temporary column
ALTER TABLE "BigRock" DROP COLUMN "status_temp";

-- Step 8: Drop old enum type and rename new one
DROP TYPE "BigRockStatus";
ALTER TYPE "BigRockStatus_new" RENAME TO "BigRockStatus";

-- Step 9: Remove the isConfirmed column
ALTER TABLE "BigRock" DROP COLUMN "isConfirmed";
