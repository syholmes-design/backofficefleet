import {
  ConditionImpact,
  ConditionLifecycleState,
  ConditionSeverity,
  type ConditionThread,
} from "@prisma/client";

export type ConditionThreadSafetySlice = Pick<
  ConditionThread,
  "lifecycleState" | "severity" | "impact"
>;

export function isSafetyCriticalOpenCondition(thread: ConditionThreadSafetySlice): boolean {
  if (thread.lifecycleState === ConditionLifecycleState.RESOLVED) {
    return false;
  }
  if (thread.severity === ConditionSeverity.BLOCKING || thread.severity === ConditionSeverity.CRITICAL) {
    return true;
  }
  if (
    thread.impact === ConditionImpact.SAFETY_RISK ||
    thread.impact === ConditionImpact.REGULATORY_RISK
  ) {
    return true;
  }
  return false;
}
