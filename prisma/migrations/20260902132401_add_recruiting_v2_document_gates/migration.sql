-- CreateEnum
CREATE TYPE "RecruitingV2DocumentType" AS ENUM ('CDL', 'MVR', 'MEDICAL', 'CLEARINGHOUSE', 'I9', 'W9', 'ROAD_TEST', 'EMPLOYMENT_VERIFICATION');

-- CreateEnum
CREATE TYPE "RecruitingV2DocumentStatus" AS ENUM ('RECEIVED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RecruitingV2GateState" AS ENUM ('OPEN', 'BLOCKED', 'SATISFIED');

-- CreateTable
CREATE TABLE "DocumentRecord" (
    "id" TEXT NOT NULL,
    "documentCode" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "documentType" "RecruitingV2DocumentType" NOT NULL,
    "status" "RecruitingV2DocumentStatus" NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "uploadedBy" TEXT,
    "verifiedBy" TEXT,
    "verificationNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceGate" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "documentType" "RecruitingV2DocumentType" NOT NULL,
    "state" "RecruitingV2GateState" NOT NULL,
    "reason" TEXT NOT NULL,
    "requiredAction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceGate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRecord_documentCode_key" ON "DocumentRecord"("documentCode");

-- CreateIndex
CREATE INDEX "DocumentRecord_candidateId_idx" ON "DocumentRecord"("candidateId");

-- CreateIndex
CREATE INDEX "DocumentRecord_documentType_idx" ON "DocumentRecord"("documentType");

-- CreateIndex
CREATE INDEX "DocumentRecord_status_idx" ON "DocumentRecord"("status");

-- CreateIndex
CREATE INDEX "DocumentRecord_updatedAt_idx" ON "DocumentRecord"("updatedAt");

-- CreateIndex
CREATE INDEX "ComplianceGate_candidateId_idx" ON "ComplianceGate"("candidateId");

-- CreateIndex
CREATE INDEX "ComplianceGate_documentType_idx" ON "ComplianceGate"("documentType");

-- CreateIndex
CREATE INDEX "ComplianceGate_state_idx" ON "ComplianceGate"("state");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceGate_candidateId_documentType_key" ON "ComplianceGate"("candidateId", "documentType");

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceGate" ADD CONSTRAINT "ComplianceGate_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
