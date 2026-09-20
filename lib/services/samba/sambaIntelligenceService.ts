import { Prisma, type SambaFindingSeverity, type SambaFindingStatus, type SambaProvenance } from "@prisma/client";

import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { createAuditRecord } from "@/lib/audit";
import { getCarrierById } from "@/lib/carrier-registry";
import { prisma } from "@/lib/prisma";
import { renderSambaContextNarrative, renderSambaExplanation, sambaLlmBoundary } from "@/lib/services/samba/explanation";
import { getSambaOperationalContext } from "@/lib/services/samba/sambaContext";
import { SAMBA_FINDING_TYPES, SAMBA_OPERATOR_ROLES, SAMBA_PATTERN_TYPES, type SambaEvidenceRef, type SambaStatement } from "@/lib/services/samba/types";

function requireSession(user: SessionUserLike | null | undefined) {
  if (!user?.id) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
}

function requireOperator(user: SessionUserLike, fleetId: string) {
  const access = requireFleetAccess(user, fleetId, [...SAMBA_OPERATOR_ROLES]);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, payload: { reason: access.reason } });
  }
}

function requireTenant(user: SessionUserLike, fleetId: string) {
  const access = requireFleetAccess(user, fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, payload: { reason: access.reason } });
  }
}

function mapFmcsaProvenance(value: string): { finding: SambaProvenance; evidence: string } {
  if (value === "LIVE") return { finding: "VERIFIED_EXTERNAL", evidence: "LIVE" };
  if (value === "CACHED") return { finding: "CACHED", evidence: "CACHED" };
  if (value === "FIXTURE") return { finding: "FIXTURE", evidence: "FIXTURE" };
  if (value === "UNAVAILABLE") return { finding: "INSUFFICIENT_EVIDENCE", evidence: "UNAVAILABLE" };
  return { finding: "UNVERIFIED", evidence: value };
}

async function audit(
  user: SessionUserLike,
  fleetId: string,
  findingId: string,
  event: string,
  details: Record<string, unknown>,
) {
  await createAuditRecord({
    actorId: user.id ?? null,
    actorEmail: user.email ?? null,
    tenantId: fleetId,
    action: "UPDATED",
    entityType: "SambaFinding",
    entityId: findingId,
    details: { event, llmUsed: false, ...details },
    metadata: { source: "samba-intelligence" },
  });
}

async function upsertOpenFinding(
  user: SessionUserLike,
  input: {
    fleetId: string;
    domain: "CARRIER" | "PICKUP" | "DRIVER" | "EQUIPMENT" | "OPERATIONS";
    entityType: string;
    entityId: string;
    findingType: string;
    severity: SambaFindingSeverity;
    provenance: SambaProvenance;
    evidenceFreshness?: string | null;
    evidenceSource: string;
    evidenceId?: string | null;
    evidenceTimestamp?: Date | null;
    demoReferenceUsed?: boolean;
    liveConnected?: boolean;
    fact: string;
    verifiedEvidence?: string | null;
    inference?: string | null;
    recommendation: string;
    explanation: string;
    statements: SambaStatement[];
    evidenceRefs: SambaEvidenceRef[];
    workflowHref?: string | null;
    relatedEntityRefs?: unknown;
    patternType?: string | null;
    recommendedAction?: string | null;
    temporalContext?: string | null;
    evidenceSummary?: string | null;
    whatHappened?: string | null;
    whyItMatters?: string | null;
    whatIsNotVerified?: string | null;
    context?: unknown;
  },
) {
  const existing = await prisma.sambaFinding.findFirst({
    where: {
      fleetId: input.fleetId,
      findingType: input.findingType,
      entityType: input.entityType,
      entityId: input.entityId,
      status: { in: ["OPEN", "ACKNOWLEDGED"] },
    },
  });
  if (existing) return { row: existing, created: false };

  const row = await prisma.sambaFinding.create({
    data: {
      fleetId: input.fleetId,
      domain: input.domain,
      entityType: input.entityType,
      entityId: input.entityId,
      findingType: input.findingType,
      severity: input.severity,
      status: "OPEN",
      provenance: input.provenance,
      evidenceFreshness: input.evidenceFreshness ?? null,
      evidenceSource: input.evidenceSource,
      evidenceId: input.evidenceId ?? null,
      evidenceTimestamp: input.evidenceTimestamp ?? null,
      demoReferenceUsed: input.demoReferenceUsed ?? false,
      liveConnected: input.liveConnected ?? false,
      fact: input.fact,
      verifiedEvidence: input.verifiedEvidence ?? null,
      inference: input.inference ?? null,
      recommendation: input.recommendation,
      explanation: input.explanation,
      statements: input.statements as unknown as Prisma.InputJsonValue,
      evidenceRefs: input.evidenceRefs as unknown as Prisma.InputJsonValue,
      workflowHref: input.workflowHref ?? null,
      relatedEntityRefs: (input.relatedEntityRefs as Prisma.InputJsonValue) ?? undefined,
      patternType: input.patternType ?? null,
      recommendedAction: input.recommendedAction ?? input.recommendation,
      temporalContext: input.temporalContext ?? null,
      evidenceSummary: input.evidenceSummary ?? null,
      whatHappened: input.whatHappened ?? null,
      whyItMatters: input.whyItMatters ?? null,
      whatIsNotVerified: input.whatIsNotVerified ?? null,
      context: (input.context as Prisma.InputJsonValue) ?? undefined,
      llmUsed: false,
      createdByUserId: user.id as string,
    },
  });
  await audit(user, input.fleetId, row.id, "samba.finding_created", {
    findingType: input.findingType,
    entityType: input.entityType,
    entityId: input.entityId,
    provenance: input.provenance,
    evidenceSource: input.evidenceSource,
    priorStatus: null,
    newStatus: "OPEN",
  });
  return { row, created: true };
}

export async function listSambaFindings(
  user: SessionUserLike | null | undefined,
  fleetId: string,
  relatedEntityId?: string | null,
) {
  requireSession(user);
  requireTenant(user!, fleetId);
  const rows = await prisma.sambaFinding.findMany({
    where: {
      fleetId,
      ...(relatedEntityId
        ? {
            OR: [{ entityId: relatedEntityId }, { evidenceId: relatedEntityId }],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });
  return {
    llm: sambaLlmBoundary(),
    mutatedOperationalRecords: false,
    findings: rows,
  };
}

export async function transitionSambaFinding(
  user: SessionUserLike | null | undefined,
  findingId: string,
  nextStatus: SambaFindingStatus,
  reason?: string | null,
) {
  requireSession(user);
  const actor = user!;
  const current = await prisma.sambaFinding.findUnique({ where: { id: findingId } });
  if (!current) throw Object.assign(new Error("Finding not found"), { statusCode: 404 });
  requireOperator(actor, current.fleetId);
  if (!["ACKNOWLEDGED", "RESOLVED", "DISMISSED"].includes(nextStatus)) {
    throw Object.assign(new Error("Unsupported Samba status transition"), { statusCode: 422 });
  }
  const now = new Date();
  const updated = await prisma.sambaFinding.update({
    where: { id: findingId },
    data: {
      status: nextStatus,
      resolutionReason: reason?.trim() || null,
      resolvedByUserId: actor.id as string,
      acknowledgedAt: nextStatus === "ACKNOWLEDGED" ? now : current.acknowledgedAt,
      resolvedAt: nextStatus === "RESOLVED" ? now : current.resolvedAt,
      dismissedAt: nextStatus === "DISMISSED" ? now : current.dismissedAt,
    },
  });
  const event =
    nextStatus === "ACKNOWLEDGED"
      ? "samba.finding_acknowledged"
      : nextStatus === "RESOLVED"
        ? "samba.finding_resolved"
        : "samba.finding_dismissed";
  await audit(actor, current.fleetId, updated.id, event, {
    findingType: current.findingType,
    entityType: current.entityType,
    entityId: current.entityId,
    evidenceSource: current.evidenceSource,
    priorStatus: current.status,
    newStatus: nextStatus,
    reason: reason?.trim() || null,
  });
  return { finding: updated, mutatedOperationalRecords: false };
}

export async function evaluateSambaIntelligence(user: SessionUserLike | null | undefined, fleetId: string) {
  requireSession(user);
  const actor = user!;
  requireOperator(actor, fleetId);
  const created: string[] = [];

  const fmcsaRows = await prisma.fmcsaRegulatoryVerification.findMany({
    where: { fleetId },
    orderBy: { verifiedAt: "desc" },
    take: 25,
  });
  const latestByCarrier = new Map<string, (typeof fmcsaRows)[number]>();
  for (const row of fmcsaRows) {
    const key = row.carrierRegistryId ?? `${row.queriedKind}:${row.queriedValue}`;
    if (!latestByCarrier.has(key)) latestByCarrier.set(key, row);
  }

  for (const row of latestByCarrier.values()) {
    const mapped = mapFmcsaProvenance(row.provenance);
    const carrier = row.carrierRegistryId ? getCarrierById(row.carrierRegistryId) : null;
    const comparisons = Array.isArray(row.fieldComparisons)
      ? (row.fieldComparisons as Array<{ field: string; result: string; bofValue?: string | null; fmcsaValue?: string | null }>)
      : [];
    const mismatches = comparisons.filter((item) => item.result === "MISMATCH");

    if (row.result === "UNAVAILABLE" || mapped.finding === "INSUFFICIENT_EVIDENCE") {
      continue;
    }

    if (row.result === "STALE" || row.freshnessState === "STALE") {
      const statements: SambaStatement[] = [
        {
          class: "VERIFIED_EVIDENCE",
          text: `Latest FMCSA verification for ${row.queriedKind} ${row.queriedValue} is STALE under BOF cache policy.`,
          source: "FmcsaRegulatoryVerification",
          provenance: mapped.evidence,
          authority: "EXTERNAL",
        },
      ];
      const evidence: SambaEvidenceRef[] = [
        {
          source: "FMCSA",
          entityType: "FmcsaRegulatoryVerification",
          entityId: row.id,
          provenance: mapped.evidence,
          timestamp: row.retrievedAt?.toISOString() ?? row.verifiedAt.toISOString(),
          freshness: "STALE",
        },
      ];
      const inserted = await upsertOpenFinding(actor, {
        fleetId,
        domain: "CARRIER",
        entityType: "FmcsaRegulatoryVerification",
        entityId: row.id,
        findingType: SAMBA_FINDING_TYPES.FMCSA_STALE_EVIDENCE,
        severity: "LOW",
        provenance: "CACHED",
        evidenceFreshness: "STALE",
        evidenceSource: "FMCSA",
        evidenceId: row.id,
        evidenceTimestamp: row.verifiedAt,
        demoReferenceUsed: Boolean(carrier),
        liveConnected: row.provenance === "LIVE",
        fact: `BOF has a cached FMCSA verification whose freshness is STALE.`,
        verifiedEvidence: `FMCSA provenance=${mapped.evidence}; result=${row.result}.`,
        inference: null,
        recommendation: "Refresh FMCSA verification through the existing Carrier Registry workflow before relying on this evidence.",
        explanation: renderSambaExplanation({
          whatHappened: "Cached FMCSA evidence is stale.",
          statements,
          evidence,
          whyFlagged: "Samba flags STALE evidence so it is not treated as a current live lookup.",
          review: "Open Carrier Registry FMCSA verification and refresh if authorized.",
          notVerified: "current QCMobile live status",
        }),
        statements,
        evidenceRefs: evidence,
        workflowHref: row.carrierRegistryId ? `/carriers/${row.carrierRegistryId}` : "/carriers",
      });
      if (inserted.created) created.push(inserted.row.id);
    }

    if (row.result === "CONFLICT" && mismatches.length > 0) {
      const statements: SambaStatement[] = [
        {
          class: "FACT",
          text: carrier
            ? `DEMO_REFERENCE Carrier Registry ${carrier.id} legalName=${carrier.legalName}, USDOT=${carrier.dotNumber}, MC=${carrier.mcNumber}, authority=${carrier.authority.status}.`
            : `No BOF carrier registry snapshot was attached.`,
          source: "CarrierRegistry",
          provenance: "UNVERIFIED",
          authority: "DEMO_REFERENCE",
        },
        {
          class: "VERIFIED_EVIDENCE",
          text: `FMCSA verification result=${row.result} legalName=${row.legalName ?? "n/a"} USDOT=${row.usdot ?? "n/a"} allowToOperate=${row.allowToOperate ?? "n/a"} provenance=${mapped.evidence}.`,
          source: "FmcsaRegulatoryVerification",
          provenance: mapped.evidence,
          authority: "EXTERNAL",
        },
        {
          class: "INFERENCE",
          text: `Field mismatches: ${mismatches.map((item) => item.field).join(", ")}.`,
          source: "Samba",
          provenance: "INFERRED",
          authority: "INFERENCE",
        },
        {
          class: "RECOMMENDATION",
          text: "Review DEMO_REFERENCE Carrier Registry and FMCSA evidence before additional dispatch. Samba will not change carrier or pickup state.",
          source: "Samba",
          provenance: "INFERRED",
          authority: "INFERENCE",
        },
      ];
      const evidence: SambaEvidenceRef[] = [
        {
          source: "FMCSA",
          entityType: "FmcsaRegulatoryVerification",
          entityId: row.id,
          provenance: mapped.evidence,
          timestamp: row.retrievedAt?.toISOString() ?? row.verifiedAt.toISOString(),
          freshness: row.freshnessState,
        },
      ];
      const inserted = await upsertOpenFinding(actor, {
        fleetId,
        domain: "CARRIER",
        entityType: "FmcsaRegulatoryVerification",
        entityId: row.id,
        findingType: SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT,
        severity: "MEDIUM",
        provenance: "INFERRED",
        evidenceFreshness: row.freshnessState,
        evidenceSource: "FMCSA",
        evidenceId: row.id,
        evidenceTimestamp: row.verifiedAt,
        demoReferenceUsed: true,
        liveConnected: row.provenance === "LIVE",
        fact: statements[0]!.text,
        verifiedEvidence: statements[1]!.text,
        inference: statements[2]!.text,
        recommendation: statements[3]!.text,
        explanation: renderSambaExplanation({
          whatHappened: "DEMO_REFERENCE Carrier Registry values conflict with the latest FMCSA verification fields.",
          statements,
          evidence,
          whyFlagged: "Samba infers a carrier-identity conflict from explicit MATCH/MISMATCH field results.",
          review: "Compare BOF vs FMCSA on the carrier detail page. Do not treat DEMO registry rows as LIVE operational authority.",
          notVerified: "physical identity, insurance filings, BOC-3, or live QCMobile unless provenance is LIVE",
        }),
        statements,
        evidenceRefs: evidence,
        workflowHref: row.carrierRegistryId ? `/carriers/${row.carrierRegistryId}` : "/carriers",
      });
      if (inserted.created) created.push(inserted.row.id);
    }
  }

  const stopped = await prisma.pickupAuthorization.findMany({
    where: { fleetId, status: "STOPPED" },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });
  for (const row of stopped) {
    const codes = Array.isArray(row.reasonCodes) ? (row.reasonCodes as unknown[]) : [];
    const statements: SambaStatement[] = [
      {
        class: "FACT",
        text: `PickupAuthorization ${row.id} status=STOPPED reason=${row.reason ?? "n/a"} codes=${codes.join(",") || "n/a"}.`,
        source: "PickupAuthorization",
        provenance: "LIVE",
        authority: "LIVE_BOF",
      },
      {
        class: "RECOMMENDATION",
        text: "Review the Secure Pickup desk. Samba will not stop or release the load.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
    ];
    const evidence: SambaEvidenceRef[] = [
      {
        source: "BOF",
        entityType: "PickupAuthorization",
        entityId: row.id,
        provenance: "LIVE",
        timestamp: row.stoppedAt?.toISOString() ?? row.updatedAt.toISOString(),
      },
    ];
    const inserted = await upsertOpenFinding(actor, {
      fleetId,
      domain: "PICKUP",
      entityType: "PickupAuthorization",
      entityId: row.id,
      findingType: SAMBA_FINDING_TYPES.PICKUP_STOPPED,
      severity: "HIGH",
      provenance: "LIVE",
      evidenceSource: "PickupAuthorization",
      evidenceId: row.id,
      evidenceTimestamp: row.stoppedAt ?? row.updatedAt,
      liveConnected: true,
      fact: statements[0]!.text,
      recommendation: statements[1]!.text,
      explanation: renderSambaExplanation({
        whatHappened: "A Secure Pickup authorization was STOPPED.",
        statements,
        evidence,
        whyFlagged: "Samba observes existing Phase 1 STOP records.",
        review: "Open /dispatch/pickup and inspect the authorization and attempts.",
        notVerified: "physical identity of the arriving driver",
      }),
      statements,
      evidenceRefs: evidence,
      workflowHref: `/dispatch/pickup?loadId=${row.loadId}`,
    });
    if (inserted.created) created.push(inserted.row.id);
  }

  const physicalStops = await prisma.pickupPhysicalReconciliation.findMany({
    where: { fleetId, disposition: "STOP" },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });
  for (const row of physicalStops) {
    const statements: SambaStatement[] = [
      {
        class: "FACT",
        text: `PickupPhysicalReconciliation ${row.id} disposition=STOP reason=${row.reason}. Physical identity class remains ${row.identityPhysicalClass}.`,
        source: "PickupPhysicalReconciliation",
        provenance: "LIVE",
        authority: "LIVE_BOF",
      },
      {
        class: "RECOMMENDATION",
        text: "Review the shipper dock workflow. Samba will not reverse a physical STOP.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
    ];
    const inserted = await upsertOpenFinding(actor, {
      fleetId,
      domain: "PICKUP",
      entityType: "PickupPhysicalReconciliation",
      entityId: row.id,
      findingType: SAMBA_FINDING_TYPES.PICKUP_PHYSICAL_STOP,
      severity: "HIGH",
      provenance: "LIVE",
      evidenceSource: "PickupPhysicalReconciliation",
      evidenceId: row.id,
      evidenceTimestamp: row.updatedAt,
      liveConnected: true,
      fact: statements[0]!.text,
      recommendation: statements[1]!.text,
      explanation: renderSambaExplanation({
        whatHappened: "Phase 2 physical reconciliation recorded STOP.",
        statements,
        evidence: [
          {
            source: "BOF",
            entityType: "PickupPhysicalReconciliation",
            entityId: row.id,
            provenance: "LIVE",
            timestamp: row.updatedAt.toISOString(),
          },
        ],
        whyFlagged: "Samba observes existing Phase 2 STOP dispositions.",
        review: "Open /dispatch/pickup/dock for this authorization.",
        notVerified: "driver's license, liveness, GPS, or telematics",
      }),
      statements,
      evidenceRefs: [
        {
          source: "BOF",
          entityType: "PickupPhysicalReconciliation",
          entityId: row.id,
          provenance: "LIVE",
          timestamp: row.updatedAt.toISOString(),
        },
      ],
      workflowHref: "/dispatch/pickup/dock",
    });
    if (inserted.created) created.push(inserted.row.id);
  }

  if (stopped.length >= 2) {
    const statements: SambaStatement[] = [
      {
        class: "INFERENCE",
        text: `This tenant has ${stopped.length} persisted STOPPED pickup authorizations.`,
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
      {
        class: "RECOMMENDATION",
        text: "Review repeated Secure Pickup stops. This is a pattern inference from existing STOP records, not a new operational gate.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
    ];
    const inserted = await upsertOpenFinding(actor, {
      fleetId,
      domain: "OPERATIONS",
      entityType: "Fleet",
      entityId: fleetId,
      findingType: SAMBA_FINDING_TYPES.PICKUP_REPEATED_STOP,
      severity: "MEDIUM",
      provenance: "INFERRED",
      evidenceSource: "PickupAuthorization",
      evidenceId: stopped[0]!.id,
      liveConnected: true,
      fact: `${stopped.length} STOPPED PickupAuthorization rows exist for this fleet.`,
      inference: statements[0]!.text,
      recommendation: statements[1]!.text,
      explanation: renderSambaExplanation({
        whatHappened: "Multiple persisted pickup STOP records exist in this tenant.",
        statements,
        evidence: stopped.slice(0, 5).map((row) => ({
          source: "BOF",
          entityType: "PickupAuthorization",
          entityId: row.id,
          provenance: "LIVE",
          timestamp: row.updatedAt.toISOString(),
        })),
        whyFlagged: "Samba reports a pattern only when two or more actual STOPPED rows already exist.",
        review: "Inspect Secure Pickup history. Samba does not change authorization status.",
        notVerified: "intent, fraud, or identity of arriving parties",
      }),
      statements,
      evidenceRefs: stopped.slice(0, 5).map((row) => ({
        source: "BOF",
        entityType: "PickupAuthorization",
        entityId: row.id,
        provenance: "LIVE",
        timestamp: row.updatedAt.toISOString(),
      })),
      workflowHref: "/dispatch/pickup",
    });
    if (inserted.created) created.push(inserted.row.id);
  }

  const now = new Date();
  const expiredLicenses = await prisma.driverLicense.findMany({
    where: {
      driver: { fleetId },
      OR: [{ status: "EXPIRED" }, { expirationDate: { lt: now } }],
    },
    take: 25,
    include: { driver: true },
  });
  for (const license of expiredLicenses) {
    const statements: SambaStatement[] = [
      {
        class: "FACT",
        text: `DriverLicense ${license.id} for driver ${license.driverId} expirationDate=${license.expirationDate?.toISOString() ?? "n/a"} status=${license.status}.`,
        source: "DriverLicense",
        provenance: "LIVE",
        authority: "LIVE_BOF",
      },
      {
        class: "RECOMMENDATION",
        text: "Review the driver qualification file. Samba will not change driver status.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
    ];
    const inserted = await upsertOpenFinding(actor, {
      fleetId,
      domain: "DRIVER",
      entityType: "DriverLicense",
      entityId: license.id,
      findingType: SAMBA_FINDING_TYPES.DRIVER_CREDENTIAL_EXPIRED,
      severity: "HIGH",
      provenance: "LIVE",
      evidenceSource: "DriverLicense",
      evidenceId: license.id,
      evidenceTimestamp: license.expirationDate,
      liveConnected: true,
      fact: statements[0]!.text,
      recommendation: statements[1]!.text,
      explanation: renderSambaExplanation({
        whatHappened: "A persisted driver license is expired according to BOF records.",
        statements,
        evidence: [
          {
            source: "BOF",
            entityType: "DriverLicense",
            entityId: license.id,
            provenance: "LIVE",
            timestamp: license.expirationDate?.toISOString() ?? null,
          },
        ],
        whyFlagged: "Samba reads existing DriverLicense.expirationDate / EXPIRED status.",
        review: `Open /drivers/${license.driverId}.`,
        notVerified: "physical license possession or an external DMV query",
      }),
      statements,
      evidenceRefs: [
        {
          source: "BOF",
          entityType: "DriverLicense",
          entityId: license.id,
          provenance: "LIVE",
          timestamp: license.expirationDate?.toISOString() ?? null,
        },
      ],
      workflowHref: `/drivers/${license.driverId}`,
    });
    if (inserted.created) created.push(inserted.row.id);
  }

  const notReady = await prisma.driverReadinessScore.findMany({
    where: { fleetId, status: "NOT_READY" },
    orderBy: { evaluatedAt: "desc" },
    take: 25,
  });
  const seenDrivers = new Set<string>();
  for (const row of notReady) {
    if (seenDrivers.has(row.driverId)) continue;
    seenDrivers.add(row.driverId);
    const statements: SambaStatement[] = [
      {
        class: "FACT",
        text: `DriverReadinessScore ${row.id} driver=${row.driverId} status=NOT_READY summary=${row.summary}.`,
        source: "DriverReadinessScore",
        provenance: "LIVE",
        authority: "LIVE_BOF",
      },
      {
        class: "RECOMMENDATION",
        text: "Use existing readiness/trip-release workflows. Samba will not assign or release.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
    ];
    const inserted = await upsertOpenFinding(actor, {
      fleetId,
      domain: "DRIVER",
      entityType: "DriverReadinessScore",
      entityId: row.id,
      findingType: SAMBA_FINDING_TYPES.DRIVER_NOT_READY,
      severity: "MEDIUM",
      provenance: "LIVE",
      evidenceSource: "DriverReadinessScore",
      evidenceId: row.id,
      evidenceTimestamp: row.evaluatedAt,
      liveConnected: true,
      fact: statements[0]!.text,
      recommendation: statements[1]!.text,
      explanation: renderSambaExplanation({
        whatHappened: "Existing BOF driver readiness is NOT_READY.",
        statements,
        evidence: [
          {
            source: "BOF",
            entityType: "DriverReadinessScore",
            entityId: row.id,
            provenance: "LIVE",
            timestamp: row.evaluatedAt.toISOString(),
          },
        ],
        whyFlagged: "Samba consumes DriverReadinessScore rather than inventing qualification rules.",
        review: "Open dispatch readiness for this driver.",
        notVerified: "physical identity or new documents not already in BOF",
      }),
      statements,
      evidenceRefs: [
        {
          source: "BOF",
          entityType: "DriverReadinessScore",
          entityId: row.id,
          provenance: "LIVE",
          timestamp: row.evaluatedAt.toISOString(),
        },
      ],
      workflowHref: "/dispatch",
    });
    if (inserted.created) created.push(inserted.row.id);
  }

  const equipment = await prisma.equipment.findMany({
    where: { fleetId, status: { in: ["UNAVAILABLE", "OUT_OF_SERVICE"] } },
    take: 25,
  });
  for (const unit of equipment) {
    const statements: SambaStatement[] = [
      {
        class: "FACT",
        text: `Equipment ${unit.id} unit=${unit.unitNumber} type=${unit.equipmentType} status=${unit.status}.`,
        source: "Equipment",
        provenance: "LIVE",
        authority: "LIVE_BOF",
      },
      {
        class: "RECOMMENDATION",
        text: "Review equipment status in dispatch. Samba will not reassign equipment.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
    ];
    const inserted = await upsertOpenFinding(actor, {
      fleetId,
      domain: "EQUIPMENT",
      entityType: "Equipment",
      entityId: unit.id,
      findingType: SAMBA_FINDING_TYPES.EQUIPMENT_UNAVAILABLE,
      severity: "MEDIUM",
      provenance: "LIVE",
      evidenceSource: "Equipment",
      evidenceId: unit.id,
      evidenceTimestamp: unit.updatedAt,
      liveConnected: true,
      fact: statements[0]!.text,
      recommendation: statements[1]!.text,
      explanation: renderSambaExplanation({
        whatHappened: "Equipment is UNAVAILABLE or OUT_OF_SERVICE in BOF.",
        statements,
        evidence: [
          {
            source: "BOF",
            entityType: "Equipment",
            entityId: unit.id,
            provenance: "LIVE",
            timestamp: unit.updatedAt.toISOString(),
          },
        ],
        whyFlagged: "Samba reads Equipment.status. No GPS or telematics was used.",
        review: "Open dispatch equipment.",
        notVerified: "physical location, VIN scan, or telematics",
      }),
      statements,
      evidenceRefs: [
        {
          source: "BOF",
          entityType: "Equipment",
          entityId: unit.id,
          provenance: "LIVE",
          timestamp: unit.updatedAt.toISOString(),
        },
      ],
      workflowHref: "/dispatch",
    });
    if (inserted.created) created.push(inserted.row.id);
  }

  const openConditions = await prisma.conditionThread.findMany({
    where: {
      fleetId,
      lifecycleState: { notIn: ["RESOLVED"] },
      severity: "BLOCKING",
    },
    take: 25,
  });
  for (const thread of openConditions) {
    const statements: SambaStatement[] = [
      {
        class: "FACT",
        text: `ConditionThread ${thread.id} equipment=${thread.equipmentId} severity=${thread.severity} lifecycle=${thread.lifecycleState} title=${thread.title}.`,
        source: "ConditionThread",
        provenance: "LIVE",
        authority: "LIVE_BOF",
      },
      {
        class: "RECOMMENDATION",
        text: "Review the existing condition thread. Samba will not close or reopen maintenance records.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
    ];
    const inserted = await upsertOpenFinding(actor, {
      fleetId,
      domain: "EQUIPMENT",
      entityType: "ConditionThread",
      entityId: thread.id,
      findingType: SAMBA_FINDING_TYPES.EQUIPMENT_CONDITION_OPEN,
      severity: "HIGH",
      provenance: "LIVE",
      evidenceSource: "ConditionThread",
      evidenceId: thread.id,
      liveConnected: true,
      fact: statements[0]!.text,
      recommendation: statements[1]!.text,
      explanation: renderSambaExplanation({
        whatHappened: "An unresolved BLOCKING equipment condition exists in BOF.",
        statements,
        evidence: [
          {
            source: "BOF",
            entityType: "ConditionThread",
            entityId: thread.id,
            provenance: "LIVE",
            timestamp: thread.updatedAt.toISOString(),
          },
        ],
        whyFlagged: "Samba consumes existing condition-thread severity BLOCKING.",
        review: "Open the equipment condition workspace.",
        notVerified: "telematics or an independent shop inspection beyond the stored thread",
      }),
      statements,
      evidenceRefs: [
        {
          source: "BOF",
          entityType: "ConditionThread",
          entityId: thread.id,
          provenance: "LIVE",
          timestamp: thread.updatedAt.toISOString(),
        },
      ],
      workflowHref: "/dispatch",
    });
    if (inserted.created) created.push(inserted.row.id);
  }

  await applySambaCorrelations(actor, fleetId, created);

  const listed = await listSambaFindings(actor, fleetId);
  return {
    createdCount: created.length,
    createdIds: created,
    mutatedOperationalRecords: false,
    llm: sambaLlmBoundary(),
    findings: listed.findings,
  };
}

export { getSambaOperationalContext };

async function applySambaCorrelations(actor: SessionUserLike, fleetId: string, created: string[]) {
  const stopped = await prisma.pickupAuthorization.findMany({
    where: { fleetId, status: "STOPPED" },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  const byDriver = new Map<string, typeof stopped>();
  const byTractor = new Map<string, typeof stopped>();
  for (const row of stopped) {
    byDriver.set(row.driverId, [...(byDriver.get(row.driverId) ?? []), row]);
    byTractor.set(row.tractorEquipmentId, [...(byTractor.get(row.tractorEquipmentId) ?? []), row]);
  }
  for (const [driverId, rows] of byDriver) {
    if (rows.length < 2) continue;
    const latest = rows[0]!;
    const statements: SambaStatement[] = [
      {
        class: "FACT",
        text: `${rows.length} STOPPED PickupAuthorization rows are related to driver ${driverId}. Latest=${latest.id}.`,
        source: "PickupAuthorization",
        provenance: "LIVE",
        authority: "LIVE_BOF",
      },
      {
        class: "INFERENCE",
        text: "This may be relevant to a repeated pickup assignment issue. Samba is not stating that the driver caused the stops.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
      {
        class: "RECOMMENDATION",
        text: "Review the driver/equipment assignment before another pickup attempt.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
    ];
    const inserted = await upsertOpenFinding(actor, {
      fleetId,
      domain: "PICKUP",
      entityType: "Driver",
      entityId: driverId,
      findingType: SAMBA_FINDING_TYPES.PICKUP_REPEATED_STOP,
      severity: "MEDIUM",
      provenance: "INFERRED",
      evidenceSource: "PickupAuthorization",
      evidenceId: latest.id,
      liveConnected: true,
      fact: statements[0]!.text,
      inference: statements[1]!.text,
      recommendation: statements[2]!.text,
      whatHappened: statements[0]!.text,
      whyItMatters: "A repeated STOP pattern is related to the same stored driver and may be relevant to operator review.",
      whatIsNotVerified: "intent, fraud, physical identity, or a causal link between stops",
      patternType: SAMBA_PATTERN_TYPES.REPEATED_PICKUP_STOP_SAME_DRIVER,
      recommendedAction: statements[2]!.text,
      relatedEntityRefs: rows.slice(0, 5).map((row) => ({ entityType: "PickupAuthorization", entityId: row.id, relationship: "prior_or_current_stop", provenance: "LIVE" })),
      explanation: renderSambaContextNarrative({
        whatHappened: statements[0]!.text,
        whyItMatters: "A repeated STOP pattern is related to the same stored driver and may be relevant to operator review.",
        whatSupportsThis: rows.slice(0, 5).map((row) => `FACT (LIVE_BOF/LIVE): PickupAuthorization ${row.id} status=STOPPED.`),
        whatIsNotVerified: "intent, fraud, physical identity, or a causal link between stops",
        whatToReviewNext: "Review the driver/equipment assignment before another pickup attempt.",
        workflowHref: "/dispatch/pickup",
      }),
      statements,
      evidenceRefs: rows.slice(0, 5).map((row) => ({
        source: "BOF",
        entityType: "PickupAuthorization",
        entityId: row.id,
        provenance: "LIVE",
        timestamp: row.updatedAt.toISOString(),
      })),
      workflowHref: `/dispatch/pickup?loadId=${latest.loadId}`,
    });
    if (inserted.created) created.push(inserted.row.id);
  }

  const notReady = await prisma.driverReadinessScore.findMany({
    where: { fleetId, status: "NOT_READY" },
    orderBy: { evaluatedAt: "desc" },
    take: 25,
  });
  const seenNotReady = new Set<string>();
  for (const row of notReady) {
    if (seenNotReady.has(row.driverId)) continue;
    seenNotReady.add(row.driverId);
    const assignment = await prisma.dispatchAssignment.findFirst({
      where: { fleetId, driverId: row.driverId, status: "ACTIVE" },
    });
    const pickup = await prisma.pickupAuthorization.findFirst({
      where: { fleetId, driverId: row.driverId, status: { in: ["PENDING", "AUTHORIZED", "STOPPED"] } },
      orderBy: { createdAt: "desc" },
    });
    if (!assignment && !pickup) continue;
    const relatedId = pickup?.id ?? assignment!.id;
    const statements: SambaStatement[] = [
      {
        class: "FACT",
        text: `DriverReadinessScore ${row.id} status=NOT_READY is related to ${pickup ? `PickupAuthorization ${pickup.id}` : `DispatchAssignment ${assignment!.id}`}.`,
        source: "DriverReadinessScore",
        provenance: "LIVE",
        authority: "LIVE_BOF",
      },
      {
        class: "INFERENCE",
        text: "A readiness issue is related to a current pickup workflow and may be relevant to dispatch review.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
      {
        class: "RECOMMENDATION",
        text: "Review driver readiness in the existing trip-release workflow. Samba will not change readiness.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
    ];
    const inserted = await upsertOpenFinding(actor, {
      fleetId,
      domain: "DRIVER",
      entityType: "Driver",
      entityId: row.driverId,
      findingType: SAMBA_FINDING_TYPES.DRIVER_NOT_READY_PICKUP_RELATED,
      severity: "MEDIUM",
      provenance: "INFERRED",
      evidenceSource: "DriverReadinessScore",
      evidenceId: row.id,
      liveConnected: true,
      fact: statements[0]!.text,
      inference: statements[1]!.text,
      recommendation: statements[2]!.text,
      patternType: SAMBA_PATTERN_TYPES.REPEATED_DRIVER_NOT_READY,
      relatedEntityRefs: [
        { entityType: "DriverReadinessScore", entityId: row.id, relationship: "readiness", provenance: "LIVE" },
        pickup
          ? { entityType: "PickupAuthorization", entityId: pickup.id, relationship: "related_pickup", provenance: "LIVE" }
          : { entityType: "DispatchAssignment", entityId: assignment!.id, relationship: "related_assignment", provenance: "LIVE" },
      ],
      whatHappened: statements[0]!.text,
      whyItMatters: statements[1]!.text,
      whatIsNotVerified: "physical identity or new qualification documents not already stored in BOF",
      recommendedAction: statements[2]!.text,
      explanation: renderSambaContextNarrative({
        whatHappened: statements[0]!.text,
        whyItMatters: statements[1]!.text,
        whatSupportsThis: [statements[0]!.text],
        whatIsNotVerified: "physical identity or new qualification documents not already stored in BOF",
        whatToReviewNext: statements[2]!.text,
        workflowHref: pickup ? `/dispatch/pickup?loadId=${pickup.loadId}` : "/dispatch",
      }),
      statements,
      evidenceRefs: [
        {
          source: "BOF",
          entityType: "DriverReadinessScore",
          entityId: row.id,
          provenance: "LIVE",
          timestamp: row.evaluatedAt.toISOString(),
        },
      ],
      workflowHref: pickup ? `/dispatch/pickup?loadId=${pickup.loadId}` : assignment ? `/trip-release/${assignment.loadId}` : "/dispatch",
    });
    if (inserted.created) created.push(inserted.row.id);
  }

  const conditions = await prisma.conditionThread.findMany({
    where: { fleetId, lifecycleState: { not: "RESOLVED" } },
    take: 25,
  });
  for (const thread of conditions) {
    const assignment = await prisma.dispatchAssignment.findFirst({
      where: {
        fleetId,
        status: "ACTIVE",
        OR: [{ tractorEquipmentId: thread.equipmentId }, { trailerEquipmentId: thread.equipmentId }],
      },
    });
    const pickup = await prisma.pickupAuthorization.findFirst({
      where: {
        fleetId,
        OR: [{ tractorEquipmentId: thread.equipmentId }, { trailerEquipmentId: thread.equipmentId }],
        status: { in: ["PENDING", "AUTHORIZED", "STOPPED", "RELEASED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!assignment && !pickup) continue;
    const statements: SambaStatement[] = [
      {
        class: "FACT",
        text: `ConditionThread ${thread.id} on equipment ${thread.equipmentId} lifecycle=${thread.lifecycleState} is related to ${pickup ? `PickupAuthorization ${pickup.id}` : `DispatchAssignment ${assignment!.id}`}.`,
        source: "ConditionThread",
        provenance: "LIVE",
        authority: "LIVE_BOF",
      },
      {
        class: "INFERENCE",
        text: "An equipment condition may be operationally relevant to the related pickup or assignment. Samba is not stating the condition caused a pickup outcome.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
      {
        class: "RECOMMENDATION",
        text: "Review the existing equipment condition workflow before relying on this unit for another pickup.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
    ];
    const inserted = await upsertOpenFinding(actor, {
      fleetId,
      domain: "EQUIPMENT",
      entityType: "ConditionThread",
      entityId: thread.id,
      findingType: SAMBA_FINDING_TYPES.EQUIPMENT_CONDITION_PICKUP_RELATED,
      severity: thread.severity === "BLOCKING" ? "HIGH" : "MEDIUM",
      provenance: "INFERRED",
      evidenceSource: "ConditionThread",
      evidenceId: thread.id,
      liveConnected: true,
      fact: statements[0]!.text,
      inference: statements[1]!.text,
      recommendation: statements[2]!.text,
      patternType: SAMBA_PATTERN_TYPES.REPEATED_EQUIPMENT_CONDITION,
      relatedEntityRefs: [
        { entityType: "Equipment", entityId: thread.equipmentId, relationship: "conditioned_equipment", provenance: "LIVE" },
        pickup
          ? { entityType: "PickupAuthorization", entityId: pickup.id, relationship: "related_pickup", provenance: "LIVE" }
          : { entityType: "DispatchAssignment", entityId: assignment!.id, relationship: "related_assignment", provenance: "LIVE" },
      ],
      whatHappened: statements[0]!.text,
      whyItMatters: statements[1]!.text,
      whatIsNotVerified: "shop inspection, telematics, or a causal link to pickup outcome",
      recommendedAction: statements[2]!.text,
      explanation: renderSambaContextNarrative({
        whatHappened: statements[0]!.text,
        whyItMatters: statements[1]!.text,
        whatSupportsThis: [statements[0]!.text],
        whatIsNotVerified: "shop inspection, telematics, or a causal link to pickup outcome",
        whatToReviewNext: statements[2]!.text,
        workflowHref: "/dispatch",
      }),
      statements,
      evidenceRefs: [
        {
          source: "BOF",
          entityType: "ConditionThread",
          entityId: thread.id,
          provenance: "LIVE",
          timestamp: thread.updatedAt.toISOString(),
        },
      ],
      workflowHref: pickup ? `/dispatch/pickup?loadId=${pickup.loadId}` : "/dispatch",
    });
    if (inserted.created) created.push(inserted.row.id);
  }

  const fmcsaConflicts = await prisma.fmcsaRegulatoryVerification.findMany({
    where: { fleetId, result: "CONFLICT" },
    orderBy: { verifiedAt: "desc" },
    take: 10,
  });
  for (const row of fmcsaConflicts) {
    if (!row.carrierRegistryId) continue;
    const statements: SambaStatement[] = [
      {
        class: "VERIFIED_EVIDENCE",
        text: `FmcsaRegulatoryVerification ${row.id} result=CONFLICT for DEMO_REFERENCE carrier ${row.carrierRegistryId}.`,
        source: "FmcsaRegulatoryVerification",
        provenance: row.provenance,
        authority: "EXTERNAL",
      },
      {
        class: "INFERENCE",
        text: "This external evidence conflict may be relevant to compliance review of that carrier packet. DEMO_REFERENCE is not LIVE carrier authority. Samba will not guess a Load relationship without a stored carrier foreign key.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
      {
        class: "RECOMMENDATION",
        text: "Review the FMCSA evidence conflict against the carrier record.",
        source: "Samba",
        provenance: "INFERRED",
        authority: "INFERENCE",
      },
    ];
    const inserted = await upsertOpenFinding(actor, {
      fleetId,
      domain: "CARRIER",
      entityType: "FmcsaRegulatoryVerification",
      entityId: row.id,
      findingType: SAMBA_FINDING_TYPES.FMCSA_CARRIER_WORKFLOW_RELATED,
      severity: "MEDIUM",
      provenance: "INFERRED",
      evidenceSource: "FMCSA",
      evidenceId: row.id,
      evidenceTimestamp: row.verifiedAt,
      demoReferenceUsed: true,
      liveConnected: row.provenance === "LIVE",
      fact: statements[0]!.text,
      inference: statements[1]!.text,
      recommendation: statements[2]!.text,
      patternType: SAMBA_PATTERN_TYPES.UNRESOLVED_FMCSA_CONFLICT,
      relatedEntityRefs: [{ entityType: "CarrierRegistry", entityId: row.carrierRegistryId, relationship: "demo_reference_overlay", provenance: "UNVERIFIED" }],
      whatHappened: statements[0]!.text,
      whyItMatters: statements[1]!.text,
      whatIsNotVerified: "LIVE carrier master, physical authority documents, or a load-carrier foreign key",
      recommendedAction: statements[2]!.text,
      explanation: renderSambaContextNarrative({
        whatHappened: statements[0]!.text,
        whyItMatters: statements[1]!.text,
        whatSupportsThis: [statements[0]!.text],
        whatIsNotVerified: "LIVE carrier master, physical authority documents, or a load-carrier foreign key",
        whatToReviewNext: statements[2]!.text,
        workflowHref: `/carriers/${row.carrierRegistryId}`,
      }),
      statements,
      evidenceRefs: [
        {
          source: "FMCSA",
          entityType: "FmcsaRegulatoryVerification",
          entityId: row.id,
          provenance: row.provenance,
          timestamp: row.verifiedAt.toISOString(),
          freshness: row.freshnessState,
        },
      ],
      workflowHref: `/carriers/${row.carrierRegistryId}`,
    });
    if (inserted.created) created.push(inserted.row.id);
  }
}
