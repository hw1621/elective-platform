-- DropForeignKey
ALTER TABLE "rule" DROP CONSTRAINT "rule_module_group_id_fkey";

-- AlterTable
ALTER TABLE "rule" ALTER COLUMN "module_group_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "rule" ADD CONSTRAINT "rule_module_group_id_fkey" FOREIGN KEY ("module_group_id") REFERENCES "module_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
