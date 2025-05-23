/*
  Warnings:

  - The values [SIGNIN] on the enum `RegisterLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RegisterLevel_new" AS ENUM ('SITIN', 'CREDIT');
ALTER TABLE "module_selection_result" ALTER COLUMN "type" TYPE "RegisterLevel_new" USING ("type"::text::"RegisterLevel_new");
ALTER TYPE "RegisterLevel" RENAME TO "RegisterLevel_old";
ALTER TYPE "RegisterLevel_new" RENAME TO "RegisterLevel";
DROP TYPE "RegisterLevel_old";
COMMIT;
