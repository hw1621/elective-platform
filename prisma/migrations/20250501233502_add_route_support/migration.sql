-- Step 1: Create the route table
CREATE TABLE "route" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "program_id" INTEGER NOT NULL,
    CONSTRAINT "route_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add route_id column as NULLABLE first
ALTER TABLE "rule" ADD COLUMN "route_id" INTEGER;

-- Step 3: Insert a default route (you can customize the name and program_id if needed)
INSERT INTO "route" ("name", "program_id")
SELECT 'Research Project Route', id FROM "program" LIMIT 1;

-- Step 4: Assign default route_id to existing rules
UPDATE "rule" SET "route_id" = 1 WHERE "route_id" IS NULL;

-- Step 5: Make route_id NOT NULL
ALTER TABLE "rule" ALTER COLUMN "route_id" SET NOT NULL;

-- Step 6: Add foreign key constraints
ALTER TABLE "rule"
ADD CONSTRAINT "rule_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "route"
ADD CONSTRAINT "route_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
