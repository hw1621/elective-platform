/*
  Warnings:

  - Made the column `bid_result` on table `module_selection_result` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "module_selection_result" ALTER COLUMN "bid_result" SET NOT NULL,
ALTER COLUMN "bid_result" SET DEFAULT 'PENDING';
