/*
  Warnings:

  - The `term` column on the `module` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "module" DROP COLUMN "term",
ADD COLUMN     "term" TEXT;
