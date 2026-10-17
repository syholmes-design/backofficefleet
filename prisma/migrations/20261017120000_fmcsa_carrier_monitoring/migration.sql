-- CreateEnum
CREATE TYPE "FmcsaMonitoringTrigger" AS ENUM ('MANUAL', 'SCHEDULED', 'CLI');

-- CreateEnum
CREATE TYPE "FmcsaMonitoringRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'COMPLETED_WITH_EXCEPTIONS', 'FAILED');

-- CreateEnum
CREATE TYPE "FmcsaComplianceStatus" AS ENUM ('CLEAR', 'ATTENTION', 'CRITICAL', 'UNVERIFIED', 'NOT_CONFIGURED');

-- CreateEnum
CREATE TYPE "FmcsaSnapshotSource" AS ENUM ('QCMOBILE', 'OPEN_DATA');

-- AlterTable
ALTER TABLE "Fleet" ADD COLUMN     "carrierIdentityUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "mcNumber" TEXT,
ADD COLUMN     "usdotNumber" TEXT;

-- CreateTable
CREATE TABLE "FmcsaMonitoringRun" (
    "id" TEXT NOT NULL,
    "trigger" "FmcsaMonitoringTrigger" NOT NULL,
    "status" "FmcsaMonitoringRunStatus" NOT NULL DEFAULT 'RUNNING',
    "initiatedByUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "fleetsChecked" INTEGER NOT NULL DEFAULT 0,
    "clearCount" INTEGER NOT NULL DEFAULT 0,
    "attentionCount" INTEGER NOT NULL DEFAULT 0,
    "criticalCount" INTEGER NOT NULL DEFAULT 0,
    "unverifiedCount" INTEGER NOT NULL DEFAULT 0,
    "notConfiguredCount" INTEGER NOT NULL DEFAULT 0,
    "sourcesUsed" JSONB,
    "schemaValidation" JSONB,
    "sourceErrors" JSONB,
    "exceptions" JSONB,
    "errorMessage" TEXT,

    CONSTRAINT "FmcsaMonitoringRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FmcsaCarrierSnapshot" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "fleetId" TEXT NOT NULL,
    "usdotNumber" TEXT NOT NULL,
    "source" "FmcsaSnapshotSource" NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "dataAsOf" TIMESTAMP(3),
    "schemaValidated" BOOLEAN NOT NULL DEFAULT false,
    "complete" BOOLEAN NOT NULL DEFAULT false,
    "found" BOOLEAN NOT NULL DEFAULT false,
    "missingFields" JSONB NOT NULL,
    "profile" JSONB,
    "alerts" JSONB NOT NULL,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FmcsaCarrierSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FmcsaMonitoringResult" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "usdotNumber" TEXT,
    "status" "FmcsaComplianceStatus" NOT NULL,
    "reasons" JSONB NOT NULL,
    "alerts" JSONB NOT NULL,
    "changeAlerts" JSONB NOT NULL,
    "qcmobileSnapshotId" TEXT,
    "openDataSnapshotId" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FmcsaMonitoringResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FmcsaMonitoringRun_startedAt_idx" ON "FmcsaMonitoringRun"("startedAt");

-- CreateIndex
CREATE INDEX "FmcsaMonitoringRun_status_startedAt_idx" ON "FmcsaMonitoringRun"("status", "startedAt");

-- CreateIndex
CREATE INDEX "FmcsaCarrierSnapshot_fleetId_retrievedAt_idx" ON "FmcsaCarrierSnapshot"("fleetId", "retrievedAt");

-- CreateIndex
CREATE INDEX "FmcsaCarrierSnapshot_usdotNumber_retrievedAt_idx" ON "FmcsaCarrierSnapshot"("usdotNumber", "retrievedAt");

-- CreateIndex
CREATE INDEX "FmcsaCarrierSnapshot_runId_idx" ON "FmcsaCarrierSnapshot"("runId");

-- CreateIndex
CREATE INDEX "FmcsaMonitoringResult_fleetId_evaluatedAt_idx" ON "FmcsaMonitoringResult"("fleetId", "evaluatedAt");

-- CreateIndex
CREATE INDEX "FmcsaMonitoringResult_status_evaluatedAt_idx" ON "FmcsaMonitoringResult"("status", "evaluatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FmcsaMonitoringResult_runId_fleetId_key" ON "FmcsaMonitoringResult"("runId", "fleetId");

-- CreateIndex
CREATE INDEX "Fleet_usdotNumber_idx" ON "Fleet"("usdotNumber");

-- AddForeignKey
ALTER TABLE "FmcsaMonitoringRun" ADD CONSTRAINT "FmcsaMonitoringRun_initiatedByUserId_fkey" FOREIGN KEY ("initiatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FmcsaCarrierSnapshot" ADD CONSTRAINT "FmcsaCarrierSnapshot_runId_fkey" FOREIGN KEY ("runId") REFERENCES "FmcsaMonitoringRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FmcsaCarrierSnapshot" ADD CONSTRAINT "FmcsaCarrierSnapshot_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FmcsaMonitoringResult" ADD CONSTRAINT "FmcsaMonitoringResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "FmcsaMonitoringRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FmcsaMonitoringResult" ADD CONSTRAINT "FmcsaMonitoringResult_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Identifier hygiene (not expressible in the Prisma schema).
ALTER TABLE "Fleet" ADD CONSTRAINT "Fleet_usdotNumber_format_check" CHECK ("usdotNumber" IS NULL OR "usdotNumber" ~ '^[1-9][0-9]{0,7}$');
ALTER TABLE "Fleet" ADD CONSTRAINT "Fleet_mcNumber_format_check" CHECK ("mcNumber" IS NULL OR "mcNumber" ~ '^(MC|MX|FF)[0-9]{1,8}$');
ALTER TABLE "FmcsaCarrierSnapshot" ADD CONSTRAINT "FmcsaCarrierSnapshot_usdotNumber_format_check" CHECK ("usdotNumber" ~ '^[1-9][0-9]{0,7}$');
-- A CLEAR result must carry no alerts; anything else is a false clearance.
ALTER TABLE "FmcsaMonitoringResult" ADD CONSTRAINT "FmcsaMonitoringResult_clear_has_no_alerts_check" CHECK ("status" <> 'CLEAR' OR ("alerts" = '[]'::jsonb AND "usdotNumber" IS NOT NULL AND ("qcmobileSnapshotId" IS NOT NULL OR "openDataSnapshotId" IS NOT NULL)));
