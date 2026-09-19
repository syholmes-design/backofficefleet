import { Prisma, RequisitionApprovalDecision, RequisitionApprovalRole, RequisitionStatus } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";
import { prisma } from "@/lib/prisma";
import {
  REQUISITION_UPDATABLE_BOOLEAN_FIELDS,
  REQUISITION_UPDATABLE_STRING_FIELDS,
} from "@/lib/recruiting/requisition-fields";
import {
  canPerformWorkflowAction,
  getSubmitFieldErrors,
  isCdlRequisition,
  missingApprovalsForApprove,
  nextRequisitionStatus,
  REQUISITION_APPROVAL_ROLES,
  rolesAllowedToRecordApproval,
  type RequisitionAction,
  type RequisitionApprovalRoleValue,
  type RequisitionStatusValue,
} from "@/lib/recruiting/requisition-transitions";

const APPROVAL_SEED = REQUISITION_APPROVAL_ROLES.map((approvalRole) => ({
  approvalRole: approvalRole as RequisitionApprovalRole,
  decision: "PENDING" as RequisitionApprovalDecision,
  signatureCaptureKind: "NOT_CAPTURED" as const,
}));

function httpError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

export async function logRequisitionUnauthorized(
  user: SessionUserLike | null | undefined,
  fleetId: string | null,
  requisitionId: string | null,
  reason: string,
) {
  await createAuditRecord({
    actorId: user?.id ?? null,
    actorEmail: user?.email ?? null,
    tenantId: fleetId,
    action: "ACCESS_DENIED",
    entityType: "Requisition",
    entityId: requisitionId,
    details: { event: "unauthorized.access", reason },
    metadata: { source: "requisition-api" },
  });
}

function membershipRoleCodes(user: SessionUserLike | null | undefined, fleetId: string): string[] {
  const onFleet = (user?.memberships ?? [])
    .filter((membership) => membership.fleetId === fleetId && membership.status !== "INACTIVE" && membership.status !== "INVITED")
    .map((membership) => membership.roleCode);
  const service = (user?.memberships ?? [])
    .filter(
      (membership) =>
        membership.status !== "INACTIVE" &&
        membership.status !== "INVITED" &&
        (membership.roleCode === "BOF_OPERATIONS" || membership.roleCode === "BOF_COMPLIANCE_REVIEW"),
    )
    .map((membership) => membership.roleCode);
  return [...new Set([...onFleet, ...service])];
}

async function requireAccess(user: SessionUserLike | null | undefined, fleetId: string) {
  if (!user?.id) {
    throw httpError("Unauthorized", 401);
  }
  const access = await authorizedFleetAccess(user, fleetId);
  if (!access.allowed) {
    await logRequisitionUnauthorized(user, fleetId, null, access.reason ?? "TENANT_ACCESS_DENIED");
    throw httpError("Forbidden", 403);
  }
}

function requireAction(user: SessionUserLike, fleetId: string, action: RequisitionAction) {
  const codes = membershipRoleCodes(user, fleetId);
  if (!canPerformWorkflowAction(action, codes)) {
    throw httpError(`Role is not authorized to ${action} this requisition`, 403);
  }
}

function parseOptionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw httpError("Invalid date", 422);
  }
  return date;
}

function parseOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw httpError("Invalid integer", 422);
  }
  return parsed;
}

function parseOptionalBoolean(value: unknown): boolean | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "on" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw httpError("Invalid boolean", 422);
}

export async function generateRequisitionPublicNumber(fleetId: string) {
  const count = await prisma.requisition.count({ where: { fleetId } });
  return `BOF-HR-DRV-${String(count + 1).padStart(3, "0")}`;
}

function draftPatchFromBody(body: Record<string, unknown>): Prisma.RequisitionUpdateInput {
  const data: Prisma.RequisitionUpdateInput = {};
  for (const field of REQUISITION_UPDATABLE_STRING_FIELDS) {
    if (field in body) {
      const value = body[field];
      (data as Record<string, unknown>)[field] = value === null || value === undefined ? null : String(value);
    }
  }
  for (const field of REQUISITION_UPDATABLE_BOOLEAN_FIELDS) {
    if (field in body) {
      (data as Record<string, unknown>)[field] = parseOptionalBoolean(body[field]) ?? null;
    }
  }
  if ("numberOfPositions" in body) {
    const parsed = parseOptionalInt(body.numberOfPositions);
    if (parsed !== undefined) {
      if (parsed < 1) throw httpError("Number of positions must be at least 1", 422);
      data.numberOfPositions = parsed;
    }
  }
  if ("minimumAge" in body) {
    const parsed = parseOptionalInt(body.minimumAge);
    data.minimumAge = parsed ?? null;
  }
  if ("targetStartDate" in body) {
    data.targetStartDate = parseOptionalDate(body.targetStartDate);
  }
  return data;
}

export async function listRequisitionsForUser(user: SessionUserLike | null | undefined, requestedFleetId?: string | null) {
  if (!user?.id) {
    throw httpError("Unauthorized", 401);
  }
  const membershipFleetIds = (user.memberships ?? [])
    .filter((membership) => membership.status !== "INACTIVE" && membership.status !== "INVITED")
    .map((membership) => membership.fleetId);
  const aggregatorFleets = await prisma.aggregatorMembership.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    select: { aggregator: { select: { aggregatorFleets: { where: { status: "ACTIVE" }, select: { fleetId: true } } } } },
  });
  const allowed = new Set([
    ...membershipFleetIds,
    ...aggregatorFleets.flatMap((row) => row.aggregator.aggregatorFleets.map((fleet) => fleet.fleetId)),
  ]);
  if (requestedFleetId) {
    if (!allowed.has(requestedFleetId)) {
      await logRequisitionUnauthorized(user, requestedFleetId, null, "TENANT_ACCESS_DENIED");
      throw httpError("Forbidden", 403);
    }
  }
  const fleetIds = requestedFleetId ? [requestedFleetId] : [...allowed];
  if (fleetIds.length === 0) {
    return [];
  }
  return prisma.requisition.findMany({
    where: { fleetId: { in: fleetIds } },
    include: {
      fleet: { select: { id: true, name: true, slug: true } },
      requestingManager: { select: { id: true, name: true, email: true } },
      approvals: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAuthorizedRequisition(user: SessionUserLike | null | undefined, requisitionId: string) {
  const requisition = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: {
      fleet: { select: { id: true, name: true, slug: true } },
      requestingManager: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      approvals: { orderBy: { approvalRole: "asc" } },
    },
  });
  if (!requisition) {
    throw httpError("Requisition not found", 404);
  }
  await requireAccess(user, requisition.fleetId);
  return requisition;
}

export async function createDraftRequisition(input: {
  sessionUser: SessionUserLike | null | undefined;
  fleetId?: string;
}) {
  if (!input.sessionUser?.id) {
    throw httpError("Unauthorized", 401);
  }
  const fleetId = input.fleetId ?? input.sessionUser.memberships?.find((membership) => membership.status !== "INACTIVE")?.fleetId;
  if (!fleetId) {
    throw httpError("No fleet membership available to create a requisition", 422);
  }
  await requireAccess(input.sessionUser, fleetId);
  const creatorRoles = membershipRoleCodes(input.sessionUser, fleetId);
  if (creatorRoles.length === 0 || creatorRoles.every((code) => code === "DRIVER")) {
    throw httpError("Driver accounts cannot create requisitions", 403);
  }

  const fleet = await prisma.fleet.findUnique({ where: { id: fleetId }, select: { id: true, name: true } });
  if (!fleet) {
    throw httpError("Fleet not found", 404);
  }

  const publicNumber = await generateRequisitionPublicNumber(fleetId);
  const requisition = await prisma.requisition.create({
    data: {
      fleetId,
      publicNumber,
      createdByUserId: input.sessionUser.id,
      requestingManagerUserId: input.sessionUser.id,
      requestingManagerName: input.sessionUser.email ?? null,
      requestingCarrierName: fleet.name,
      numberOfPositions: 1,
      approvals: { create: APPROVAL_SEED },
    },
    include: { fleet: { select: { id: true, name: true, slug: true } }, approvals: true },
  });

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: fleetId,
    action: "CREATED",
    entityType: "Requisition",
    entityId: requisition.id,
    details: { publicNumber, status: "DRAFT" },
    metadata: { source: "requisition-api" },
  });

  return requisition;
}

export async function updateDraftRequisition(input: {
  sessionUser: SessionUserLike | null | undefined;
  requisitionId: string;
  body: Record<string, unknown>;
}) {
  const requisition = await getAuthorizedRequisition(input.sessionUser, input.requisitionId);
  if (requisition.status !== "DRAFT") {
    throw httpError("Only DRAFT requisitions can be edited", 422);
  }
  if (input.body.fleetId && input.body.fleetId !== requisition.fleetId) {
    throw httpError("Fleet identity cannot be changed by the client", 422);
  }
  if (input.body.createdByUserId || input.body.requestingManagerUserId) {
    throw httpError("User identity cannot be assigned by the client", 422);
  }

  const data = draftPatchFromBody(input.body);
  const updated = await prisma.requisition.update({
    where: { id: requisition.id },
    data,
    include: { fleet: { select: { id: true, name: true, slug: true } }, approvals: true, requestingManager: { select: { id: true, name: true, email: true } } },
  });

  await createAuditRecord({
    actorId: input.sessionUser?.id,
    actorEmail: input.sessionUser?.email ?? null,
    tenantId: requisition.fleetId,
    action: "UPDATED",
    entityType: "Requisition",
    entityId: requisition.id,
    details: { fields: Object.keys(data) },
    metadata: { source: "requisition-api" },
  });

  return updated;
}

export async function transitionRequisition(input: {
  sessionUser: SessionUserLike | null | undefined;
  requisitionId: string;
  action: RequisitionAction;
  notes?: string;
}) {
  if (!input.sessionUser?.id) {
    throw httpError("Unauthorized", 401);
  }
  const requisition = await getAuthorizedRequisition(input.sessionUser, input.requisitionId);
  requireAction(input.sessionUser, requisition.fleetId, input.action);

  const current = requisition.status as RequisitionStatusValue;
  const next = nextRequisitionStatus(current, input.action);

  if (input.action === "submit") {
    const errors = getSubmitFieldErrors({
      positionTitle: requisition.positionTitle,
      numberOfPositions: requisition.numberOfPositions,
      targetStartDate: requisition.targetStartDate,
    });
    if (errors.length > 0) {
      throw httpError(errors.join("; "), 422);
    }
  }

  if (input.action === "approve") {
    const missing = missingApprovalsForApprove(requisition.cdlClass, requisition.approvals);
    if (missing.length > 0) {
      throw httpError(`CDL/approval requirements incomplete: ${missing.join(", ")} must approve before the requisition can be APPROVED`, 422);
    }
  }

  if (input.action === "approve" && current === "ON_HOLD" && requisition.statusBeforeHold && requisition.statusBeforeHold !== "UNDER_REVIEW" && requisition.statusBeforeHold !== "APPROVED") {
    throw httpError("Held requisition cannot be approved from its prior state", 422);
  }

  const now = new Date();
  const data: Prisma.RequisitionUpdateInput = {
    status: next as RequisitionStatus,
  };

  if (input.action === "submit") {
    data.submittedAt = now;
    data.dateSubmitted = now;
  }
  if (input.action === "review") {
    data.reviewedAt = now;
    data.heldAt = null;
    data.statusBeforeHold = null;
  }
  if (input.action === "approve") {
    data.approvedAt = now;
    data.recruitingPipelineState = "READY_FOR_RECRUITING";
    data.recruitingOpenedAt = now;
    data.heldAt = null;
    data.statusBeforeHold = null;
  }
  if (input.action === "hold") {
    data.heldAt = now;
    data.statusBeforeHold = current as RequisitionStatus;
    data.recruitingPipelineState = "NOT_OPEN";
  }
  if (input.action === "cancel") {
    data.cancelledAt = now;
    data.recruitingPipelineState = "NOT_OPEN";
  }
  if (input.action === "fill") {
    data.filledAt = now;
  }

  const updated = await prisma.requisition.update({
    where: { id: requisition.id },
    data,
    include: { fleet: { select: { id: true, name: true, slug: true } }, approvals: true, requestingManager: { select: { id: true, name: true, email: true } } },
  });

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: requisition.fleetId,
    action: "UPDATED",
    entityType: "Requisition",
    entityId: requisition.id,
    details: { action: input.action, from: current, to: next, notes: input.notes ?? null, cdlRequisition: isCdlRequisition(requisition.cdlClass) },
    metadata: { source: "requisition-api" },
  });

  return updated;
}

export async function recordRequisitionApproval(input: {
  sessionUser: SessionUserLike | null | undefined;
  requisitionId: string;
  approvalRole: string;
  decision: string;
  notes?: string;
  signatureName?: string;
  reviewerName?: string;
}) {
  if (!input.sessionUser?.id) {
    throw httpError("Unauthorized", 401);
  }
  const requisition = await getAuthorizedRequisition(input.sessionUser, input.requisitionId);
  if (requisition.status !== "UNDER_REVIEW" && requisition.status !== "SUBMITTED" && requisition.status !== "ON_HOLD") {
    throw httpError("Approvals can only be recorded while the requisition is submitted, under review, or on hold", 422);
  }
  if (!REQUISITION_APPROVAL_ROLES.includes(input.approvalRole as RequisitionApprovalRoleValue)) {
    throw httpError("Unknown approval role", 422);
  }
  const role = input.approvalRole as RequisitionApprovalRoleValue;
  if (role === "FLEET_SAFETY_DIRECTOR" && !isCdlRequisition(requisition.cdlClass)) {
    throw httpError("Fleet Safety Director approval applies to CDL requisitions", 422);
  }
  const actorRoles = membershipRoleCodes(input.sessionUser, requisition.fleetId);
  const allowed = rolesAllowedToRecordApproval(role);
  const codes = actorRoles.length > 0 ? actorRoles : (input.sessionUser.memberships ?? []).map((membership) => membership.roleCode);
  if (!codes.some((code) => allowed.includes(code))) {
    throw httpError(`Role is not authorized to record ${role} approval`, 403);
  }
  if (input.decision !== "APPROVED" && input.decision !== "NOT_APPROVED" && input.decision !== "PENDING") {
    throw httpError("Decision must be PENDING, APPROVED, or NOT_APPROVED", 422);
  }

  const updated = await prisma.requisitionApproval.update({
    where: { requisitionId_approvalRole: { requisitionId: requisition.id, approvalRole: role as RequisitionApprovalRole } },
    data: {
      decision: input.decision as RequisitionApprovalDecision,
      reviewerUserId: input.sessionUser.id,
      reviewerName: input.reviewerName?.trim() || input.sessionUser.email || null,
      notes: input.notes ?? null,
      signatureName: input.signatureName?.trim() || null,
      signatureCaptureKind: input.signatureName?.trim() ? "FORM_FIELD" : "NOT_CAPTURED",
      decidedAt: input.decision === "PENDING" ? null : new Date(),
    },
  });

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: requisition.fleetId,
    action: "UPDATED",
    entityType: "RequisitionApproval",
    entityId: updated.id,
    details: { requisitionId: requisition.id, approvalRole: role, decision: input.decision, signatureCaptureKind: updated.signatureCaptureKind },
    metadata: { source: "requisition-api" },
  });

  return getAuthorizedRequisition(input.sessionUser, requisition.id);
}
