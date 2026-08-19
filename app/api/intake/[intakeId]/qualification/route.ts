import { auth } from "@/auth";
import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { authorizedFleetAccess, logUnauthorizedAttempt } from "@/lib/services/intakeService";
import {
  assembleQualificationInputs,
  evaluateQualification,
  getLatestQualificationSnapshot,
  writeQualificationSnapshot,
} from "@/lib/services/qualificationService";

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

    const access = await authorizedFleetAccess(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> }, intake.fleetId);
    if (!access.allowed) {
      await logUnauthorizedAttempt(session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> } | null, intake.fleetId, intakeId, "TENANT_ACCESS_DENIED");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (driverId !== intake.driverId) {
      await createAuditRecord({
        actorId: session.user.id,
        actorEmail: session.user.email ?? null,
        tenantId: intake.fleetId,
        action: "ACCESS_DENIED",
        entityType: "DriverQualificationSnapshot",
        entityId: null,
        details: {
          event: "unauthorized qualification access",
          driverId,
          intakeId,
          reason: "driver-intake-mismatch",
        },
        metadata: { source: "qualification-api" },
      });
      return NextResponse.json({ error: "Driver does not belong to this intake" }, { status: 422 });
    }

    const userLike = session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> };

    const inputs = await assembleQualificationInputs(userLike, driverId, intakeId);
    const evaluation = evaluateQualification(inputs);
    const snapshot = await writeQualificationSnapshot(userLike, driverId, intakeId, intake.fleetId, evaluation);

    const latest = await getLatestQualificationSnapshot(userLike, driverId, intakeId);

    const auditEventName =
      evaluation.status === "QUALIFIED"
        ? "qualification.passed"
        : evaluation.status === "CONDITIONALLY_QUALIFIED"
          ? evaluation.reasonCodes.includes("REQUIREMENT_EXCEPTION")
            ? "qualification.exception"
            : "qualification.conditionally_qualified"
          : evaluation.status === "NOT_QUALIFIED"
            ? "qualification.failed"
            : "qualification.evaluated";

    await createAuditRecord({
      actorId: userLike.id ?? null,
      actorEmail: userLike.email ?? null,
      tenantId: intake.fleetId,
      action: "CREATED",
      entityType: "DriverQualificationSnapshot",
      entityId: snapshot.id,
      details: {
        event: auditEventName,
        driverId,
        intakeId,
        qualificationStatus: evaluation.status,
        reasonCodes: evaluation.reasonCodes,
        policyVersion: evaluation.policyVersion,
      },
      metadata: { source: "qualification-api" },
    });

    return NextResponse.json({
      snapshotId: snapshot.id,
      latestSnapshotId: latest?.id ?? snapshot.id,
      qualificationStatus: snapshot.status,
      reasonCodes: snapshot.reasonCodes,
      summary: snapshot.summary,
      policyVersion: snapshot.policyVersion,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) || 500 : 500;

    if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
      await logUnauthorizedAttempt(
        session.user as { id?: string; email?: string | null; memberships?: Array<{ fleetId: string; roleCode: string; status?: string }> } | null,
        null,
        intakeId,
        message,
      );
    }

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
