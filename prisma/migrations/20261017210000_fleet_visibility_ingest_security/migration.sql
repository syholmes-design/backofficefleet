-- Increment 5 security remediation: fleet-scoped ingest credentials + observation FK integrity

CREATE TABLE "TelematicsIngestCredential" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "provider" "TelematicsProvider" NOT NULL,
    "label" TEXT,
    "secretHash" TEXT NOT NULL,
    "webhookSigningSecretHash" TEXT,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelematicsIngestCredential_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TelematicsIngestCredential_fleetId_provider_idx" ON "TelematicsIngestCredential"("fleetId", "provider");
CREATE INDEX "TelematicsIngestCredential_fleetId_revokedAt_idx" ON "TelematicsIngestCredential"("fleetId", "revokedAt");

ALTER TABLE "TelematicsIngestCredential" ADD CONSTRAINT "TelematicsIngestCredential_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleLocationObservation" ADD CONSTRAINT "VehicleLocationObservation_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VehicleLocationObservation" ADD CONSTRAINT "VehicleLocationObservation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
