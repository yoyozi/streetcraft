/*
  Warnings:

  - You are about to drop the column `isFeatured` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerified` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Product_isFeatured_idx";

-- DropIndex
DROP INDEX "User_phoneNumber_key";

-- AlterTable
ALTER TABLE "Crafter" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "isFeatured",
ADD COLUMN     "depth" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "height" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "width" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phoneNumber",
DROP COLUMN "phoneVerified";

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");
