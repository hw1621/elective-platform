/*
  Warnings:

  - The values [NOT_STARTED] on the enum `BidRound` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BidRound_new" AS ENUM ('ROUND1', 'ROUND2');
ALTER TABLE "module_selection_result" ALTER COLUMN "bid_round" DROP DEFAULT;
ALTER TABLE "module_selection_result" ALTER COLUMN "bid_round" TYPE "BidRound_new" USING ("bid_round"::text::"BidRound_new");
ALTER TYPE "BidRound" RENAME TO "BidRound_old";
ALTER TYPE "BidRound_new" RENAME TO "BidRound";
DROP TYPE "BidRound_old";
ALTER TABLE "module_selection_result" ALTER COLUMN "bid_round" SET DEFAULT 'ROUND1';
COMMIT;
