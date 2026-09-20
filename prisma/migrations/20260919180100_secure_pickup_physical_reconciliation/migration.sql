-- CreateTable
CREATE TABLE "PickupPhysicalReconciliation" (
    "id" TEXT NOT NULL,
    "pickupAuthorizationId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "disposition" "PickupPhysicalDisposition" NOT NULL,
    "driverArrivalResult" "PickupArrivalResult" NOT NULL,
    "tractorArrivalResult" "PickupArrivalResult" NOT NULL,
    "trailerArrivalResult" "PickupArrivalResult" NOT NULL,
    "loadArrivalResult" "PickupArrivalResult" NOT NULL,
    "authorizationArrivalResult" "PickupArrivalResult" NOT NULL,
    "identityMatchToAuthorizedRecord" BOOLEAN NOT NULL,
    "identityPhysicalClass" "RecordVerificationClass" NOT NULL DEFAULT 'UNVERIFIED',
    "equipmentPhysicalClass" "RecordVerificationClass" NOT NULL DEFAULT 'UNVERIFIED',
    "method" "PickupVerificationMethod" NOT NULL,
    "arrivingDriverId" TEXT,
    "arrivingTractorUnitNumber" TEXT,
    "arrivingTrailerUnitNumber" TEXT,
    "arrivingVin" TEXT,
    "arrivingPlate" TEXT,
    "arrivingQr" TEXT,
    "reason" TEXT NOT NULL,
    "reasonCodes" JSONB NOT NULL,
    "evidenceReference" TEXT,
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupPhysicalReconciliation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PickupPhysicalReconciliation_pickupAuthorizationId_key" ON "PickupPhysicalReconciliation"("pickupAuthorizationId");

CREATE INDEX "PickupPhysicalReconciliation_fleetId_disposition_createdAt_idx" ON "PickupPhysicalReconciliation"("fleetId", "disposition", "createdAt");

CREATE INDEX "PickupPhysicalReconciliation_loadId_createdAt_idx" ON "PickupPhysicalReconciliation"("loadId", "createdAt");

ALTER TABLE "PickupPhysicalReconciliation" ADD CONSTRAINT "PickupPhysicalReconciliation_pickupAuthorizationId_fkey" FOREIGN KEY ("pickupAuthorizationId") REFERENCES "PickupAuthorization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PickupPhysicalReconciliation" ADD CONSTRAINT "PickupPhysicalReconciliation_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PickupPhysicalReconciliation" ADD CONSTRAINT "PickupPhysicalReconciliation_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
