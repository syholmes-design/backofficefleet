import { prisma } from "@/lib/prisma";
import type { DriverOperationalProjection } from "@/lib/recruiting-v2/activation-presentation";
import type { RecruitingV2DriverHandoff } from "@/lib/recruiting-v2/driver-activation-service";

export async function loadDriverOperationalProjection(
  handoff: RecruitingV2DriverHandoff | null,
): Promise<DriverOperationalProjection | null> {
  if (!handoff) return null;

  const [qualification, readiness] = await Promise.all([
    prisma.driverQualificationSnapshot.findFirst({
      where: { driverId: handoff.driverId, fleetId: handoff.fleetId },
      orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
      select: { status: true },
    }),
    prisma.driverReadinessScore.findFirst({
      where: { driverId: handoff.driverId, fleetId: handoff.fleetId },
      orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
      select: { status: true },
    }),
  ]);

  return {
    driverId: handoff.driverId,
    fleetId: handoff.fleetId,
    driverIntakeId: handoff.driverIntakeId,
    qualificationStatus: qualification?.status ?? null,
    readinessStatus: readiness?.status ?? null,
    qualificationEvaluationState: qualification ? "AVAILABLE" : "NOT_EVALUATED",
    readinessEvaluationState: readiness ? "AVAILABLE" : "NOT_EVALUATED",
    dispatchEligibilityNote:
      "Dispatch eligibility is determined by Prisma DriverQualificationSnapshot and DriverReadinessScore—not Recruiting V2 activationStatus or recruiting qualification READY.",
  };
}
