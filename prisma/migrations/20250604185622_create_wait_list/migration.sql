/*
  Warnings:

  - You are about to drop the `module_instance` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BidResult" AS ENUM ('PENDING', 'SUCCESS', 'WAITLIST', 'FAILED');

-- DropForeignKey
ALTER TABLE "module_instance" DROP CONSTRAINT "module_instance_academic_year_id_fkey";

-- DropForeignKey
ALTER TABLE "module_instance" DROP CONSTRAINT "module_instance_module_id_fkey";

-- DropForeignKey
ALTER TABLE "module_instance" DROP CONSTRAINT "module_instance_program_id_fkey";

-- AlterTable
ALTER TABLE "module_selection_result" ADD COLUMN     "bid_result" "BidResult";

-- DropTable
DROP TABLE "module_instance";

-- CreateTable
CREATE TABLE "wait_list" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "module_id" INTEGER NOT NULL,
    "academic_year_id" INTEGER NOT NULL,
    "bid_points" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "wait_list_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "wait_list" ADD CONSTRAINT "wait_list_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wait_list" ADD CONSTRAINT "wait_list_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wait_list" ADD CONSTRAINT "wait_list_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
