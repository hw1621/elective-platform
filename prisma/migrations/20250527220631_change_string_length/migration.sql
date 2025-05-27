/*
  Warnings:

  - You are about to alter the column `lecturer` on the `module` table. The data in that column could be lost. The data in that column will be cast from `VarChar(256)` to `VarChar(32)`.
  - You are about to alter the column `email` on the `student` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `user_name` on the `student` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(16)`.
  - You are about to alter the column `given_name` on the `student` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(16)`.
  - You are about to alter the column `surname` on the `student` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(16)`.
  - You are about to alter the column `cid` on the `student` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(16)`.

*/
-- AlterTable
ALTER TABLE "module" ALTER COLUMN "lecturer" SET DATA TYPE VARCHAR(32);

-- AlterTable
ALTER TABLE "student" ALTER COLUMN "email" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "user_name" SET DATA TYPE VARCHAR(16),
ALTER COLUMN "given_name" SET DATA TYPE VARCHAR(16),
ALTER COLUMN "surname" SET DATA TYPE VARCHAR(16),
ALTER COLUMN "cid" SET DATA TYPE VARCHAR(16);
