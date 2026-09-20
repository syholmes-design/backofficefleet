-- CreateEnum
CREATE TYPE "FmcsaQueryKind" AS ENUM ('USDOT', 'DOCKET');

CREATE TYPE "FmcsaVerificationResult" AS ENUM ('VERIFIED', 'NOT_VERIFIED', 'UNAVAILABLE', 'STALE', 'CONFLICT', 'ERROR');

CREATE TYPE "FmcsaProvenance" AS ENUM ('LIVE', 'CACHED', 'FIXTURE', 'UNAVAILABLE', 'ERROR');

CREATE TYPE "FmcsaFreshnessState" AS ENUM ('NEVER_VERIFIED', 'LIVE_RETRIEVED', 'CACHED', 'STALE', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "FmcsaRegulatoryVerification" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "carrierRegistryId" TEXT,
    "queriedKind" "FmcsaQueryKind" NOT NULL,
    "queriedValue" TEXT NOT NULL,
    "result" "FmcsaVerificationResult" NOT NULL,
    "provenance" "FmcsaProvenance" NOT NULL,
    "freshnessState" "FmcsaFreshnessState" NOT NULL,
    "retrievedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "identifierFound" BOOLEAN NOT NULL DEFAULT false,
    "usdot" TEXT,
    "docketNumber" TEXT,
    "legalName" TEXT,
    "dbaName" TEXT,
    "allowToOperate" TEXT,
    "outOfService" TEXT,
    "outOfServiceDate" TEXT,
    "fieldComparisons" JSONB NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "endpointUsed" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FmcsaRegulatoryVerification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FmcsaRegVer_fleet_carrier_verified_idx" ON "FmcsaRegulatoryVerification"("fleetId", "carrierRegistryId", "verifiedAt");

CREATE INDEX "FmcsaRegVer_fleet_query_verified_idx" ON "FmcsaRegulatoryVerification"("fleetId", "queriedKind", "queriedValue", "verifiedAt");

ALTER TABLE "FmcsaRegulatoryVerification" ADD CONSTRAINT "FmcsaRegulatoryVerification_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FmcsaRegulatoryVerification" ADD CONSTRAINT "FmcsaRegulatoryVerification_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
