import { Prisma } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";
import {
  QUALIFICATION_POLICY_VERSION,
  writeQualificationSnapshot,
} from "@/lib/services/qualificationService";
import { READINESS_POLICY_VERSION } from "@/lib/services/readinessService";
import { rejectDemoOperationalKey } from "@/lib/uos/demo-operational-keys";

export type EligibilityReviewDisposition = "ELIGIBLE" | "INELIGIBLE";

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

export async function recordDriverEligibilityReview(
  sessionUser: SessionUserLike | null | undefined,
  driverId: string,
  disposition: EligibilityReviewDisposition,
  reason: string,
) {
  requireSessionUser(sessionUser);
  rejectDemoOperationalKey(driverId, "driverId");
  const actor = sessionUser as SessionUserLike & { id: string };
  const nextReason = reason.trim();
  if (!nextReason) {
    throw Object.assign(new Error("Review reason is required"), { statusCode: 422 });
  }
  if (disposition !== "ELIGIBLE" && disposition !== "INELIGIBLE") {
    throw Object.assign(new Error("Invalid eligibility disposition"), { statusCode: 422 });
  }

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: {
      id: true,
      fleetId: true,
      driverIntakes: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!driver) {
    throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
  }

  const access = await authorizedFleetAccess(actor, driver.fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const intakeId = driver.driverIntakes[0]?.id ?? null;
  const eligible = disposition === "ELIGIBLE";
  const qualification = await writeQualificationSnapshot(actor, driver.id, intakeId, driver.fleetId, {
    status: eligible ? "QUALIFIED" : "NOT_QUALIFIED",
    reasonCodes: eligible ? ["OPERATOR_AUTHORIZED_REVIEW"] : ["OPERATOR_DISPATCH_INELIGIBLE"],
    summary: nextReason,
    policyVersion: QUALIFICATION_POLICY_VERSION,
  });
  const readiness = await prisma.driverReadinessScore.create({
    data: {
      driverId: driver.id,
      driverIntakeId: intakeId,
      fleetId: driver.fleetId,
      evaluatedAt: new Date(),
      evaluatedByUserId: actor.id,
      status: eligible ? "READY" : "NOT_READY",
      summary: nextReason,
      reasonCodes: (eligible ? ["MANUAL_READINESS_REVIEW"] : ["QUALIFICATION_NOT_COMPLETE"]) as Prisma.InputJsonValue,
      policyVersion: READINESS_POLICY_VERSION,
    },
  });

  await createAuditRecord({
    actorId: actor.id,
    actorEmail: actor.email ?? null,
    tenantId: driver.fleetId,
    action: "UPDATED",
    entityType: "DriverQualificationSnapshot",
    entityId: qualification.id,
    details: {
      event: "operator.eligibility.review",
      driverId: driver.id,
      disposition,
      reason: nextReason,
      readinessScoreId: readiness.id,
    },
    metadata: { source: "driver-eligibility-review" },
  });

  return { qualification, readiness, disposition };
}
