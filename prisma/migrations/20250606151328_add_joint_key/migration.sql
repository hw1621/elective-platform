/*
  Warnings:

  - A unique constraint covering the columns `[student_id,module_id,academic_year_id,deleted_at]` on the table `module_selection_result` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "module_selection_result_student_id_module_id_academic_year__key" ON "module_selection_result"("student_id", "module_id", "academic_year_id", "deleted_at");
