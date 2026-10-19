import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createAuditRecord } from "@/lib/audit";
import { readRecruitingV2DriverHandoff } from "@/lib/recruiting-v2/driver-activation-service";
import { candidateScopeWhere, resolveRecruitingScope, type RecruitingScope } from "@/lib/recruiting-v2/candidate-scope";
import type { SessionUserLike } from "@/lib/authorization";
import { evaluateRecruitingV2DocumentGates } from "@/lib/recruiting-v2/document-gate-engine";
import { artifactSummaryForRecord, metadataWithoutArtifactBytes } from "@/lib/recruiting-v2/document-artifact";
import { recruitingPipelineState, requisitionPipelineCounts } from "@/lib/recruiting/requisition-pipeline";
import { evaluateRequisitionScreening } from "@/lib/recruiting/requisition-screening";
import { publicOpeningInclude, toPublicOpening, type PublicOpening } from "@/lib/recruiting/public-openings";
import {
  buildRecruitingWorkspaceModel,
  positionFieldsFromRequisition,
  type WorkspaceActivationFacts,
  type WorkspaceCandidateRow,
  type WorkspacePositionRow,
  type WorkspaceRequisition,
} from "@/lib/recruiting/workspace-model";

/**
 * Connects the September 18 requisition front door to recruiting: an approved requisition opens one
 * recruiting Position (linked by requisitionId), candidates are attached to that position, and the
 * requisition's recruiting pipeline state follows its candidates through to FILLED.
 */

function httpError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

/** Opens (or returns) the recruiting position for an approved requisition. Idempotent. */
export async function openRecruitingPositionForRequisition(requisitionId: string, actor?: { id?: string | null; email?: string | null }) {
  const requisition = await prisma.requisition.findUnique({ where: { id: requisitionId }, include: { recruitingPosition: true } });
  if (!requisition) throw httpError("Requisition not found", 404);
  if (requisition.status !== "APPROVED" && requisition.status !== "FILLED") {
    throw httpError("Only an approved requisition opens a recruiting position", 422);
  }
  if (requisition.recruitingPosition) return requisition.recruitingPosition;

  const fields = positionFieldsFromRequisition(requisition);
  const position = await prisma.position.create({
    data: { ...fields, status: "OPEN", requisitionId: requisition.id, fleetId: requisition.fleetId },
  });
  if (actor?.id) {
    await createAuditRecord({
      actorId: actor.id,
      actorEmail: actor.email ?? null,
      tenantId: requisition.fleetId,
      action: "CREATED",
      entityType: "Position",
      entityId: position.id,
      details: { event: "requisition.recruiting-position.opened", requisitionId: requisition.id, publicNumber: requisition.publicNumber },
      metadata: { source: "requisition-recruiting-bridge" },
    });
  }
  return position;
}

/** Recomputes the requisition's recruiting pipeline state from its candidates and stores it. */
export async function syncRequisitionRecruitingPipeline(requisitionId: string) {
  const requisition = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: { recruitingPosition: { include: { candidates: { include: { interviews: { select: { status: true } } } } } } },
  });
  if (!requisition?.recruitingPosition) return null;
  const counts = requisitionPipelineCounts(
    requisition.numberOfPositions,
    requisition.recruitingPosition.candidates.map((c) => ({
      dispositionStatus: c.dispositionStatus,
      applicationStatus: c.applicationStatus,
      interviewCompleted: c.interviews.some((i) => i.status === "COMPLETED"),
      offerStatus: String((c.offerSummary as { offerStatus?: string } | null)?.offerStatus ?? "NOT_PROVIDED"),
      activationStatus: c.activationStatus,
    })),
  );
  const approved = requisition.status === "APPROVED" || requisition.status === "FILLED";
  const state = recruitingPipelineState(approved, counts);
  const data: Prisma.RequisitionUpdateInput = { recruitingPipelineState: state };
  if (state === "FILLED" && requisition.status === "APPROVED") {
    data.status = "FILLED";
    data.filledAt = new Date();
  }
  if (state !== requisition.recruitingPipelineState || data.status) {
    await prisma.requisition.update({ where: { id: requisition.id }, data });
  }
  return { state, counts };
}

export async function syncPipelineForPosition(positionId: string) {
  const position = await prisma.position.findUnique({ where: { id: positionId }, select: { requisitionId: true } });
  if (position?.requisitionId) await syncRequisitionRecruitingPipeline(position.requisitionId);
}

function fleetFilter(scope: RecruitingScope) {
  return scope.platform ? {} : { fleetId: { in: scope.fleetIds } };
}

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function reasonList(summary: string | null, reasonCodes: Prisma.JsonValue | null) {
  const codes = Array.isArray(reasonCodes) ? reasonCodes.map((item) => (typeof item === "string" ? item : JSON.stringify(item))) : [];
  return [summary, ...codes].filter((item): item is string => Boolean(item));
}

/** Everything the Recruiting & Onboarding workspace shows, limited to the user's recruiting scope. */
export async function loadRecruitingWorkspace(user: SessionUserLike) {
  if (!user?.id) throw httpError("Unauthorized", 401);
  const scope = await resolveRecruitingScope(user);

  const requisitionRows = await prisma.requisition.findMany({
    where: { ...fleetFilter(scope), status: { in: ["APPROVED", "FILLED"] } },
    include: { fleet: { select: { name: true } }, approvals: { select: { approvalRole: true, decision: true } } },
    orderBy: { approvedAt: "desc" },
  });
  const positionRows = await prisma.position.findMany({
    where: scope.platform ? {} : { OR: [{ fleetId: { in: scope.fleetIds } }, { candidates: { some: candidateScopeWhere(scope) } }] },
    orderBy: { createdAt: "desc" },
  });
  const candidateRows = await prisma.candidate.findMany({
    where: { AND: [candidateScopeWhere(scope), { positionId: { in: positionRows.map((p) => p.id) } }] },
    include: {
      documentRecords: { orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }] },
      interviews: { orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }] },
    },
    orderBy: { createdAt: "asc" },
  });

  const activations: Record<string, WorkspaceActivationFacts> = {};
  for (const candidate of candidateRows) {
    const handoff = candidate.activationStatus === "ACTIVE" ? readRecruitingV2DriverHandoff(candidate.applicationSummary) : null;
    if (!handoff) continue;
    const [driver, qualification, readiness, documents] = await Promise.all([
      prisma.driver.findFirst({ where: { id: handoff.driverId, fleetId: handoff.fleetId }, select: { id: true, status: true } }),
      prisma.driverQualificationSnapshot.findFirst({ where: { driverId: handoff.driverId, driverIntakeId: handoff.driverIntakeId }, orderBy: { evaluatedAt: "desc" } }),
      prisma.driverReadinessScore.findFirst({ where: { driverId: handoff.driverId, driverIntakeId: handoff.driverIntakeId }, orderBy: { evaluatedAt: "desc" } }),
      prisma.driverDocument.count({ where: { driverId: handoff.driverId, driverIntakeId: handoff.driverIntakeId } }),
    ]);
    if (!driver) continue;
    activations[candidate.candidateCode] = {
      simulated: false,
      driverId: driver.id,
      driverIntakeId: handoff.driverIntakeId,
      fleetId: handoff.fleetId,
      activatedAt: handoff.activatedAt,
      driverHref: `/drivers/${driver.id}`,
      // The live driver file (qualification, readiness, employment history), not the demo safety page.
      readinessHref: `/drivers/${driver.id}`,
      qualification: qualification ? { status: qualification.status, reasons: reasonList(qualification.summary, qualification.reasonCodes) } : null,
      readiness: readiness
        ? { status: readiness.status, score: readiness.score, blockers: reasonList(readiness.summary, readiness.reasonCodes), dispatchEligible: readiness.status === "READY" }
        : null,
      records: [
        `Driver ${driver.id} (${driver.status})`,
        `Driver intake ${handoff.driverIntakeId} (qualification review)`,
        `${documents} driver document record${documents === 1 ? "" : "s"} carried over from recruiting`,
        qualification ? `Qualification snapshot ${qualification.id}` : "Qualification snapshot not written",
        readiness ? `Readiness score ${readiness.id}` : "Readiness score not written",
      ],
    };
  }

  const requisitions: WorkspaceRequisition[] = requisitionRows.map((r) => ({
    ...r,
    fleetName: r.fleet?.name ?? null,
    targetStartDate: iso(r.targetStartDate),
    approvedAt: iso(r.approvedAt),
    approvals: r.approvals.map((a) => ({ approvalRole: a.approvalRole, decision: a.decision })),
  }));
  const positions: WorkspacePositionRow[] = positionRows.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));
  const candidates: WorkspaceCandidateRow[] = candidateRows.map((c) => ({
    ...c,
    dispositionAt: iso(c.dispositionAt),
    createdAt: c.createdAt.toISOString(),
    documents: c.documentRecords.map((d) => ({
      id: d.id,
      documentCode: d.documentCode,
      candidateId: d.candidateId,
      documentType: d.documentType,
      status: d.status,
      expirationDate: iso(d.expirationDate),
      uploadedBy: d.uploadedBy,
      verifiedBy: d.verifiedBy,
      verificationNotes: d.verificationNotes,
      // Uploaded file bytes stay on the server; the workspace gets the view/download links below.
      metadata: metadataWithoutArtifactBytes(d.metadata),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
    documentFiles: Object.fromEntries(
      c.documentRecords.flatMap((d) => {
        const file = artifactSummaryForRecord({ candidateCode: c.candidateCode, documentCode: d.documentCode, documentType: d.documentType, metadata: d.metadata });
        return file.attached && file.viewUrl && file.downloadUrl
          ? [[d.documentCode, { fileName: file.fileName, viewUrl: file.viewUrl, downloadUrl: file.downloadUrl, synthetic: file.synthetic }]]
          : [];
      }),
    ),
    interviews: c.interviews.map((i) => ({
      id: i.id,
      interviewCode: i.interviewCode,
      interviewDate: iso(i.scheduledFor),
      interviewType: i.interviewType,
      location: i.location,
      status: i.status,
      score: i.score,
      recommendation: i.recommendation,
      interviewers: i.interviewers,
      notes: i.notes,
      questionnaire: i.questionnaire,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
  }));

  return buildRecruitingWorkspaceModel({
    mode: "live",
    requisitions,
    positions,
    candidates,
    activations,
    requisitionHref: (id) => `/recruiting/requisitions/${id}`,
    requisitionsHref: "/recruiting",
  });
}

/** Resolves a position the user may recruit for (platform staff, or a recruiting role on its fleet). */
export async function requireRecruitingPosition(user: SessionUserLike, positionId: string) {
  const scope = await resolveRecruitingScope(user);
  const position = await prisma.position.findUnique({ where: { id: positionId }, include: { requisition: true } });
  if (!position || (!scope.platform && (!position.fleetId || !scope.fleetIds.includes(position.fleetId)))) {
    throw httpError("Position not found", 404);
  }
  return position;
}

/** The requisition-driven screening for one candidate, or null when the candidate has no requisition. */
export async function requisitionScreeningForCandidate(candidateId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { position: { include: { requisition: true } }, documentRecords: true },
  });
  const requisition = candidate?.position.requisition;
  if (!candidate || !requisition) return null;
  const summary = (candidate.applicationSummary ?? {}) as Record<string, unknown>;
  const screening = (summary.screening ?? {}) as { confirmations?: Record<string, { confirmedBy: string; confirmedAt: string; notes?: string | null }> };
  const years = Number(summary.experienceYears);
  const documentGates = evaluateRecruitingV2DocumentGates(
    candidate.documentRecords.map((d) => ({
      id: d.id,
      documentCode: d.documentCode,
      candidateId: d.candidateId,
      documentType: d.documentType,
      status: d.status,
      expirationDate: iso(d.expirationDate),
      uploadedBy: d.uploadedBy,
      verifiedBy: d.verifiedBy,
      verificationNotes: d.verificationNotes,
      metadata: d.metadata,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
  );
  const evaluation = evaluateRequisitionScreening({
    requisition,
    candidate: {
      cdlClass: candidate.cdlClass,
      experienceYears: Number.isFinite(years) ? years : null,
      endorsements: Array.isArray(summary.endorsements) ? summary.endorsements.filter((e): e is string => typeof e === "string") : [],
      equipmentExperience: typeof summary.equipmentExperience === "string" ? summary.equipmentExperience : null,
      confirmations: screening.confirmations ?? {},
    },
    documentGates,
  });
  return { candidate, requisition, publicNumber: requisition.publicNumber, evaluation };
}

// ---------------------------------------------------------------------------------------------
// Candidate intake: one implementation for recruiter attachment (workspace) and public applications
// (careers page). Both create the Candidate on the requisition's recruiting position.
// ---------------------------------------------------------------------------------------------

export type CandidateIntake = {
  fullName: string;
  email: string;
  phone?: string;
  homeLocation?: string;
  cdlClass: string;
  cdlState?: string;
  cdlNumber?: string;
  experienceYears?: number | null;
  endorsements?: string[];
  equipmentExperience?: string | null;
  /** Where the candidate came from, e.g. "BOF Careers Page" or "Recruiter attached in Recruiting & Onboarding". */
  source: string;
  /** Who attached the candidate, for the audit trail. */
  attachedBy: string;
};

type IntakePosition = {
  id: string;
  status: string;
  title: string;
  positionCode: string;
  requisitionId: string | null;
  fleetId: string | null;
  requisition: { publicNumber: string } | null;
};

function maskCdl(value: string, state: string) {
  const digits = value.replace(/[^0-9A-Za-z]/g, "");
  if (!digits) return "";
  return `${state || "XX"}••••${digits.slice(-4)}`;
}

async function nextCandidateCode() {
  const existing = await prisma.candidate.findMany({ where: { candidateCode: { startsWith: "CAND-" } }, select: { candidateCode: true } });
  const max = existing.reduce((m, c) => Math.max(m, Number(c.candidateCode.slice(5)) || 0), 0);
  return `CAND-${String(max + 1).padStart(3, "0")}`;
}

/** Creates a Candidate on a recruiting position (and so on its originating requisition). */
export async function attachCandidateToPosition(position: IntakePosition, input: CandidateIntake) {
  if (position.status === "CLOSED") throw httpError("Position is closed", 422);
  const email = input.email.trim().toLowerCase();
  const duplicate = await prisma.candidate.findFirst({
    where: { positionId: position.id, email: { equals: email, mode: "insensitive" } },
    select: { candidateCode: true },
  });
  if (duplicate) throw httpError(`This candidate is already attached as ${duplicate.candidateCode}`, 409);

  const cdlState = (input.cdlState ?? "").trim().toUpperCase().slice(0, 2);
  const now = new Date().toISOString();
  const requisitionNumber = position.requisition?.publicNumber ?? null;
  const candidate = await prisma.candidate.create({
    data: {
      candidateCode: await nextCandidateCode(),
      fullName: input.fullName.trim(),
      email,
      phone: input.phone?.trim() ?? "",
      homeLocation: input.homeLocation?.trim() ?? "",
      cdlClass: input.cdlClass.trim(),
      cdlState,
      cdlNumberMasked: maskCdl(input.cdlNumber ?? "", cdlState),
      positionId: position.id,
      applicationSummary: {
        source: input.source,
        appliedDate: now.slice(0, 10),
        experienceYears: typeof input.experienceYears === "number" && Number.isFinite(input.experienceYears) ? input.experienceYears : null,
        endorsements: input.endorsements ?? [],
        equipmentExperience: input.equipmentExperience || null,
        requisitionId: position.requisitionId,
        requisitionNumber,
        tenant: { fleetId: position.fleetId },
        screening: { confirmations: {} },
      } as Prisma.InputJsonValue,
      qualificationSummary: {},
      documentRequirements: [],
      complianceSummary: {},
      onboardingSummary: {},
      auditTrail: [`${input.source}: attached to ${requisitionNumber ?? position.positionCode} (${position.title}) by ${input.attachedBy} at ${now}`],
    },
  });
  await syncPipelineForPosition(position.id);
  return candidate;
}

/** Requisition states in which the position accepts applications. */
const OPEN_FOR_APPLICATIONS = ["READY_FOR_RECRUITING", "RECRUITING", "PARTIALLY_FILLED"] as const;

const openWhere = {
  status: { not: "CLOSED" },
  requisition: { status: "APPROVED", recruitingPipelineState: { in: [...OPEN_FOR_APPLICATIONS] } },
} satisfies Prisma.PositionWhereInput;

/** Open driver positions for the public careers page (approved requisitions with seats remaining). */
export async function listPublicOpenings(): Promise<PublicOpening[]> {
  const rows = await prisma.position.findMany({ where: openWhere, include: publicOpeningInclude, orderBy: { createdAt: "desc" } });
  return rows.map(toPublicOpening).filter((o): o is PublicOpening => o !== null);
}

/** The recruiting position behind a public opening, or null when it is not open for applications. */
export async function findOpenPositionByOpeningId(openingId: string) {
  const row = await prisma.position.findFirst({
    where: { ...openWhere, requisition: { ...openWhere.requisition, publicNumber: openingId } },
    include: publicOpeningInclude,
  });
  return row && toPublicOpening(row) ? row : null;
}
