-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "clientEmail" TEXT,
ADD COLUMN     "serviceId" TEXT;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
