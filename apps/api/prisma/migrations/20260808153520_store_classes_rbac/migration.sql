-- AlterEnum
BEGIN;
CREATE TYPE "BusinessStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION', 'SUSPENDED', 'DEACTIVATED');
ALTER TABLE "Business" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Business" ALTER COLUMN "status" TYPE "BusinessStatus_new" USING ("status"::text::"BusinessStatus_new");
ALTER TYPE "BusinessStatus" RENAME TO "BusinessStatus_old";
ALTER TYPE "BusinessStatus_new" RENAME TO "BusinessStatus";
DROP TYPE "BusinessStatus_old";
ALTER TABLE "Business" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'STORE_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'STORE_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'STORE_CHANGES_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'STORE_SUSPENDED';
ALTER TYPE "NotificationType" ADD VALUE 'STORE_REACTIVATED';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('CUSTOMER', 'STORE_MANAGER', 'RIDER', 'SYSTEM_ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_ownerId_fkey";

-- DropIndex
DROP INDEX "Business_categoryId_idx";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "categoryId",
DROP COLUMN "ownerId",
ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "isActivated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "prepTimeMinutes" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "storeClassId" TEXT NOT NULL,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "taxId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- DropTable
DROP TABLE "BusinessCategory";

-- DropEnum
DROP TYPE "BusinessCategorySlug";

-- CreateTable
CREATE TABLE "StoreManager" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "profilePhotoUrl" TEXT,
    "nationalIdInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT,
    "coverImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreClassDocumentRequirement" (
    "id" TEXT NOT NULL,
    "storeClassId" TEXT NOT NULL,
    "documentLabel" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoreClassDocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreManagerAssignment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "storeManagerId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreManagerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreDocument" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "requirementId" TEXT,
    "label" TEXT NOT NULL,
    "fileData" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "StoreDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreManager_userId_key" ON "StoreManager"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreClass_slug_key" ON "StoreClass"("slug");

-- CreateIndex
CREATE INDEX "StoreClassDocumentRequirement_storeClassId_idx" ON "StoreClassDocumentRequirement"("storeClassId");

-- CreateIndex
CREATE INDEX "StoreManagerAssignment_storeManagerId_idx" ON "StoreManagerAssignment"("storeManagerId");

-- CreateIndex
CREATE INDEX "StoreManagerAssignment_businessId_idx" ON "StoreManagerAssignment"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreManagerAssignment_businessId_storeManagerId_key" ON "StoreManagerAssignment"("businessId", "storeManagerId");

-- CreateIndex
CREATE INDEX "StoreDocument_businessId_idx" ON "StoreDocument"("businessId");

-- CreateIndex
CREATE INDEX "Business_storeClassId_idx" ON "Business"("storeClassId");

-- AddForeignKey
ALTER TABLE "StoreManager" ADD CONSTRAINT "StoreManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreClassDocumentRequirement" ADD CONSTRAINT "StoreClassDocumentRequirement_storeClassId_fkey" FOREIGN KEY ("storeClassId") REFERENCES "StoreClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_storeClassId_fkey" FOREIGN KEY ("storeClassId") REFERENCES "StoreClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreManagerAssignment" ADD CONSTRAINT "StoreManagerAssignment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreManagerAssignment" ADD CONSTRAINT "StoreManagerAssignment_storeManagerId_fkey" FOREIGN KEY ("storeManagerId") REFERENCES "StoreManager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreDocument" ADD CONSTRAINT "StoreDocument_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreDocument" ADD CONSTRAINT "StoreDocument_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "StoreClassDocumentRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

