-- AlterEnum
ALTER TYPE "term" ADD VALUE 'TBC';

-- AlterTable
ALTER TABLE "module" ADD COLUMN     "FHEQ_level" VARCHAR(8),
ADD COLUMN     "academic_year_id" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "assessment" TEXT,
ADD COLUMN     "brief_description" TEXT,
ADD COLUMN     "delivery_mode" VARCHAR(32),
ADD COLUMN     "department" VARCHAR(32),
ADD COLUMN     "eligible_cohorts" VARCHAR(512),
ADD COLUMN     "employee_type" VARCHAR(32),
ADD COLUMN     "file_name" VARCHAR(512),
ADD COLUMN     "lead_program" VARCHAR(32),
ADD COLUMN     "learn_teach_approach" TEXT,
ADD COLUMN     "learning_outcome" TEXT,
ADD COLUMN     "lecturer" VARCHAR(256),
ADD COLUMN     "module_content" TEXT,
ADD COLUMN     "reading_list" TEXT,
ADD COLUMN     "role" VARCHAR(32),
ADD COLUMN     "subject_area" VARCHAR(32),
ADD COLUMN     "suite" VARCHAR(32),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(256);

-- AddForeignKey
ALTER TABLE "module" ADD CONSTRAINT "module_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
