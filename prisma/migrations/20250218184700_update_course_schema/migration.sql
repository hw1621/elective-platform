/*
  Warnings:

  - The values [SUP] on the enum `term` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "term_new" AS ENUM ('SU', 'SP', 'AU', 'SEPT');
ALTER TABLE "module" ALTER COLUMN "term" TYPE "term_new" USING ("term"::text::"term_new");
ALTER TYPE "term" RENAME TO "term_old";
ALTER TYPE "term_new" RENAME TO "term";
DROP TYPE "term_old";
COMMIT;
