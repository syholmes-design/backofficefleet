-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('PLANNED', 'ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('TRACTOR', 'TRAILER');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "DispatchAssignmentStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PreTripStatus" AS ENUM ('OPEN', 'COMPLETED', 'BLOCKED', 'VOIDED');

-- CreateEnum
CREATE TYPE "PreTripItemStatus" AS ENUM ('PENDING', 'PASS', 'WARNING', 'FAIL', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "PreTripDefectSeverity" AS ENUM ('WARNING', 'BLOCKING');

-- CreateEnum
CREATE TYPE "DispatchReleaseDisposition" AS ENUM ('RELEASED', 'CONDITIONALLY_RELEASED', 'HOLD', 'BLOCKED');

-- CreateTable
CREATE TABLE "Load" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "pickupWindowStart" TIMESTAMP(3),
    "pickupWindowEnd" TIMESTAMP(3),
    "deliveryWindowStart" TIMESTAMP(3),
    "deliveryWindowEnd" TIMESTAMP(3),
    "referenceNumber" TEXT,
    "secondaryReferenceNumber" TEXT,
    "status" "LoadStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Load_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "equipmentType" "EquipmentType" NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "vin" TEXT,
    "status" "EquipmentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchAssignment" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tractorEquipmentId" TEXT NOT NULL,
    "trailerEquipmentId" TEXT,
    "status" "DispatchAssignmentStatus" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedByUserId" TEXT,
    "unassignedAt" TIMESTAMP(3),
    "unassignedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreTripHeader" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "status" "PreTripStatus" NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreTripHeader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreTripItem" (
    "id" TEXT NOT NULL,
    "preTripHeaderId" TEXT NOT NULL,
    "sectionCode" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "isCritical" BOOLEAN NOT NULL,
    "status" "PreTripItemStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreTripItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreTripDefect" (
    "id" TEXT NOT NULL,
    "preTripHeaderId" TEXT NOT NULL,
    "preTripItemId" TEXT,
    "itemCode" TEXT NOT NULL,
    "severity" "PreTripDefectSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "requiresRepair" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreTripDefect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchRelease" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tractorEquipmentId" TEXT NOT NULL,
    "trailerEquipmentId" TEXT,
    "preTripHeaderId" TEXT,
    "driverReadinessScoreId" TEXT NOT NULL,
    "disposition" "DispatchReleaseDisposition" NOT NULL,
    "reasonCodes" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchRelease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Load_fleetId_status_idx" ON "Load"("fleetId", "status");

-- CreateIndex
CREATE INDEX "Load_fleetId_pickupWindowStart_idx" ON "Load"("fleetId", "pickupWindowStart");

-- CreateIndex
CREATE INDEX "Load_fleetId_deliveryWindowStart_idx" ON "Load"("fleetId", "deliveryWindowStart");

-- CreateIndex
CREATE INDEX "Equipment_fleetId_equipmentType_status_idx" ON "Equipment"("fleetId", "equipmentType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_fleetId_unitNumber_key" ON "Equipment"("fleetId", "unitNumber");

-- CreateIndex
CREATE INDEX "DispatchAssignment_fleetId_status_idx" ON "DispatchAssignment"("fleetId", "status");

-- CreateIndex
CREATE INDEX "DispatchAssignment_loadId_assignedAt_idx" ON "DispatchAssignment"("loadId", "assignedAt");

-- CreateIndex
CREATE INDEX "DispatchAssignment_driverId_assignedAt_idx" ON "DispatchAssignment"("driverId", "assignedAt");

-- CreateIndex
CREATE INDEX "DispatchAssignment_tractorEquipmentId_assignedAt_idx" ON "DispatchAssignment"("tractorEquipmentId", "assignedAt");

-- CreateIndex
CREATE INDEX "DispatchAssignment_trailerEquipmentId_assignedAt_idx" ON "DispatchAssignment"("trailerEquipmentId", "assignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PreTripItem_preTripHeaderId_itemCode_key" ON "PreTripItem"("preTripHeaderId", "itemCode");

-- CreateIndex
CREATE INDEX "DispatchRelease_assignmentId_evaluatedAt_idx" ON "DispatchRelease"("assignmentId", "evaluatedAt");

-- CreateIndex
CREATE INDEX "DispatchRelease_loadId_evaluatedAt_idx" ON "DispatchRelease"("loadId", "evaluatedAt");

-- CreateIndex
CREATE INDEX "DispatchRelease_fleetId_evaluatedAt_idx" ON "DispatchRelease"("fleetId", "evaluatedAt");

-- CreateIndex
CREATE INDEX "DispatchRelease_driverReadinessScoreId_idx" ON "DispatchRelease"("driverReadinessScoreId");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchAssignment_active_load_unique_idx"
    ON "DispatchAssignment"("loadId")
    WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "DispatchAssignment_active_driver_unique_idx"
    ON "DispatchAssignment"("driverId")
    WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "DispatchAssignment_active_tractor_unique_idx"
    ON "DispatchAssignment"("tractorEquipmentId")
    WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "DispatchAssignment_active_trailer_unique_idx"
    ON "DispatchAssignment"("trailerEquipmentId")
    WHERE "status" = 'ACTIVE' AND "trailerEquipmentId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PreTripHeader_open_assignment_unique_idx"
    ON "PreTripHeader"("assignmentId")
    WHERE "status" = 'OPEN';

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_tractorEquipmentId_fkey" FOREIGN KEY ("tractorEquipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_trailerEquipmentId_fkey" FOREIGN KEY ("trailerEquipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_unassignedByUserId_fkey" FOREIGN KEY ("unassignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreTripHeader" ADD CONSTRAINT "PreTripHeader_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreTripHeader" ADD CONSTRAINT "PreTripHeader_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DispatchAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreTripHeader" ADD CONSTRAINT "PreTripHeader_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreTripItem" ADD CONSTRAINT "PreTripItem_preTripHeaderId_fkey" FOREIGN KEY ("preTripHeaderId") REFERENCES "PreTripHeader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreTripDefect" ADD CONSTRAINT "PreTripDefect_preTripHeaderId_fkey" FOREIGN KEY ("preTripHeaderId") REFERENCES "PreTripHeader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreTripDefect" ADD CONSTRAINT "PreTripDefect_preTripItemId_fkey" FOREIGN KEY ("preTripItemId") REFERENCES "PreTripItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRelease" ADD CONSTRAINT "DispatchRelease_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRelease" ADD CONSTRAINT "DispatchRelease_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRelease" ADD CONSTRAINT "DispatchRelease_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DispatchAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRelease" ADD CONSTRAINT "DispatchRelease_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRelease" ADD CONSTRAINT "DispatchRelease_tractorEquipmentId_fkey" FOREIGN KEY ("tractorEquipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRelease" ADD CONSTRAINT "DispatchRelease_trailerEquipmentId_fkey" FOREIGN KEY ("trailerEquipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRelease" ADD CONSTRAINT "DispatchRelease_preTripHeaderId_fkey" FOREIGN KEY ("preTripHeaderId") REFERENCES "PreTripHeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRelease" ADD CONSTRAINT "DispatchRelease_driverReadinessScoreId_fkey" FOREIGN KEY ("driverReadinessScoreId") REFERENCES "DriverReadinessScore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRelease" ADD CONSTRAINT "DispatchRelease_evaluatedByUserId_fkey" FOREIGN KEY ("evaluatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
