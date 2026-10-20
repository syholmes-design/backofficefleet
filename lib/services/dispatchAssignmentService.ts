import { DispatchAssignmentStatus, EquipmentType, Prisma } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { recordOperatingProcessEvent } from "@/lib/process-intelligence/operating-event-service";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import { authorizeMovement, type MovementAuthorizationResult } from "@/lib/services/dispatchMovementAuthorizationService";
import { loadOpenSafetyCriticalConditionsForEquipment } from "@/lib/services/dispatchReleaseService";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";
import { findLoadByOperatorKey } from "@/lib/services/loadService";
import { rejectDemoOperationalKey } from "@/lib/uos/demo-operational-keys";

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

/**
 * Roles that may create, reassign or unassign dispatch assignments. Held through an ACTIVE membership in the
 * assignment's own fleet: BOF operations staff act only in fleets where they are explicitly granted that
 * membership. DRIVER, compliance and other memberships, other fleets and aggregator membership do not qualify.
 */
const DISPATCH_MUTATION_ROLE_CODES = new Set(["DISPATCH", "FLEET_OPERATIONS", "FLEET_MANAGER", "FLEET_ADMIN", "BOF_OPERATIONS"]);

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

async function recordAssignmentRefusal(input: {
  actorId: string;
  actorEmail: string | null | undefined;
  fleetId: string;
  loadId: string;
  driverId: string;
  reason: string;
  reasonCodes?: string[];
}) {
  await createAuditRecord({
    action: "ACCESS_DENIED",
    entityType: "DispatchAssignment",
    tenantId: input.fleetId,
    actorId: input.actorId,
    actorEmail: input.actorEmail ?? null,
    details: {
      event: "assignment.refused",
      reason: input.reason,
      ...(input.reasonCodes ? { reasonCodes: input.reasonCodes } : {}),
      loadId: input.loadId,
      driverId: input.driverId,
    },
  });
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

/**
 * Dispatch mutation authority, read from the database (session claims are not trusted) for the fleet that owns
 * the load or assignment. Returns the authorizing role code; otherwise records the refusal and throws 403.
 */
async function requireDispatchMutationRole(
  db: Prisma.TransactionClient,
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string,
  entityId: string | null,
) {
  const membership = await db.fleetMembership.findFirst({
    where: { userId: sessionUser!.id!, fleetId, status: "ACTIVE", user: { status: "ACTIVE" } },
    select: { role: { select: { code: true } } },
  });
  const roleCode = membership?.role.code;
  if (roleCode && DISPATCH_MUTATION_ROLE_CODES.has(roleCode)) {
    return roleCode;
  }
  const reason = !roleCode ? "TENANT_ACCESS_DENIED" : roleCode === "DRIVER" ? "DRIVER_ROLE" : "ROLE_REQUIRED";
  await logUnauthorizedDispatchAccess(sessionUser, fleetId, entityId, reason);
  throw Object.assign(
    new Error(reason === "DRIVER_ROLE" ? "A driver cannot create or change a dispatch assignment." : "Forbidden"),
    { statusCode: 403 },
  );
}

function planningRefusal(result: MovementAuthorizationResult) {
  if (result.reasonCodes.includes("DRIVER_PLANNING_DENIED")) {
    const status = result.driverQualificationStatus;
    return {
      reason: status === "CONDITIONAL" ? "CONDITIONAL_NOT_PERMITTED" : status ?? "QUALIFICATION_EVALUATION_FAILED",
      message:
        status === "PENDING_COMPLIANCE"
          ? "ASSIGNMENT BLOCKED — DRIVER QUALIFICATION PENDING COMPLIANCE REVIEW"
          : "ASSIGNMENT BLOCKED — DRIVER NOT QUALIFIED",
    };
  }
  if (result.reasonCodes.includes("EQUIPMENT_PLANNING_DENIED")) {
    return { reason: "EQUIPMENT_PLANNING_DENIED", message: "ASSIGNMENT BLOCKED — EQUIPMENT OUT OF SERVICE" };
  }
  return { reason: "QUALIFICATION_EVALUATION_FAILED", message: "ASSIGNMENT BLOCKED — DRIVER QUALIFICATION COULD NOT BE EVALUATED" };
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
  rejectDemoOperationalKey(loadId, "loadId");
  rejectDemoOperationalKey(driverId, "driverId");
  rejectDemoOperationalKey(tractorId, "tractorId");
  if (trailerId) rejectDemoOperationalKey(trailerId, "trailerId");
  const actorId = sessionUser!.id!;

  try {
    const assignment = await prisma.$transaction(async (tx) => {
      const load = await tx.load.findUnique({ where: { id: loadId } });
      if (!load) {
        throw Object.assign(new Error("Load not found"), { statusCode: 404 });
      }

      const authorizedRole = await requireDispatchMutationRole(tx, sessionUser, load.fleetId, null);

      const driver = await tx.driver.findUnique({ where: { id: driverId } });
      if (!driver) {
        throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
      }
      if (driver.fleetId !== load.fleetId) {
        throw Object.assign(new Error("Driver does not belong to the load fleet"), { statusCode: 422 });
      }
      if (driver.userId && driver.userId === actorId) {
        await recordAssignmentRefusal({
          actorId,
          actorEmail: sessionUser?.email,
          fleetId: load.fleetId,
          loadId: load.id,
          driverId: driver.id,
          reason: "SELF_ASSIGNMENT",
        });
        throw Object.assign(new Error("You cannot dispatch the driver record linked to your own account."), { statusCode: 403 });
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

      // Stage 0 planning gate (contract PLANNING_RESERVE): evaluated before the row exists. It takes the driver
      // lock held by qualification and readiness writers, so the decision stands until this transaction commits.
      const planning = await authorizeMovement(tx, "PLANNING_RESERVE", {
        sessionUser: sessionUser!,
        loadId: load.id,
        proposedAssignment: { driverId: driver.id, tractorId: tractor.id, trailerId: trailer?.id ?? null },
      });
      if (!planning.allowed) {
        const refusal = planningRefusal(planning);
        await recordAssignmentRefusal({
          actorId,
          actorEmail: sessionUser?.email,
          fleetId: load.fleetId,
          loadId: load.id,
          driverId: driver.id,
          reason: refusal.reason,
          reasonCodes: planning.reasonCodes,
        });
        throw Object.assign(new Error(refusal.message), { statusCode: 409 });
      }
      // Open safety-critical equipment conditions do not block planning; they are enforced at RELEASE and pickup.
      const advisory = await loadOpenSafetyCriticalConditionsForEquipment(tractor.id, trailer?.id ?? null, tx);
      const advisoryOpenConditionIds = [...advisory.openTractorConditions, ...advisory.openTrailerConditions].map(
        (condition) => condition.id,
      );

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

      const created = await tx.dispatchAssignment.create({
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
      await createAuditRecord(
        {
          action: "CREATED",
          entityType: "DispatchAssignment",
          entityId: created.id,
          tenantId: load.fleetId,
          actorId,
          actorEmail: sessionUser?.email ?? null,
          details: {
            event: "dispatch.assigned",
            loadId: load.id,
            driverId: driver.id,
            authorizedRole,
            planningDisposition: planning.disposition,
            planningReasonCodes: planning.reasonCodes,
            driverQualificationStatus: planning.driverQualificationStatus,
            driverQualificationPolicyVersion: planning.driverQualificationPolicyVersion,
            movementPolicyVersion: planning.policyVersion,
            advisoryOpenConditionIds,
          },
        },
        tx,
      );
      return created;
    });
    const store = getOperatingProcessStore();
    const assignmentLineage = { sourceSystem: "BOF" as const, sourceRecordId: assignment.id };
    const recordedFleet = { authorizedFleetId: assignment.fleetId };
    await recordOperatingProcessEvent(store, sessionUser, {
      fleetId: assignment.fleetId,
      loadId: assignment.loadId,
      entityType: "DispatchAssignment",
      entityId: assignment.id,
      eventType: "DISPATCH_ASSIGNED",
      processStage: "DISPATCH",
      eventTimestamp: assignment.assignedAt,
      actorId: actorId,
      actorType: "USER",
      resultingState: assignment.status,
      relatedRecordType: "DispatchAssignment",
      relatedRecordId: assignment.id,
      lineage: assignmentLineage,
    }, recordedFleet);
    await recordOperatingProcessEvent(store, sessionUser, {
      fleetId: assignment.fleetId,
      loadId: assignment.loadId,
      entityType: "Driver",
      entityId: assignment.driverId,
      eventType: "DRIVER_LINKED",
      processStage: "DRIVER_EQUIPMENT",
      eventTimestamp: assignment.assignedAt,
      actorId: actorId,
      actorType: "USER",
      resultingState: assignment.driverId,
      relatedRecordType: "DispatchAssignment",
      relatedRecordId: assignment.id,
      lineage: assignmentLineage,
    }, recordedFleet);
    await recordOperatingProcessEvent(store, sessionUser, {
      fleetId: assignment.fleetId,
      loadId: assignment.loadId,
      entityType: "Equipment",
      entityId: assignment.tractorEquipmentId,
      eventType: "EQUIPMENT_LINKED",
      processStage: "DRIVER_EQUIPMENT",
      eventTimestamp: assignment.assignedAt,
      actorId: actorId,
      actorType: "USER",
      resultingState: assignment.tractorEquipmentId,
      relatedRecordType: "DispatchAssignment",
      relatedRecordId: assignment.id,
      lineage: assignmentLineage,
    }, recordedFleet);
    if (assignment.trailerEquipmentId) {
      await recordOperatingProcessEvent(store, sessionUser, {
        fleetId: assignment.fleetId,
        loadId: assignment.loadId,
        entityType: "Equipment",
        entityId: assignment.trailerEquipmentId,
        eventType: "EQUIPMENT_LINKED",
        processStage: "DRIVER_EQUIPMENT",
        eventTimestamp: assignment.assignedAt,
        actorId: actorId,
        actorType: "USER",
        resultingState: assignment.trailerEquipmentId,
        relatedRecordType: "DispatchAssignment",
        relatedRecordId: assignment.id,
        lineage: { sourceSystem: "BOF", sourceRecordId: assignment.trailerEquipmentId },
      }, recordedFleet);
    }
    return assignment;
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

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.dispatchAssignment.findUnique({
      where: { id: assignmentId },
      include: { driver: { select: { userId: true } } },
    });
    if (!assignment) {
      throw Object.assign(new Error("DispatchAssignment not found"), { statusCode: 404 });
    }
    const authorizedRole = await requireDispatchMutationRole(tx, sessionUser, assignment.fleetId, assignment.id);
    if (assignment.driver.userId && assignment.driver.userId === actorId) {
      await logUnauthorizedDispatchAccess(sessionUser, assignment.fleetId, assignment.id, "SELF_ASSIGNMENT");
      throw Object.assign(new Error("You cannot change the assignment of the driver record linked to your own account."), {
        statusCode: 403,
      });
    }
    if (assignment.status !== "ACTIVE") {
      throw Object.assign(new Error("Only active assignments can be unassigned"), { statusCode: 422 });
    }

    // Conditional on the row still being ACTIVE: a concurrent closure cannot be overwritten.
    const closed = await tx.dispatchAssignment.updateMany({
      where: { id: assignment.id, status: "ACTIVE" },
      data: {
        status: nextStatus,
        unassignedAt: new Date(),
        unassignedByUserId: actorId,
      },
    });
    if (closed.count !== 1) {
      throw Object.assign(new Error("Assignment is no longer active"), { statusCode: 409 });
    }
    await createAuditRecord(
      {
        action: "UPDATED",
        entityType: "DispatchAssignment",
        entityId: assignment.id,
        tenantId: assignment.fleetId,
        actorId,
        actorEmail: sessionUser?.email ?? null,
        details: { event: "dispatch.unassigned", status: nextStatus, loadId: assignment.loadId, authorizedRole },
      },
      tx,
    );
    return tx.dispatchAssignment.findUniqueOrThrow({ where: { id: assignment.id } });
  });
}

export async function getActiveAssignmentForLoad(
  sessionUser: SessionUserLike | null | undefined,
  loadId: string,
) {
  requireSessionUser(sessionUser);

  const load = await findLoadByOperatorKey(loadId);
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

export async function getActiveAssignmentForDriver(
  sessionUser: SessionUserLike | null | undefined,
  driverId: string,
) {
  requireSessionUser(sessionUser);
  rejectDemoOperationalKey(driverId, "driverId");
  const normalizedDriverId = driverId.trim();
  const driver = await prisma.driver.findUnique({
    where: { id: normalizedDriverId },
    select: { id: true, fleetId: true },
  });
  if (!driver) {
    throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
  }

  const access = await authorizedFleetAccess(sessionUser, driver.fleetId);
  if (!access.allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, driver.fleetId, null, access.reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const assignment = await prisma.dispatchAssignment.findFirst({
    where: {
      driverId: driver.id,
      fleetId: driver.fleetId,
      status: "ACTIVE",
    },
    orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      loadId: true,
      status: true,
      assignedAt: true,
      load: {
        select: {
          id: true,
          customerName: true,
          origin: true,
          destination: true,
          status: true,
          referenceNumber: true,
        },
      },
    },
  });

  if (!assignment) return null;

  return {
    id: assignment.id,
    loadId: assignment.loadId,
    status: assignment.status,
    assignedAt: assignment.assignedAt.toISOString(),
    load: assignment.load,
  };
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
