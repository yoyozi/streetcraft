-- CreateEnum
CREATE TYPE "ProductImageUploadStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ProductImageUpload" (
    "id" TEXT NOT NULL,
    "crafterId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "status" "ProductImageUploadStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImageUpload_pkey" PRIMARY KEY ("id")
);

-- AddIndex
CREATE INDEX "ProductImageUpload_crafterId_idx" ON "ProductImageUpload"("crafterId");

-- AddIndex
CREATE INDEX "ProductImageUpload_status_idx" ON "ProductImageUpload"("status");

-- AddIndex
CREATE INDEX "ProductImageUpload_createdAt_idx" ON "ProductImageUpload"("createdAt");

-- AddForeignKey
ALTER TABLE "ProductImageUpload" ADD CONSTRAINT "ProductImageUpload_crafterId_fkey" FOREIGN KEY ("crafterId") REFERENCES "Crafter"("id") ON DELETE CASCADE ON UPDATE CASCADE;