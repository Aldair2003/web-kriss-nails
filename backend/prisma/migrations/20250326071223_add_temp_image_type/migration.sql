-- CreateEnum
CREATE TYPE "SystemLogType" AS ENUM ('CLEANUP', 'ERROR', 'INFO');

-- AlterEnum
ALTER TYPE "ImageType" ADD VALUE 'TEMP';

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "type" "SystemLogType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);
