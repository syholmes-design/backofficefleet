-- CreateEnum
CREATE TYPE "PickupAuthorizationStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'RELEASED', 'STOPPED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PickupVerificationMethod" AS ENUM ('TOKEN_PRESENTATION', 'MANUAL_OPERATOR', 'IDENTITY_PROVIDER', 'DL_VERIFICATION', 'PHOTO_MATCH', 'LIVENESS', 'VIN_SCAN', 'PLATE_OCR', 'QR_BARCODE', 'GPS_GEOFENCE', 'TELEMATICS', 'SHIPPER_DOCK');

-- CreateEnum
CREATE TYPE "PickupVerificationResult" AS ENUM ('MATCH', 'MISMATCH', 'AUTHORIZED', 'REJECTED', 'RELEASED', 'STOPPED');

-- CreateEnum
CREATE TYPE "PickupStopReasonCode" AS ENUM ('WRONG_DRIVER', 'WRONG_TRACTOR', 'WRONG_TRAILER', 'WRONG_LOAD', 'EXPIRED', 'REUSED', 'CANCELLED', 'NO_ACTIVE_ASSIGNMENT', 'NO_DRIVER_READINESS', 'NO_TRIP_RELEASE', 'TOKEN_INVALID', 'ASSIGNMENT_DRIFT');

-- AlterEnum
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'PICKUP_AUTHORIZATION_CREATED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'PICKUP_VERIFICATION_RECORDED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'PICKUP_RELEASED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'PICKUP_STOPPED';

-- CreateTable
CREATE TABLE "PickupAuthorization" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tractorEquipmentId" TEXT NOT NULL,
    "trailerEquipmentId" TEXT,
    "dispatchReleaseId" TEXT NOT NULL,
    "driverReadinessScoreId" TEXT NOT NULL,
    "status" "PickupAuthorizationStatus" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "pickupWindowStart" TIMESTAMP(3),
    "pickupWindowEnd" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "reason" TEXT,
    "reasonCodes" JSONB,
    "policyVersion" TEXT NOT NULL,
    "physicalIdentityClass" "RecordVerificationClass" NOT NULL DEFAULT 'UNVERIFIED',
    "physicalEquipmentClass" "RecordVerificationClass" NOT NULL DEFAULT 'UNVERIFIED',
    "createdByUserId" TEXT NOT NULL,
    "cancelledByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupVerificationAttempt" (
    "id" TEXT NOT NULL,
    "pickupAuthorizationId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "method" "PickupVerificationMethod" NOT NULL,
    "result" "PickupVerificationResult" NOT NULL,
    "presentedTokenValid" BOOLEAN NOT NULL,
    "presentedDriverId" TEXT,
    "presentedTractorEquipmentId" TEXT,
    "presentedTrailerEquipmentId" TEXT,
    "presentedLoadId" TEXT,
    "presentedAuthorizationId" TEXT,
    "reason" TEXT NOT NULL,
    "reasonCodes" JSONB NOT NULL,
    "physicalVerificationPerformed" BOOLEAN NOT NULL DEFAULT false,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickupVerificationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PickupAuthorization_tokenHash_key" ON "PickupAuthorization"("tokenHash");

-- CreateIndex
CREATE INDEX "PickupAuthorization_fleetId_status_createdAt_idx" ON "PickupAuthorization"("fleetId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PickupAuthorization_loadId_createdAt_idx" ON "PickupAuthorization"("loadId", "createdAt");

-- CreateIndex
CREATE INDEX "PickupAuthorization_assignmentId_createdAt_idx" ON "PickupAuthorization"("assignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "PickupAuthorization_driverId_createdAt_idx" ON "PickupAuthorization"("driverId", "createdAt");

-- CreateIndex
CREATE INDEX "PickupAuthorization_expiresAt_status_idx" ON "PickupAuthorization"("expiresAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PickupAuthorization_active_load_unique_idx"
    ON "PickupAuthorization"("loadId")
    WHERE "status" IN ('PENDING', 'AUTHORIZED');

-- CreateIndex
CREATE INDEX "PickupVerificationAttempt_pickupAuthorizationId_createdAt_idx" ON "PickupVerificationAttempt"("pickupAuthorizationId", "createdAt");

-- CreateIndex
CREATE INDEX "PickupVerificationAttempt_fleetId_createdAt_idx" ON "PickupVerificationAttempt"("fleetId", "createdAt");

-- AddForeignKey
ALTER TABLE "PickupAuthorization" ADD CONSTRAINT "PickupAuthorization_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupAuthorization" ADD CONSTRAINT "PickupAuthorization_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupAuthorization" ADD CONSTRAINT "PickupAuthorization_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DispatchAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupAuthorization" ADD CONSTRAINT "PickupAuthorization_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupAuthorization" ADD CONSTRAINT "PickupAuthorization_tractorEquipmentId_fkey" FOREIGN KEY ("tractorEquipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupAuthorization" ADD CONSTRAINT "PickupAuthorization_trailerEquipmentId_fkey" FOREIGN KEY ("trailerEquipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupAuthorization" ADD CONSTRAINT "PickupAuthorization_dispatchReleaseId_fkey" FOREIGN KEY ("dispatchReleaseId") REFERENCES "DispatchRelease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupAuthorization" ADD CONSTRAINT "PickupAuthorization_driverReadinessScoreId_fkey" FOREIGN KEY ("driverReadinessScoreId") REFERENCES "DriverReadinessScore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupAuthorization" ADD CONSTRAINT "PickupAuthorization_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupAuthorization" ADD CONSTRAINT "PickupAuthorization_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupVerificationAttempt" ADD CONSTRAINT "PickupVerificationAttempt_pickupAuthorizationId_fkey" FOREIGN KEY ("pickupAuthorizationId") REFERENCES "PickupAuthorization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupVerificationAttempt" ADD CONSTRAINT "PickupVerificationAttempt_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupVerificationAttempt" ADD CONSTRAINT "PickupVerificationAttempt_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
