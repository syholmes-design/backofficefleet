-- CreateEnum
CREATE TYPE "ConditionCategory" AS ENUM ('MECHANICAL', 'ELECTRICAL', 'STRUCTURAL', 'SAFETY', 'CARGO', 'SECUREMENT', 'COSMETIC', 'DOCUMENTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ConditionSeverity" AS ENUM ('MINOR', 'MODERATE', 'CRITICAL', 'BLOCKING');

-- CreateEnum
CREATE TYPE "ConditionImpact" AS ENUM ('COSMETIC_ONLY', 'SAFETY_RISK', 'LOAD_RISK', 'DELAY_RISK', 'REGULATORY_RISK', 'CUSTOMER_RISK');

-- CreateEnum
CREATE TYPE "ConditionObservationSource" AS ENUM ('DRIVER', 'MAINTENANCE', 'SAFETY', 'DISPATCH', 'SYSTEM', 'TELEMATICS', 'AI_ASSISTED', 'OTHER');

-- CreateEnum
CREATE TYPE "ConditionVerificationState" AS ENUM ('UNVERIFIED', 'CONFIRMED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ConditionLifecycleState" AS ENUM ('IDENTIFIED', 'CONFIRMED', 'CHANGED', 'REPAIR_REPORTED', 'AWAITING_VERIFICATION', 'RESOLVED', 'REOPENED');

-- CreateEnum
CREATE TYPE "ConditionEventType" AS ENUM ('IDENTIFIED', 'CONFIRMED', 'CHANGED', 'REPAIR_REPORTED', 'AWAITING_VERIFICATION', 'RESOLUTION_VERIFIED', 'REOPENED');

-- CreateEnum
CREATE TYPE "ConditionResolutionAuthority" AS ENUM ('DRIVER', 'FLEET_MAINTENANCE', 'THIRD_PARTY_SHOP', 'SAFETY', 'DISPATCH', 'OTHER_AUTHORIZED_ACTOR');

-- CreateEnum
CREATE TYPE "ConditionEvidenceCompleteness" AS ENUM ('NONE', 'PARTIAL', 'COMPLETE', 'INSUFFICIENT');

-- CreateEnum
CREATE TYPE "ConditionEvidenceKind" AS ENUM ('PHOTO', 'VIDEO', 'DOCUMENT', 'SYSTEM_VALUE', 'NOTE');

-- CreateTable
CREATE TABLE "ConditionThread" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ConditionCategory" NOT NULL,
    "severity" "ConditionSeverity" NOT NULL,
    "impact" "ConditionImpact",
    "observationSource" "ConditionObservationSource" NOT NULL,
    "lifecycleState" "ConditionLifecycleState" NOT NULL,
    "verificationState" "ConditionVerificationState" NOT NULL DEFAULT 'UNVERIFIED',
    "evidenceCompleteness" "ConditionEvidenceCompleteness" NOT NULL DEFAULT 'NONE',
    "firstIdentifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastConfirmedAt" TIMESTAMP(3),
    "repairReportedAt" TIMESTAMP(3),
    "resolutionVerifiedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdByDriverId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConditionThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionEvent" (
    "id" TEXT NOT NULL,
    "conditionThreadId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "loadId" TEXT,
    "dispatchAssignmentId" TEXT,
    "preTripHeaderId" TEXT,
    "preTripItemId" TEXT,
    "eventType" "ConditionEventType" NOT NULL,
    "observationSource" "ConditionObservationSource" NOT NULL,
    "verificationState" "ConditionVerificationState" NOT NULL,
    "resolutionAuthority" "ConditionResolutionAuthority",
    "statusBefore" "ConditionLifecycleState",
    "statusAfter" "ConditionLifecycleState" NOT NULL,
    "verificationBefore" "ConditionVerificationState",
    "verificationAfter" "ConditionVerificationState" NOT NULL,
    "categoryBefore" "ConditionCategory",
    "categoryAfter" "ConditionCategory",
    "severityBefore" "ConditionSeverity",
    "severityAfter" "ConditionSeverity",
    "impactBefore" "ConditionImpact",
    "impactAfter" "ConditionImpact",
    "notes" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedByUserId" TEXT NOT NULL,
    "recordedByDriverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConditionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalEvidence" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "loadId" TEXT,
    "dispatchAssignmentId" TEXT,
    "preTripHeaderId" TEXT,
    "preTripItemId" TEXT,
    "conditionThreadId" TEXT,
    "conditionEventId" TEXT,
    "evidenceKind" "ConditionEvidenceKind" NOT NULL,
    "observationSource" "ConditionObservationSource" NOT NULL,
    "observationValue" JSONB,
    "provenance" JSONB,
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "checksum" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedByUserId" TEXT NOT NULL,
    "capturedByDriverId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConditionThread_fleetId_equipmentId_lifecycleState_idx" ON "ConditionThread"("fleetId", "equipmentId", "lifecycleState");

-- CreateIndex
CREATE INDEX "ConditionThread_fleetId_firstIdentifiedAt_idx" ON "ConditionThread"("fleetId", "firstIdentifiedAt");

-- CreateIndex
CREATE INDEX "ConditionThread_equipmentId_lifecycleState_idx" ON "ConditionThread"("equipmentId", "lifecycleState");

-- CreateIndex
CREATE INDEX "ConditionThread_createdByUserId_idx" ON "ConditionThread"("createdByUserId");

-- CreateIndex
CREATE INDEX "ConditionThread_createdByDriverId_idx" ON "ConditionThread"("createdByDriverId");

-- CreateIndex
CREATE INDEX "ConditionEvent_conditionThreadId_observedAt_idx" ON "ConditionEvent"("conditionThreadId", "observedAt");

-- CreateIndex
CREATE INDEX "ConditionEvent_fleetId_observedAt_idx" ON "ConditionEvent"("fleetId", "observedAt");

-- CreateIndex
CREATE INDEX "ConditionEvent_equipmentId_observedAt_idx" ON "ConditionEvent"("equipmentId", "observedAt");

-- CreateIndex
CREATE INDEX "ConditionEvent_loadId_observedAt_idx" ON "ConditionEvent"("loadId", "observedAt");

-- CreateIndex
CREATE INDEX "ConditionEvent_dispatchAssignmentId_observedAt_idx" ON "ConditionEvent"("dispatchAssignmentId", "observedAt");

-- CreateIndex
CREATE INDEX "ConditionEvent_preTripHeaderId_observedAt_idx" ON "ConditionEvent"("preTripHeaderId", "observedAt");

-- CreateIndex
CREATE INDEX "ConditionEvent_preTripItemId_observedAt_idx" ON "ConditionEvent"("preTripItemId", "observedAt");

-- CreateIndex
CREATE INDEX "ConditionEvent_recordedByUserId_idx" ON "ConditionEvent"("recordedByUserId");

-- CreateIndex
CREATE INDEX "ConditionEvent_recordedByDriverId_idx" ON "ConditionEvent"("recordedByDriverId");

-- CreateIndex
CREATE INDEX "OperationalEvidence_fleetId_capturedAt_idx" ON "OperationalEvidence"("fleetId", "capturedAt");

-- CreateIndex
CREATE INDEX "OperationalEvidence_equipmentId_capturedAt_idx" ON "OperationalEvidence"("equipmentId", "capturedAt");

-- CreateIndex
CREATE INDEX "OperationalEvidence_loadId_capturedAt_idx" ON "OperationalEvidence"("loadId", "capturedAt");

-- CreateIndex
CREATE INDEX "OperationalEvidence_dispatchAssignmentId_capturedAt_idx" ON "OperationalEvidence"("dispatchAssignmentId", "capturedAt");

-- CreateIndex
CREATE INDEX "OperationalEvidence_preTripHeaderId_capturedAt_idx" ON "OperationalEvidence"("preTripHeaderId", "capturedAt");

-- CreateIndex
CREATE INDEX "OperationalEvidence_preTripItemId_capturedAt_idx" ON "OperationalEvidence"("preTripItemId", "capturedAt");

-- CreateIndex
CREATE INDEX "OperationalEvidence_conditionThreadId_capturedAt_idx" ON "OperationalEvidence"("conditionThreadId", "capturedAt");

-- CreateIndex
CREATE INDEX "OperationalEvidence_conditionEventId_capturedAt_idx" ON "OperationalEvidence"("conditionEventId", "capturedAt");

-- CreateIndex
CREATE INDEX "OperationalEvidence_capturedByUserId_idx" ON "OperationalEvidence"("capturedByUserId");

-- CreateIndex
CREATE INDEX "OperationalEvidence_capturedByDriverId_idx" ON "OperationalEvidence"("capturedByDriverId");

-- AddForeignKey
ALTER TABLE "ConditionThread" ADD CONSTRAINT "ConditionThread_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionThread" ADD CONSTRAINT "ConditionThread_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionThread" ADD CONSTRAINT "ConditionThread_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionThread" ADD CONSTRAINT "ConditionThread_createdByDriverId_fkey" FOREIGN KEY ("createdByDriverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionEvent" ADD CONSTRAINT "ConditionEvent_conditionThreadId_fkey" FOREIGN KEY ("conditionThreadId") REFERENCES "ConditionThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionEvent" ADD CONSTRAINT "ConditionEvent_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionEvent" ADD CONSTRAINT "ConditionEvent_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionEvent" ADD CONSTRAINT "ConditionEvent_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionEvent" ADD CONSTRAINT "ConditionEvent_dispatchAssignmentId_fkey" FOREIGN KEY ("dispatchAssignmentId") REFERENCES "DispatchAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionEvent" ADD CONSTRAINT "ConditionEvent_preTripHeaderId_fkey" FOREIGN KEY ("preTripHeaderId") REFERENCES "PreTripHeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionEvent" ADD CONSTRAINT "ConditionEvent_preTripItemId_fkey" FOREIGN KEY ("preTripItemId") REFERENCES "PreTripItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionEvent" ADD CONSTRAINT "ConditionEvent_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionEvent" ADD CONSTRAINT "ConditionEvent_recordedByDriverId_fkey" FOREIGN KEY ("recordedByDriverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalEvidence" ADD CONSTRAINT "OperationalEvidence_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalEvidence" ADD CONSTRAINT "OperationalEvidence_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalEvidence" ADD CONSTRAINT "OperationalEvidence_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalEvidence" ADD CONSTRAINT "OperationalEvidence_dispatchAssignmentId_fkey" FOREIGN KEY ("dispatchAssignmentId") REFERENCES "DispatchAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalEvidence" ADD CONSTRAINT "OperationalEvidence_preTripHeaderId_fkey" FOREIGN KEY ("preTripHeaderId") REFERENCES "PreTripHeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalEvidence" ADD CONSTRAINT "OperationalEvidence_preTripItemId_fkey" FOREIGN KEY ("preTripItemId") REFERENCES "PreTripItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalEvidence" ADD CONSTRAINT "OperationalEvidence_conditionThreadId_fkey" FOREIGN KEY ("conditionThreadId") REFERENCES "ConditionThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalEvidence" ADD CONSTRAINT "OperationalEvidence_conditionEventId_fkey" FOREIGN KEY ("conditionEventId") REFERENCES "ConditionEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalEvidence" ADD CONSTRAINT "OperationalEvidence_capturedByUserId_fkey" FOREIGN KEY ("capturedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalEvidence" ADD CONSTRAINT "OperationalEvidence_capturedByDriverId_fkey" FOREIGN KEY ("capturedByDriverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
