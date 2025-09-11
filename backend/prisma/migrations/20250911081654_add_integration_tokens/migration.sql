-- CreateTable
CREATE TABLE "IntegrationToken" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "needsAuth" BOOLEAN NOT NULL DEFAULT false,
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationToken_provider_key" ON "IntegrationToken"("provider");

-- CreateIndex
CREATE INDEX "IntegrationToken_provider_idx" ON "IntegrationToken"("provider");

-- CreateIndex
CREATE INDEX "IntegrationToken_isActive_idx" ON "IntegrationToken"("isActive");

-- CreateIndex
CREATE INDEX "IntegrationToken_needsAuth_idx" ON "IntegrationToken"("needsAuth");
