/*
  Warnings:

  - The primary key for the `academic_year` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `academic_year` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `program` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `program` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `academic_year_id` on the `program` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- DropForeignKey
ALTER TABLE "program" DROP CONSTRAINT "program_academic_year_id_fkey";

-- AlterTable
ALTER TABLE "academic_year" DROP CONSTRAINT "academic_year_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "academic_year_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "program" DROP CONSTRAINT "program_pkey",
ALTER COLUMN "id" SET DATA TYPE INTEGER,
ALTER COLUMN "academic_year_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "program_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "program" ADD CONSTRAINT "program_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
