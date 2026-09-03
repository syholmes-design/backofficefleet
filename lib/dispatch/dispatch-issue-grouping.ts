import type { CanonicalOperatingBlocker } from "@/lib/dispatch/canonical-dispatch-operating-state";
import { classifyIssueSeverity, type DispatchIssueSeverity } from "@/lib/dispatch/dispatch-severity";

export type DispatchIssueCategory =
  | "DOCUMENTATION"
  | "SEAL & SECURITY"
  | "MAINTENANCE & SAFETY"
  | "COMPLIANCE";

const ISSUE_CATEGORY_BY_ID: Record<string, DispatchIssueCategory> = {
  bol: "DOCUMENTATION",
  "rate-con": "DOCUMENTATION",
  pod: "DOCUMENTATION",
  "document-review": "DOCUMENTATION",
  "dispatch-instructions": "DOCUMENTATION",
  "payment-flags": "DOCUMENTATION",
  "lumper-setup": "DOCUMENTATION",
  seal: "SEAL & SECURITY",
  "seal-verify": "SEAL & SECURITY",
  "maint-report": "MAINTENANCE & SAFETY",
  "tire-check": "MAINTENANCE & SAFETY",
  "pretrip-cargo": "MAINTENANCE & SAFETY",
  "trailer-condition": "MAINTENANCE & SAFETY",
  "fuel-check": "MAINTENANCE & SAFETY",
  cdl: "COMPLIANCE",
  med: "COMPLIANCE",
  mvr: "COMPLIANCE",
  hos: "COMPLIANCE",
  camera: "COMPLIANCE",
  "rf-actions": "COMPLIANCE",
  unassigned: "COMPLIANCE",
  settlement: "COMPLIANCE",
  exception: "COMPLIANCE",
};

const CATEGORY_LABEL: Record<DispatchIssueCategory, string> = {
  DOCUMENTATION: "Documentation",
  "SEAL & SECURITY": "Seal & Security",
  "MAINTENANCE & SAFETY": "Maintenance & Safety",
  COMPLIANCE: "Compliance",
};

export type GroupedDispatchIssueCategory = {
  category: DispatchIssueCategory;
  label: string;
  count: number;
  summary: string;
  severity: DispatchIssueSeverity;
};

function categoryForBlocker(blocker: CanonicalOperatingBlocker): DispatchIssueCategory {
  if (ISSUE_CATEGORY_BY_ID[blocker.id]) return ISSUE_CATEGORY_BY_ID[blocker.id];
  if (blocker.source === "document") return "DOCUMENTATION";
  if (blocker.source === "maintenance") return "MAINTENANCE & SAFETY";
  if (blocker.source === "safety") return "COMPLIANCE";
  if (blocker.id === "seal" || blocker.id === "seal-verify") return "SEAL & SECURITY";
  return "COMPLIANCE";
}

/**
 * Maps existing canonical blocker ids/sources to one primary display category.
 */
export function groupDispatchIssues(blockers: CanonicalOperatingBlocker[]): GroupedDispatchIssueCategory[] {
  const buckets = new Map<DispatchIssueCategory, CanonicalOperatingBlocker[]>();
  for (const blocker of blockers) {
    const category = categoryForBlocker(blocker);
    const rows = buckets.get(category) ?? [];
    rows.push(blocker);
    buckets.set(category, rows);
  }

  const ranks: Record<DispatchIssueSeverity, number> = { CRITICAL: 3, MAJOR: 2, MINOR: 1 };
  return [...buckets.entries()].map(([category, rows]) => {
    const severity = rows.reduce<DispatchIssueSeverity>((highest, blocker) => {
      const next = classifyIssueSeverity(blocker);
      return ranks[next] > ranks[highest] ? next : highest;
    }, "MINOR");
    return {
      category,
      label: CATEGORY_LABEL[category],
      count: rows.length,
      summary: rows.map((row) => row.label.replace(/:\s*(Missing|Warning|OK)$/i, "").trim()).join("; "),
      severity,
    };
  });
}

export function nextActionHref(loadId: string, blocker: CanonicalOperatingBlocker, driverId?: string, assetId?: string): string {
  if (blocker.id === "bol" || blocker.id === "rate-con" || blocker.id === "pod" || blocker.id === "document-review") {
    return `/loads/${encodeURIComponent(loadId)}`;
  }
  if (blocker.id === "seal" || blocker.id === "seal-verify") {
    return `/loads/${encodeURIComponent(loadId)}#artifact-seal_pickup_photo`;
  }
  if (blocker.id === "tire-check" || blocker.id === "maint-report" || blocker.source === "maintenance") {
    return assetId ? `/maintenance/${encodeURIComponent(assetId)}` : `/loads/${encodeURIComponent(loadId)}`;
  }
  if (blocker.source === "safety" && driverId) {
    return `/drivers/${encodeURIComponent(driverId)}/safety`;
  }
  if (blocker.id === "unassigned") {
    return `/dispatch?view=assign&loadId=${encodeURIComponent(loadId)}`;
  }
  if (blocker.id === "pretrip-cargo" || blocker.source === "equipment") {
    return `/pretrip/${encodeURIComponent(loadId)}`;
  }
  if (blocker.source === "settlement" && driverId) {
    return `/settlements?driver=${encodeURIComponent(driverId)}`;
  }
  return `/pretrip/${encodeURIComponent(loadId)}`;
}

export function nextActionLabel(blocker: CanonicalOperatingBlocker): string {
  if (blocker.id === "bol" || blocker.id === "rate-con") return "Review / upload required BOL";
  if (blocker.id === "seal" || blocker.id === "seal-verify") return "Review / verify seal";
  if (blocker.id === "tire-check") return "Review tire check";
  if (blocker.id === "maint-report" || blocker.source === "maintenance") return "Review maintenance issue";
  if (blocker.id === "pretrip-cargo" || blocker.id === "hos") return "Review pre-trip";
  if (blocker.source === "safety") return "Review compliance issue";
  if (blocker.id === "unassigned") return "Assign driver";
  if (blocker.id === "dispatch-instructions") return "Review dispatch instructions";
  if (blocker.id === "pod") return "Review POD on load file";
  return "Review release gate";
}
