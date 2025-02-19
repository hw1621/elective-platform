/*
  Warnings:

  - You are about to drop the column `name` on the `module` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `module` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `module` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "module" DROP COLUMN "name",
ADD COLUMN     "title" VARCHAR(128) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "module_code_key" ON "module"("code");
