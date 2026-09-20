import { prisma } from "@/lib/prisma";
import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { sambaLlmBoundary } from "@/lib/services/samba/explanation";
import { sambaTemporalLabel } from "@/lib/services/samba/temporal";
import {
  SAMBA_FINDING_TYPES,
  SAMBA_PATTERN_TYPES,
  type SambaEvidenceRef,
  type SambaOperationalContext,
  type SambaRelatedEntity,
} from "@/lib/services/samba/types";

function requireSession(user: SessionUserLike | null | undefined) {
  if (!user?.id) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
}

function requireTenant(user: SessionUserLike, fleetId: string) {
  const access = requireFleetAccess(user, fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, payload: { reason: access.reason } });
  }
}

function related(
  entityType: string,
  entityId: string,
  relationship: string,
  timestamp: Date | string | null | undefined,
  authority: SambaRelatedEntity["authority"] = "LIVE_BOF",
  provenance = "LIVE",
  freshness?: string | null,
): SambaRelatedEntity {
  return {
    entityType,
    entityId,
    relationship,
    provenance,
    authority,
    timestamp: timestamp ? new Date(timestamp).toISOString() : null,
    temporalLabel: sambaTemporalLabel(timestamp ?? null, freshness),
  };
}

export type SambaContextQuery = {
  loadId?: string | null;
  authorizationId?: string | null;
  driverId?: string | null;
  equipmentId?: string | null;
  carrierRegistryId?: string | null;
};

export async function getSambaOperationalContext(
  user: SessionUserLike | null | undefined,
  fleetId: string,
  query: SambaContextQuery = {},
): Promise<SambaOperationalContext> {
  requireSession(user);
  requireTenant(user!, fleetId);

  const missingEvidence: string[] = [];
  const relatedEntities: SambaRelatedEntity[] = [];
  const verifiedEvidence: SambaEvidenceRef[] = [];
  const externalEvidence: SambaEvidenceRef[] = [];

  let authorization = query.authorizationId
    ? await prisma.pickupAuthorization.findFirst({
        where: { id: query.authorizationId, fleetId },
        include: { load: true, assignment: true, driver: true, tractorEquipment: true, trailerEquipment: true, physicalReconciliation: true },
      })
    : null;

  if (!authorization && query.loadId) {
    authorization = await prisma.pickupAuthorization.findFirst({
      where: { loadId: query.loadId, fleetId },
      orderBy: { createdAt: "desc" },
      include: { load: true, assignment: true, driver: true, tractorEquipment: true, trailerEquipment: true, physicalReconciliation: true },
    });
  }

  let load = authorization?.load ?? (query.loadId
    ? await prisma.load.findFirst({ where: { id: query.loadId, fleetId } })
    : null);

  if (!load && !authorization && !query.loadId && !query.authorizationId && !query.driverId && !query.equipmentId && !query.carrierRegistryId) {
    load = await prisma.load.findFirst({ where: { fleetId }, orderBy: { updatedAt: "desc" } });
    if (load) {
      authorization = await prisma.pickupAuthorization.findFirst({
        where: { loadId: load.id, fleetId },
        orderBy: { createdAt: "desc" },
        include: { load: true, assignment: true, driver: true, tractorEquipment: true, trailerEquipment: true, physicalReconciliation: true },
      });
    }
  }

  const assignment = authorization?.assignment
    ?? (load
      ? await prisma.dispatchAssignment.findFirst({
          where: { loadId: load.id, fleetId, status: "ACTIVE" },
          include: { driver: true, tractorEquipment: true, trailerEquipment: true },
        })
      : query.driverId
        ? await prisma.dispatchAssignment.findFirst({
            where: { driverId: query.driverId, fleetId, status: "ACTIVE" },
            include: { driver: true, tractorEquipment: true, trailerEquipment: true, load: true },
          })
        : query.equipmentId
          ? await prisma.dispatchAssignment.findFirst({
              where: {
                fleetId,
                status: "ACTIVE",
                OR: [{ tractorEquipmentId: query.equipmentId }, { trailerEquipmentId: query.equipmentId }],
              },
              include: { driver: true, tractorEquipment: true, trailerEquipment: true, load: true },
            })
          : null);

  if (!load && assignment && "load" in assignment && assignment.load) {
    load = assignment.load;
  }

  const driverId = authorization?.driverId ?? assignment?.driverId ?? query.driverId ?? null;
  const tractorId = authorization?.tractorEquipmentId ?? assignment?.tractorEquipmentId ?? query.equipmentId ?? null;
  const trailerId = authorization?.trailerEquipmentId ?? assignment?.trailerEquipmentId ?? null;

  let primary: SambaRelatedEntity | null = null;
  if (authorization) {
    primary = related("PickupAuthorization", authorization.id, "primary", authorization.updatedAt);
  } else if (load) {
    primary = related("Load", load.id, "primary", load.updatedAt);
  } else if (query.carrierRegistryId) {
    primary = related("CarrierRegistry", query.carrierRegistryId, "primary", null, "DEMO_REFERENCE", "UNVERIFIED");
  } else if (driverId) {
    primary = related("Driver", driverId, "primary", null);
  } else if (tractorId) {
    primary = related("Equipment", tractorId, "primary", null);
  }

  if (load) relatedEntities.push(related("Load", load.id, "assigned_or_authorized_load", load.updatedAt));
  else missingEvidence.push("No Load row is related by a stored pickup authorization or active assignment.");

  if (authorization) relatedEntities.push(related("PickupAuthorization", authorization.id, "phase1_authorization", authorization.updatedAt));
  if (assignment) relatedEntities.push(related("DispatchAssignment", assignment.id, "active_or_authorized_assignment", assignment.assignedAt));
  if (driverId) relatedEntities.push(related("Driver", driverId, "assigned_driver", authorization?.updatedAt ?? assignment?.assignedAt ?? null));
  if (tractorId) relatedEntities.push(related("Equipment", tractorId, "assigned_tractor", authorization?.updatedAt ?? assignment?.assignedAt ?? null));
  if (trailerId) relatedEntities.push(related("Equipment", trailerId, "assigned_trailer", authorization?.updatedAt ?? assignment?.assignedAt ?? null));

  const tripRelease = load && assignment
    ? await prisma.dispatchRelease.findFirst({
        where: { loadId: load.id, assignmentId: assignment.id, fleetId },
        orderBy: { evaluatedAt: "desc" },
      })
    : null;
  if (tripRelease) relatedEntities.push(related("DispatchRelease", tripRelease.id, "trip_release", tripRelease.evaluatedAt));
  else if (load) missingEvidence.push("No DispatchRelease is stored for this load/assignment pair.");

  const readiness = driverId
    ? await prisma.driverReadinessScore.findFirst({
        where: { driverId, fleetId },
        orderBy: { evaluatedAt: "desc" },
      })
    : null;
  if (readiness) relatedEntities.push(related("DriverReadinessScore", readiness.id, "driver_readiness", readiness.evaluatedAt));
  else if (driverId) missingEvidence.push("No DriverReadinessScore is stored for the related driver.");

  if (authorization?.physicalReconciliation) {
    relatedEntities.push(
      related("PickupPhysicalReconciliation", authorization.physicalReconciliation.id, "phase2_physical_reconciliation", authorization.physicalReconciliation.updatedAt),
    );
  } else if (authorization) {
    missingEvidence.push("No PickupPhysicalReconciliation is stored for this authorization.");
  }

  const license = driverId
    ? await prisma.driverLicense.findFirst({ where: { driverId }, orderBy: { expirationDate: "desc" } })
    : null;
  if (license) relatedEntities.push(related("DriverLicense", license.id, "driver_credential", license.expirationDate));
  else if (driverId) missingEvidence.push("No DriverLicense is stored for the related driver.");

  const conditions = tractorId
    ? await prisma.conditionThread.findMany({
        where: { fleetId, equipmentId: { in: [tractorId, trailerId].filter(Boolean) as string[] }, lifecycleState: { not: "RESOLVED" } },
        take: 10,
      })
    : [];
  for (const thread of conditions) {
    relatedEntities.push(related("ConditionThread", thread.id, "open_equipment_condition", thread.updatedAt));
  }

  if (query.carrierRegistryId) {
    relatedEntities.push(related("CarrierRegistry", query.carrierRegistryId, "demo_reference_carrier", null, "DEMO_REFERENCE", "UNVERIFIED"));
    const fmcsa = await prisma.fmcsaRegulatoryVerification.findFirst({
      where: { fleetId, carrierRegistryId: query.carrierRegistryId },
      orderBy: { verifiedAt: "desc" },
    });
    if (fmcsa) {
      relatedEntities.push(related("FmcsaRegulatoryVerification", fmcsa.id, "external_fmcsa_overlay", fmcsa.verifiedAt, "EXTERNAL", fmcsa.provenance, fmcsa.freshnessState));
      externalEvidence.push({
        source: "FMCSA",
        entityType: "FmcsaRegulatoryVerification",
        entityId: fmcsa.id,
        provenance: fmcsa.provenance,
        timestamp: fmcsa.verifiedAt.toISOString(),
        freshness: fmcsa.freshnessState,
      });
    } else {
      missingEvidence.push("No FmcsaRegulatoryVerification is stored for this DEMO_REFERENCE carrier id.");
    }
    missingEvidence.push("INSUFFICIENT_EVIDENCE: no stored carrier foreign key relates this DEMO_REFERENCE carrier to a LIVE load.");
  } else if (load) {
    missingEvidence.push("INSUFFICIENT_EVIDENCE: Load has no stored carrier foreign key, so Samba will not guess a carrier relationship.");
  }

  const loadIds = [load?.id, authorization?.loadId].filter(Boolean) as string[];
  const eventFilters = [
    loadIds.length ? { loadId: { in: loadIds } } : null,
    authorization ? { entityId: authorization.id } : null,
    authorization?.physicalReconciliation ? { entityId: authorization.physicalReconciliation.id } : null,
  ].filter((row): row is { loadId: { in: string[] } } | { entityId: string } => row !== null);
  const events = eventFilters.length
    ? await prisma.operatingProcessEvent.findMany({
        where: { fleetId, OR: eventFilters },
        orderBy: { eventTimestamp: "asc" },
        take: 25,
      })
    : [];

  const recentEvents = events.map((event) => ({
    eventType: event.eventType,
    entityType: event.entityType,
    entityId: event.entityId,
    resultingState: event.resultingState,
    timestamp: event.eventTimestamp.toISOString(),
    temporalLabel: sambaTemporalLabel(event.eventTimestamp),
    provenance: "LIVE" as const,
  }));

  const relatedIds = relatedEntities.map((row) => row.entityId);
  const findings = await prisma.sambaFinding.findMany({
    where: {
      fleetId,
      status: { in: ["OPEN", "ACKNOWLEDGED"] },
      ...(relatedIds.length
        ? { OR: [{ entityId: { in: relatedIds } }, { evidenceId: { in: relatedIds } }] }
        : query.carrierRegistryId
          ? {
              findingType: {
                in: [
                  SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT,
                  SAMBA_FINDING_TYPES.FMCSA_STALE_EVIDENCE,
                  SAMBA_FINDING_TYPES.FMCSA_CARRIER_WORKFLOW_RELATED,
                ],
              },
            }
          : { id: "__no-related-entity__" }),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const exceptions = await prisma.operatingException.findMany({
    where: {
      fleetId,
      status: "OPEN",
      ...(load ? { loadId: load.id } : {}),
    },
    take: 20,
  });

  const stoppedSameDriver = driverId
    ? await prisma.pickupAuthorization.count({ where: { fleetId, driverId, status: "STOPPED" } })
    : 0;
  const stoppedSameEquipment = tractorId
    ? await prisma.pickupAuthorization.count({ where: { fleetId, tractorEquipmentId: tractorId, status: "STOPPED" } })
    : 0;
  const notReadyCount = driverId
    ? await prisma.driverReadinessScore.count({ where: { fleetId, driverId, status: "NOT_READY" } })
    : 0;

  const repeatedPatterns: SambaOperationalContext["repeatedPatterns"] = [];
  if (stoppedSameDriver >= 2 && driverId) {
    repeatedPatterns.push({
      patternType: SAMBA_PATTERN_TYPES.REPEATED_PICKUP_STOP_SAME_DRIVER,
      relatedEntityType: "Driver",
      relatedEntityId: driverId,
      evidenceCount: stoppedSameDriver,
      inference: `${stoppedSameDriver} STOPPED pickup authorizations are related to the same stored driver. This is a repeated pattern, not a proven cause.`,
    });
  }
  if (stoppedSameEquipment >= 2 && tractorId) {
    repeatedPatterns.push({
      patternType: SAMBA_PATTERN_TYPES.REPEATED_PICKUP_STOP_SAME_EQUIPMENT,
      relatedEntityType: "Equipment",
      relatedEntityId: tractorId,
      evidenceCount: stoppedSameEquipment,
      inference: `${stoppedSameEquipment} STOPPED pickup authorizations are related to the same stored tractor. This is a repeated pattern, not a proven cause.`,
    });
  }
  if (notReadyCount >= 2 && driverId) {
    repeatedPatterns.push({
      patternType: SAMBA_PATTERN_TYPES.REPEATED_DRIVER_NOT_READY,
      relatedEntityType: "Driver",
      relatedEntityId: driverId,
      evidenceCount: notReadyCount,
      inference: "Multiple NOT_READY DriverReadinessScore rows are related to this driver.",
    });
  }
  if (conditions.length >= 2 && tractorId) {
    repeatedPatterns.push({
      patternType: SAMBA_PATTERN_TYPES.REPEATED_EQUIPMENT_CONDITION,
      relatedEntityType: "Equipment",
      relatedEntityId: tractorId,
      evidenceCount: conditions.length,
      inference: "Multiple unresolved ConditionThread rows are related to assigned equipment.",
    });
  }

  const physical = authorization?.physicalReconciliation ?? null;
  const supports: string[] = [];
  if (tripRelease) supports.push(`FACT (LIVE_BOF/LIVE): trip release disposition=${tripRelease.disposition}.`);
  if (readiness) supports.push(`FACT (LIVE_BOF/LIVE): driver readiness status=${readiness.status}.`);
  if (authorization) supports.push(`FACT (LIVE_BOF/LIVE): Phase 1 pickup authorization status=${authorization.status}.`);
  if (physical) {
    supports.push(`FACT (LIVE_BOF/LIVE): Phase 2 disposition=${physical.disposition}; driver=${physical.driverArrivalResult}; tractor=${physical.tractorArrivalResult}; authorization=${physical.authorizationArrivalResult}.`);
    verifiedEvidence.push({
      source: "BOF",
      entityType: "PickupPhysicalReconciliation",
      entityId: physical.id,
      provenance: "LIVE",
      timestamp: physical.updatedAt.toISOString(),
    });
  }
  for (const event of recentEvents) {
    verifiedEvidence.push({
      source: "BOF",
      entityType: event.entityType,
      entityId: event.entityId,
      provenance: "LIVE",
      timestamp: event.timestamp,
    });
  }

  const identityUnverified = !physical || physical.identityPhysicalClass === "UNVERIFIED";
  const cleanRelease =
    authorization?.status === "RELEASED" &&
    physical?.disposition === "RELEASE" &&
    physical.identityPhysicalClass !== "IDENTITY_PHYSICALLY_VERIFIED";

  let whatHappened: string;
  let whyItMatters: string;
  let whatToReviewNext: string;
  let summary: string;
  let recommended = null as SambaOperationalContext["recommendedReview"];
  let workflowHref: string | null = load ? `/dispatch/pickup?loadId=${load.id}` : "/dispatch/pickup";

  if (!primary) {
    whatHappened = "INSUFFICIENT_EVIDENCE: Samba found no related Load, PickupAuthorization, Driver, Equipment, or CarrierRegistry id in this tenant query.";
    whyItMatters = "Samba cannot construct operational context without stored entity relationships.";
    whatToReviewNext = "Open Command Center and select a LIVE load or existing workflow record.";
    summary = whatHappened;
    missingEvidence.push("No primary BOF entity was supplied or discoverable.");
    workflowHref = "/command-center";
    recommended = { text: "Review LIVE Command Center for stored operating records.", workflowHref, workflowLabel: "Command Center", executesAction: false };
  } else if (cleanRelease && physical) {
    whatHappened =
      "Pickup authorization completed successfully after trip release, readiness, and physical record reconciliation. Presented driver and tractor records matched the authorization.";
    whyItMatters = "The records reconciled successfully for this authorization. This is an intelligence summary, not a new operational state.";
    whatToReviewNext = "No exception review is currently indicated.";
    summary =
      "Pickup authorization completed successfully after trip release, readiness, and physical record reconciliation. Presented driver and tractor records matched the authorization. Physical identity remains unverified because no physical identity provider is connected.";
    recommended = {
      text: "No exception review is currently indicated. Open the existing pickup authorization if a desk check is needed.",
      workflowHref: workflowHref!,
      workflowLabel: "Pickup authorization",
      executesAction: false,
    };
  } else if (authorization?.status === "STOPPED" || physical?.disposition === "STOP") {
    whatHappened = `Pickup ${authorization?.status === "STOPPED" ? "authorization was STOPPED" : "physical reconciliation recorded STOP"} for stored authorization ${authorization?.id}.`;
    whyItMatters = "A persisted STOP is related to this load/driver/equipment set and may be relevant to the next pickup attempt.";
    whatToReviewNext = "Review the driver/equipment assignment before another pickup attempt.";
    summary = `${whatHappened} Correlation is not causation. Physical identity remains UNVERIFIED.`;
    recommended = {
      text: "Review the driver/equipment assignment before another pickup attempt.",
      workflowHref: workflowHref!,
      workflowLabel: "Pickup authorization",
      executesAction: false,
    };
  } else if (readiness?.status === "NOT_READY" && (assignment || authorization)) {
    whatHappened = `DriverReadinessScore ${readiness.id} is NOT_READY and is related to an active assignment or pickup authorization.`;
    whyItMatters = "A readiness issue is related to a current pickup workflow and may be relevant to dispatch review.";
    whatToReviewNext = "Review driver readiness in the existing trip-release workflow.";
    summary = whatHappened;
    workflowHref = load ? `/trip-release/${load.id}` : "/dispatch";
    recommended = {
      text: "Review driver readiness in the existing trip-release workflow. Samba will not change readiness.",
      workflowHref,
      workflowLabel: "Trip release",
      executesAction: false,
    };
  } else if (query.carrierRegistryId) {
    const conflict = findings.find((row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT);
    const stale = findings.find((row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_STALE_EVIDENCE);
    if (conflict) {
      whatHappened = `FMCSA overlay evidence conflicts with the DEMO_REFERENCE carrier snapshot for ${query.carrierRegistryId}.`;
      whyItMatters = "External evidence conflict may be relevant to compliance review. DEMO_REFERENCE is not LIVE carrier authority.";
      whatToReviewNext = "Review the FMCSA evidence conflict against the carrier record.";
      summary = whatHappened;
      workflowHref = `/carriers/${query.carrierRegistryId}`;
      recommended = {
        text: "Review the FMCSA evidence conflict against the carrier record. Samba will not change carrier authority.",
        workflowHref,
        workflowLabel: "Carrier Registry",
        executesAction: false,
      };
    } else if (stale) {
      whatHappened = `Cached FMCSA evidence related to DEMO_REFERENCE carrier ${query.carrierRegistryId} is STALE.`;
      whyItMatters = "Stale external evidence should not be treated as current compliance status.";
      whatToReviewNext = "Refresh FMCSA verification through the existing Carrier Registry workflow.";
      summary = whatHappened;
      workflowHref = `/carriers/${query.carrierRegistryId}`;
      recommended = {
        text: "Refresh FMCSA verification through the existing Carrier Registry workflow.",
        workflowHref,
        workflowLabel: "Carrier Registry",
        executesAction: false,
      };
    } else {
      whatHappened = `Carrier Registry ${query.carrierRegistryId} is DEMO_REFERENCE. No LIVE carrier master is related.`;
      whyItMatters = "Reference-only carrier packets are not operating-spine authority.";
      whatToReviewNext = "Use existing carrier packet review if packet controls need attention.";
      summary = whatHappened;
      missingEvidence.push("INSUFFICIENT_EVIDENCE for a LIVE carrier master relationship.");
      workflowHref = `/carriers/${query.carrierRegistryId}`;
    }
  } else {
    whatHappened = primary
      ? `Samba assembled stored BOF relationships around ${primary.entityType} ${primary.entityId}.`
      : "INSUFFICIENT_EVIDENCE";
    whyItMatters = "Related records are available for operator review. Samba has not created operational state.";
    whatToReviewNext = missingEvidence.length ? "Collect missing related records in existing BOF workflows." : "No exception review is currently indicated.";
    summary = whatHappened;
    recommended = {
      text: whatToReviewNext,
      workflowHref: workflowHref ?? "/command-center",
      workflowLabel: "Existing BOF workflow",
      executesAction: false,
    };
  }

  const whatIsNotVerified = identityUnverified
    ? "Physical identity and physical equipment identity remain UNVERIFIED. No physical identity provider, DL verification, liveness, GPS, or telematics is connected. Correlation is not causation."
    : "Samba did not independently verify physical identity beyond stored BOF records.";

  return {
    authority: "SAMBA_INTELLIGENCE",
    mayAuthorOperationalState: false,
    mutatedOperationalRecords: false,
    llm: sambaLlmBoundary(),
    primaryEntity: primary,
    relatedEntities,
    recentEvents,
    relevantFindings: findings.map((row) => ({
      id: row.id,
      findingType: row.findingType,
      status: row.status,
      provenance: row.provenance,
    })),
    verifiedEvidence,
    externalEvidence,
    unresolvedExceptions: exceptions.map((row) => ({
      id: row.id,
      exceptionType: row.exceptionType,
      entityType: row.entityType,
      entityId: row.entityId,
      status: row.status,
    })),
    repeatedPatterns,
    missingEvidence,
    recommendedReview: recommended,
    narrative: {
      whatHappened,
      whyItMatters,
      whatSupportsThis: supports.length ? supports : ["INSUFFICIENT_EVIDENCE"],
      whatIsNotVerified,
      whatToReviewNext,
      workflowHref,
      workflowLabel: recommended?.workflowLabel ?? null,
    },
    summary,
    provenance: primary ? "LIVE" : "INSUFFICIENT_EVIDENCE",
    timestamps: { generatedAt: new Date().toISOString() },
  };
}
