-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "beforeImageId" TEXT,
ADD COLUMN     "isAfterImage" BOOLEAN;

-- CreateIndex
CREATE INDEX "Image_isAfterImage_idx" ON "Image"("isAfterImage");

-- CreateIndex
CREATE INDEX "Image_beforeImageId_idx" ON "Image"("beforeImageId");
