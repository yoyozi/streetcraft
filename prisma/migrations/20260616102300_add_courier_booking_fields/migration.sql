-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "shippingServiceCode" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingServiceCode" TEXT,
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "waybillNumber" TEXT;
