-- Step 1: Drop existing foreign key & unique constraint
ALTER TABLE "module_group_mapping" DROP CONSTRAINT "module_group_mapping_module_instance_id_fkey";
DROP INDEX "module_group_mapping_module_group_id_module_instance_id_key";

-- Step 2: Add new column (module_id) as NULLABLE FIRST
ALTER TABLE "module_group_mapping" ADD COLUMN "module_id" INTEGER;

-- Step 3: Populate new column with matching module_instance.module_id
UPDATE "module_group_mapping" AS mgm
SET "module_id" = mi."module_id"
FROM "module_instance" AS mi
WHERE mgm."module_instance_id" = mi."id";

-- Step 4: Make the column NOT NULL
ALTER TABLE "module_group_mapping" ALTER COLUMN "module_id" SET NOT NULL;

-- Step 5: Drop old column
ALTER TABLE "module_group_mapping" DROP COLUMN "module_instance_id";

-- Step 6: Add unique constraint
CREATE UNIQUE INDEX "module_group_mapping_module_group_id_module_id_key" ON "module_group_mapping"("module_group_id", "module_id");

-- Step 7: Add foreign key to module
ALTER TABLE "module_group_mapping"
ADD CONSTRAINT "module_group_mapping_module_id_fkey"
FOREIGN KEY ("module_id") REFERENCES "module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
