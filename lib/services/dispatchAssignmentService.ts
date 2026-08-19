import { DispatchAssignmentStatus, EquipmentType, Prisma } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";

export type AssignmentClosureStatus = Extract<DispatchAssignmentStatus, "SUPERSEDED" | "CANCELLED">;

const ACTIVE_ASSIGNMENT_CONSTRAINTS = new Map([
  ["DispatchAssignment_active_load_unique_idx", "Active assignment already exists for this load."],
  ["DispatchAssignment_active_driver_unique_idx", "Driver already has an active assignment."],
  ["DispatchAssignment_active_tractor_unique_idx", "Tractor already has an active assignment."],
  ["DispatchAssignment_active_trailer_unique_idx", "Trailer already has an active assignment."],
  ["loadId", "Active assignment already exists for this load."],
  ["driverId", "Driver already has an active assignment."],
  ["tractorEquipmentId", "Tractor already has an active assignment."],
  ["trailerEquipmentId", "Trailer already has an active assignment."],
]);

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

async function logUnauthorizedDispatchAccess(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string | null,
  entityId: string | null,
  reason: string,
) {
  await createAuditRecord({
    actorId: sessionUser?.id ?? null,
    actorEmail: sessionUser?.email ?? null,
    tenantId: fleetId,
    action: "ACCESS_DENIED",
    entityType: "DispatchAssignment",
    entityId,
    details: { event: "unauthorized dispatch access", reason },
    metadata: { source: "dispatch-assignment-service" },
  });
}

function isKnownUniqueConstraintError(error: unknown, knownConstraints: Map<string, string>) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return null;
  }

  const targets = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
  const rawMessage = String(error.message ?? "");
  for (const [constraint, mappedMessage] of knownConstraints.entries()) {
    if (targets.includes(constraint) || rawMessage.includes(constraint)) {
      return mappedMessage;
    }
  }

  return null;
}

async function getAuthorizedAssignmentRecord(
  sessionUser: SessionUserLike | null | undefined,
  assignmentId: string,
) {
  const assignment = await prisma.dispatchAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      load: true,
      driver: true,
      tractorEquipment: true,
      trailerEquipment: true,
    },
  });

  if (!assignment) {
    return { assignment: null, allowed: false, reason: "NOT_FOUND" as const };
  }

  const access = await authorizedFleetAccess(sessionUser, assignment.fleetId);
  if (!access.allowed) {
    return { assignment, allowed: false, reason: access.reason ?? "TENANT_ACCESS_DENIED" };
  }

  return { assignment, allowed: true, reason: undefined as string | undefined };
}

export async function createAssignment(
  sessionUser: SessionUserLike | null | undefined,
  loadId: string,
  driverId: string,
  tractorId: string,
  trailerId?: string | null,
) {
  requireSessionUser(sessionUser);
  const actorId = sessionUser!.id;

  try {
    return await prisma.$transaction(async (tx) => {
      const load = await tx.load.findUnique({ where: { id: loadId } });
      if (!load) {
        throw Object.assign(new Error("Load not found"), { statusCode: 404 });
      }

      const access = await authorizedFleetAccess(sessionUser, load.fleetId);
      if (!access.allowed) {
        await logUnauthorizedDispatchAccess(sessionUser, load.fleetId, null, access.reason ?? "TENANT_ACCESS_DENIED");
        throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
      }

      const driver = await tx.driver.findUnique({ where: { id: driverId } });
      if (!driver) {
        throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
      }
      if (driver.fleetId !== load.fleetId) {
        throw Object.assign(new Error("Driver does not belong to the load fleet"), { statusCode: 422 });
      }

      const tractor = await tx.equipment.findUnique({ where: { id: tractorId } });
      if (!tractor) {
        throw Object.assign(new Error("Tractor not found"), { statusCode: 404 });
      }
      if (tractor.fleetId !== load.fleetId) {
        throw Object.assign(new Error("Tractor does not belong to the load fleet"), { statusCode: 422 });
      }
      if (tractor.equipmentType !== EquipmentType.TRACTOR) {
        throw Object.assign(new Error("Assigned tractor must be TRACTOR equipment"), { statusCode: 422 });
      }
      if (tractor.status === "OUT_OF_SERVICE") {
        throw Object.assign(new Error("Tractor is out of service"), { statusCode: 422 });
      }

      let trailer: Awaited<ReturnType<typeof tx.equipment.findUnique>> | null = null;
      if (trailerId) {
        trailer = await tx.equipment.findUnique({ where: { id: trailerId } });
        if (!trailer) {
          throw Object.assign(new Error("Trailer not found"), { statusCode: 404 });
        }
        if (trailer.fleetId !== load.fleetId) {
          throw Object.assign(new Error("Trailer does not belong to the load fleet"), { statusCode: 422 });
        }
        if (trailer.equipmentType !== EquipmentType.TRAILER) {
          throw Object.assign(new Error("Assigned trailer must be TRAILER equipment"), { statusCode: 422 });
        }
        if (trailer.status === "OUT_OF_SERVICE") {
          throw Object.assign(new Error("Trailer is out of service"), { statusCode: 422 });
        }
      }

      const [loadConflict, driverConflict, tractorConflict, trailerConflict] = await Promise.all([
        tx.dispatchAssignment.findFirst({
          where: { loadId: load.id, status: "ACTIVE" },
          select: { id: true },
        }),
        tx.dispatchAssignment.findFirst({
          where: { driverId: driver.id, status: "ACTIVE" },
          select: { id: true },
        }),
        tx.dispatchAssignment.findFirst({
          where: { tractorEquipmentId: tractor.id, status: "ACTIVE" },
          select: { id: true },
        }),
        trailer
          ? tx.dispatchAssignment.findFirst({
              where: { trailerEquipmentId: trailer.id, status: "ACTIVE" },
              select: { id: true },
            })
          : Promise.resolve(null),
      ]);

      if (loadConflict) {
        throw Object.assign(new Error("Active assignment already exists for this load."), { statusCode: 409 });
      }
      if (driverConflict) {
        throw Object.assign(new Error("Driver already has an active assignment."), { statusCode: 409 });
      }
      if (tractorConflict) {
        throw Object.assign(new Error("Tractor already has an active assignment."), { statusCode: 409 });
      }
      if (trailerConflict) {
        throw Object.assign(new Error("Trailer already has an active assignment."), { statusCode: 409 });
      }

      return tx.dispatchAssignment.create({
        data: {
          fleetId: load.fleetId,
          loadId: load.id,
          driverId: driver.id,
          tractorEquipmentId: tractor.id,
          trailerEquipmentId: trailer?.id ?? null,
          status: "ACTIVE",
          assignedAt: new Date(),
          assignedByUserId: actorId,
        },
      });
    });
  } catch (error) {
    const constraintMessage = isKnownUniqueConstraintError(error, ACTIVE_ASSIGNMENT_CONSTRAINTS);
    if (constraintMessage) {
      throw Object.assign(new Error(constraintMessage), { statusCode: 409 });
    }
    throw error;
  }
}

export async function unassign(
  sessionUser: SessionUserLike | null | undefined,
  assignmentId: string,
  nextStatus: AssignmentClosureStatus,
) {
  requireSessionUser(sessionUser);
  const actorId = sessionUser!.id;

  if (nextStatus !== "SUPERSEDED" && nextStatus !== "CANCELLED") {
    throw Object.assign(new Error("Invalid unassignment status"), { statusCode: 422 });
  }

  const { assignment, allowed, reason } = await getAuthorizedAssignmentRecord(sessionUser, assignmentId);
  if (!assignment) {
    throw Object.assign(new Error("DispatchAssignment not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, assignment.fleetId, assignment.id, reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  if (assignment.status !== "ACTIVE") {
    throw Object.assign(new Error("Only active assignments can be unassigned"), { statusCode: 422 });
  }

  return prisma.dispatchAssignment.update({
    where: { id: assignment.id },
    data: {
      status: nextStatus,
      unassignedAt: new Date(),
      unassignedByUserId: actorId,
    },
  });
}

export async function getActiveAssignmentForLoad(
  sessionUser: SessionUserLike | null | undefined,
  loadId: string,
) {
  requireSessionUser(sessionUser);

  const load = await prisma.load.findUnique({ where: { id: loadId } });
  if (!load) {
    throw Object.assign(new Error("Load not found"), { statusCode: 404 });
  }

  const access = await authorizedFleetAccess(sessionUser, load.fleetId);
  if (!access.allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, load.fleetId, null, access.reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return prisma.dispatchAssignment.findFirst({
    where: {
      loadId: load.id,
      status: "ACTIVE",
    },
    orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function getAssignmentById(sessionUser: SessionUserLike | null | undefined, assignmentId: string) {
  requireSessionUser(sessionUser);

  const { assignment, allowed, reason } = await getAuthorizedAssignmentRecord(sessionUser, assignmentId);
  if (!assignment) {
    throw Object.assign(new Error("DispatchAssignment not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, assignment.fleetId, assignment.id, reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return assignment;
}
