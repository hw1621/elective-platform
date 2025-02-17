/*
  Warnings:

  - You are about to drop the `Program` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Program" DROP CONSTRAINT "Program_academic_year_id_fkey";

-- DropTable
DROP TABLE "Program";

-- CreateTable
CREATE TABLE "program" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "short_title" VARCHAR(128),
    "academic_year_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "program_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "program" ADD CONSTRAINT "program_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
