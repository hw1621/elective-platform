-- CreateEnum
CREATE TYPE "RegisterLevel" AS ENUM ('SIGNIN', 'CREDIT');

-- CreateEnum
CREATE TYPE "ModuleSelectionStatus" AS ENUM ('COMPLETE', 'IN_PROGRESS', 'NOT_STARTED');

-- AlterTable
ALTER TABLE "student" ADD COLUMN     "selection_status" "ModuleSelectionStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- CreateTable
CREATE TABLE "module_selection_result" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "route_id" INTEGER NOT NULL,
    "module_id" INTEGER NOT NULL,
    "academic_year_id" INTEGER NOT NULL,
    "type" "RegisterLevel" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "module_selection_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "module_selection_result_student_id_academic_year_id_module__key" ON "module_selection_result"("student_id", "academic_year_id", "module_id");

-- AddForeignKey
ALTER TABLE "module_selection_result" ADD CONSTRAINT "module_selection_result_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_selection_result" ADD CONSTRAINT "module_selection_result_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_selection_result" ADD CONSTRAINT "module_selection_result_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_selection_result" ADD CONSTRAINT "module_selection_result_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
