import type { SessionUserLike } from "@/lib/authorization";
import {
  assembleQualificationInputs,
  evaluateQualification,
  writeQualificationSnapshot,
} from "@/lib/services/qualificationService";
import {
  assembleReadinessInputs,
  evaluateReadiness,
  writeReadinessScore,
} from "@/lib/services/readinessService";

export type PostActivationEvaluationResult = {
  qualificationStatus: string;
  readinessStatus: string;
  qualificationSnapshotId: string;
  readinessScoreId: string;
  dispatchEligibilityNote: string;
};

/**
 * Runs authoritative Prisma qualification + readiness projections after recruiting activation.
 * Recruiting "ACTIVE" and recruiting readiness do not imply dispatch eligibility.
 */
export async function runPostActivationQualificationAndReadiness(
  sessionUser: SessionUserLike,
  driverId: string,
  intakeId: string,
  fleetId: string,
): Promise<PostActivationEvaluationResult> {
  const qualificationInputs = await assembleQualificationInputs(sessionUser, driverId, intakeId);
  const qualificationEvaluation = evaluateQualification(qualificationInputs);
  const qualificationSnapshot = await writeQualificationSnapshot(
    sessionUser,
    driverId,
    intakeId,
    fleetId,
    qualificationEvaluation,
  );

  const readinessInputs = await assembleReadinessInputs(sessionUser, driverId, intakeId);
  const readinessEvaluation = evaluateReadiness(readinessInputs);
  const readinessScore = await writeReadinessScore(
    sessionUser,
    driverId,
    intakeId,
    fleetId,
    readinessEvaluation,
  );

  return {
    qualificationStatus: qualificationEvaluation.status,
    readinessStatus: readinessEvaluation.status,
    qualificationSnapshotId: qualificationSnapshot.id,
    readinessScoreId: readinessScore.id,
    dispatchEligibilityNote:
      "Dispatch eligibility is determined by DriverReadinessScore and dispatch gates—not Recruiting V2 activationStatus.",
  };
}
