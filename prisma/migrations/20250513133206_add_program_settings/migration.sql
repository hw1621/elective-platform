-- CreateTable
CREATE TABLE "setting" (
    "id" SERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "setting_program_id_key_key" ON "setting"("program_id", "key");

-- AddForeignKey
ALTER TABLE "setting" ADD CONSTRAINT "setting_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
