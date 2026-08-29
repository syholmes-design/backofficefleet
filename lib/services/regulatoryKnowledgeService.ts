import { Prisma, RegulatoryRecordStatus, TrainingAssignmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireFleetAccess, type SessionUserLike } from "@/lib/authorization";

export type RegulationSearch = { query?: string; topic?: string; citation?: string; status?: RegulatoryRecordStatus; publicOnly?: boolean };

export class RegulatoryKnowledgeError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "RegulatoryKnowledgeError";
    this.statusCode = statusCode;
  }
}

function requireUser(user: SessionUserLike | null | undefined) {
  if (!user?.id) throw new RegulatoryKnowledgeError("AUTH_REQUIRED", 401);
  return user;
}

function requireFleet(user: SessionUserLike, fleetId: string) {
  const access = requireFleetAccess(user, fleetId);
  if (!access.allowed) throw new RegulatoryKnowledgeError(access.reason ?? "TENANT_ACCESS_DENIED", access.reason === "AUTH_REQUIRED" ? 401 : 403);
}

const TRAINING_ADMIN_ROLES = ["BOF_OPERATIONS", "BOF_ADMINISTRATION", "BOF_COMPLIANCE_REVIEW", "FLEET_ADMIN", "FLEET_OPERATIONS", "FLEET_MANAGER"];

const requirementInclude = {
  source: true,
  versions: { orderBy: { effectiveDate: "desc" as const }, include: { trainingLinks: { include: { trainingModule: true, trainingSegment: true } } } },
} satisfies Prisma.RegulatoryRequirementInclude;

export async function searchRegulatoryKnowledge(search: RegulationSearch = {}) {
  const query = search.query?.trim();
  return prisma.regulatoryRequirement.findMany({
    where: {
      ...(search.publicOnly ? { source: { sourceType: { in: ["REGULATION", "FMCSA_GUIDANCE", "FEDERAL_REGISTER", "FMCSA_TRAINING"] } } } : {}),
      ...(search.status ? { versions: { some: { status: search.status } } } : {}),
      ...(search.topic ? { topic: { contains: search.topic.trim(), mode: "insensitive" } } : {}),
      ...(search.citation ? { versions: { some: { citation: { contains: search.citation.trim(), mode: "insensitive" } } } } : {}),
      ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { topic: { contains: query, mode: "insensitive" } }, { cfrPart: { contains: query, mode: "insensitive" } }, { section: { contains: query, mode: "insensitive" } }] } : {}),
    },
    include: requirementInclude,
    orderBy: [{ topic: "asc" }, { title: "asc" }],
  });
}

export async function getRegulatoryRequirement(id: string) {
  const requirement = await prisma.regulatoryRequirement.findUnique({ where: { id }, include: requirementInclude });
  if (!requirement) throw new RegulatoryKnowledgeError("Regulatory requirement not found", 404);
  return requirement;
}

export async function searchTrainingForRequirement(requirementVersionId: string) {
  return prisma.regulatoryTrainingLink.findMany({ where: { requirementVersionId }, include: { trainingModule: { include: { segments: true } }, trainingSegment: true }, orderBy: [{ isPrimary: "desc" }, { trainingModule: { title: "asc" } }] });
}

export async function listTrainingModules(search?: { query?: string; category?: string; audience?: string }) {
  return prisma.trainingModule.findMany({
    where: {
      retiredAt: null,
      ...(search?.category ? { category: { contains: search.category, mode: "insensitive" } } : {}),
      ...(search?.audience ? { audience: { contains: search.audience, mode: "insensitive" } } : {}),
      ...(search?.query ? { OR: [{ title: { contains: search.query, mode: "insensitive" } }, { description: { contains: search.query, mode: "insensitive" } }, { keywords: { has: search.query } }] } : {}),
    },
    include: { segments: true, regulatoryLinks: { include: { requirementVersion: { include: { requirement: true } } } } },
    orderBy: { title: "asc" },
  });
}

export async function createTrainingAssignment(userInput: SessionUserLike | null | undefined, input: { fleetId: string; driverId: string; trainingModuleId: string; requirementVersionId?: string; dueAt?: string; reason?: string }) {
  const user = requireUser(userInput);
  const access = requireFleetAccess(user, input.fleetId, TRAINING_ADMIN_ROLES);
  if (!access.allowed) throw new RegulatoryKnowledgeError(access.reason ?? "ROLE_REQUIRED", access.reason === "AUTH_REQUIRED" ? 401 : 403);
  const driver = await prisma.driver.findFirst({ where: { id: input.driverId, fleetId: input.fleetId }, select: { id: true } });
  if (!driver) throw new RegulatoryKnowledgeError("Driver not found", 404);
  const trainingModule = await prisma.trainingModule.findUnique({ where: { id: input.trainingModuleId }, select: { id: true, retiredAt: true } });
  if (!trainingModule || trainingModule.retiredAt) throw new RegulatoryKnowledgeError("Training module not found", 404);
  if (input.requirementVersionId) {
    const requirement = await prisma.regulatoryRequirementVersion.findUnique({ where: { id: input.requirementVersionId }, select: { id: true } });
    if (!requirement) throw new RegulatoryKnowledgeError("Regulatory version not found", 404);
  }
  return prisma.$transaction(async (tx) => {
    const assignment = await tx.trainingAssignment.create({ data: { fleetId: input.fleetId, driverId: input.driverId, trainingModuleId: input.trainingModuleId, requirementVersionId: input.requirementVersionId, dueAt: input.dueAt ? new Date(input.dueAt) : undefined, reason: input.reason, assignedByUserId: user.id! } });
    await tx.auditEvent.create({ data: { actorId: user.id, actorEmail: user.email ?? undefined, tenantId: input.fleetId, action: "CREATED", entityType: "TrainingAssignment", entityId: assignment.id, details: { trainingModuleId: input.trainingModuleId, requirementVersionId: input.requirementVersionId } } });
    return assignment;
  });
}

export async function listTrainingAssignments(userInput: SessionUserLike | null | undefined, fleetId: string, driverId?: string) {
  const user = requireUser(userInput);
  requireFleet(user, fleetId);
  const internal = user.memberships?.some((membership) => membership.fleetId === fleetId && TRAINING_ADMIN_ROLES.includes(membership.roleCode) && membership.status === "ACTIVE");
  const linkedDriver = internal ? null : await prisma.driver.findFirst({ where: { fleetId, userId: user.id }, select: { id: true } });
  if (!internal && (!linkedDriver || (driverId && driverId !== linkedDriver.id))) throw new RegulatoryKnowledgeError("TRAINING_ASSIGNMENT_DENIED", 403);
  const assignments = await prisma.trainingAssignment.findMany({
    where: { fleetId, ...(driverId ? { driverId } : {}) },
    orderBy: { assignedAt: "desc" },
    include: {
      trainingModule: { include: { segments: true } },
      requirementVersion: { include: { requirement: { include: { source: true } } } },
      certification: true,
    },
  });
  if (driverId && assignments.some((assignment) => assignment.driverId !== driverId)) throw new RegulatoryKnowledgeError("Training assignment not found", 404);
  return assignments;
}

export async function updateTrainingAssignment(userInput: SessionUserLike | null | undefined, input: { fleetId: string; assignmentId: string; status: TrainingAssignmentStatus; knowledgeCheckStatus?: string; acknowledge?: boolean }) {
  const user = requireUser(userInput);
  requireFleet(user, input.fleetId);
  const assignment = await prisma.trainingAssignment.findFirst({ where: { id: input.assignmentId, fleetId: input.fleetId }, include: { driver: { select: { userId: true } } } });
  if (!assignment) throw new RegulatoryKnowledgeError("Training assignment not found", 404);
  const internal = user.memberships?.some((membership) => membership.fleetId === input.fleetId && TRAINING_ADMIN_ROLES.includes(membership.roleCode) && membership.status === "ACTIVE");
  if (!internal && assignment.driver.userId !== user.id) throw new RegulatoryKnowledgeError("TRAINING_ASSIGNMENT_DENIED", 403);
  const now = new Date();
  const updated = await prisma.trainingAssignment.update({ where: { id: assignment.id }, data: { status: input.status, knowledgeCheckStatus: input.knowledgeCheckStatus, startedAt: input.status === "STARTED" ? now : assignment.startedAt, viewedAt: input.status === "VIEWED" ? now : assignment.viewedAt, acknowledgedAt: input.acknowledge ? now : assignment.acknowledgedAt, completedAt: ["COMPLETE", "CERTIFIED"].includes(input.status) ? now : assignment.completedAt } });
  await prisma.auditEvent.create({ data: { actorId: user.id, actorEmail: user.email ?? undefined, tenantId: input.fleetId, action: "UPDATED", entityType: "TrainingAssignment", entityId: assignment.id, details: { status: input.status, knowledgeCheckStatus: input.knowledgeCheckStatus, acknowledged: input.acknowledge ?? false } } });
  return updated;
}

export async function certifyTrainingAssignment(userInput: SessionUserLike | null | undefined, input: { fleetId: string; assignmentId: string; outcome: "CERTIFIED" | "NOT_CERTIFIED" | "EXPIRED" | "REQUIRES_REVIEW"; expiresAt?: string; notes?: string }) {
  const user = requireUser(userInput);
  const access = requireFleetAccess(user, input.fleetId, TRAINING_ADMIN_ROLES);
  if (!access.allowed) throw new RegulatoryKnowledgeError(access.reason ?? "ROLE_REQUIRED", access.reason === "AUTH_REQUIRED" ? 401 : 403);
  const assignment = await prisma.trainingAssignment.findFirst({ where: { id: input.assignmentId, fleetId: input.fleetId }, select: { id: true, driverId: true } });
  if (!assignment) throw new RegulatoryKnowledgeError("Training assignment not found", 404);
  const certification = await prisma.$transaction(async (tx) => {
    const record = await tx.trainingCertification.upsert({ where: { assignmentId: assignment.id }, create: { assignmentId: assignment.id, fleetId: input.fleetId, driverId: assignment.driverId, outcome: input.outcome, certifiedById: user.id, expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined, notes: input.notes }, update: { outcome: input.outcome, certifiedById: user.id, certifiedAt: new Date(), expiresAt: input.expiresAt ? new Date(input.expiresAt) : null, notes: input.notes } });
    await tx.trainingAssignment.update({ where: { id: assignment.id }, data: { status: input.outcome === "CERTIFIED" ? "CERTIFIED" : "REVIEW_REQUIRED" } });
    await tx.auditEvent.create({ data: { actorId: user.id, actorEmail: user.email ?? undefined, tenantId: input.fleetId, action: "UPDATED", entityType: "TrainingCertification", entityId: record.id, details: { assignmentId: assignment.id, outcome: input.outcome } } });
    return record;
  });
  return certification;
}

export async function getRegulatoryCitationForOperatingRecord(user: SessionUserLike, fleetId: string, recordType: "REGULATION" | "TRAINING_MODULE" | "TRAINING_ASSIGNMENT" | "TRAINING_CERTIFICATION", recordId: string) {
  requireFleet(user, fleetId);
  if (recordType === "REGULATION") {
    const requirement = await getRegulatoryRequirement(recordId);
    return { tenantId: fleetId, recordType, recordId, title: requirement.title, snapshot: { id: requirement.id, title: requirement.title, topic: requirement.topic, source: requirement.source, versions: requirement.versions }, route: `/qa#regulation-${requirement.id}` };
  }
  if (recordType === "TRAINING_MODULE") {
    const trainingModule = await prisma.trainingModule.findUnique({ where: { id: recordId }, include: { segments: true, regulatoryLinks: { include: { requirementVersion: { include: { requirement: true } } } } } });
    if (!trainingModule) throw new RegulatoryKnowledgeError("Training module not found", 404);
    return { tenantId: fleetId, recordType, recordId, title: trainingModule.title, snapshot: { id: trainingModule.id, title: trainingModule.title, category: trainingModule.category, ownership: trainingModule.ownership, version: trainingModule.version, regulatoryLinks: trainingModule.regulatoryLinks }, route: "/safety/training" };
  }
  if (recordType === "TRAINING_ASSIGNMENT") {
    const assignment = await prisma.trainingAssignment.findFirst({ where: { id: recordId, fleetId }, include: { trainingModule: true, requirementVersion: { include: { requirement: true } }, certification: true } });
    if (!assignment) throw new RegulatoryKnowledgeError("Training assignment not found", 404);
    return { tenantId: fleetId, recordType, recordId, title: `Training assignment: ${assignment.trainingModule.title}`, snapshot: assignment as unknown as Record<string, unknown>, route: "/safety/training" };
  }
  const certification = await prisma.trainingCertification.findFirst({ where: { id: recordId, fleetId }, include: { assignment: { include: { trainingModule: true, requirementVersion: { include: { requirement: true } } } } } });
  if (!certification) throw new RegulatoryKnowledgeError("Training certification not found", 404);
  return { tenantId: fleetId, recordType, recordId, title: `Training certification: ${certification.assignment.trainingModule.title}`, snapshot: certification as unknown as Record<string, unknown>, route: "/safety/training" };
}
