-- CreateTable
CREATE TABLE "CrafterPayment" (
    "id" TEXT NOT NULL,
    "crafterId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrafterPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrafterPayout" (
    "id" TEXT NOT NULL,
    "crafterId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "reference" TEXT,
    "attachment" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrafterPayout_pkey" PRIMARY KEY ("id")
);

-- AddIndex
CREATE INDEX "CrafterPayment_crafterId_idx" ON "CrafterPayment"("crafterId");

-- AddIndex
CREATE INDEX "CrafterPayment_status_idx" ON "CrafterPayment"("status");

-- AddIndex
CREATE INDEX "CrafterPayment_orderId_idx" ON "CrafterPayment"("orderId");

-- AddIndex
CREATE INDEX "CrafterPayment_payoutId_idx" ON "CrafterPayment"("payoutId");

-- AddIndex
CREATE INDEX "CrafterPayout_crafterId_idx" ON "CrafterPayout"("crafterId");

-- AddIndex
CREATE INDEX "CrafterPayout_status_idx" ON "CrafterPayout"("status");

-- AddForeignKey
ALTER TABLE "CrafterPayment" ADD CONSTRAINT "CrafterPayment_crafterId_fkey" FOREIGN KEY ("crafterId") REFERENCES "Crafter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrafterPayment" ADD CONSTRAINT "CrafterPayment_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "CrafterPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrafterPayout" ADD CONSTRAINT "CrafterPayout_crafterId_fkey" FOREIGN KEY ("crafterId") REFERENCES "Crafter"("id") ON DELETE CASCADE ON UPDATE CASCADE;