import type { DispatchLoadWorkflowSnapshot } from "@/lib/dispatch-workflow-ui";

export type LiveLoadReviewSeverity = "Critical" | "High" | "Medium" | "Watch";

export type LiveLoadReviewItem = {
  id: string;
  stage: string;
  severity: LiveLoadReviewSeverity;
  explanation: string;
  recommendedAction: string;
  href: string;
  hrefLabel: string;
  recordedOutcome: string;
};

function reasonCodes(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function joinExplanation(summary: string | null | undefined, codes: string[], fallback: string) {
  const parts = [summary?.trim(), codes.join(", ")].filter((part) => part && part.length > 0);
  return parts.join(" · ") || fallback;
}

/**
 * Review rows from the stored live workflow snapshot.
 * This does not read demo workbook data and does not mark an issue resolved.
 */
export function buildLiveLoadReview(
  loadId: string,
  workflow: DispatchLoadWorkflowSnapshot | null,
  workflowError: string | null,
): LiveLoadReviewItem[] {
  const items: LiveLoadReviewItem[] = [];
  if (workflowError) {
    items.push({
      id: "workflow-unavailable",
      stage: "Workflow",
      severity: "Watch",
      explanation: workflowError,
      recommendedAction: "Reload the load. This review does not invent a blocker.",
      href: `/loads/${encodeURIComponent(loadId)}`,
      hrefLabel: "Reload load",
      recordedOutcome: "Unavailable",
    });
  }
  if (!workflow) return items;

  if (!workflow.assignment) {
    items.push({
      id: "assignment-missing",
      stage: "Assignment",
      severity: "Watch",
      explanation: "No assignment is stored for this load.",
      recommendedAction: "Open dispatch. This review does not assign a driver.",
      href: `/dispatch?loadId=${encodeURIComponent(loadId)}`,
      hrefLabel: "Open dispatch",
      recordedOutcome: "No assignment stored",
    });
  }

  const readiness = workflow.readiness;
  if (readiness && readiness.status !== "READY") {
    items.push({
      id: "readiness",
      stage: "Readiness",
      severity: readiness.status === "NOT_READY" ? "Critical" : "High",
      explanation: joinExplanation(readiness.summary, reasonCodes(readiness.reasonCodes), readiness.status),
      recommendedAction: "Review the stored readiness record. This panel does not mark the driver ready.",
      href: `/trip-release/${encodeURIComponent(loadId)}`,
      hrefLabel: "Open release workflow",
      recordedOutcome: readiness.status,
    });
  }

  const release = workflow.latestRelease;
  if (release && release.disposition !== "RELEASED") {
    const severity: LiveLoadReviewSeverity =
      release.disposition === "BLOCKED" ? "Critical" : release.disposition === "HOLD" ? "High" : "Medium";
    items.push({
      id: "release",
      stage: "Release",
      severity,
      explanation: joinExplanation(release.summary, reasonCodes(release.reasonCodes), release.disposition),
      recommendedAction: "Use the existing release workflow. This review does not release the load.",
      href: `/trip-release/${encodeURIComponent(loadId)}`,
      hrefLabel: "Open release workflow",
      recordedOutcome: release.disposition,
    });
  }

  const preTrip = workflow.preTrip;
  if (preTrip && preTrip.status !== "COMPLETED") {
    const blocking = preTrip.defects.filter((defect) => defect.severity === "BLOCKING");
    items.push({
      id: "pretrip",
      stage: "Pre-trip",
      severity: preTrip.status === "BLOCKED" || blocking.length > 0 ? "High" : "Watch",
      explanation:
        blocking.length > 0
          ? blocking.map((defect) => defect.description).join("; ")
          : `Pre-trip status is ${preTrip.status}.`,
      recommendedAction: "Review the stored pre-trip. This review does not close defects.",
      href: `/pretrip/${encodeURIComponent(loadId)}`,
      hrefLabel: "Open pre-trip",
      recordedOutcome: preTrip.status,
    });
  }

  return items;
}
