import type { CanonicalOperatingBlocker } from "@/lib/dispatch/canonical-dispatch-operating-state";

export type DispatchIssueSeverity = "CRITICAL" | "MAJOR" | "MINOR";

const CRITICAL_ISSUE_IDS = new Set([
  "seal",
  "seal-verify",
  "bol",
  "pretrip-cargo",
  "cdl",
  "med",
  "mvr",
  "hos",
]);

const MAJOR_ISSUE_IDS = new Set([
  "tire-check",
  "maint-report",
  "dispatch-instructions",
  "exception",
  "pod",
  "unassigned",
  "settlement",
  "document-review",
  "rate-con",
]);

function looksLikeBrakeDefect(blocker: CanonicalOperatingBlocker): boolean {
  const haystack = `${blocker.id} ${blocker.label} ${blocker.detail}`.toLowerCase();
  return haystack.includes("brake");
}

/**
 * Derived operational urgency from an existing canonical blocker.
 * Does not persist a second status and does not replace Load Readiness.
 */
export function classifyIssueSeverity(blocker: CanonicalOperatingBlocker): DispatchIssueSeverity {
  if (blocker.id === "seal" || blocker.id === "seal-verify") return "CRITICAL";
  if (looksLikeBrakeDefect(blocker)) return "CRITICAL";
  if (CRITICAL_ISSUE_IDS.has(blocker.id) && blocker.impact === "HOLD") return "CRITICAL";
  if (blocker.source === "safety" && blocker.impact === "HOLD") return "CRITICAL";
  if (blocker.source === "maintenance" && blocker.impact === "HOLD" && blocker.id !== "tire-check") {
    return "CRITICAL";
  }
  if (MAJOR_ISSUE_IDS.has(blocker.id)) return "MAJOR";
  if (blocker.source === "maintenance") return "MAJOR";
  if (blocker.impact === "HOLD") return "MAJOR";
  return "MINOR";
}

export function classifyLoadSeverity(blockers: CanonicalOperatingBlocker[]): DispatchIssueSeverity | null {
  if (blockers.length === 0) return null;
  const ranks: Record<DispatchIssueSeverity, number> = { CRITICAL: 3, MAJOR: 2, MINOR: 1 };
  return blockers.reduce<DispatchIssueSeverity>((highest, blocker) => {
    const next = classifyIssueSeverity(blocker);
    return ranks[next] > ranks[highest] ? next : highest;
  }, "MINOR");
}
