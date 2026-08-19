import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedDriver } from "@/lib/services/authenticatedDriverService";
import {
  authorizedFleetAccess,
  isServiceRole,
  type SessionUserLike,
} from "@/lib/services/intakeService";

const SERVICE_ROLE_CODES = ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW"] as const;

type QualificationSnapshotRecord = {
  id: string;
  driverId: string;
  driverIntakeId: string | null;
  fleetId: string;
  status: "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED" | "PENDING_REVIEW";
  reasonCodes: unknown;
  summary: string | null;
  policyVersion: string;
  evaluatedAt: Date;
  evaluatedByUserId: string | null;
};

type ReadinessScoreRecord = {
  id: string;
  driverId: string;
  driverIntakeId: string | null;
  fleetId: string;
  status: "READY" | "CONDITIONAL" | "NOT_READY";
  reasonCodes: unknown;
  summary: string | null;
  policyVersion: string;
  evaluatedAt: Date;
  evaluatedByUserId: string | null;
};

export type DriverQualificationProjection = {
  driverId: string;
  driverIntakeId: string | null;
  fleetId: string;
  qualificationStatus: "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED" | "PENDING_REVIEW";
  reasonCodes: string[];
  summary: string | null;
  policyVersion: string;
  evaluatedAt: string;
  evaluatedByUserId: string | null;
  snapshotId: string;
};

export type DriverReadinessProjection = {
  driverId: string;
  driverIntakeId: string | null;
  fleetId: string;
  readinessStatus: "READY" | "CONDITIONAL" | "NOT_READY";
  reasonCodes: string[];
  summary: string | null;
  policyVersion: string;
  evaluatedAt: string;
  evaluatedByUserId: string | null;
  readinessScoreId: string;
};

export type DriverOperationalSummary = {
  driverId: string;
  driverName: string;
  fleetId: string;
  latestIntakeId: string | null;
  qualification: DriverQualificationProjection | null;
  readiness: DriverReadinessProjection | null;
  qualificationEvaluationState: "AVAILABLE" | "NOT_EVALUATED";
  readinessEvaluationState: "AVAILABLE" | "NOT_EVALUATED";
  latestEvaluationDates: {
    qualificationEvaluatedAt: string | null;
    readinessEvaluatedAt: string | null;
  };
};

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function requireNonEmptyString(value: string, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw Object.assign(new Error(`${fieldName} is required`), { statusCode: 422 });
  }

  return value.trim();
}

function jsonStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function mapQualificationProjection(snapshot: QualificationSnapshotRecord | null): DriverQualificationProjection | null {
  if (!snapshot) {
    return null;
  }

  return {
    driverId: snapshot.driverId,
    driverIntakeId: snapshot.driverIntakeId,
    fleetId: snapshot.fleetId,
    qualificationStatus: snapshot.status,
    reasonCodes: jsonStringArray(snapshot.reasonCodes),
    summary: snapshot.summary,
    policyVersion: snapshot.policyVersion,
    evaluatedAt: snapshot.evaluatedAt.toISOString(),
    evaluatedByUserId: snapshot.evaluatedByUserId,
    snapshotId: snapshot.id,
  };
}

function mapReadinessProjection(score: ReadinessScoreRecord | null): DriverReadinessProjection | null {
  if (!score) {
    return null;
  }

  return {
    driverId: score.driverId,
    driverIntakeId: score.driverIntakeId,
    fleetId: score.fleetId,
    readinessStatus: score.status,
    reasonCodes: jsonStringArray(score.reasonCodes),
    summary: score.summary,
    policyVersion: score.policyVersion,
    evaluatedAt: score.evaluatedAt.toISOString(),
    evaluatedByUserId: score.evaluatedByUserId,
    readinessScoreId: score.id,
  };
}

function mapDriverOperationalSummary(driver: DriverRow): DriverOperationalSummary {
  const qualification = mapQualificationProjection(driver.qualificationSnapshots[0] ?? null);
  const readiness = mapReadinessProjection(driver.readinessScores[0] ?? null);
  const latestIntakeId =
    driver.driverIntakes[0]?.id ??
    qualification?.driverIntakeId ??
    readiness?.driverIntakeId ??
    null;

  return {
    driverId: driver.id,
    driverName: `${driver.firstName} ${driver.lastName}`.trim(),
    fleetId: driver.fleetId,
    latestIntakeId,
    qualification,
    readiness,
    qualificationEvaluationState: qualification ? "AVAILABLE" : "NOT_EVALUATED",
    readinessEvaluationState: readiness ? "AVAILABLE" : "NOT_EVALUATED",
    latestEvaluationDates: {
      qualificationEvaluatedAt: qualification?.evaluatedAt ?? null,
      readinessEvaluatedAt: readiness?.evaluatedAt ?? null,
    },
  };
}

async function getAccessibleFleetIds(sessionUser: SessionUserLike) {
  const directFleetIds = (sessionUser.memberships ?? [])
    .filter((membership) => membership.status !== "INACTIVE" && membership.status !== "INVITED")
    .map((membership) => membership.fleetId);

  const aggregatorMemberships = await prisma.aggregatorMembership.findMany({
    where: {
      userId: sessionUser.id,
      status: "ACTIVE",
    },
    select: {
      aggregator: {
        select: {
          aggregatorFleets: {
            where: { status: "ACTIVE" },
            select: { fleetId: true },
          },
        },
      },
    },
  });

  const aggregatorFleetIds = aggregatorMemberships.flatMap((membership) =>
    membership.aggregator.aggregatorFleets.map((fleet) => fleet.fleetId),
  );

  return [...new Set([...directFleetIds, ...aggregatorFleetIds])];
}

const driverSummarySelect = Prisma.validator<Prisma.DriverSelect>()({
  id: true,
  fleetId: true,
  firstName: true,
  lastName: true,
  driverIntakes: {
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 1,
    select: { id: true },
  },
  qualificationSnapshots: {
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
    take: 1,
    select: {
      id: true,
      driverId: true,
      driverIntakeId: true,
      fleetId: true,
      status: true,
      reasonCodes: true,
      summary: true,
      policyVersion: true,
      evaluatedAt: true,
      evaluatedByUserId: true,
    },
  },
  readinessScores: {
    where: {
      driverIntakeId: { not: null },
    },
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
    take: 1,
    select: {
      id: true,
      driverId: true,
      driverIntakeId: true,
      fleetId: true,
      status: true,
      reasonCodes: true,
      summary: true,
      policyVersion: true,
      evaluatedAt: true,
      evaluatedByUserId: true,
    },
  },
});

type DriverRow = Prisma.DriverGetPayload<{ select: typeof driverSummarySelect }>;

export async function getDriverOperationalSummary(
  sessionUser: SessionUserLike | null | undefined,
  driverId: string,
  options?: { selfOnly?: boolean },
): Promise<DriverOperationalSummary> {
  requireSessionUser(sessionUser);
  const user = sessionUser as SessionUserLike;
  const nextDriverId = requireNonEmptyString(driverId, "driverId");
  const authenticatedDriver = await getAuthenticatedDriver(user);

  if (options?.selfOnly) {
   if (authenticatedDriver.status !== "LINKED" || authenticatedDriver.driver.id !== nextDriverId) {
     throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
   }
  }

  const unrestricted = !options?.selfOnly && isServiceRole(user, [...SERVICE_ROLE_CODES]);
  const accessibleFleetIds = unrestricted ? null : await getAccessibleFleetIds(user);

  if (!unrestricted && !options?.selfOnly && (!accessibleFleetIds || accessibleFleetIds.length === 0)) {
   throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
  }

  const driver = (await prisma.driver.findFirst({
   where: options?.selfOnly
     ? { id: nextDriverId }
     : unrestricted
       ? { id: nextDriverId }
       : {
           id: nextDriverId,
           fleetId: { in: accessibleFleetIds ?? [] },
         },
   select: driverSummarySelect,
  })) as DriverRow | null;

  if (!driver) {
   throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
  }

  if (!options?.selfOnly) {
   const access = await authorizedFleetAccess(user, driver.fleetId);
   if (!access.allowed) {
     throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
   }
  }

  return mapDriverOperationalSummary(driver);
}

export async function listDriverOperationalSummaries(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string,
): Promise<DriverOperationalSummary[]> {
  requireSessionUser(sessionUser);
  const user = sessionUser as SessionUserLike;
  const nextFleetId = requireNonEmptyString(fleetId, "fleetId");

  const access = await authorizedFleetAccess(user, nextFleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const drivers = (await prisma.driver.findMany({
    where: { fleetId: nextFleetId },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { id: "asc" }],
    select: driverSummarySelect,
  })) as DriverRow[];

  return drivers.map(mapDriverOperationalSummary);
}
