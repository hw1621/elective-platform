/*
  Warnings:

  - You are about to drop the column `sername` on the `student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "student" DROP COLUMN "sername",
ADD COLUMN     "surname" TEXT;
