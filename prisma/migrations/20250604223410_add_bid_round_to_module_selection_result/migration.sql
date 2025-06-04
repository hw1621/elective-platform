-- CreateEnum
CREATE TYPE "BidRound" AS ENUM ('ROUND1', 'ROUND2', 'NOT_STARTED');

-- AlterTable
ALTER TABLE "module_selection_result" ADD COLUMN     "bid_round" "BidRound" NOT NULL DEFAULT 'NOT_STARTED';
