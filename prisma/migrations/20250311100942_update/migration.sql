-- CreateTable
CREATE TABLE "rule" (
    "id" SERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "module_group_id" INTEGER NOT NULL,
    "academic_year_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_group" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(512) NOT NULL,
    "max_ects" DECIMAL(4,2),
    "min_ects" DECIMAL(4,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "module_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_group_mapping" (
    "id" SERIAL NOT NULL,
    "module_group_id" INTEGER NOT NULL,
    "module_instance_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "module_group_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "module_group_mapping_module_group_id_module_instance_id_key" ON "module_group_mapping"("module_group_id", "module_instance_id");

-- AddForeignKey
ALTER TABLE "rule" ADD CONSTRAINT "rule_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule" ADD CONSTRAINT "rule_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule" ADD CONSTRAINT "rule_module_group_id_fkey" FOREIGN KEY ("module_group_id") REFERENCES "module_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_group_mapping" ADD CONSTRAINT "module_group_mapping_module_group_id_fkey" FOREIGN KEY ("module_group_id") REFERENCES "module_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_group_mapping" ADD CONSTRAINT "module_group_mapping_module_instance_id_fkey" FOREIGN KEY ("module_instance_id") REFERENCES "module_instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
