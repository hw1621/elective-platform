-- Step 1: Rename the current column
ALTER TABLE student RENAME COLUMN cid TO cid_old;

-- Step 2: Add new cid column as STRING
ALTER TABLE student ADD COLUMN cid TEXT;

-- Step 3: Copy and convert existing integer values to string
UPDATE student SET cid = CAST(cid_old AS TEXT);

-- Step 4: Drop old column
ALTER TABLE student DROP COLUMN cid_old;
