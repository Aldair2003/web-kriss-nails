-- CreateTable
CREATE TABLE "PublicHour" (
    "id" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,
    "hour" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicHour_availabilityId_idx" ON "PublicHour"("availabilityId");

-- CreateIndex
CREATE INDEX "PublicHour_hour_idx" ON "PublicHour"("hour");

-- CreateIndex
CREATE UNIQUE INDEX "PublicHour_availabilityId_hour_key" ON "PublicHour"("availabilityId", "hour");

-- AddForeignKey
ALTER TABLE "PublicHour" ADD CONSTRAINT "PublicHour_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "Availability"("id") ON DELETE CASCADE ON UPDATE CASCADE;
