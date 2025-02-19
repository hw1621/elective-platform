/*
  Warnings:

  - You are about to alter the column `ects` on the `module` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(4,2)`.
  - You are about to alter the column `cats` on the `module` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(4,2)`.

*/
-- AlterTable
ALTER TABLE "module" ALTER COLUMN "ects" SET DATA TYPE DECIMAL(4,2),
ALTER COLUMN "cats" SET DATA TYPE DECIMAL(4,2);
