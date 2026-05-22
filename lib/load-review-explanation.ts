import type { BofData } from "@/lib/load-bof-data";
import type { ReviewDrawerIssue } from "@/components/review/review-types";
import {
  getLoadRiskExplanation,
  type DemoRiskOverrides,
  type LoadRiskReason,
  type LoadRiskStatus,
} from "@/lib/load-risk-explanation";

export type LoadReviewStatus = "ready" | "needs_review" | "at_risk" | "blocked";

export type LoadReviewExplanation = {
  entityType: "load";
  entityId: string;
  entityLabel: string;
  status: LoadReviewStatus;
  summary: string;
  issues: ReviewDrawerIssue[];
  primaryActionHref?: string;
  primaryActionLabel?: string;
  /** True when persisted demo risk overrides exist for this load or its assigned driver */
  demoOverridesActive: boolean;
};

function mapRiskStatus(risk: LoadRiskStatus): LoadReviewStatus {
  if (risk === "clean") return "ready";
  return risk;
}

function reasonToIssue(r: LoadRiskReason): ReviewDrawerIssue {
  return {
    id: r.id,
    severity: r.severity,
    category: r.category,
    title: r.title,
    detail: r.detail,
    whyItMatters: r.whyItMatters,
    recommendedFix: r.recommendedFix,
    actionHref: r.actionHref,
    actionLabel: r.actionLabel,
    canResolveInDemo: r.clearableInDemo,
  };
}

/**
 * Load-centric review narrative — keyed by loadId; driver linkage uses driverId strings only.
 */
export function getLoadReviewExplanation(
  data: BofData,
  loadId: string,
  overrides?: DemoRiskOverrides
): LoadReviewExplanation {
  const base = getLoadRiskExplanation(data, loadId, overrides);
  const load = data.loads.find((l) => l.id === loadId);

  const demoOverridesActive =
    Boolean(overrides?.loads?.[loadId]?.resolvedReasonIds?.length) ||
    Boolean(load && overrides?.drivers?.[load.driverId]?.resolvedReasonIds?.length);

  const issues = base.reasons.map(reasonToIssue);
  const summary =
    issues.length === 0
      ? "No open load risk reasons after demo overrides."
      : `${issues.length} open reason(s) affecting this load — ${issues.filter((i) => i.severity === "critical").length} critical, ${issues.filter((i) => i.severity === "high").length} high.`;

  const first = issues[0];
  return {
    entityType: "load",
    entityId: loadId,
    entityLabel: loadId,
    status: mapRiskStatus(base.riskStatus),
    summary,
    issues,
    primaryActionHref: first?.actionHref,
    primaryActionLabel: first?.actionLabel,
    demoOverridesActive,
  };
}

export function loadRiskReasonUsesDriverOverride(reasonId: string): boolean {
  return reasonId.startsWith("driver-hard:") || reasonId.startsWith("driver-soft:");
}
