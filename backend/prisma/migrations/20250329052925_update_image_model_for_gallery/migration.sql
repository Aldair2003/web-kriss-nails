-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "beforeAfterPair" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dimensions" JSONB,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isHighlight" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE INDEX "Image_type_idx" ON "Image"("type");

-- CreateIndex
CREATE INDEX "Image_category_idx" ON "Image"("category");

-- CreateIndex
CREATE INDEX "Image_serviceId_idx" ON "Image"("serviceId");
