/*
  Warnings:

  - The values [DROPPED] on the enum `BidResult` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BidResult_new" AS ENUM ('PENDING', 'SUCCESS', 'WAITLIST', 'DROP');
ALTER TABLE "module_selection_result" ALTER COLUMN "bid_result" DROP DEFAULT;
ALTER TABLE "module_selection_result" ALTER COLUMN "bid_result" TYPE "BidResult_new" USING ("bid_result"::text::"BidResult_new");
ALTER TYPE "BidResult" RENAME TO "BidResult_old";
ALTER TYPE "BidResult_new" RENAME TO "BidResult";
DROP TYPE "BidResult_old";
ALTER TABLE "module_selection_result" ALTER COLUMN "bid_result" SET DEFAULT 'PENDING';
COMMIT;
