-- DropIndex
DROP INDEX "module_selection_result_student_id_module_id_academic_year__key";

-- CreateIndex
CREATE INDEX "module_selection_result_student_id_module_id_academic_year__idx" ON "module_selection_result"("student_id", "module_id", "academic_year_id");
