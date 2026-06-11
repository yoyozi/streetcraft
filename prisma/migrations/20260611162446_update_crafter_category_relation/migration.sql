/*
  Warnings:

  - You are about to drop the column `category` on the `Crafter` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Crafter" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "ProductImageUpload" ADD COLUMN     "availability" INTEGER,
ADD COLUMN     "costPrice" DOUBLE PRECISION,
ADD COLUMN     "depth" DOUBLE PRECISION,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION,
ADD COLUMN     "width" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Crafter" ADD CONSTRAINT "Crafter_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
