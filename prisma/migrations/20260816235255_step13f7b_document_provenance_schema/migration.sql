-- AlterTable
ALTER TABLE "DriverDocument" ADD COLUMN     "sourceDocumentId" TEXT,
ADD COLUMN     "versionNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "previousVersionId" TEXT,
ADD COLUMN     "supersededAt" TIMESTAMP(3),
ADD COLUMN     "supersededByDocumentId" TEXT;

UPDATE "DriverDocument"
SET "sourceDocumentId" = "id"
WHERE "sourceDocumentId" IS NULL;

ALTER TABLE "DriverDocument" ALTER COLUMN "sourceDocumentId" SET NOT NULL;

-- CreateEnum
CREATE TYPE "EmployerDocumentMaterializationStorageMode" AS ENUM ('COPY', 'REFERENCE');

-- CreateTable
CREATE TABLE "DocumentAuthorization" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "sourceVersionNumber" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "authorizedByUserId" TEXT NOT NULL,
    "authorizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerDocumentMaterialization" (
    "id" TEXT NOT NULL,
    "authorizationId" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "sourceVersionNumber" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "materializedByUserId" TEXT NOT NULL,
    "materializedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storageMode" "EmployerDocumentMaterializationStorageMode" NOT NULL,
    "sourceStorageKey" TEXT NOT NULL,
    "employerStorageKey" TEXT,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "checksum" TEXT,
    "standardizedEntityType" TEXT,
    "standardizedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerDocumentMaterialization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverDocument_sourceDocumentId_versionNumber_key" ON "DriverDocument"("sourceDocumentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DriverDocument_previousVersionId_key" ON "DriverDocument"("previousVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverDocument_supersededByDocumentId_key" ON "DriverDocument"("supersededByDocumentId");

-- CreateIndex
CREATE INDEX "DriverDocument_sourceDocumentId_idx" ON "DriverDocument"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "DriverDocument_previousVersionId_idx" ON "DriverDocument"("previousVersionId");

-- CreateIndex
CREATE INDEX "DriverDocument_supersededByDocumentId_idx" ON "DriverDocument"("supersededByDocumentId");

-- CreateIndex
CREATE INDEX "DocumentAuthorization_sourceDocumentId_sourceVersionNumber_idx" ON "DocumentAuthorization"("sourceDocumentId", "sourceVersionNumber");

-- CreateIndex
CREATE INDEX "DocumentAuthorization_sourceDocumentId_fleetId_sourceVersio_idx" ON "DocumentAuthorization"("sourceDocumentId", "fleetId", "sourceVersionNumber");

-- CreateIndex
CREATE INDEX "DocumentAuthorization_driverId_idx" ON "DocumentAuthorization"("driverId");

-- CreateIndex
CREATE INDEX "DocumentAuthorization_fleetId_idx" ON "DocumentAuthorization"("fleetId");

-- CreateIndex
CREATE INDEX "DocumentAuthorization_authorizedByUserId_idx" ON "DocumentAuthorization"("authorizedByUserId");

-- CreateIndex
CREATE INDEX "DocumentAuthorization_authorizedAt_idx" ON "DocumentAuthorization"("authorizedAt");

-- CreateIndex
CREATE INDEX "DocumentAuthorization_revokedAt_idx" ON "DocumentAuthorization"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerDocumentMaterialization_authorizationId_key" ON "EmployerDocumentMaterialization"("authorizationId");

-- CreateIndex
CREATE INDEX "EmployerDocumentMaterialization_sourceDocumentId_sourceVers_idx" ON "EmployerDocumentMaterialization"("sourceDocumentId", "sourceVersionNumber");

-- CreateIndex
CREATE INDEX "EmployerDocumentMaterialization_driverId_fleetId_idx" ON "EmployerDocumentMaterialization"("driverId", "fleetId");

-- CreateIndex
CREATE INDEX "EmployerDocumentMaterialization_materializedAt_idx" ON "EmployerDocumentMaterialization"("materializedAt");

-- CreateIndex
CREATE INDEX "EmployerDocumentMaterialization_materializedByUserId_idx" ON "EmployerDocumentMaterialization"("materializedByUserId");

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "DriverDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_supersededByDocumentId_fkey" FOREIGN KEY ("supersededByDocumentId") REFERENCES "DriverDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAuthorization" ADD CONSTRAINT "DocumentAuthorization_sourceDocumentId_sourceVersionNumber_fkey" FOREIGN KEY ("sourceDocumentId", "sourceVersionNumber") REFERENCES "DriverDocument"("sourceDocumentId", "versionNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAuthorization" ADD CONSTRAINT "DocumentAuthorization_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAuthorization" ADD CONSTRAINT "DocumentAuthorization_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAuthorization" ADD CONSTRAINT "DocumentAuthorization_authorizedByUserId_fkey" FOREIGN KEY ("authorizedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAuthorization" ADD CONSTRAINT "DocumentAuthorization_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerDocumentMaterialization" ADD CONSTRAINT "EmployerDocumentMaterialization_authorizationId_fkey" FOREIGN KEY ("authorizationId") REFERENCES "DocumentAuthorization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerDocumentMaterialization" ADD CONSTRAINT "EmployerDocumentMaterialization_sourceDocumentId_sourceVer_fkey" FOREIGN KEY ("sourceDocumentId", "sourceVersionNumber") REFERENCES "DriverDocument"("sourceDocumentId", "versionNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerDocumentMaterialization" ADD CONSTRAINT "EmployerDocumentMaterialization_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerDocumentMaterialization" ADD CONSTRAINT "EmployerDocumentMaterialization_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerDocumentMaterialization" ADD CONSTRAINT "EmployerDocumentMaterialization_materializedByUserId_fkey" FOREIGN KEY ("materializedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreatePartialUniqueIndex
CREATE UNIQUE INDEX "DocumentAuthorization_active_source_fleet_version_key"
  ON "DocumentAuthorization" ("sourceDocumentId", "fleetId", "sourceVersionNumber")
  WHERE "revokedAt" IS NULL;
