import { createAuditRecord } from "@/lib/audit";
import { hasRole, type SessionUserLike } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import type { WorkHistoryInput } from "@/lib/qualification/work-history-input";
import { authorizedFleetAccess } from "@/lib/services/intakeService";
import { reevaluateDriverReadinessAfterDocumentChange } from "@/lib/services/readinessReevaluationService";

/**
 * Employment history on a DriverIntake. Qualification requires it (WORK_HISTORY_INCOMPLETE until at
 * least one entry exists), and before this service nothing could record it, so no recruited driver
 * could become qualified or dispatch-ready. Recording an entry re-runs the existing qualification and
 * readiness evaluation.
 */

/** Who may record qualification-file employment history: BOF compliance/operations and fleet HR leads. */
export const WORK_HISTORY_EDITOR_ROLES = ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW", "FLEET_ADMIN", "FLEET_MANAGER"] as const;

function httpError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

async function authorizedIntake(user: SessionUserLike, intakeId: string) {
  const intake = await prisma.driverIntake.findUnique({ where: { id: intakeId }, select: { id: true, driverId: true, fleetId: true } });
  if (!intake) throw httpError("Driver intake not found", 404);
  const access = await authorizedFleetAccess(user, intake.fleetId);
  // Out-of-tenant intakes read as not found.
  if (!access.allowed) throw httpError("Driver intake not found", 404);
  return intake;
}

export async function listWorkHistory(user: SessionUserLike, intakeId: string) {
  const intake = await authorizedIntake(user, intakeId);
  const rows = await prisma.workHistory.findMany({
    where: { driverIntakeId: intake.id },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    select: { id: true, employerName: true, startDate: true, endDate: true, status: true, createdAt: true },
  });
  return { intake, rows, canEdit: hasRole(user, [...WORK_HISTORY_EDITOR_ROLES]) };
}

export async function recordWorkHistory(user: SessionUserLike, intakeId: string, input: WorkHistoryInput) {
  const intake = await authorizedIntake(user, intakeId);
  if (!hasRole(user, [...WORK_HISTORY_EDITOR_ROLES])) throw httpError("Only BOF compliance/operations or fleet HR leads can record employment history", 403);
  const row = await prisma.workHistory.create({
    data: {
      driverId: intake.driverId,
      driverIntakeId: intake.id,
      employerName: input.employerName,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "ACTIVE",
    },
  });
  await createAuditRecord({
    actorId: user.id ?? null,
    actorEmail: user.email ?? null,
    tenantId: intake.fleetId,
    action: "CREATED",
    entityType: "WorkHistory",
    entityId: row.id,
    details: { driverId: intake.driverId, driverIntakeId: intake.id, employerName: input.employerName },
  });
  const evaluation = await reevaluateDriverReadinessAfterDocumentChange({
    sessionUser: user,
    driverId: intake.driverId,
    driverIntakeId: intake.id,
    fleetId: intake.fleetId,
  });
  return { row, evaluation };
}
