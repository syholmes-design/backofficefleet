import type { DriverDocumentType, Prisma, RecruitingV2DocumentStatus } from "@prisma/client";
import { AuditAction } from "@prisma/client";
import { hasRole, type SessionUserLike } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { evaluateRecruitingV2DocumentGates } from "@/lib/recruiting-v2/document-gate-engine";
import { normalizeRecruitingV2OfferSummary } from "@/lib/recruiting-v2/offer-engine";
import { aggregateRecruitingV2Qualification, getLatestRecruitingV2Interview } from "@/lib/recruiting-v2/qualification-engine";
import {
  evaluateRecruitingV2ActivationReadiness,
  normalizeRecruitingV2OnboardingSummary,
} from "@/lib/recruiting-v2/activation-engine";
import { runPostActivationQualificationAndReadiness } from "@/lib/recruiting-v2/post-activation-evaluation";
import { authorizedFleetAccess } from "@/lib/services/intakeService";
import { lockDriverReadinessWrite } from "@/lib/services/readinessService";

const ACTIVATION_ROLE_CODES = [
  "BOF_OPERATIONS",
  "BOF_COMPLIANCE_REVIEW",
  "BOF_ADMINISTRATION",
  "FLEET_ADMIN",
  "FLEET_MANAGER",
  "FLEET_OPERATIONS",
  "SAFETY",
  "DISPATCH",
] as const;

export type RecruitingV2DriverHandoff = {
  driverId: string;
  driverIntakeId: string;
  fleetId: string;
  activatedAt: string;
  activatedByUserId: string;
  candidateCode: string;
};

export class RecruitingV2ActivationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "RecruitingV2ActivationError";
    this.statusCode = statusCode;
  }
}

export function splitRecruitingFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Unknown", lastName: "Driver" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "Driver" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function readRecruitingV2DriverHandoff(applicationSummary: Prisma.JsonValue): RecruitingV2DriverHandoff | null {
  if (!applicationSummary || typeof applicationSummary !== "object" || Array.isArray(applicationSummary)) return null;
  const handoff = (applicationSummary as Record<string, unknown>).recruitingV2DriverHandoff;
  if (!handoff || typeof handoff !== "object" || Array.isArray(handoff)) return null;
  const row = handoff as Record<string, unknown>;
  if (
    typeof row.driverId === "string" &&
    typeof row.driverIntakeId === "string" &&
    typeof row.fleetId === "string" &&
    typeof row.activatedAt === "string" &&
    typeof row.activatedByUserId === "string" &&
    typeof row.candidateCode === "string"
  ) {
    return row as RecruitingV2DriverHandoff;
  }
  return null;
}

function mergeApplicationSummaryHandoff(
  applicationSummary: Prisma.JsonValue,
  handoff: RecruitingV2DriverHandoff,
): Prisma.InputJsonValue {
  const base =
    applicationSummary && typeof applicationSummary === "object" && !Array.isArray(applicationSummary)
      ? { ...(applicationSummary as Record<string, unknown>) }
      : {};
  return { ...base, recruitingV2DriverHandoff: handoff } as Prisma.InputJsonValue;
}

function appendAuditTrail(auditTrail: Prisma.JsonValue, entry: string): Prisma.InputJsonValue {
  const rows = Array.isArray(auditTrail) ? auditTrail.filter((item): item is string => typeof item === "string") : [];
  return [...rows, entry] as Prisma.InputJsonValue;
}

function mapRecruitingDocStatus(status: RecruitingV2DocumentStatus): "VERIFIED" | "PENDING_VERIFICATION" | "REJECTED" {
  if (status === "VERIFIED") return "VERIFIED";
  if (status === "REJECTED") return "REJECTED";
  return "PENDING_VERIFICATION";
}

function mapRecruitingDocType(documentType: string): DriverDocumentType {
  if (documentType === "CDL") return "DRIVER_LICENSE";
  if (documentType === "MEDICAL") return "MEDICAL";
  if (documentType === "MVR" || documentType === "CLEARINGHOUSE") return "OTHER";
  if (documentType === "EMPLOYMENT_VERIFICATION") return "WORK_HISTORY";
  if (documentType === "I9" || documentType === "W9") return "IDENTITY_SUPPORTING";
  return "OTHER";
}

export async function activateRecruitingV2Candidate(input: {
  sessionUser: SessionUserLike;
  candidateCode: string;
  fleetId: string;
}) {
  if (!input.sessionUser.id) throw new RecruitingV2ActivationError("Unauthorized", 401);

  const fleetId = input.fleetId.trim();
  if (!fleetId) throw new RecruitingV2ActivationError("fleetId is required", 422);

  const fleetAccess = await authorizedFleetAccess(input.sessionUser, fleetId);
  if (!fleetAccess.allowed) {
    throw new RecruitingV2ActivationError(
      fleetAccess.reason === "AUTH_REQUIRED" ? "Unauthorized" : "Forbidden",
      fleetAccess.reason === "AUTH_REQUIRED" ? 401 : 403,
    );
  }

  if (!hasRole(input.sessionUser, [...ACTIVATION_ROLE_CODES])) {
    throw new RecruitingV2ActivationError(
      "Driver activation requires an authorized fleet operations, safety, dispatch, or BOF operations role.",
      403,
    );
  }

  const candidate = await prisma.candidate.findUnique({
    where: { candidateCode: input.candidateCode },
    include: {
      position: true,
      documentRecords: { orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }] },
      interviews: { orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }] },
    },
  });
  if (!candidate) throw new RecruitingV2ActivationError("Candidate not found", 404);

  const existingHandoff = readRecruitingV2DriverHandoff(candidate.applicationSummary);
  if (candidate.activationStatus === "ACTIVE" && existingHandoff) {
    const driver = await prisma.driver.findFirst({
      where: { id: existingHandoff.driverId, fleetId: existingHandoff.fleetId },
      select: { id: true, fleetId: true },
    });
    if (driver) {
      let postActivationEvaluation = null;
      const latestReadiness = await prisma.driverReadinessScore.findFirst({
        where: { driverId: driver.id, driverIntakeId: existingHandoff.driverIntakeId, fleetId: existingHandoff.fleetId },
        orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
      });
      if (!latestReadiness) {
        postActivationEvaluation = await runPostActivationQualificationAndReadiness(
          input.sessionUser,
          driver.id,
          existingHandoff.driverIntakeId,
          existingHandoff.fleetId,
        );
      }
      return {
        idempotent: true as const,
        handoff: existingHandoff,
        driverId: driver.id,
        driverIntakeId: existingHandoff.driverIntakeId,
        dispatchReadinessHref: `/drivers/${driver.id}/safety`,
        driverHref: `/drivers/${driver.id}`,
        postActivationEvaluation,
      };
    }
  }

  const documentGates = evaluateRecruitingV2DocumentGates(
    candidate.documentRecords.map((record) => ({
      id: record.id,
      documentCode: record.documentCode,
      candidateId: record.candidateId,
      documentType: record.documentType,
      status: record.status,
      expirationDate: record.expirationDate?.toISOString() ?? null,
      uploadedBy: record.uploadedBy,
      verifiedBy: record.verifiedBy,
      verificationNotes: record.verificationNotes,
      metadata: record.metadata,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    })),
  );
  const latestInterview = getLatestRecruitingV2Interview(
    candidate.interviews.map((interview) => ({
      id: interview.id,
      interviewCode: interview.interviewCode,
      candidateId: interview.candidateId,
      positionId: interview.positionId,
      interviewDate: interview.scheduledFor?.toISOString() ?? null,
      interviewType: interview.interviewType,
      location: interview.location,
      status: interview.status,
      score: interview.score,
      recommendation: interview.recommendation,
      interviewers: interview.interviewers,
      scores: interview.categoryScores,
      notes: interview.notes,
      auditTrail: interview.auditTrail,
      createdAt: interview.createdAt.toISOString(),
      updatedAt: interview.updatedAt.toISOString(),
    })),
  );
  const qualification = aggregateRecruitingV2Qualification({ candidate, documentGates, latestInterview });
  const offer = normalizeRecruitingV2OfferSummary(candidate.offerSummary);
  const onboarding = normalizeRecruitingV2OnboardingSummary(candidate.onboardingSummary, candidate.onboardingStatus);
  const activationReadiness = evaluateRecruitingV2ActivationReadiness({
    qualificationSummary: qualification.qualificationSummary,
    qualificationRisks: qualification.operationalRisks,
    offer,
    onboarding,
  });

  if (!activationReadiness.ready) {
    throw new RecruitingV2ActivationError("Activation prerequisites are incomplete; ACTIVE cannot be persisted.", 400);
  }

  const email = candidate.email.trim().toLowerCase();
  const { firstName, lastName } = splitRecruitingFullName(candidate.fullName);

  const result = await prisma.$transaction(async (tx) => {
    let driver = await tx.driver.findFirst({
      where: { fleetId, email: { equals: email, mode: "insensitive" } },
      select: { id: true, fleetId: true },
    });

    if (!driver) {
      driver = await tx.driver.create({
        data: {
          fleetId,
          firstName,
          lastName,
          email: candidate.email.trim(),
          phone: candidate.phone.trim() || null,
          status: "ACTIVE",
        },
        select: { id: true, fleetId: true },
      });
    } else if (driver.fleetId !== fleetId) {
      throw new RecruitingV2ActivationError("A driver with this email exists in another fleet.", 409);
    }

    // The new intake becomes the one qualification is evaluated from.
    await lockDriverReadinessWrite(tx, driver.id);
    const intake = await tx.driverIntake.create({
      data: {
        driverId: driver.id,
        fleetId,
        createdByUserId: input.sessionUser.id!,
        intakeSource: "API",
        intakeChannel: "INTERNAL_ADMIN",
        stage: "QUALIFICATION_REVIEW",
        status: "IN_REVIEW",
      },
    });

    await tx.driverIntakeStage.create({
      data: {
        driverIntakeId: intake.id,
        stage: "QUALIFICATION_REVIEW",
        status: "IN_REVIEW",
        changedByUserId: input.sessionUser.id!,
        notes: `Recruiting V2 activation from candidate ${candidate.candidateCode}`,
      },
    });

    for (const record of candidate.documentRecords) {
      const storageKey = `recruiting-v2-bridge://${candidate.candidateCode}/${record.documentCode}`;
      const existing = await tx.driverDocument.findFirst({
        where: { fleetId, driverId: driver.id, storageKey },
        select: { id: true },
      });
      if (existing) continue;

      await tx.driverDocument.create({
        data: {
          driverId: driver.id,
          driverIntakeId: intake.id,
          fleetId,
          type: mapRecruitingDocType(record.documentType),
          status: mapRecruitingDocStatus(record.status),
          storageKey,
          originalFileName: `${record.documentType}-${record.documentCode}.recruiting-bridge`,
          mimeType: "application/json",
          uploadedByUserId: input.sessionUser.id!,
          verificationQuality: JSON.stringify({
            source: "recruiting-v2",
            candidateCode: candidate.candidateCode,
            recruitingDocumentCode: record.documentCode,
            recruitingDocumentType: record.documentType,
            recruitingStatus: record.status,
            expirationDate: record.expirationDate?.toISOString() ?? null,
            verificationNotes: record.verificationNotes,
          }),
        },
      });
    }

    const activatedAt = new Date().toISOString();
    const handoff: RecruitingV2DriverHandoff = {
      driverId: driver.id,
      driverIntakeId: intake.id,
      fleetId,
      activatedAt,
      activatedByUserId: input.sessionUser.id!,
      candidateCode: candidate.candidateCode,
    };

    await tx.candidate.update({
      where: { id: candidate.id },
      data: {
        activationStatus: "ACTIVE",
        activationStage: "ACTIVATED",
        applicationSummary: mergeApplicationSummaryHandoff(candidate.applicationSummary, handoff),
        auditTrail: appendAuditTrail(
          candidate.auditTrail,
          `Driver activated to fleet ${fleetId} as ${driver.id} (intake ${intake.id}) at ${activatedAt}`,
        ),
      },
    });

    await tx.auditEvent.create({
      data: {
        actorId: input.sessionUser.id!,
        actorEmail: input.sessionUser.email ?? undefined,
        tenantId: fleetId,
        action: AuditAction.CREATED,
        entityType: "Driver",
        entityId: driver.id,
        details: {
          event: "recruiting-v2.driver.activated",
          candidateCode: candidate.candidateCode,
          driverIntakeId: intake.id,
        },
      },
    });

    return { driver, intake, handoff };
  });

  const postActivationEvaluation = await runPostActivationQualificationAndReadiness(
    input.sessionUser,
    result.driver.id,
    result.intake.id,
    fleetId,
  );

  return {
    idempotent: false as const,
    handoff: result.handoff,
    driverId: result.driver.id,
    driverIntakeId: result.intake.id,
    dispatchReadinessHref: `/drivers/${result.driver.id}/safety`,
    driverHref: `/drivers/${result.driver.id}`,
    activationReadiness,
    postActivationEvaluation,
  };
}
