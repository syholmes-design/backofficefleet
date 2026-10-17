import type { SessionUserLike } from "@/lib/authorization";
import { requireFleetAccess } from "@/lib/authorization";
import { assessDeliveryProgress } from "@/lib/fleet-visibility/delivery-risk";
import { evaluateGeofenceTransitions } from "@/lib/fleet-visibility/geofence";
import { normalizeProviderObservation, type ProviderPayload } from "@/lib/fleet-visibility/providers/normalize";
import { isLocationStale, locationFreshnessLabel } from "@/lib/fleet-visibility/staleness";
import type { FleetMapLoadOverlay, FleetMapVehiclePin, NormalizedLocationInput } from "@/lib/fleet-visibility/types";
import { recordOperatingProcessEvent } from "@/lib/process-intelligence/operating-event-service";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import type { OperatingProcessEventType } from "@/lib/process-intelligence/types";
import { prisma } from "@/lib/prisma";
import { resolveIngestAssociations, resolveObservationKindForSession } from "@/lib/fleet-visibility/association-validation";
import { FleetVisibilityError } from "@/lib/fleet-visibility/errors";
import { withGpsStorage } from "@/lib/fleet-visibility/gps-storage";
import type { IngestChannel } from "@/lib/fleet-visibility/association-validation";
import type { DeliveryProgressStatus, LoadStopKind, TelematicsProvider } from "@prisma/client";

export { FleetVisibilityError } from "@/lib/fleet-visibility/errors";

function assertFleet(user: SessionUserLike | null | undefined, fleetId: string) {
  if (!user?.id) throw new FleetVisibilityError("AUTH_REQUIRED", 401);
  const access = requireFleetAccess(user, fleetId);
  if (!access.allowed) {
    throw new FleetVisibilityError(access.reason ?? "TENANT_ACCESS_DENIED", access.reason === "AUTH_REQUIRED" ? 401 : 403);
  }
}

async function loadStopMap(fleetId: string, loadId: string) {
  const rows = await prisma.loadStopGeography.findMany({ where: { fleetId, loadId } });
  const map: Partial<Record<LoadStopKind, { latitude: number; longitude: number; geocodeLabel: string | null }>> = {};
  for (const row of rows) {
    map[row.stopKind] = { latitude: row.latitude, longitude: row.longitude, geocodeLabel: row.geocodeLabel };
  }
  return map;
}

async function recordGeofenceEvents(input: {
  fleetId: string;
  loadId: string;
  equipmentId: string;
  observationId: string;
  events: OperatingProcessEventType[];
  user: SessionUserLike | null | undefined;
  serviceAuthorized: boolean;
}) {
  const store = getOperatingProcessStore();
  const eventAuth = input.serviceAuthorized ? { authorizedFleetId: input.fleetId } : undefined;
  for (const eventType of input.events) {
    await recordOperatingProcessEvent(
      store,
      input.user,
      {
        fleetId: input.fleetId,
        loadId: input.loadId,
        entityType: "EQUIPMENT",
        entityId: input.equipmentId,
        eventType,
        processStage: eventType.includes("PICKUP") ? "RELEASE" : "DELIVERY_PROOF",
        eventTimestamp: new Date(),
        actorType: "EXTERNAL",
        relatedRecordType: "VEHICLE_LOCATION_OBSERVATION",
        relatedRecordId: `${input.observationId}:${eventType}`,
        lineage: {
          lifecycleClass: "LIVE",
          originKind: "EXTERNAL_SYSTEM",
          verificationClass: "UNVERIFIED",
          derivationKind: "SOURCE",
          sourceSystem: "FLEET_VISIBILITY",
          sourceRecordId: input.observationId,
        },
      },
      eventAuth,
    );
  }
}

export async function ingestLocationObservation(
  user: SessionUserLike | null | undefined,
  normalized: NormalizedLocationInput,
  options: {
    channel: IngestChannel;
    integrationFleetId?: string;
  },
) {
  const channel = options.channel;
  const serviceAuthorized = channel === "integration";

  if (channel === "integration") {
    if (!options.integrationFleetId || options.integrationFleetId !== normalized.fleetId) {
      throw new FleetVisibilityError("INTEGRATION_FLEET_MISMATCH", 403);
    }
  } else {
    if (!user?.id) throw new FleetVisibilityError("AUTH_REQUIRED", 401);
    assertFleet(user, normalized.fleetId);
  }

  const observationKind =
    channel === "integration"
      ? "LIVE"
      : resolveObservationKindForSession(user!, normalized.fleetId, normalized.observationKind);

  const associations = await resolveIngestAssociations({
    fleetId: normalized.fleetId,
    provider: normalized.provider,
    providerDeviceId: normalized.providerDeviceId,
    channel,
    observationKind,
    requestedEquipmentId: normalized.equipmentId,
    requestedLoadId: normalized.loadId,
    requestedDriverId: normalized.driverId,
  });

  const { equipmentId, loadId, driverId } = associations;
  const eventAuth = serviceAuthorized ? { authorizedFleetId: normalized.fleetId } : undefined;

  const existing = await prisma.vehicleLocationObservation.findUnique({
    where: { fleetId_idempotencyKey: { fleetId: normalized.fleetId, idempotencyKey: normalized.idempotencyKey } },
  });
  if (existing) {
    return { observation: existing, duplicate: true as const };
  }

  const observation = await prisma.vehicleLocationObservation.create({
    data: {
      fleetId: normalized.fleetId,
      equipmentId,
      driverId,
      loadId,
      provider: normalized.provider,
      providerDeviceId: normalized.providerDeviceId,
      observationKind,
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      observedAt: normalized.observedAt,
      movementStatus: normalized.movementStatus,
      speedMph: normalized.speedMph,
      headingDegrees: normalized.headingDegrees,
      accuracyMeters: normalized.accuracyMeters,
      sourceReliability: normalized.sourceReliability,
      idempotencyKey: normalized.idempotencyKey,
    },
  });

  if (observationKind === "LIVE" && loadId && equipmentId) {
    const stops = await loadStopMap(normalized.fleetId, loadId);
    const pickup = stops.PICKUP
      ? { stopKind: "PICKUP" as const, latitude: stops.PICKUP.latitude, longitude: stops.PICKUP.longitude }
      : null;
    const delivery = stops.DELIVERY
      ? { stopKind: "DELIVERY" as const, latitude: stops.DELIVERY.latitude, longitude: stops.DELIVERY.longitude }
      : null;

    const priorEvents = await prisma.operatingProcessEvent.findMany({
      where: {
        fleetId: normalized.fleetId,
        loadId,
        eventType: {
          in: [
            "GEOFENCE_PICKUP_ARRIVED",
            "GEOFENCE_PICKUP_DEPARTED",
            "GEOFENCE_DELIVERY_ARRIVED",
            "GEOFENCE_DELIVERY_DEPARTED",
          ],
        },
      },
      select: { eventType: true },
      orderBy: { eventTimestamp: "desc" },
      take: 20,
    });
    const previouslyInsidePickup = priorEvents.some((e) => e.eventType === "GEOFENCE_PICKUP_ARRIVED") &&
      !priorEvents.some((e) => e.eventType === "GEOFENCE_PICKUP_DEPARTED");
    const previouslyInsideDelivery = priorEvents.some((e) => e.eventType === "GEOFENCE_DELIVERY_ARRIVED") &&
      !priorEvents.some((e) => e.eventType === "GEOFENCE_DELIVERY_DEPARTED");

    const geofence = evaluateGeofenceTransitions({
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      pickup,
      delivery,
      previouslyInsidePickup,
      previouslyInsideDelivery,
    });

    if (geofence.events.length) {
      await recordGeofenceEvents({
        fleetId: normalized.fleetId,
        loadId,
        equipmentId,
        observationId: observation.id,
        events: geofence.events,
        user,
        serviceAuthorized,
      });
    }

    const load = await prisma.load.findFirst({
      where: { id: loadId, fleetId: normalized.fleetId },
      select: { deliveryWindowEnd: true },
    });

    const risk = assessDeliveryProgress({
      observedAt: normalized.observedAt,
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      deliveryStop: delivery,
      deliveryWindowEnd: load?.deliveryWindowEnd ?? null,
      averageSpeedMph: normalized.speedMph ?? null,
      locationStale: isLocationStale(normalized.observedAt),
      locationMissing: false,
    });

    await prisma.loadMovementAssessment.upsert({
      where: { fleetId_loadId: { fleetId: normalized.fleetId, loadId } },
      create: {
        fleetId: normalized.fleetId,
        loadId,
        equipmentId,
        progressStatus: risk.progressStatus,
        distanceToDeliveryMiles: risk.distanceToDeliveryMiles,
        estimatedArrivalAt: risk.estimatedArrivalAt,
        etaConfidenceNote: risk.etaConfidenceNote,
        lastObservationId: observation.id,
      },
      update: {
        equipmentId,
        progressStatus: risk.progressStatus,
        distanceToDeliveryMiles: risk.distanceToDeliveryMiles,
        estimatedArrivalAt: risk.estimatedArrivalAt,
        etaConfidenceNote: risk.etaConfidenceNote,
        lastObservationId: observation.id,
        assessedAt: new Date(),
      },
    });

    await recordOperatingProcessEvent(
      getOperatingProcessStore(),
      user,
      {
        fleetId: normalized.fleetId,
        loadId,
        entityType: "LOAD",
        entityId: loadId,
        eventType: "DELIVERY_RISK_ASSESSED",
        processStage: "DELIVERY_PROOF",
        eventTimestamp: new Date(),
        actorType: "SYSTEM",
        resultingState: risk.progressStatus,
        decisionReason: risk.etaConfidenceNote,
        relatedRecordType: "VEHICLE_LOCATION_OBSERVATION",
        relatedRecordId: observation.id,
        lineage: {
          lifecycleClass: "LIVE",
          originKind: "SYSTEM_GENERATED",
          verificationClass: "UNVERIFIED",
          derivationKind: "DERIVED",
          sourceSystem: "FLEET_VISIBILITY",
          sourceRecordId: observation.id,
        },
      },
      eventAuth,
    );
  }

  if (observationKind === "LIVE" && equipmentId) {
    await recordOperatingProcessEvent(
      getOperatingProcessStore(),
      user,
      {
        fleetId: normalized.fleetId,
        loadId: loadId ?? undefined,
        entityType: "EQUIPMENT",
        entityId: equipmentId,
        eventType: "VEHICLE_LOCATION_RECORDED",
        processStage: loadId ? "DELIVERY_PROOF" : "DISPATCH",
        eventTimestamp: normalized.observedAt,
        actorType: "EXTERNAL",
        relatedRecordType: "VEHICLE_LOCATION_OBSERVATION",
        relatedRecordId: observation.id,
        lineage: {
          lifecycleClass: "LIVE",
          originKind: "EXTERNAL_SYSTEM",
          verificationClass: "UNVERIFIED",
          derivationKind: "SOURCE",
          sourceSystem: normalized.provider,
          sourceRecordId: normalized.idempotencyKey,
        },
      },
      eventAuth,
    );
  }

  return { observation, duplicate: false as const };
}

export async function ingestFromProviderPayload(
  user: SessionUserLike | null | undefined,
  fleetId: string,
  provider: TelematicsProvider,
  body: ProviderPayload,
  options: {
    channel: IngestChannel;
    integrationFleetId?: string;
  },
) {
  const normalized = normalizeProviderObservation(fleetId, provider, body);
  return ingestLocationObservation(user, normalized, options);
}

export async function getFleetMapView(user: SessionUserLike, fleetId: string) {
  return withGpsStorage(async () => {
  assertFleet(user, fleetId);
  const now = new Date();

  const equipment = await prisma.equipment.findMany({
    where: { fleetId, equipmentType: "TRACTOR" },
    select: { id: true, unitNumber: true, equipmentType: true },
  });

  const latestByEquipment = await Promise.all(
    equipment.map(async (row) => {
      const obs = await prisma.vehicleLocationObservation.findFirst({
        where: { fleetId, equipmentId: row.id },
        orderBy: { observedAt: "desc" },
      });
      return { equipment: row, obs };
    }),
  );

  const activeAssignments = await prisma.dispatchAssignment.findMany({
    where: { fleetId, status: "ACTIVE", unassignedAt: null },
    select: { loadId: true, driverId: true, tractorEquipmentId: true, load: { select: { referenceNumber: true } } },
  });
  const assignmentByTractor = new Map(activeAssignments.map((a) => [a.tractorEquipmentId, a]));

  const assessments = await prisma.loadMovementAssessment.findMany({ where: { fleetId } });
  const assessmentByLoad = new Map(assessments.map((a) => [a.loadId, a]));

  const vehicles: FleetMapVehiclePin[] = latestByEquipment.map(({ equipment: row, obs }) => {
    const assignment = assignmentByTractor.get(row.id);
    const assessment = assignment ? assessmentByLoad.get(assignment.loadId) : null;
    const label = locationFreshnessLabel(obs?.observedAt ?? null, obs?.observationKind ?? null, now);
    return {
      equipmentId: row.id,
      unitNumber: row.unitNumber,
      equipmentType: row.equipmentType,
      fleetId,
      latitude: obs?.latitude ?? null,
      longitude: obs?.longitude ?? null,
      observedAt: obs?.observedAt?.toISOString() ?? null,
      locationLabel: label,
      provider: obs?.provider ?? null,
      activeLoadId: assignment?.loadId ?? null,
      activeLoadReference: assignment?.load.referenceNumber ?? null,
      driverId: assignment?.driverId ?? null,
      progressStatus: (assessment?.progressStatus as DeliveryProgressStatus | undefined) ?? null,
      staleWarning:
        label === "STALE"
          ? "Last GPS observation is stale; position may not reflect current location."
          : label === "UNAVAILABLE"
            ? "No GPS observations recorded for this unit."
            : null,
    };
  });

  const loadOverlays: FleetMapLoadOverlay[] = [];
  for (const assignment of activeAssignments) {
    const stops = await loadStopMap(fleetId, assignment.loadId);
    const load = await prisma.load.findFirst({
      where: { id: assignment.loadId, fleetId },
      select: { origin: true, destination: true, referenceNumber: true },
    });
    if (!load) continue;
    const assessment = assessmentByLoad.get(assignment.loadId);
    loadOverlays.push({
      loadId: assignment.loadId,
      referenceNumber: load.referenceNumber,
      origin: load.origin,
      destination: load.destination,
      progressStatus: assessment?.progressStatus ?? null,
      pickup: stops.PICKUP
        ? { stopKind: "PICKUP", latitude: stops.PICKUP.latitude, longitude: stops.PICKUP.longitude, geocodeLabel: stops.PICKUP.geocodeLabel }
        : null,
      delivery: stops.DELIVERY
        ? { stopKind: "DELIVERY", latitude: stops.DELIVERY.latitude, longitude: stops.DELIVERY.longitude, geocodeLabel: stops.DELIVERY.geocodeLabel }
        : null,
      equipmentId: assignment.tractorEquipmentId,
    });
  }

  return {
    dataAuthority: "LIVE" as const,
    fleetId,
    generatedAt: now.toISOString(),
    vehicles,
    loads: loadOverlays,
    limitations: [
      "Map pins use persisted VehicleLocationObservation rows only — not demo dispatch route interpolation.",
      "Units without observations remain listed with locationLabel UNAVAILABLE (no fabricated coordinates).",
    ],
  };
  });
}

export async function upsertLoadStopGeography(
  user: SessionUserLike,
  input: {
    fleetId: string;
    loadId: string;
    stopKind: LoadStopKind;
    latitude: number;
    longitude: number;
    geocodeLabel?: string;
    sourceSystem?: string;
  },
) {
  return withGpsStorage(async () => {
  assertFleet(user, input.fleetId);
  const load = await prisma.load.findFirst({ where: { id: input.loadId, fleetId: input.fleetId }, select: { id: true } });
  if (!load) throw new FleetVisibilityError("Load not found for tenant", 404);

  return prisma.loadStopGeography.upsert({
    where: { fleetId_loadId_stopKind: { fleetId: input.fleetId, loadId: input.loadId, stopKind: input.stopKind } },
    create: {
      fleetId: input.fleetId,
      loadId: input.loadId,
      stopKind: input.stopKind,
      latitude: input.latitude,
      longitude: input.longitude,
      geocodeLabel: input.geocodeLabel,
      sourceSystem: input.sourceSystem ?? "BOF_OPERATOR",
    },
    update: {
      latitude: input.latitude,
      longitude: input.longitude,
      geocodeLabel: input.geocodeLabel,
      sourceSystem: input.sourceSystem ?? "BOF_OPERATOR",
    },
  });
  });
}
