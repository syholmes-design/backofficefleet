import {
  DispatchAssignmentStatus,
  DispatchReleaseDisposition,
  DriverReadinessState,
  Prisma,
  type PickupStopReasonCode,
  type PickupVerificationMethod,
} from "@prisma/client";

import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";
import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { recordOperatingProcessEvent } from "@/lib/process-intelligence/operating-event-service";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import { getPickupAuthorization } from "@/lib/services/pickupAuthorizationService";
import {
  PHASE2_PHYSICAL_UNVERIFIED_NOTE,
  PICKUP_PHYSICAL_POLICY_VERSION,
  evaluatePickupPhysicalArrival,
  refuseUnimplementedPhysicalKind,
  type PickupArrivalObservation,
} from "@/lib/services/pickupPhysicalArrival";
import { pickupAuthorizationTokensMatch } from "@/lib/services/pickupToken";

export const SHIPPER_DOCK_ROLES = ["FLEET_ADMIN", "FLEET_OPERATIONS", "DISPATCH"] as const;

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function toPublicPhysical(row: {
  id: string;
  pickupAuthorizationId: string;
  fleetId: string;
  loadId: string;
  disposition: string;
  driverArrivalResult: string;
  tractorArrivalResult: string;
  trailerArrivalResult: string;
  loadArrivalResult: string;
  authorizationArrivalResult: string;
  identityMatchToAuthorizedRecord: boolean;
  identityPhysicalClass: string;
  equipmentPhysicalClass: string;
  method: string;
  reason: string;
  reasonCodes: Prisma.JsonValue;
  evidenceReference: string | null;
  actorUserId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    pickupAuthorizationId: row.pickupAuthorizationId,
    fleetId: row.fleetId,
    loadId: row.loadId,
    disposition: row.disposition,
    dimensions: {
      driver: row.driverArrivalResult,
      tractor: row.tractorArrivalResult,
      trailer: row.trailerArrivalResult,
      load: row.loadArrivalResult,
      authorization: row.authorizationArrivalResult,
    },
    identityMatchToAuthorizedRecord: row.identityMatchToAuthorizedRecord,
    identityClass: row.identityMatchToAuthorizedRecord
      ? "IDENTITY_MATCHED_TO_AUTHORIZED_RECORD"
      : "UNVERIFIED",
    identityPhysicalClass: row.identityPhysicalClass,
    equipmentPhysicalClass: row.equipmentPhysicalClass,
    identityPhysicallyVerified: false,
    method: row.method,
    reason: row.reason,
    reasonCodes: row.reasonCodes,
    evidenceReference: row.evidenceReference,
    actorUserId: row.actorUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    physicalVerificationNote: PHASE2_PHYSICAL_UNVERIFIED_NOTE,
  };
}

export async function getPickupDockView(sessionUser: SessionUserLike | null | undefined, authorizationId: string) {
  requireSessionUser(sessionUser);
  const detail = await getPickupAuthorization(sessionUser, authorizationId);
  const role = requireFleetAccess(sessionUser, detail.authorization.fleetId, [...SHIPPER_DOCK_ROLES]);
  if (!role.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, payload: { reason: role.reason } });
  }

  const row = await prisma.pickupAuthorization.findUniqueOrThrow({
    where: { id: authorizationId },
    include: {
      load: true,
      driver: true,
      tractorEquipment: true,
      trailerEquipment: true,
      fleet: true,
      physicalReconciliation: true,
    },
  });

  return {
    authorization: {
      id: row.id,
      status: row.status,
      expiresAt: row.expiresAt,
      physicalIdentityClass: row.physicalIdentityClass,
      physicalEquipmentClass: row.physicalEquipmentClass,
    },
    shipment: {
      loadId: row.loadId,
      customerName: row.load.customerName,
      origin: row.load.origin,
      destination: row.load.destination,
      carrierName: row.fleet.name,
    },
    authorized: {
      driverDisplay: `${row.driver.firstName} ${row.driver.lastName.slice(0, 1)}.`,
      tractorUnitNumber: row.tractorEquipment.unitNumber,
      trailerUnitNumber: row.trailerEquipment?.unitNumber ?? null,
    },
    physical: row.physicalReconciliation ? toPublicPhysical(row.physicalReconciliation) : null,
    physicalVerificationNote: PHASE2_PHYSICAL_UNVERIFIED_NOTE,
  };
}

export async function reconcilePickupPhysicalArrival(
  sessionUser: SessionUserLike | null | undefined,
  authorizationId: string,
  input: {
    token: string;
    method?: PickupVerificationMethod | string | null;
    arriving?: PickupArrivalObservation;
    evidenceReference?: string | null;
    intendedDisposition?: "RELEASE" | "STOP" | null;
    stopReason?: string | null;
  },
) {
  requireSessionUser(sessionUser);
  const actorId = sessionUser!.id as string;
  const method = (input.method ?? "SHIPPER_DOCK") as PickupVerificationMethod;
  refuseUnimplementedPhysicalKind(method);

  const detail = await getPickupAuthorization(sessionUser, authorizationId);
  const role = requireFleetAccess(sessionUser, detail.authorization.fleetId, [...SHIPPER_DOCK_ROLES]);
  if (!role.allowed) {
    await createAuditRecord({
      actorId,
      actorEmail: sessionUser!.email ?? null,
      tenantId: detail.authorization.fleetId,
      action: "ACCESS_DENIED",
      entityType: "PickupPhysicalReconciliation",
      entityId: authorizationId,
      details: { event: "unauthorized shipper dock", reason: role.reason },
      metadata: { source: "pickup-physical-reconciliation" },
    });
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, payload: { reason: role.reason } });
  }

  const row = await prisma.pickupAuthorization.findUniqueOrThrow({
    where: { id: authorizationId },
    include: {
      load: true,
      assignment: true,
      driver: true,
      tractorEquipment: true,
      trailerEquipment: true,
      physicalReconciliation: true,
    },
  });

  const tokenValid = pickupAuthorizationTokensMatch(input.token, row.tokenHash);
  const arriving = input.arriving ?? {};

  const throwDecision = async (
    statusCode: number,
    result: "REJECTED" | "STOPPED" | "RELEASED",
    decision: ReturnType<typeof evaluatePickupPhysicalArrival>,
    extraCodes: PickupStopReasonCode[] = [],
    options?: { persistPhysical?: boolean; stopPhase1?: boolean },
  ): Promise<never> => {
    const reasonCodes = [...new Set([...decision.reasonCodes, ...extraCodes])];
    const persistPhysical = options?.persistPhysical !== false;
    const stopPhase1 = options?.stopPhase1 === true;
    const attempt = await prisma.pickupVerificationAttempt.create({
      data: {
        pickupAuthorizationId: row.id,
        fleetId: row.fleetId,
        method,
        result,
        presentedTokenValid: tokenValid,
        presentedDriverId: arriving.driverId?.trim() || null,
        presentedTractorEquipmentId: arriving.tractorId?.trim() || null,
        presentedTrailerEquipmentId: arriving.trailerId?.trim() || null,
        presentedLoadId: arriving.loadId?.trim() || null,
        presentedAuthorizationId: arriving.authorizationId?.trim() || authorizationId,
        reason: decision.summary,
        reasonCodes: reasonCodes as Prisma.InputJsonValue,
        physicalVerificationPerformed: false,
        actorUserId: actorId,
      },
    });

    const physicalData = {
      disposition: decision.disposition,
      driverArrivalResult: decision.driverArrivalResult,
      tractorArrivalResult: decision.tractorArrivalResult,
      trailerArrivalResult: decision.trailerArrivalResult,
      loadArrivalResult: decision.loadArrivalResult,
      authorizationArrivalResult: decision.authorizationArrivalResult,
      identityMatchToAuthorizedRecord: decision.identityMatchToAuthorizedRecord,
      identityPhysicalClass: "UNVERIFIED" as const,
      equipmentPhysicalClass: "UNVERIFIED" as const,
      method,
      arrivingDriverId: arriving.driverId?.trim() || null,
      arrivingTractorUnitNumber: arriving.tractorUnitNumber?.trim() || null,
      arrivingTrailerUnitNumber: arriving.trailerUnitNumber?.trim() || null,
      arrivingVin: arriving.vin?.trim() || null,
      arrivingPlate: arriving.plate?.trim() || null,
      arrivingQr: arriving.qr?.trim() || null,
      reason: decision.summary,
      reasonCodes: reasonCodes as Prisma.InputJsonValue,
      evidenceReference: input.evidenceReference?.trim() || null,
      actorUserId: actorId,
    };

    const physical = persistPhysical
      ? await prisma.pickupPhysicalReconciliation.upsert({
          where: { pickupAuthorizationId: row.id },
          update: physicalData,
          create: {
            pickupAuthorizationId: row.id,
            fleetId: row.fleetId,
            loadId: row.loadId,
            ...physicalData,
          },
        })
      : row.physicalReconciliation;

    if (
      persistPhysical &&
      stopPhase1 &&
      decision.disposition === "STOP" &&
      (row.status === "PENDING" || row.status === "AUTHORIZED")
    ) {
      await prisma.pickupAuthorization.update({
        where: { id: row.id },
        data: {
          status: extraCodes.includes("EXPIRED") || decision.reasonCodes.includes("EXPIRED") ? "EXPIRED" : "STOPPED",
          stoppedAt: new Date(),
          reason: decision.summary,
          reasonCodes: reasonCodes as Prisma.InputJsonValue,
        },
      });
    }

    await createAuditRecord({
      actorId,
      actorEmail: sessionUser!.email ?? null,
      tenantId: row.fleetId,
      action: "UPDATED",
      entityType: persistPhysical && physical ? "PickupPhysicalReconciliation" : "PickupAuthorization",
      entityId: persistPhysical && physical ? physical.id : row.id,
      details: {
        event: persistPhysical ? "pickup.physical_reconciliation" : "pickup.physical_reconciliation_rejected",
        disposition: decision.disposition,
        dimensions: {
          driver: decision.driverArrivalResult,
          tractor: decision.tractorArrivalResult,
          trailer: decision.trailerArrivalResult,
          load: decision.loadArrivalResult,
          authorization: decision.authorizationArrivalResult,
        },
        identityMatchToAuthorizedRecord: decision.identityMatchToAuthorizedRecord,
        identityPhysicalClass: "UNVERIFIED",
        equipmentPhysicalClass: "UNVERIFIED",
        method,
        reasonCodes,
        evidenceReference: input.evidenceReference?.trim() || null,
        physicalVerificationPerformed: false,
        policyVersion: PICKUP_PHYSICAL_POLICY_VERSION,
      },
      metadata: { source: "pickup-physical-reconciliation" },
    });

    if (persistPhysical && physical) {
      await recordOperatingProcessEvent(getOperatingProcessStore(), sessionUser!, {
        fleetId: row.fleetId,
        loadId: row.loadId,
        entityType: "PickupPhysicalReconciliation",
        entityId: physical.id,
        eventType: "PICKUP_PHYSICAL_RECONCILED",
        processStage: "RELEASE",
        eventTimestamp: new Date(),
        actorId,
        actorType: "USER",
        relatedRecordType: "PickupVerificationAttempt",
        relatedRecordId: attempt.id,
        lineage: { sourceSystem: "BOF", sourceRecordId: physical.id },
        decisionType: "PICKUP_PHYSICAL_RELEASE",
        decisionResult: decision.disposition,
        decisionReason: decision.summary,
        decisionOwner: actorId,
        priorState: row.status,
        resultingState: decision.disposition,
        operationalConsequence:
          decision.disposition === "RELEASE"
            ? "Shipper dock released pickup under Phase 2. Physical identity and equipment remain UNVERIFIED."
            : "Shipper dock stopped pickup under Phase 2.",
      });
    }

    throw Object.assign(new Error(decision.summary), {
      statusCode,
      payload: {
        authorization: detail.authorization,
        physical: physical ? toPublicPhysical(physical) : null,
        attempt: {
          id: attempt.id,
          result: attempt.result,
          reason: attempt.reason,
          reasonCodes: attempt.reasonCodes,
          createdAt: attempt.createdAt,
        },
        physicalVerificationNote: PHASE2_PHYSICAL_UNVERIFIED_NOTE,
      },
    });
  };

  const authorizedArrival = {
    authorizationId: row.id,
    loadId: row.loadId,
    driverId: row.driverId,
    tractorId: row.tractorEquipmentId,
    trailerId: row.trailerEquipmentId,
    tractorUnitNumber: row.tractorEquipment.unitNumber,
    trailerUnitNumber: row.trailerEquipment?.unitNumber ?? null,
    tractorVin: row.tractorEquipment.vin,
    trailerVin: row.trailerEquipment?.vin ?? null,
  };

  if (!tokenValid) {
    const decision = evaluatePickupPhysicalArrival(authorizedArrival, arriving);
    await throwDecision(
      409,
      "REJECTED",
      { ...decision, disposition: "STOP", reasonCodes: ["TOKEN_INVALID"], summary: "Pickup credential is invalid" },
      ["TOKEN_INVALID"],
      { persistPhysical: false, stopPhase1: false },
    );
  }

  if (row.status === "EXPIRED" || row.expiresAt.getTime() <= Date.now()) {
    await throwDecision(409, "STOPPED", evaluatePickupPhysicalArrival(authorizedArrival, arriving, { expired: true }), ["EXPIRED"], {
      persistPhysical: true,
      stopPhase1: true,
    });
  }
  if (row.status === "CANCELLED") {
    const decision = evaluatePickupPhysicalArrival(authorizedArrival, arriving);
    await throwDecision(
      409,
      "REJECTED",
      { ...decision, disposition: "STOP", summary: "Authorization is CANCELLED", reasonCodes: ["CANCELLED"] },
      ["CANCELLED"],
      { persistPhysical: false, stopPhase1: false },
    );
  }
  if (row.physicalReconciliation && row.physicalReconciliation.disposition !== "PENDING") {
    const decision = evaluatePickupPhysicalArrival(authorizedArrival, arriving);
    await throwDecision(
      409,
      "REJECTED",
      { ...decision, disposition: "STOP", summary: "Phase 2 reconciliation already completed", reasonCodes: ["REUSED"] },
      ["REUSED"],
      { persistPhysical: false, stopPhase1: false },
    );
  }

  const assignment = await prisma.dispatchAssignment.findUnique({ where: { id: row.assignmentId } });
  if (!assignment || assignment.status !== DispatchAssignmentStatus.ACTIVE) {
    const decision = evaluatePickupPhysicalArrival(authorizedArrival, arriving);
    await throwDecision(
      409,
      "STOPPED",
      { ...decision, disposition: "STOP", summary: "Active DispatchAssignment is no longer present", reasonCodes: ["NO_ACTIVE_ASSIGNMENT"] },
      ["NO_ACTIVE_ASSIGNMENT"],
      { persistPhysical: true, stopPhase1: true },
    );
  }
  if (
    assignment &&
    (assignment.driverId !== row.driverId ||
      assignment.tractorEquipmentId !== row.tractorEquipmentId ||
      (assignment.trailerEquipmentId ?? null) !== (row.trailerEquipmentId ?? null) ||
      assignment.loadId !== row.loadId)
  ) {
    const decision = evaluatePickupPhysicalArrival(authorizedArrival, arriving);
    await throwDecision(
      409,
      "STOPPED",
      { ...decision, disposition: "STOP", summary: "DispatchAssignment identities drifted from this authorization", reasonCodes: ["ASSIGNMENT_DRIFT"] },
      ["ASSIGNMENT_DRIFT"],
      { persistPhysical: true, stopPhase1: true },
    );
  }

  const readiness = await prisma.driverReadinessScore.findFirst({
    where: { driverId: row.driverId, fleetId: row.fleetId },
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
  });
  if (!readiness || readiness.status === DriverReadinessState.NOT_READY) {
    const decision = evaluatePickupPhysicalArrival(authorizedArrival, arriving);
    await throwDecision(
      409,
      "STOPPED",
      { ...decision, disposition: "STOP", summary: "Driver readiness no longer allows pickup", reasonCodes: ["NO_DRIVER_READINESS"] },
      ["NO_DRIVER_READINESS"],
      { persistPhysical: true, stopPhase1: true },
    );
  }

  const tripRelease = await prisma.dispatchRelease.findFirst({
    where: { assignmentId: row.assignmentId, loadId: row.loadId },
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
  });
  if (
    !tripRelease ||
    (tripRelease.disposition !== DispatchReleaseDisposition.RELEASED &&
      tripRelease.disposition !== DispatchReleaseDisposition.CONDITIONALLY_RELEASED)
  ) {
    const decision = evaluatePickupPhysicalArrival(authorizedArrival, arriving);
    await throwDecision(
      409,
      "STOPPED",
      { ...decision, disposition: "STOP", summary: "Trip release no longer allows pickup", reasonCodes: ["NO_TRIP_RELEASE"] },
      ["NO_TRIP_RELEASE"],
      { persistPhysical: true, stopPhase1: true },
    );
  }

  let decision = evaluatePickupPhysicalArrival(authorizedArrival, {
    ...arriving,
    authorizationId: arriving.authorizationId ?? authorizationId,
  });

  if (input.intendedDisposition === "STOP") {
    decision = {
      ...decision,
      disposition: "STOP",
      summary: input.stopReason?.trim()
        ? `Phase 2 STOPPED by shipper dock. ${input.stopReason.trim()} Physical identity and equipment remain UNVERIFIED.`
        : "Phase 2 STOPPED by shipper dock. Physical identity and equipment remain UNVERIFIED.",
    };
  }

  if (decision.disposition === "STOP") {
    await throwDecision(409, "STOPPED", decision, [], { persistPhysical: true, stopPhase1: true });
  }

  const attempt = await prisma.pickupVerificationAttempt.create({
    data: {
      pickupAuthorizationId: row.id,
      fleetId: row.fleetId,
      method,
      result: "RELEASED",
      presentedTokenValid: true,
      presentedDriverId: arriving.driverId?.trim() || null,
      presentedTractorEquipmentId: arriving.tractorId?.trim() || null,
      presentedTrailerEquipmentId: arriving.trailerId?.trim() || null,
      presentedLoadId: arriving.loadId?.trim() || null,
      presentedAuthorizationId: arriving.authorizationId?.trim() || authorizationId,
      reason: decision.summary,
      reasonCodes: decision.reasonCodes as Prisma.InputJsonValue,
      physicalVerificationPerformed: false,
      actorUserId: actorId,
    },
  });

  const physical = await prisma.pickupPhysicalReconciliation.upsert({
    where: { pickupAuthorizationId: row.id },
    update: {
      disposition: "RELEASE",
      driverArrivalResult: decision.driverArrivalResult,
      tractorArrivalResult: decision.tractorArrivalResult,
      trailerArrivalResult: decision.trailerArrivalResult,
      loadArrivalResult: decision.loadArrivalResult,
      authorizationArrivalResult: decision.authorizationArrivalResult,
      identityMatchToAuthorizedRecord: decision.identityMatchToAuthorizedRecord,
      identityPhysicalClass: "UNVERIFIED",
      equipmentPhysicalClass: "UNVERIFIED",
      method,
      arrivingDriverId: arriving.driverId?.trim() || null,
      arrivingTractorUnitNumber: arriving.tractorUnitNumber?.trim() || null,
      arrivingTrailerUnitNumber: arriving.trailerUnitNumber?.trim() || null,
      arrivingVin: arriving.vin?.trim() || null,
      arrivingPlate: arriving.plate?.trim() || null,
      arrivingQr: arriving.qr?.trim() || null,
      reason: decision.summary,
      reasonCodes: decision.reasonCodes as Prisma.InputJsonValue,
      evidenceReference: input.evidenceReference?.trim() || null,
      actorUserId: actorId,
    },
    create: {
      pickupAuthorizationId: row.id,
      fleetId: row.fleetId,
      loadId: row.loadId,
      disposition: "RELEASE",
      driverArrivalResult: decision.driverArrivalResult,
      tractorArrivalResult: decision.tractorArrivalResult,
      trailerArrivalResult: decision.trailerArrivalResult,
      loadArrivalResult: decision.loadArrivalResult,
      authorizationArrivalResult: decision.authorizationArrivalResult,
      identityMatchToAuthorizedRecord: decision.identityMatchToAuthorizedRecord,
      identityPhysicalClass: "UNVERIFIED",
      equipmentPhysicalClass: "UNVERIFIED",
      method,
      arrivingDriverId: arriving.driverId?.trim() || null,
      arrivingTractorUnitNumber: arriving.tractorUnitNumber?.trim() || null,
      arrivingTrailerUnitNumber: arriving.trailerUnitNumber?.trim() || null,
      arrivingVin: arriving.vin?.trim() || null,
      arrivingPlate: arriving.plate?.trim() || null,
      arrivingQr: arriving.qr?.trim() || null,
      reason: decision.summary,
      reasonCodes: decision.reasonCodes as Prisma.InputJsonValue,
      evidenceReference: input.evidenceReference?.trim() || null,
      actorUserId: actorId,
    },
  });

  if (row.status === "PENDING" || row.status === "AUTHORIZED") {
    await prisma.pickupAuthorization.update({
      where: { id: row.id },
      data: decision.identityMatchToAuthorizedRecord
        ? { status: "RELEASED", releasedAt: new Date(), reason: decision.summary, reasonCodes: [] as Prisma.InputJsonValue }
        : { status: "AUTHORIZED", reason: decision.summary },
    });
  }

  await createAuditRecord({
    actorId,
    actorEmail: sessionUser!.email ?? null,
    tenantId: row.fleetId,
    action: "UPDATED",
    entityType: "PickupPhysicalReconciliation",
    entityId: physical.id,
    details: {
      event: "pickup.physical_reconciliation",
      disposition: "RELEASE",
      dimensions: {
        driver: decision.driverArrivalResult,
        tractor: decision.tractorArrivalResult,
        trailer: decision.trailerArrivalResult,
        load: decision.loadArrivalResult,
        authorization: decision.authorizationArrivalResult,
      },
      identityMatchToAuthorizedRecord: decision.identityMatchToAuthorizedRecord,
      identityPhysicalClass: "UNVERIFIED",
      equipmentPhysicalClass: "UNVERIFIED",
      method,
      evidenceReference: input.evidenceReference?.trim() || null,
      physicalVerificationPerformed: false,
      policyVersion: PICKUP_PHYSICAL_POLICY_VERSION,
    },
    metadata: { source: "pickup-physical-reconciliation" },
  });

  await recordOperatingProcessEvent(getOperatingProcessStore(), sessionUser!, {
    fleetId: row.fleetId,
    loadId: row.loadId,
    entityType: "PickupPhysicalReconciliation",
    entityId: physical.id,
    eventType: "PICKUP_PHYSICAL_RECONCILED",
    processStage: "RELEASE",
    eventTimestamp: new Date(),
    actorId,
    actorType: "USER",
    relatedRecordType: "PickupVerificationAttempt",
    relatedRecordId: attempt.id,
    lineage: { sourceSystem: "BOF", sourceRecordId: physical.id },
    decisionType: "PICKUP_PHYSICAL_RELEASE",
    decisionResult: "RELEASE",
    decisionReason: decision.summary,
    decisionOwner: actorId,
    priorState: row.status,
    resultingState: "RELEASE",
    operationalConsequence: "Shipper dock released pickup under Phase 2. Physical identity and equipment remain UNVERIFIED.",
  });

  const refreshed = await getPickupAuthorization(sessionUser, authorizationId);
  return {
    authorization: refreshed.authorization,
    physical: toPublicPhysical(physical),
    attempt: {
      id: attempt.id,
      result: attempt.result,
      reason: attempt.reason,
      reasonCodes: attempt.reasonCodes,
      createdAt: attempt.createdAt,
    },
    physicalVerificationNote: PHASE2_PHYSICAL_UNVERIFIED_NOTE,
  };
}
