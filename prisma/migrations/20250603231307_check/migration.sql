/*
  Warnings:

  - You are about to drop the column `type` on the `module_selection_result` table. All the data in the column will be lost.
  - Added the required column `register_level` to the `module_selection_result` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "module_selection_result" DROP COLUMN "type",
ADD COLUMN     "register_level" "RegisterLevel" NOT NULL;
