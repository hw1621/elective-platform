-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('ECTS', 'TERM');

-- AlterTable
ALTER TABLE "rule" ADD COLUMN     "max_module_count" INTEGER DEFAULT 0,
ADD COLUMN     "type" "RuleType" NOT NULL DEFAULT 'ECTS';
