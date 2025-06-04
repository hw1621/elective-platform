-- AlterTable
ALTER TABLE "student" ADD COLUMN     "route_id" INTEGER;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE SET NULL ON UPDATE CASCADE;
