-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('SUPER', 'STANDARD');

-- DropEnum
DROP TYPE "course_type";

-- CreateTable
CREATE TABLE "student" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "sername" TEXT NOT NULL,
    "given_name" TEXT NOT NULL,
    "cid" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "academic_year_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "access_level" "AccessLevel" NOT NULL DEFAULT 'STANDARD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
