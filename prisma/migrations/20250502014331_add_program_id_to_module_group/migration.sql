-- Step 1: Add column as nullable first
ALTER TABLE "module_group" ADD COLUMN "program_id" INTEGER;

-- Step 2: Fill in existing rows (默认都设为 program_id = 1，可自定义)
UPDATE "module_group" SET "program_id" = 1 WHERE "program_id" IS NULL;

-- Step 3: Set NOT NULL constraint
ALTER TABLE "module_group" ALTER COLUMN "program_id" SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "module_group"
ADD CONSTRAINT "module_group_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
