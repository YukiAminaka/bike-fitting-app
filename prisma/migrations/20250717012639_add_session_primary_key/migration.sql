/*
  Warnings:

  - The required column `id` was added to the `Session` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/

-- Step 1: Add id column as optional with default value
ALTER TABLE "Session" ADD COLUMN "id" TEXT;

-- Step 2: Update existing rows with unique IDs
UPDATE "Session" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;

-- Step 3: Make the column NOT NULL and set as primary key
ALTER TABLE "Session" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "Session" ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");
