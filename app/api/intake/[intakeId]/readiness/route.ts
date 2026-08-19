import { auth } from "@/auth";
import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { authorizedFleetAccess } from "@/lib/services/intakeService";
import {
  assembleReadinessInputs,
  evaluateReadiness,
  getLatestReadinessScore,
  writeReadinessScore,
} from "@/lib/services/readinessService";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: Promise<{ intakeId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { intakeId } = await context.params;

  try {
    const body = (await request.json()) as {
      driverId?: string;
    };

    const driverId = body.driverId ?? null;
    if (!driverId || typeof driverId !== "string") {
      return NextResponse.json({ error: "driverId is required" }, { status: 422 });
    }

    const intake = await prisma.driverIntake.findUnique({
      where: { id: intakeId },
      include: { driver: true, fleet: true },
    });

    if (!intake) {
      return NextResponse.json({ error: "DriverIntake not found" }, { status: 404 });
    }

    const userLike = session.user as {
      id?: string;
      email?: string | null;
      memberships?: Array<{ fleetId: string; roleCode: string; status?: string }>;
    };

    const access = await authorizedFleetAccess(userLike, intake.fleetId);
    if (!access.allowed) {
      await createAuditRecord({
        actorId: userLike.id ?? null,
        actorEmail: userLike.email ?? null,
        tenantId: intake.fleetId,
        action: "ACCESS_DENIED",
        entityType: "DriverReadinessScore",
        entityId: null,
        details: {
          event: "unauthorized readiness access",
          driverId,
          intakeId,
          reason: "TENANT_ACCESS_DENIED",
        },
        metadata: { source: "readiness-api" },
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (driverId !== intake.driverId) {
      await createAuditRecord({
        actorId: userLike.id ?? null,
        actorEmail: userLike.email ?? null,
        tenantId: intake.fleetId,
        action: "ACCESS_DENIED",
        entityType: "DriverReadinessScore",
        entityId: null,
        details: {
          event: "unauthorized readiness access",
          driverId,
          intakeId,
          reason: "driver-intake-mismatch",
        },
        metadata: { source: "readiness-api" },
      });
      return NextResponse.json({ error: "Driver does not belong to this intake" }, { status: 422 });
    }

    const inputs = await assembleReadinessInputs(userLike, driverId, intakeId);
    const evaluation = evaluateReadiness(inputs);
    const readinessScore = await writeReadinessScore(userLike, driverId, intakeId, intake.fleetId, evaluation);
    const latest = await getLatestReadinessScore(userLike, driverId, intakeId);

    const readinessEvent =
      evaluation.status === "READY"
        ? "readiness.ready"
        : evaluation.status === "CONDITIONAL"
          ? "readiness.conditional"
          : "readiness.not_ready";

    await createAuditRecord({
      actorId: userLike.id ?? null,
      actorEmail: userLike.email ?? null,
      tenantId: intake.fleetId,
      action: "CREATED",
      entityType: "DriverReadinessScore",
      entityId: readinessScore.id,
      details: {
        event: "readiness.evaluated",
        driverId,
        intakeId,
        readinessStatus: evaluation.status,
        qualificationSnapshotId: inputs.qualificationSnapshot?.id ?? null,
        reasonCodes: evaluation.reasonCodes,
        policyVersion: evaluation.policyVersion,
      },
      metadata: { source: "readiness-api" },
    });

    await createAuditRecord({
      actorId: userLike.id ?? null,
      actorEmail: userLike.email ?? null,
      tenantId: intake.fleetId,
      action: "CREATED",
      entityType: "DriverReadinessScore",
      entityId: readinessScore.id,
      details: {
        event: readinessEvent,
        driverId,
        intakeId,
        readinessStatus: evaluation.status,
        qualificationSnapshotId: inputs.qualificationSnapshot?.id ?? null,
        reasonCodes: evaluation.reasonCodes,
        policyVersion: evaluation.policyVersion,
      },
      metadata: { source: "readiness-api" },
    });

    return NextResponse.json({
      readinessId: readinessScore.id,
      latestReadinessId: latest?.id ?? readinessScore.id,
      readinessStatus: readinessScore.status,
      reasonCodes: readinessScore.reasonCodes,
      summary: readinessScore.summary,
      policyVersion: readinessScore.policyVersion,
      qualificationSnapshotId: inputs.qualificationSnapshot?.id ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode) || 500
        : 500;

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
