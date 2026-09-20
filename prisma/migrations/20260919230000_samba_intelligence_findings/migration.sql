CREATE TYPE "SambaFindingStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED', 'EXPIRED');
CREATE TYPE "SambaFindingSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "SambaFindingDomain" AS ENUM ('CARRIER', 'PICKUP', 'DRIVER', 'EQUIPMENT', 'OPERATIONS');
CREATE TYPE "SambaProvenance" AS ENUM ('LIVE', 'VERIFIED_EXTERNAL', 'CACHED', 'FIXTURE', 'INFERRED', 'UNVERIFIED', 'INSUFFICIENT_EVIDENCE');

CREATE TABLE "SambaFinding" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "domain" "SambaFindingDomain" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "findingType" TEXT NOT NULL,
    "severity" "SambaFindingSeverity" NOT NULL,
    "status" "SambaFindingStatus" NOT NULL DEFAULT 'OPEN',
    "provenance" "SambaProvenance" NOT NULL,
    "evidenceFreshness" TEXT,
    "evidenceSource" TEXT NOT NULL,
    "evidenceId" TEXT,
    "evidenceTimestamp" TIMESTAMP(3),
    "demoReferenceUsed" BOOLEAN NOT NULL DEFAULT false,
    "liveConnected" BOOLEAN NOT NULL DEFAULT false,
    "fact" TEXT NOT NULL,
    "verifiedEvidence" TEXT,
    "inference" TEXT,
    "recommendation" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "statements" JSONB NOT NULL,
    "evidenceRefs" JSONB NOT NULL,
    "workflowHref" TEXT,
    "llmUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "resolvedByUserId" TEXT,
    "resolutionReason" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SambaFinding_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SambaFinding_fleet_status_created_idx" ON "SambaFinding"("fleetId", "status", "createdAt");
CREATE INDEX "SambaFinding_fleet_type_entity_status_idx" ON "SambaFinding"("fleetId", "findingType", "entityId", "status");

ALTER TABLE "SambaFinding" ADD CONSTRAINT "SambaFinding_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SambaFinding" ADD CONSTRAINT "SambaFinding_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SambaFinding" ADD CONSTRAINT "SambaFinding_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
