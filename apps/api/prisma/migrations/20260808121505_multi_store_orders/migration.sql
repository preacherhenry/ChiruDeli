-- CreateEnum
CREATE TYPE "MasterDeliveryStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DeliveryStopType" AS ENUM ('PICKUP', 'DROPOFF');

-- CreateEnum
CREATE TYPE "DeliveryStopStatus" AS ENUM ('PENDING', 'ARRIVED', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_riderId_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryLocationPing" DROP CONSTRAINT "DeliveryLocationPing_deliveryId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_addressId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_promotionId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_riderId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_orderId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionRedemption" DROP CONSTRAINT "PromotionRedemption_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_riderId_fkey";

-- DropIndex
DROP INDEX "DeliveryLocationPing_deliveryId_recordedAt_idx";

-- DropIndex
DROP INDEX "Order_idempotencyKey_key";

-- DropIndex
DROP INDEX "Order_riderId_idx";

-- DropIndex
DROP INDEX "Payment_orderId_key";

-- DropIndex
DROP INDEX "PromotionRedemption_orderId_key";

-- AlterTable
ALTER TABLE "DeliveryLocationPing" DROP COLUMN "deliveryId",
ADD COLUMN     "masterDeliveryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "addressId",
DROP COLUMN "deliveryFee",
DROP COLUMN "deliveryFeeOverridden",
DROP COLUMN "deliveryInstructions",
DROP COLUMN "discountAmount",
DROP COLUMN "idempotencyKey",
DROP COLUMN "paymentMethod",
DROP COLUMN "paymentStatus",
DROP COLUMN "placedAt",
DROP COLUMN "promotionId",
DROP COLUMN "riderId",
DROP COLUMN "serviceFee",
DROP COLUMN "total",
ADD COLUMN     "masterOrderId" TEXT NOT NULL,
ADD COLUMN     "sequence" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "orderId",
ADD COLUMN     "masterOrderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PromotionRedemption" DROP COLUMN "orderId",
ADD COLUMN     "masterOrderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "riderComment",
DROP COLUMN "riderId",
DROP COLUMN "riderRating",
ALTER COLUMN "businessId" SET NOT NULL,
ALTER COLUMN "businessRating" SET NOT NULL;

-- DropTable
DROP TABLE "Delivery";

-- DropEnum
DROP TYPE "DeliveryStatus";

-- CreateTable
CREATE TABLE "MasterOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "deliveryFee" DECIMAL(10,2) NOT NULL,
    "serviceFee" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "deliveryFeeOverridden" BOOLEAN NOT NULL DEFAULT false,
    "deliveryInstructions" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "promotionId" TEXT,
    "cancelReason" TEXT,
    "riderRating" INTEGER,
    "riderComment" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "MasterOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterDelivery" (
    "id" TEXT NOT NULL,
    "masterOrderId" TEXT NOT NULL,
    "riderId" TEXT,
    "status" "MasterDeliveryStatus" NOT NULL DEFAULT 'ASSIGNED',
    "totalDistanceKm" DOUBLE PRECISION NOT NULL,
    "estimatedEarnings" DECIMAL(10,2) NOT NULL,
    "actualEarnings" DECIMAL(10,2),
    "deliveryPin" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MasterDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryStop" (
    "id" TEXT NOT NULL,
    "masterDeliveryId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "DeliveryStopType" NOT NULL,
    "storeOrderId" TEXT,
    "label" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "DeliveryStopStatus" NOT NULL DEFAULT 'PENDING',
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DeliveryStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterOrder_orderNumber_key" ON "MasterOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MasterOrder_idempotencyKey_key" ON "MasterOrder"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MasterOrder_customerId_idx" ON "MasterOrder"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "MasterDelivery_masterOrderId_key" ON "MasterDelivery"("masterOrderId");

-- CreateIndex
CREATE INDEX "MasterDelivery_riderId_idx" ON "MasterDelivery"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryStop_storeOrderId_key" ON "DeliveryStop"("storeOrderId");

-- CreateIndex
CREATE INDEX "DeliveryStop_masterDeliveryId_sequence_idx" ON "DeliveryStop"("masterDeliveryId", "sequence");

-- CreateIndex
CREATE INDEX "DeliveryLocationPing_masterDeliveryId_recordedAt_idx" ON "DeliveryLocationPing"("masterDeliveryId", "recordedAt");

-- CreateIndex
CREATE INDEX "Order_masterOrderId_idx" ON "Order"("masterOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_masterOrderId_businessId_key" ON "Order"("masterOrderId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_masterOrderId_key" ON "Payment"("masterOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRedemption_masterOrderId_key" ON "PromotionRedemption"("masterOrderId");

-- AddForeignKey
ALTER TABLE "MasterOrder" ADD CONSTRAINT "MasterOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterOrder" ADD CONSTRAINT "MasterOrder_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterOrder" ADD CONSTRAINT "MasterOrder_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_masterOrderId_fkey" FOREIGN KEY ("masterOrderId") REFERENCES "MasterOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterDelivery" ADD CONSTRAINT "MasterDelivery_masterOrderId_fkey" FOREIGN KEY ("masterOrderId") REFERENCES "MasterOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterDelivery" ADD CONSTRAINT "MasterDelivery_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryStop" ADD CONSTRAINT "DeliveryStop_masterDeliveryId_fkey" FOREIGN KEY ("masterDeliveryId") REFERENCES "MasterDelivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryStop" ADD CONSTRAINT "DeliveryStop_storeOrderId_fkey" FOREIGN KEY ("storeOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryLocationPing" ADD CONSTRAINT "DeliveryLocationPing_masterDeliveryId_fkey" FOREIGN KEY ("masterDeliveryId") REFERENCES "MasterDelivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_masterOrderId_fkey" FOREIGN KEY ("masterOrderId") REFERENCES "MasterOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_masterOrderId_fkey" FOREIGN KEY ("masterOrderId") REFERENCES "MasterOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

