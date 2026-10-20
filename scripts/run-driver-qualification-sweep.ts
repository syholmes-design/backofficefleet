/**
 * Stage 0 I-7 scheduled detection: re-evaluates every driver on an ACTIVE assignment in the fleets where the
 * actor holds an ACTIVE BOF_OPERATIONS or BOF_COMPLIANCE_REVIEW membership, and invalidates movement
 * authorizations made stale by qualifications that lapsed without a write (credential expiry).
 *
 *   npx --yes tsx scripts/run-driver-qualification-sweep.ts --actor-email=<service account> [--fleet=<fleetId> ...]
 *
 * Intended for a scheduler. Runs against DATABASE_URL; scheduling it in any environment is a deployment step.
 */
import { prisma } from "@/lib/prisma";
import { sweepDriverQualificationInvalidations } from "@/lib/services/driverMovementInvalidationService";

async function main() {
  const args = process.argv.slice(2);
  const actorEmail = args.find((arg) => arg.startsWith("--actor-email="))?.split("=")[1]?.trim();
  const fleetIds = args.filter((arg) => arg.startsWith("--fleet=")).map((arg) => arg.split("=")[1]!.trim());
  if (!actorEmail) {
    throw new Error("--actor-email is required");
  }

  const actor = await prisma.user.findUnique({ where: { email: actorEmail }, select: { id: true, email: true } });
  if (!actor) {
    throw new Error(`Actor ${actorEmail} not found`);
  }

  const result = await sweepDriverQualificationInvalidations(
    { id: actor.id, email: actor.email },
    fleetIds.length > 0 ? { fleetIds } : {},
  );
  console.log(JSON.stringify({
    fleetIds: result.fleetIds,
    driversEvaluated: result.driversEvaluated,
    invalidated: result.invalidated.map((outcome) => ({
      assignmentId: outcome.assignmentId,
      state: outcome.state,
      appendedReleaseId: outcome.appendedReleaseId,
      cancelledPickupIds: outcome.cancelledPickupIds,
      exceptionId: outcome.exceptionId,
      exceptionCreated: outcome.exceptionCreated,
    })),
  }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
