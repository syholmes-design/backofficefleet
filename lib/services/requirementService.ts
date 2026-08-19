import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  createRequirement,
  getRequirementById,
  getRequirementsForIntake,
  updateRequirement,
} from "@/lib/repositories/requirementRepository";
import { authorizedFleetAccess, logUnauthorizedAttempt, type SessionUserLike } from "@/lib/services/intakeService";

const VALID_REQUIREMENT_TYPES = [
  "DRIVER_LICENSE",
  "MEDICAL",
  "DRUG_TEST",
  "WORK_HISTORY",
  "ACCIDENT_HISTORY",
  "VIOLATION_HISTORY",
  "IDENTITY_SUPPORTING",
  "OTHER",
] as const;

export async function getAuthorizedRequirement(user: SessionUserLike | null | undefined, requirementId: string) {
  const requirement = await getRequirementById(requirementId);
  if (!requirement) {
    return { requirement: null, allowed: false, reason: "NOT_FOUND" as const };
  }

  const access = await authorizedFleetAccess(user, requirement.driverIntake.fleetId);
  if (!access.allowed) {
    return { requirement, allowed: false, reason: "TENANT_ACCESS_DENIED" as const };
  }

  return { requirement, allowed: true, reason: undefined as string | undefined };
}

export function normalizeRequirementStatusForDocument(requirementType: string, documentStatus: string | null | undefined, verificationExpiresAt?: Date | null) {
  if (!documentStatus) {
    return "REQUIRED" as const;
  }

  if (documentStatus === "REJECTED") {
    return "REJECTED" as const;
  }

  if (documentStatus === "PENDING_VERIFICATION") {
    return "PENDING" as const;
  }

  if (documentStatus === "VERIFIED") {
    if (verificationExpiresAt && verificationExpiresAt.getTime() < Date.now()) {
      return "EXPIRED" as const;
    }
    return "SATISFIED" as const;
  }

  if (documentStatus === "EXPIRED") {
    return "EXPIRED" as const;
  }

  return "PENDING" as const;
}

export async function evaluateIntakeRequirements(intakeId: string) {
  const intake = await prisma.driverIntake.findUnique({
    where: { id: intakeId },
    include: {
      requirements: {
        include: { satisfiedByDocument: true },
      },
      documents: true,
      driver: true,
    },
  });

  if (!intake) {
    return [];
  }

  const required = await Promise.all(
    intake.requirements.map(async (requirement) => {
      const requirementType = requirement.requirementType;
      const matching = intake.documents
        .filter(
          (document) =>
            document.driverId === intake.driverId &&
            document.fleetId === intake.fleetId &&
            document.type === requirementType,
        )
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      const latestDocument = matching[0] ?? null;
      let derivedStatus: string = "REQUIRED";
      if (requirement.exceptionReason && requirement.exceptionReason.trim().length > 0) {
        derivedStatus = "EXCEPTION";
      } else if (!latestDocument) {
        derivedStatus = "REQUIRED";
      } else if (latestDocument.status === "REJECTED") {
        derivedStatus = "REJECTED";
      } else if (latestDocument.status === "PENDING_VERIFICATION" || latestDocument.status === "RECEIVED") {
        derivedStatus = "PENDING";
      } else if (latestDocument.status === "VERIFIED") {
        if (latestDocument.verificationExpiresAt && latestDocument.verificationExpiresAt.getTime() < Date.now()) {
          derivedStatus = "EXPIRED";
        } else {
          derivedStatus = "SATISFIED";
        }
      } else if (latestDocument.status === "EXPIRED") {
        derivedStatus = "EXPIRED";
      }

      const saved = await updateRequirement(requirement.id, {
        status: derivedStatus as never,
        satisfiedByDocumentId: latestDocument && (latestDocument.status === "VERIFIED" || latestDocument.status === "PENDING_VERIFICATION") ? latestDocument.id : (requirement.satisfiedByDocumentId ?? null),
      });

      return saved;
    }),
  );

  return required;
}

export async function createDriverRequirementRecord(input: {
  sessionUser: SessionUserLike | null | undefined;
  intakeId: string;
  payload: {
    requirementType?: string;
    label?: string;
    isRequired?: boolean;
    dueDate?: string | null;
    expiresAt?: string | null;
    exceptionReason?: string | null;
  };
}) {
  if (!input.sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const intake = await prisma.driverIntake.findUnique({
    where: { id: input.intakeId },
    include: { driver: true, fleet: true },
  });

  if (!intake) {
    throw Object.assign(new Error("DriverIntake not found"), { statusCode: 404 });
  }

  const access = await authorizedFleetAccess(input.sessionUser, intake.fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const requirementType = input.payload.requirementType ?? "OTHER";
  if (!VALID_REQUIREMENT_TYPES.includes(requirementType as (typeof VALID_REQUIREMENT_TYPES)[number])) {
    throw Object.assign(new Error("Invalid requirement type"), { statusCode: 422 });
  }

  if (!input.payload.label || input.payload.label.trim().length === 0) {
    throw Object.assign(new Error("label is required"), { statusCode: 422 });
  }

  const requirement = await createRequirement({
    driverIntakeId: intake.id,
    requirementType,
    label: input.payload.label,
    isRequired: input.payload.isRequired ?? true,
    dueDate: input.payload.dueDate ? new Date(input.payload.dueDate) : null,
    expiresAt: input.payload.expiresAt ? new Date(input.payload.expiresAt) : null,
    exceptionReason: input.payload.exceptionReason ?? null,
    status: "REQUIRED",
  });

  await evaluateIntakeRequirements(intake.id);

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: intake.fleetId,
    action: "CREATED",
    entityType: "DriverIntakeRequirement",
    entityId: requirement.id,
    details: { event: "requirement.created", intakeId: intake.id, requirementType, label: requirement.label },
    metadata: { source: "requirement-api" },
  });

  return requirement;
}

export async function listDriverRequirementsForIntake(user: SessionUserLike | null | undefined, intakeId: string) {
  if (!user?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const intake = await prisma.driverIntake.findUnique({
    where: { id: intakeId },
    include: { driver: true, fleet: true },
  });

  if (!intake) {
    throw Object.assign(new Error("DriverIntake not found"), { statusCode: 404 });
  }

  const access = await authorizedFleetAccess(user, intake.fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const records = await getRequirementsForIntake(intakeId);
  return records;
}

export async function updateDriverRequirementRecord(input: {
  sessionUser: SessionUserLike | null | undefined;
  requirementId: string;
  payload: {
    label?: string;
    isRequired?: boolean;
    dueDate?: string | null;
    expiresAt?: string | null;
    exceptionReason?: string | null;
  };
}) {
  if (!input.sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const { requirement, allowed } = await getAuthorizedRequirement(input.sessionUser, input.requirementId);
  if (!requirement) {
    throw Object.assign(new Error("Requirement not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedAttempt(input.sessionUser, requirement.driverIntake.fleetId, requirement.driverIntakeId, "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const allowedFields = ["label", "isRequired", "dueDate", "expiresAt", "exceptionReason"];
  const invalidKeys = Object.keys(input.payload).filter((key) => !allowedFields.includes(key));
  if (invalidKeys.length > 0) {
    throw Object.assign(new Error(`Invalid fields: ${invalidKeys.join(", ")}`), { statusCode: 422 });
  }

  const updated = await updateRequirement(requirement.id, {
    label: input.payload.label,
    isRequired: input.payload.isRequired,
    dueDate: input.payload.dueDate !== undefined ? (input.payload.dueDate ? new Date(input.payload.dueDate) : null) : undefined,
    expiresAt: input.payload.expiresAt !== undefined ? (input.payload.expiresAt ? new Date(input.payload.expiresAt) : null) : undefined,
    exceptionReason: input.payload.exceptionReason,
  });

  await evaluateIntakeRequirements(requirement.driverIntakeId);

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: requirement.driverIntake.fleetId,
    action: "UPDATED",
    entityType: "DriverIntakeRequirement",
    entityId: updated.id,
    details: { event: "requirement.updated", previousStatus: requirement.status, nextStatus: updated.status },
    metadata: { source: "requirement-api" },
  });

  return updated;
}
