/*
  Warnings:

  - You are about to drop the column `is_deleted` on the `academic_year` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `module` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `module_instance` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `program` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "academic_year" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "module" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "module_instance" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "program" DROP COLUMN "is_deleted",
ADD COLUMN     "deleted_at" TIMESTAMP(3);
