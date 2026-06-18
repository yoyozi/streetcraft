-- AlterTable
ALTER TABLE "Crafter" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankAccountType" TEXT DEFAULT 'Cheque',
ADD COLUMN     "bankBranchCode" TEXT,
ADD COLUMN     "bankName" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "crafterId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isSold" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "OrderItem_crafterId_idx" ON "OrderItem"("crafterId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_crafterId_fkey" FOREIGN KEY ("crafterId") REFERENCES "Crafter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
