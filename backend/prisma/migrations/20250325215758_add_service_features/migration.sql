-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "hasOffer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offerPrice" DECIMAL(65,30);
