/*
  Warnings:

  - Made the column `cid` on table `student` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "student" ALTER COLUMN "cid" SET NOT NULL;
