import type { SessionUserLike } from "@/lib/authorization";
import { requireFleetAccess } from "@/lib/authorization";
import { FleetVisibilityError } from "@/lib/fleet-visibility/errors";
import { prisma } from "@/lib/prisma";
import type { LocationObservationKind, TelematicsProvider } from "@prisma/client";

const SYNTHETIC_ROLES = ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW"] as const;

export type IngestChannel = "integration" | "operator_session";

export function canSubmitSyntheticObservation(user: SessionUserLike, fleetId: string): boolean {
  const access = requireFleetAccess(user, fleetId, [...SYNTHETIC_ROLES]);
  return access.allowed;
}

export function resolveObservationKindForSession(
  user: SessionUserLike,
  fleetId: string,
  requested: LocationObservationKind | undefined,
): LocationObservationKind {
  if (requested === "SYNTHETIC_TEST") {
    if (!canSubmitSyntheticObservation(user, fleetId)) {
      throw new FleetVisibilityError("SYNTHETIC_OBSERVATIONS_REQUIRE_BOF_OPERATIONS", 403);
    }
    return "SYNTHETIC_TEST";
  }
  return "LIVE";
}

async function assertLoadInFleet(fleetId: string, loadId: string) {
  const load = await prisma.load.findFirst({ where: { id: loadId, fleetId }, select: { id: true } });
  if (!load) throw new FleetVisibilityError("LOAD_TENANT_MISMATCH", 403);
}

async function assertDriverInFleet(fleetId: string, driverId: string) {
  const driver = await prisma.driver.findFirst({ where: { id: driverId, fleetId }, select: { id: true } });
  if (!driver) throw new FleetVisibilityError("DRIVER_TENANT_MISMATCH", 403);
}

async function assertEquipmentInFleet(fleetId: string, equipmentId: string) {
  const equipment = await prisma.equipment.findFirst({ where: { id: equipmentId, fleetId }, select: { id: true } });
  if (!equipment) throw new FleetVisibilityError("EQUIPMENT_TENANT_MISMATCH", 403);
}

async function resolveActiveAssignment(fleetId: string, equipmentId: string) {
  return prisma.dispatchAssignment.findFirst({
    where: { fleetId, tractorEquipmentId: equipmentId, status: "ACTIVE", unassignedAt: null },
    orderBy: { assignedAt: "desc" },
    select: { loadId: true, driverId: true },
  });
}

export type ResolvedIngestAssociations = {
  equipmentId: string;
  loadId: string | null;
  driverId: string | null;
  telematicsDeviceLinkId: string | null;
};

/**
 * Authoritative association resolution. Integration channel never trusts caller-supplied equipment/load/driver IDs.
 */
export async function resolveIngestAssociations(input: {
  fleetId: string;
  provider: TelematicsProvider;
  providerDeviceId: string;
  channel: IngestChannel;
  observationKind: LocationObservationKind;
  requestedEquipmentId?: string | null;
  requestedLoadId?: string | null;
  requestedDriverId?: string | null;
}): Promise<ResolvedIngestAssociations> {
  if (input.channel === "integration") {
    if (input.observationKind !== "LIVE") {
      throw new FleetVisibilityError("INTEGRATION_INGEST_MUST_BE_LIVE", 403);
    }
    const link = await prisma.telematicsDeviceLink.findFirst({
      where: {
        fleetId: input.fleetId,
        provider: input.provider,
        providerDeviceId: input.providerDeviceId,
        isActive: true,
      },
      select: { id: true, equipmentId: true, provider: true },
    });
    if (!link) {
      throw new FleetVisibilityError("DEVICE_NOT_REGISTERED", 403);
    }
    if (link.provider !== input.provider) {
      throw new FleetVisibilityError("PROVIDER_MISMATCH", 403);
    }
    await assertEquipmentInFleet(input.fleetId, link.equipmentId);
    const assignment = await resolveActiveAssignment(input.fleetId, link.equipmentId);
    const loadId = assignment?.loadId ?? null;
    const driverId = assignment?.driverId ?? null;
    if (loadId) await assertLoadInFleet(input.fleetId, loadId);
    if (driverId) await assertDriverInFleet(input.fleetId, driverId);
    return {
      equipmentId: link.equipmentId,
      loadId,
      driverId,
      telematicsDeviceLinkId: link.id,
    };
  }

  if (input.observationKind === "SYNTHETIC_TEST") {
    const equipmentId = input.requestedEquipmentId?.trim();
    if (!equipmentId) throw new FleetVisibilityError("EQUIPMENT_REQUIRED_FOR_SYNTHETIC_FIXTURE", 422);
    await assertEquipmentInFleet(input.fleetId, equipmentId);
    const loadId = input.requestedLoadId ?? null;
    const driverId = input.requestedDriverId ?? null;
    if (loadId) await assertLoadInFleet(input.fleetId, loadId);
    if (driverId) await assertDriverInFleet(input.fleetId, driverId);
    if (loadId && driverId) {
      const assignment = await resolveActiveAssignment(input.fleetId, equipmentId);
      if (assignment && assignment.loadId !== loadId) {
        throw new FleetVisibilityError("LOAD_EQUIPMENT_ASSIGNMENT_MISMATCH", 403);
      }
    }
    return { equipmentId, loadId, driverId, telematicsDeviceLinkId: null };
  }

  const link = await prisma.telematicsDeviceLink.findFirst({
    where: {
      fleetId: input.fleetId,
      provider: input.provider,
      providerDeviceId: input.providerDeviceId,
      isActive: true,
    },
    select: { id: true, equipmentId: true },
  });
  if (!link) throw new FleetVisibilityError("DEVICE_NOT_REGISTERED", 403);
  await assertEquipmentInFleet(input.fleetId, link.equipmentId);
  const assignment = await resolveActiveAssignment(input.fleetId, link.equipmentId);
  const loadId = assignment?.loadId ?? null;
  const driverId = assignment?.driverId ?? null;
  if (loadId) await assertLoadInFleet(input.fleetId, loadId);
  if (driverId) await assertDriverInFleet(input.fleetId, driverId);
  return {
    equipmentId: link.equipmentId,
    loadId,
    driverId,
    telematicsDeviceLinkId: link.id,
  };
}
