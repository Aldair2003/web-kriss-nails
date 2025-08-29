-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "displayServiceCategory" TEXT,
ADD COLUMN     "displayServiceName" TEXT;

-- CreateIndex
CREATE INDEX "Image_displayServiceCategory_idx" ON "Image"("displayServiceCategory");
