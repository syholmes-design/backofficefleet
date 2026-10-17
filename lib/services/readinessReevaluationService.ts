import type { SessionUserLike } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { runPostActivationQualificationAndReadiness } from "@/lib/recruiting-v2/post-activation-evaluation";

/**
 * Re-runs Prisma qualification + readiness projections when driver documents change.
 * Does not alter recruiting candidate status.
 */
export async function reevaluateDriverReadinessAfterDocumentChange(input: {
  sessionUser: SessionUserLike;
  driverId: string;
  driverIntakeId: string | null;
  fleetId: string;
}) {
  if (!input.sessionUser.id || !input.driverIntakeId) return null;
  const intake = await prisma.driverIntake.findFirst({
    where: { id: input.driverIntakeId, driverId: input.driverId, fleetId: input.fleetId },
    select: { id: true },
  });
  if (!intake) return null;
  return runPostActivationQualificationAndReadiness(
    input.sessionUser,
    input.driverId,
    intake.id,
    input.fleetId,
  );
}
