-- UOS Increment 5: fleet visibility / normalized GPS observations

-- CreateEnum
CREATE TYPE "TelematicsProvider" AS ENUM ('SAMSARA', 'MOTIVE', 'GEOTAB', 'GENERIC_WEBHOOK', 'STANDALONE_CELLULAR', 'DRIVER_MOBILE');
CREATE TYPE "LocationObservationKind" AS ENUM ('LIVE', 'SYNTHETIC_TEST');
CREATE TYPE "LoadStopKind" AS ENUM ('PICKUP', 'DELIVERY');
CREATE TYPE "DeliveryProgressStatus" AS ENUM ('ON_SCHEDULE', 'POTENTIALLY_DELAYED', 'DELIVERY_AT_RISK', 'APPOINTMENT_MISSED', 'LOCATION_UNAVAILABLE', 'LOCATION_STALE', 'ARRIVED_AT_DESTINATION');

-- AlterEnum
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'VEHICLE_LOCATION_RECORDED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'GEOFENCE_PICKUP_APPROACHING';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'GEOFENCE_PICKUP_ARRIVED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'GEOFENCE_PICKUP_DEPARTED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'GEOFENCE_DELIVERY_APPROACHING';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'GEOFENCE_DELIVERY_ARRIVED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'GEOFENCE_DELIVERY_DEPARTED';
ALTER TYPE "OperatingProcessEventType" ADD VALUE 'DELIVERY_RISK_ASSESSED';

-- CreateTable
CREATE TABLE "TelematicsDeviceLink" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "provider" "TelematicsProvider" NOT NULL,
    "providerDeviceId" TEXT NOT NULL,
    "providerVehicleId" TEXT,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelematicsDeviceLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleLocationObservation" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "driverId" TEXT,
    "loadId" TEXT,
    "provider" "TelematicsProvider" NOT NULL,
    "providerDeviceId" TEXT,
    "observationKind" "LocationObservationKind" NOT NULL DEFAULT 'LIVE',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movementStatus" TEXT,
    "speedMph" DOUBLE PRECISION,
    "headingDegrees" DOUBLE PRECISION,
    "accuracyMeters" DOUBLE PRECISION,
    "sourceReliability" TEXT,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "VehicleLocationObservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoadStopGeography" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "stopKind" "LoadStopKind" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geocodeLabel" TEXT,
    "sourceSystem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadStopGeography_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoadMovementAssessment" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "progressStatus" "DeliveryProgressStatus" NOT NULL,
    "distanceToDeliveryMiles" DOUBLE PRECISION,
    "estimatedArrivalAt" TIMESTAMP(3),
    "etaConfidenceNote" TEXT,
    "lastObservationId" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadMovementAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelematicsDeviceLink_fleetId_provider_providerDeviceId_key" ON "TelematicsDeviceLink"("fleetId", "provider", "providerDeviceId");
CREATE INDEX "TelematicsDeviceLink_fleetId_equipmentId_idx" ON "TelematicsDeviceLink"("fleetId", "equipmentId");

CREATE UNIQUE INDEX "VehicleLocationObservation_fleetId_idempotencyKey_key" ON "VehicleLocationObservation"("fleetId", "idempotencyKey");
CREATE INDEX "VehicleLocationObservation_fleetId_equipmentId_observedAt_idx" ON "VehicleLocationObservation"("fleetId", "equipmentId", "observedAt" DESC);
CREATE INDEX "VehicleLocationObservation_fleetId_loadId_observedAt_idx" ON "VehicleLocationObservation"("fleetId", "loadId", "observedAt" DESC);
CREATE INDEX "VehicleLocationObservation_fleetId_observedAt_idx" ON "VehicleLocationObservation"("fleetId", "observedAt" DESC);

CREATE UNIQUE INDEX "LoadStopGeography_fleetId_loadId_stopKind_key" ON "LoadStopGeography"("fleetId", "loadId", "stopKind");
CREATE INDEX "LoadStopGeography_fleetId_loadId_idx" ON "LoadStopGeography"("fleetId", "loadId");

CREATE UNIQUE INDEX "LoadMovementAssessment_fleetId_loadId_key" ON "LoadMovementAssessment"("fleetId", "loadId");
CREATE INDEX "LoadMovementAssessment_fleetId_progressStatus_idx" ON "LoadMovementAssessment"("fleetId", "progressStatus");

-- AddForeignKey
ALTER TABLE "TelematicsDeviceLink" ADD CONSTRAINT "TelematicsDeviceLink_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TelematicsDeviceLink" ADD CONSTRAINT "TelematicsDeviceLink_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleLocationObservation" ADD CONSTRAINT "VehicleLocationObservation_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleLocationObservation" ADD CONSTRAINT "VehicleLocationObservation_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LoadStopGeography" ADD CONSTRAINT "LoadStopGeography_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadStopGeography" ADD CONSTRAINT "LoadStopGeography_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LoadMovementAssessment" ADD CONSTRAINT "LoadMovementAssessment_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadMovementAssessment" ADD CONSTRAINT "LoadMovementAssessment_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
