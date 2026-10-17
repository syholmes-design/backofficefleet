import type { RecruitingV2ActivationStatus, RecruitingV2CandidateStage } from "@prisma/client";
import type { RecruitingV2ActivationReadiness } from "@/lib/recruiting-v2/activation-engine";
import type { RecruitingV2DriverHandoff } from "@/lib/recruiting-v2/driver-activation-service";

export type DriverOperationalProjection = {
  driverId: string;
  fleetId: string;
  driverIntakeId: string;
  qualificationStatus: string | null;
  readinessStatus: string | null;
  qualificationEvaluationState: "AVAILABLE" | "NOT_EVALUATED";
  readinessEvaluationState: "AVAILABLE" | "NOT_EVALUATED";
  dispatchEligibilityNote: string;
};

export type RecruitingActivationPresentation = {
  /** Prisma Candidate.activationStatus — administrative handoff completed when ACTIVE */
  administrativeActivationStatus: RecruitingV2ActivationStatus;
  activationStage: RecruitingV2CandidateStage;
  /** Whether recruiting prerequisites allow a new handoff attempt */
  recruitingHandoffEligible: boolean;
  /** Human-facing decision label for recruiting workspace */
  currentRecruitingDecision: RecruitingV2ActivationReadiness["currentDecision"] | string;
  nextRequiredAction: string;
  activationReadiness: RecruitingV2ActivationReadiness;
  driverHandoff: RecruitingV2DriverHandoff | null;
  driverOperational: DriverOperationalProjection | null;
};

const DISPATCH_NOTE =
  "Dispatch eligibility is determined by Prisma DriverQualificationSnapshot and DriverReadinessScore—not Recruiting V2 activationStatus or recruiting qualification READY.";

export function buildRecruitingActivationPresentation(args: {
  storedActivationStatus: RecruitingV2ActivationStatus;
  storedActivationStage: RecruitingV2CandidateStage;
  activationReadiness: RecruitingV2ActivationReadiness;
  driverHandoff: RecruitingV2DriverHandoff | null;
  driverOperational: DriverOperationalProjection | null;
}): RecruitingActivationPresentation {
  const handoffComplete = args.storedActivationStatus === "ACTIVE" && Boolean(args.driverHandoff);
  const recruitingHandoffEligible = args.activationReadiness.ready && !handoffComplete;

  let currentRecruitingDecision: RecruitingActivationPresentation["currentRecruitingDecision"] =
    args.activationReadiness.currentDecision;
  let nextRequiredAction = args.activationReadiness.nextRequiredAction;

  if (handoffComplete) {
    currentRecruitingDecision = "ADMINISTRATIVE ACTIVATION COMPLETE";
    nextRequiredAction = args.driverOperational?.readinessStatus === "READY"
      ? "Review dispatch assignment gates before assigning loads."
      : "Complete driver qualification and readiness on the Prisma driver file before dispatch.";
  }

  const activationReadiness: RecruitingV2ActivationReadiness = handoffComplete
    ? {
        ...args.activationReadiness,
        activationStatus: "ACTIVE",
        currentDecision: "ACTIVE",
        ready: false,
        readinessReasons: [
          ...args.activationReadiness.readinessReasons,
          "Administrative driver handoff recorded in Prisma.",
          args.driverOperational?.readinessStatus
            ? `Latest driver readiness projection: ${args.driverOperational.readinessStatus}.`
            : "Driver readiness not yet evaluated on the operational driver file.",
        ],
        nextRequiredAction: nextRequiredAction as RecruitingV2ActivationReadiness["nextRequiredAction"],
      }
    : args.activationReadiness;

  return {
    administrativeActivationStatus: handoffComplete ? "ACTIVE" : args.storedActivationStatus,
    activationStage: handoffComplete ? "ACTIVATED" : args.storedActivationStage,
    recruitingHandoffEligible,
    currentRecruitingDecision,
    nextRequiredAction,
    activationReadiness,
    driverHandoff: args.driverHandoff,
    driverOperational: args.driverOperational
      ? { ...args.driverOperational, dispatchEligibilityNote: DISPATCH_NOTE }
      : null,
  };
}
