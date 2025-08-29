-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "adminReply" TEXT,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replyDate" TIMESTAMP(3);
