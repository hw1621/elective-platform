/*
  Warnings:

  - The values [NON_ASSESSED] on the enum `course_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "term" AS ENUM ('SU', 'SP', 'AU', 'SUP');

-- AlterEnum
BEGIN;
CREATE TYPE "course_type_new" AS ENUM ('COMPULSORY', 'ELECTIVE', 'REQUIRED');
ALTER TABLE "module_instance" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "module_instance" ALTER COLUMN "type" TYPE "course_type_new" USING ("type"::text::"course_type_new");
ALTER TYPE "course_type" RENAME TO "course_type_old";
ALTER TYPE "course_type_new" RENAME TO "course_type";
DROP TYPE "course_type_old";
ALTER TABLE "module_instance" ALTER COLUMN "type" SET DEFAULT 'COMPULSORY';
COMMIT;

-- AlterTable
ALTER TABLE "module" ADD COLUMN     "term" "term";
