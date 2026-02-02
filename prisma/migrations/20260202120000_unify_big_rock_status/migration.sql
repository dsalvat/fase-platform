-- Migration: unify_big_rock_status
-- This migration unifies the Big Rock status system by:
-- 1. Adding new enum values to BigRockStatus
-- 2. Transforming existing data based on the isConfirmed field
-- 3. Removing the isConfirmed column

-- Step 1: Add new enum values to BigRockStatus
ALTER TYPE "BigRockStatus" ADD VALUE 'CREADO';
ALTER TYPE "BigRockStatus" ADD VALUE 'CONFIRMADO';
ALTER TYPE "BigRockStatus" ADD VALUE 'FEEDBACK_RECIBIDO';

-- Step 2: Transform existing data
-- Convert PLANIFICADO + isConfirmed=false → CREADO
-- Convert PLANIFICADO + isConfirmed=true → CONFIRMADO
-- Keep EN_PROGRESO and FINALIZADO as is
UPDATE "BigRock"
SET status = 'CREADO'
WHERE status = 'PLANIFICADO' AND "isConfirmed" = false;

UPDATE "BigRock"
SET status = 'CONFIRMADO'
WHERE status = 'PLANIFICADO' AND "isConfirmed" = true;

-- Step 3: Remove the isConfirmed column
ALTER TABLE "BigRock" DROP COLUMN "isConfirmed";

-- Note: The PLANIFICADO value remains in the enum but is no longer used.
-- New Big Rocks will use CREADO as the initial status.
