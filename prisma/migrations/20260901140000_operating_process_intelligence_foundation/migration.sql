-- CreateEnum
CREATE TYPE "RecordLifecycleClass" AS ENUM ('LIVE', 'HISTORICAL');

-- CreateEnum
CREATE TYPE "RecordOriginKind" AS ENUM ('BOF_CREATED', 'USER_CREATED', 'IMPORTED', 'EXTERNAL_SYSTEM', 'SYSTEM_GENERATED');

-- CreateEnum
CREATE TYPE "RecordVerificationClass" AS ENUM ('VERIFIED', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "RecordDerivationKind" AS ENUM ('SOURCE', 'DERIVED');

-- CreateEnum
CREATE TYPE "OriginValidationStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "OperatingProcessStage" AS ENUM ('LOAD_INTAKE', 'CANONICAL_LOAD', 'DISPATCH', 'DRIVER_EQUIPMENT', 'DOCUMENTS', 'PRE_TRIP_EVIDENCE', 'READINESS', 'RELEASE', 'DELIVERY_PROOF', 'SETTLEMENT', 'INVOICE_CASH');

-- CreateEnum
CREATE TYPE "OperatingProcessEventType" AS ENUM ('LOAD_INTAKE_RECORDED', 'CANONICAL_LOAD_RECORDED', 'DISPATCH_ASSIGNED', 'DRIVER_LINKED', 'EQUIPMENT_LINKED', 'DOCUMENT_ATTACHED', 'PRETRIP_RECORDED', 'EVIDENCE_CAPTURED', 'READINESS_EVALUATED', 'RELEASE_EVALUATED', 'DELIVERY_PROOF_RECORDED', 'SETTLEMENT_RECORDED', 'INVOICE_RECORDED', 'EXCEPTION_OPENED', 'CORRECTIVE_ACTION_RECORDED', 'EXCEPTION_VERIFIED');

-- CreateEnum
CREATE TYPE "OperatingActorType" AS ENUM ('USER', 'DRIVER', 'BOF_OPERATIONS', 'SYSTEM', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "OperatingOwnerTeam" AS ENUM ('BOF_OPERATIONS', 'COMPLIANCE', 'DISPATCH', 'FINANCE', 'HR', 'SAFETY', 'CUSTOMER_SUCCESS', 'FLEET_PERSONNEL');

-- CreateEnum
CREATE TYPE "OperatingExceptionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "OperatingActionStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "IngestionSourceFormat" AS ENUM ('CSV', 'EXCEL', 'JSON', 'API', 'STRUCTURED', 'DOCUMENT_METADATA');

-- CreateEnum
CREATE TYPE "IngestionRecordStatus" AS ENUM ('RECEIVED', 'MAPPED', 'NORMALIZED', 'VALIDATED', 'REJECTED', 'CANONICALIZED', 'EVENT_RECORDED');

-- AlterTable
ALTER TABLE "Load" ADD COLUMN "lifecycleClass" "RecordLifecycleClass" NOT NULL DEFAULT 'LIVE';
ALTER TABLE "Load" ADD COLUMN "originKind" "RecordOriginKind" NOT NULL DEFAULT 'BOF_CREATED';
ALTER TABLE "Load" ADD COLUMN "verificationClass" "RecordVerificationClass" NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "Load" ADD COLUMN "derivationKind" "RecordDerivationKind" NOT NULL DEFAULT 'SOURCE';
ALTER TABLE "Load" ADD COLUMN "sourceSystem" TEXT;
ALTER TABLE "Load" ADD COLUMN "sourceRecordId" TEXT;
ALTER TABLE "Load" ADD COLUMN "importedAt" TIMESTAMP(3);
ALTER TABLE "Load" ADD COLUMN "originValidationStatus" "OriginValidationStatus";

-- CreateIndex
CREATE INDEX "Load_fleetId_sourceSystem_sourceRecordId_idx" ON "Load"("fleetId", "sourceSystem", "sourceRecordId");

-- CreateTable
CREATE TABLE "OperatingProcessEvent" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "eventType" "OperatingProcessEventType" NOT NULL,
    "processStage" "OperatingProcessStage" NOT NULL,
    "eventTimestamp" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorType" "OperatingActorType" NOT NULL,
    "originKind" "RecordOriginKind" NOT NULL,
    "lifecycleClass" "RecordLifecycleClass" NOT NULL DEFAULT 'LIVE',
    "verificationClass" "RecordVerificationClass" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceSystem" TEXT,
    "sourceRecordId" TEXT,
    "priorState" TEXT,
    "resultingState" TEXT,
    "evidenceIds" JSONB,
    "documentIds" JSONB,
    "exceptionId" TEXT,
    "decisionType" TEXT,
    "decisionResult" TEXT,
    "decisionReason" TEXT,
    "decisionOwner" TEXT,
    "operationalConsequence" TEXT,
    "financialConsequence" TEXT,
    "serviceConsequence" TEXT,
    "actionId" TEXT,
    "resolutionStatus" TEXT,
    "resolutionTimestamp" TIMESTAMP(3),
    "verificationActor" TEXT,
    "verificationEvidence" TEXT,
    "relatedRecordType" TEXT,
    "relatedRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatingProcessEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingException" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "loadId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "processStage" "OperatingProcessStage" NOT NULL,
    "exceptionType" TEXT NOT NULL,
    "deviation" TEXT NOT NULL,
    "consequence" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "ownerTeam" "OperatingOwnerTeam" NOT NULL,
    "ownerUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "status" "OperatingExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "recurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingCorrectiveAction" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "exceptionId" TEXT NOT NULL,
    "loadId" TEXT,
    "actionType" TEXT NOT NULL,
    "assignedOwnerTeam" "OperatingOwnerTeam" NOT NULL,
    "assignedOwnerUserId" TEXT,
    "status" "OperatingActionStatus" NOT NULL DEFAULT 'ASSIGNED',
    "completedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verificationActor" TEXT,
    "verificationEvidence" TEXT,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingCorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionBatch" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "sourceFormat" "IngestionSourceFormat" NOT NULL,
    "status" "IngestionRecordStatus" NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRecord" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "sourcePayload" JSONB NOT NULL,
    "mappedPayload" JSONB,
    "normalizedPayload" JSONB,
    "validationStatus" "OriginValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validationMessage" TEXT,
    "status" "IngestionRecordStatus" NOT NULL DEFAULT 'RECEIVED',
    "canonicalEntityType" TEXT,
    "canonicalEntityId" TEXT,
    "loadId" TEXT,
    "operatingEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperatingProcessEvent_fleetId_eventTimestamp_idx" ON "OperatingProcessEvent"("fleetId", "eventTimestamp");
CREATE INDEX "OperatingProcessEvent_fleetId_loadId_eventTimestamp_idx" ON "OperatingProcessEvent"("fleetId", "loadId", "eventTimestamp");
CREATE INDEX "OperatingProcessEvent_fleetId_entityType_entityId_idx" ON "OperatingProcessEvent"("fleetId", "entityType", "entityId");
CREATE INDEX "OperatingProcessEvent_relatedRecordType_relatedRecordId_idx" ON "OperatingProcessEvent"("relatedRecordType", "relatedRecordId");
CREATE INDEX "OperatingException_fleetId_status_idx" ON "OperatingException"("fleetId", "status");
CREATE INDEX "OperatingException_fleetId_loadId_status_idx" ON "OperatingException"("fleetId", "loadId", "status");
CREATE INDEX "OperatingException_fleetId_exceptionType_idx" ON "OperatingException"("fleetId", "exceptionType");
CREATE INDEX "OperatingCorrectiveAction_fleetId_status_idx" ON "OperatingCorrectiveAction"("fleetId", "status");
CREATE INDEX "OperatingCorrectiveAction_exceptionId_status_idx" ON "OperatingCorrectiveAction"("exceptionId", "status");
CREATE INDEX "OperatingCorrectiveAction_fleetId_loadId_idx" ON "OperatingCorrectiveAction"("fleetId", "loadId");
CREATE INDEX "IngestionBatch_fleetId_receivedAt_idx" ON "IngestionBatch"("fleetId", "receivedAt");
CREATE UNIQUE INDEX "IngestionRecord_fleetId_idempotencyKey_key" ON "IngestionRecord"("fleetId", "idempotencyKey");
CREATE INDEX "IngestionRecord_batchId_idx" ON "IngestionRecord"("batchId");
CREATE INDEX "IngestionRecord_fleetId_sourceRecordId_idx" ON "IngestionRecord"("fleetId", "sourceRecordId");

-- AddForeignKey
ALTER TABLE "OperatingProcessEvent" ADD CONSTRAINT "OperatingProcessEvent_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperatingProcessEvent" ADD CONSTRAINT "OperatingProcessEvent_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperatingProcessEvent" ADD CONSTRAINT "OperatingProcessEvent_exceptionId_fkey" FOREIGN KEY ("exceptionId") REFERENCES "OperatingException"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperatingProcessEvent" ADD CONSTRAINT "OperatingProcessEvent_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "OperatingCorrectiveAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperatingException" ADD CONSTRAINT "OperatingException_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperatingException" ADD CONSTRAINT "OperatingException_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperatingCorrectiveAction" ADD CONSTRAINT "OperatingCorrectiveAction_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperatingCorrectiveAction" ADD CONSTRAINT "OperatingCorrectiveAction_exceptionId_fkey" FOREIGN KEY ("exceptionId") REFERENCES "OperatingException"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperatingCorrectiveAction" ADD CONSTRAINT "OperatingCorrectiveAction_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IngestionBatch" ADD CONSTRAINT "IngestionBatch_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IngestionRecord" ADD CONSTRAINT "IngestionRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "IngestionBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IngestionRecord" ADD CONSTRAINT "IngestionRecord_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IngestionRecord" ADD CONSTRAINT "IngestionRecord_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
