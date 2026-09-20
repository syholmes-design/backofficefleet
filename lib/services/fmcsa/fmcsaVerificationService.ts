import { Prisma } from "@prisma/client";

import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { createAuditRecord } from "@/lib/audit";
import { getCarrierById } from "@/lib/carrier-registry";
import { prisma } from "@/lib/prisma";
import { openOperatingException } from "@/lib/process-intelligence/operating-event-service";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import {
  compareIdentifier,
  compareOperatingStatus,
  compareText,
  normalizeDocket,
  normalizeUsdot,
  parseQueryKind,
} from "@/lib/services/fmcsa/normalize";
import { bofCacheStaleAfterMs, resolveFmcsaProvider } from "@/lib/services/fmcsa/resolveProvider";
import type {
  BofCarrierSnapshot,
  FmcsaFieldComparison,
  FmcsaQueryKind,
  FmcsaRegulatoryProvider,
  FmcsaVerificationResult,
} from "@/lib/services/fmcsa/types";
import { FMCSA_VERIFY_ROLES } from "@/lib/services/fmcsa/types";

function requireSession(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function requireVerifyRole(sessionUser: SessionUserLike, fleetId: string) {
  const access = requireFleetAccess(sessionUser, fleetId, [...FMCSA_VERIFY_ROLES]);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, payload: { reason: access.reason } });
  }
  return access;
}

function requireTenant(sessionUser: SessionUserLike, fleetId: string) {
  const access = requireFleetAccess(sessionUser, fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, payload: { reason: access.reason } });
  }
  return access;
}

function snapshotCarrier(carrierRegistryId: string | null | undefined): BofCarrierSnapshot | null {
  if (!carrierRegistryId) return null;
  const row = getCarrierById(carrierRegistryId);
  if (!row) return null;
  return {
    id: row.id,
    legalName: row.legalName,
    dba: row.dba,
    dotNumber: row.dotNumber,
    mcNumber: row.mcNumber,
    authorityStatus: row.authority.status,
    authorityClass: "DEMO_REFERENCE",
  };
}

function compareFields(bof: BofCarrierSnapshot | null, fmcsa: {
  usdot: string | null;
  docketNumber: string | null;
  legalName: string | null;
  dbaName: string | null;
  allowToOperate: string | null;
} | null): FmcsaFieldComparison[] {
  return [
    { field: "usdot", bofValue: bof?.dotNumber ?? null, fmcsaValue: fmcsa?.usdot ?? null, result: compareIdentifier(bof?.dotNumber, fmcsa?.usdot) },
    { field: "docketNumber", bofValue: bof?.mcNumber ?? null, fmcsaValue: fmcsa?.docketNumber ?? null, result: compareIdentifier(bof?.mcNumber, fmcsa?.docketNumber) },
    { field: "legalName", bofValue: bof?.legalName ?? null, fmcsaValue: fmcsa?.legalName ?? null, result: compareText(bof?.legalName, fmcsa?.legalName) },
    { field: "dbaName", bofValue: bof?.dba ?? null, fmcsaValue: fmcsa?.dbaName ?? null, result: compareText(bof?.dba, fmcsa?.dbaName) },
    {
      field: "operatingStatus",
      bofValue: bof?.authorityStatus ?? null,
      fmcsaValue: fmcsa?.allowToOperate ?? null,
      result: compareOperatingStatus(bof?.authorityStatus, fmcsa?.allowToOperate),
    },
  ];
}

function resultFromOutcome(
  status: "FOUND" | "NOT_FOUND" | "UNAVAILABLE" | "ERROR",
  comparisons: FmcsaFieldComparison[],
): FmcsaVerificationResult {
  if (status === "UNAVAILABLE") return "UNAVAILABLE";
  if (status === "ERROR") return "ERROR";
  if (status === "NOT_FOUND") return "NOT_VERIFIED";
  if (comparisons.some((row) => row.result === "MISMATCH")) return "CONFLICT";
  return "VERIFIED";
}

function toPublic(row: {
  id: string;
  fleetId: string;
  carrierRegistryId: string | null;
  queriedKind: string;
  queriedValue: string;
  result: string;
  provenance: string;
  freshnessState: string;
  retrievedAt: Date | null;
  verifiedAt: Date;
  identifierFound: boolean;
  usdot: string | null;
  docketNumber: string | null;
  legalName: string | null;
  dbaName: string | null;
  allowToOperate: string | null;
  outOfService: string | null;
  outOfServiceDate: string | null;
  fieldComparisons: Prisma.JsonValue;
  errorCode: string | null;
  errorMessage: string | null;
  endpointUsed: string | null;
}) {
  return {
    id: row.id,
    fleetId: row.fleetId,
    carrierRegistryId: row.carrierRegistryId,
    queriedKind: row.queriedKind,
    queriedValue: row.queriedValue,
    result: row.result,
    provenance: row.provenance,
    freshnessState: row.freshnessState,
    retrievedAt: row.retrievedAt,
    verifiedAt: row.verifiedAt,
    identifierFound: row.identifierFound,
    fmcsa: {
      usdot: row.usdot,
      docketNumber: row.docketNumber,
      legalName: row.legalName,
      dbaName: row.dbaName,
      allowToOperate: row.allowToOperate,
      outOfService: row.outOfService,
      outOfServiceDate: row.outOfServiceDate,
    },
    fieldComparisons: row.fieldComparisons,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    endpointUsed: row.endpointUsed,
    liveConnected: row.provenance === "LIVE",
    comparisonAuthority: "DEMO_REFERENCE" as const,
    note:
      "FMCSA evidence does not replace BOF carrier, dispatch, or Secure Pickup authority. The BOF comparison target is DEMO_REFERENCE Carrier Registry, not a LIVE carrier master. Result VERIFIED means fields matched that reference snapshot, not that BOF independently verified operating authority.",
  };
}

async function writeAudit(
  sessionUser: SessionUserLike,
  fleetId: string,
  entityId: string,
  event: "carrier.fmcsa_verification" | "carrier.fmcsa_verification_failed",
  details: Record<string, unknown>,
) {
  await createAuditRecord({
    actorId: sessionUser.id ?? null,
    actorEmail: sessionUser.email ?? null,
    tenantId: fleetId,
    action: event === "carrier.fmcsa_verification_failed" ? "UPDATED" : "CREATED",
    entityType: "FmcsaRegulatoryVerification",
    entityId,
    details: { event, ...details },
    metadata: { source: "fmcsa-regulatory-verification" },
  });
}

export async function getLatestFmcsaVerification(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string,
  carrierRegistryId: string,
) {
  requireSession(sessionUser);
  requireTenant(sessionUser!, fleetId);
  const row = await prisma.fmcsaRegulatoryVerification.findFirst({
    where: { fleetId, carrierRegistryId },
    orderBy: { verifiedAt: "desc" },
  });
  if (!row) {
    return {
      verification: null,
      bof: snapshotCarrier(carrierRegistryId),
      freshnessState: "NEVER_VERIFIED" as const,
      comparisonAuthority: "DEMO_REFERENCE" as const,
      note: "No FMCSA verification has been recorded. The Carrier Registry snapshot is DEMO_REFERENCE, not a LIVE carrier master.",
    };
  }
  const staleAfter = bofCacheStaleAfterMs();
  const ageMs = Date.now() - row.verifiedAt.getTime();
  const freshnessState =
    staleAfter && ageMs > staleAfter && row.provenance !== "UNAVAILABLE" && row.result !== "ERROR"
      ? "STALE"
      : row.freshnessState === "LIVE_RETRIEVED"
        ? "CACHED"
        : row.freshnessState;
  return {
    verification: toPublic({ ...row, freshnessState }),
    bof: snapshotCarrier(carrierRegistryId),
    freshnessState,
    comparisonAuthority: "DEMO_REFERENCE" as const,
    note: "Cached FMCSA evidence is not a current live lookup unless provenance is LIVE and freshness is LIVE_RETRIEVED. The BOF comparison target remains DEMO_REFERENCE Carrier Registry.",
  };
}

export async function verifyCarrierWithFmcsa(
  sessionUser: SessionUserLike | null | undefined,
  input: {
    fleetId: string;
    carrierRegistryId?: string | null;
    kind?: string | null;
    value?: string | null;
    useCache?: boolean;
    provider?: FmcsaRegulatoryProvider;
  },
) {
  requireSession(sessionUser);
  const actor = sessionUser!;
  requireVerifyRole(actor, input.fleetId);

  const bof = snapshotCarrier(input.carrierRegistryId ?? null);
  const kind: FmcsaQueryKind =
    parseQueryKind(input.kind) ?? (input.value && /mc|mx/i.test(input.value) ? "DOCKET" : "USDOT");
  const rawValue = input.value?.trim() || (kind === "DOCKET" ? bof?.mcNumber : bof?.dotNumber) || "";
  const queriedValue = kind === "DOCKET" ? normalizeDocket(rawValue) : normalizeUsdot(rawValue);
  if (!queriedValue) {
    throw Object.assign(new Error("A USDOT or MC/MX identifier is required"), { statusCode: 422 });
  }

  if (input.useCache !== false && input.carrierRegistryId) {
    const latest = await prisma.fmcsaRegulatoryVerification.findFirst({
      where: { fleetId: input.fleetId, carrierRegistryId: input.carrierRegistryId, queriedKind: kind, queriedValue },
      orderBy: { verifiedAt: "desc" },
    });
    if (latest) {
      const staleAfter = bofCacheStaleAfterMs();
      const stale = Boolean(staleAfter && Date.now() - latest.verifiedAt.getTime() > staleAfter);
      if (stale) {
        const staleRow = await prisma.fmcsaRegulatoryVerification.update({
          where: { id: latest.id },
          data: { freshnessState: "STALE", result: latest.result === "UNAVAILABLE" || latest.result === "ERROR" ? latest.result : "STALE" },
        });
        await writeAudit(actor, input.fleetId, staleRow.id, "carrier.fmcsa_verification", {
          provenance: "CACHED",
          result: staleRow.result,
          freshnessState: "STALE",
          queriedKind: kind,
          queriedValue,
          live: false,
        });
        return {
          verification: toPublic(staleRow),
          bof,
          mutatedBofRecord: false,
        };
      }
      return {
        verification: toPublic({
          ...latest,
          provenance: latest.provenance === "LIVE" ? "CACHED" : latest.provenance,
          freshnessState: "CACHED",
        }),
        bof,
        mutatedBofRecord: false,
        cached: true,
      };
    }
  }

  const provider = resolveFmcsaProvider(input.provider);
  const outcome = await provider.lookup({ kind, value: queriedValue });
  const comparisons = compareFields(bof, outcome.carrier);
  let result = resultFromOutcome(outcome.status, comparisons);
  if (outcome.status === "UNAVAILABLE") result = "UNAVAILABLE";

  const freshnessState =
    outcome.status === "UNAVAILABLE"
      ? "UNAVAILABLE"
      : outcome.provenance === "LIVE"
        ? "LIVE_RETRIEVED"
        : outcome.provenance === "FIXTURE"
          ? "LIVE_RETRIEVED"
          : "UNAVAILABLE";

  const row = await prisma.fmcsaRegulatoryVerification.create({
    data: {
      fleetId: input.fleetId,
      carrierRegistryId: input.carrierRegistryId ?? null,
      queriedKind: kind,
      queriedValue,
      result,
      provenance: outcome.provenance,
      freshnessState,
      retrievedAt: outcome.retrievedAt,
      verifiedAt: new Date(),
      identifierFound: outcome.status === "FOUND",
      usdot: outcome.carrier?.usdot ?? null,
      docketNumber: outcome.carrier?.docketNumber ?? null,
      legalName: outcome.carrier?.legalName ?? null,
      dbaName: outcome.carrier?.dbaName ?? null,
      allowToOperate: outcome.carrier?.allowToOperate ?? null,
      outOfService: outcome.carrier?.outOfService ?? null,
      outOfServiceDate: outcome.carrier?.outOfServiceDate ?? null,
      fieldComparisons: comparisons as unknown as Prisma.InputJsonValue,
      errorCode: outcome.errorCode ?? null,
      errorMessage: outcome.errorMessage ?? null,
      endpointUsed: outcome.endpointUsed,
      actorUserId: actor.id as string,
    },
  });

  const failed = result === "ERROR" || result === "UNAVAILABLE";
  await writeAudit(actor, input.fleetId, row.id, failed ? "carrier.fmcsa_verification_failed" : "carrier.fmcsa_verification", {
    provenance: outcome.provenance,
    result,
    freshnessState,
    queriedKind: kind,
    queriedValue,
    identifierFound: outcome.status === "FOUND",
    discrepancies: comparisons.filter((item) => item.result === "MISMATCH"),
    live: outcome.provenance === "LIVE",
    fixture: outcome.provenance === "FIXTURE",
    endpointUsed: outcome.endpointUsed,
    errorCode: outcome.errorCode ?? null,
  });

  if (result === "CONFLICT") {
    await openOperatingException(getOperatingProcessStore(), actor, {
      fleetId: input.fleetId,
      loadId: null,
      entityType: "FmcsaRegulatoryVerification",
      entityId: row.id,
      processStage: "DOCUMENTS",
      exceptionType: "FMCSA_FIELD_CONFLICT",
      deviation: "FMCSA evidence conflicts with the BOF carrier registry record.",
      consequence: "Regulatory mismatch is evidence for evaluation. It does not automatically stop dispatch or Secure Pickup.",
      severity: "MEDIUM",
      ownerTeam: "COMPLIANCE",
      ownerUserId: actor.id ?? null,
    });
  }

  return {
    verification: toPublic(row),
    bof,
    mutatedBofRecord: false,
  };
}
