-- CreateTable
CREATE TABLE "DriverClaimToken" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverClaimToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverClaimToken_tokenHash_key" ON "DriverClaimToken"("tokenHash");

-- CreateIndex
CREATE INDEX "DriverClaimToken_driverId_idx" ON "DriverClaimToken"("driverId");

-- CreateIndex
CREATE INDEX "DriverClaimToken_fleetId_idx" ON "DriverClaimToken"("fleetId");

-- CreateIndex
CREATE INDEX "DriverClaimToken_createdByUserId_idx" ON "DriverClaimToken"("createdByUserId");

-- CreateIndex
CREATE INDEX "DriverClaimToken_expiresAt_idx" ON "DriverClaimToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "DriverClaimToken" ADD CONSTRAINT "DriverClaimToken_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverClaimToken" ADD CONSTRAINT "DriverClaimToken_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverClaimToken" ADD CONSTRAINT "DriverClaimToken_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreatePartialUniqueIndex
CREATE UNIQUE INDEX "DriverClaimToken_driverId_active_key"
  ON "DriverClaimToken" ("driverId")
  WHERE "claimedAt" IS NULL
    AND "revokedAt" IS NULL;
