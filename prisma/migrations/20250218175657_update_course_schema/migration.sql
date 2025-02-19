-- CreateEnum
CREATE TYPE "course_type" AS ENUM ('COMPULSORY', 'ELECTIVE');

-- CreateTable
CREATE TABLE "module" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "ects" INTEGER,
    "cats" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_instance" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "academic_year_id" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "type" "course_type" NOT NULL DEFAULT 'COMPULSORY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "module_instance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "module_instance" ADD CONSTRAINT "module_instance_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_instance" ADD CONSTRAINT "module_instance_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_instance" ADD CONSTRAINT "module_instance_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
