-- Add new columns to rule
ALTER TABLE "rule"
ADD COLUMN "min_ects" DECIMAL(4,2),
ADD COLUMN "max_ects" DECIMAL(4,2);

-- Copy existing values from module_group into rule
UPDATE "rule"
SET 
  "min_ects" = mg."min_ects",
  "max_ects" = mg."max_ects"
FROM "module_group" mg
WHERE "rule"."module_group_id" = mg."id";

-- Now drop the old columns from module_group
ALTER TABLE "module_group"
DROP COLUMN "min_ects",
DROP COLUMN "max_ects";
