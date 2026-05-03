import type { BofData } from "@/lib/load-bof-data";
import { getDriverCredentialStatus } from "@/lib/driver-credential-status";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import { getDriverReviewExplanation, type DriverReviewIssue } from "@/lib/driver-review-explanation";
import { getSafetyScorecardRows } from "@/lib/safety-scorecard";

export type DriverTableEligibilityStatus = "ready" | "needs_review" | "blocked";

export type DriverTableRowModel = {
  driverId: string;
  driverName: string;
  status: DriverTableEligibilityStatus;
  statusLabel: "Active" | "Review" | "Blocked";
  dispatchEligibilityLabel: string;
  complianceLabel: string;
  documentsLabel: string;
  safetyLabel: "Elite" | "Standard" | "At Risk";
  settlementLabel: "Paid" | "Pending" | "Hold / Review";
  currentLoadLabel: string;
  loadLinkId: string | null;
  pendingPay: number;
  primaryReviewReason: string;
  reviewReasonSource: string;
  recommendedFix: string;
  actionHref?: string;
  actionLabel?: string;
  issues: DriverReviewIssue[];
  hardBlockers: string[];
  blockerHref?: string;
  primaryDispatchBlockerId?: string;
};

function issueSeverityRank(s: DriverReviewIssue["severity"]) {
  return s === "critical" ? 0 : s === "high" ? 1 : s === "warning" ? 2 : 3;
}

/**
 * Single projection for the Drivers roster table and review drawer — driverId-keyed only.
 */
export function getDriverTableRowModel(data: BofData, driverId: string): DriverTableRowModel {
  const canonicalCredentials = getDriverCredentialStatus(data, driverId);
  if (canonicalCredentials.driverId !== driverId) {
    throw new Error("getDriverCredentialStatus returned mismatched driverId");
  }
  const review = getDriverReviewExplanation(data, driverId);
  const eligibility = getDriverDispatchEligibility(data, driverId);
  const open = review.issues.filter((i) => !i.resolved);

  const effective: DriverTableEligibilityStatus = review.reviewStatus;

  const sorted = [...open].sort((a, b) => issueSeverityRank(a.severity) - issueSeverityRank(b.severity));
  const primary = sorted[0];
  const primaryReviewReason =
    primary?.title ??
    (effective === "needs_review" || effective === "blocked"
      ? "Dispatch readiness review — see driver review"
      : "");
  const reviewReasonSource =
    primary?.detail ?? primary?.whyItMatters ?? "getDriverReviewExplanation (issues + dispatch eligibility)";

  const statusLabel: DriverTableRowModel["statusLabel"] =
    effective === "blocked" ? "Blocked" : effective === "needs_review" ? "Review" : "Active";

  const dispatchEligibilityLabel =
    effective === "ready"
      ? eligibility.status === "ready"
        ? eligibility.label
        : "Ready for dispatch"
      : effective === "needs_review" && primaryReviewReason
        ? `${eligibility.label} — ${primaryReviewReason}`
        : eligibility.label;

  const complianceLabel =
    eligibility.hardBlockerCount > 0
      ? `${review.complianceColumnLabel} · ${eligibility.hardBlockerCount} hard gate(s)`
      : review.complianceColumnLabel;

  const safetyTier = (getSafetyScorecardRows().find((r) => r.driverId === driverId)?.performanceTier ??
    "Standard") as DriverTableRowModel["safetyLabel"];

  const settlement = data.settlements.find((row) => row.driverId === driverId);
  const hasHold = data.moneyAtRisk.some(
    (item) => item.driverId === driverId && String(item.status ?? "").toUpperCase() === "BLOCKED"
  );
  const settlementHold =
    String(settlement?.status ?? "").toLowerCase().includes("hold") ||
    String(settlement?.status ?? "").toLowerCase().includes("review");
  const settlementLabel: DriverTableRowModel["settlementLabel"] =
    hasHold || settlementHold ? "Hold / Review" : settlement?.status === "Paid" ? "Paid" : "Pending";

  const pendingPay = data.moneyAtRisk
    .filter((item) => item.driverId === driverId && String(item.status ?? "").toUpperCase() !== "PAID")
    .reduce((sum, item) => sum + item.amount, 0);

  const activeLoad = data.loads.find(
    (load) => load.driverId === driverId && (load.status === "En Route" || load.status === "Pending")
  );
  const latestLoad = data.loads.find((load) => load.driverId === driverId);
  const currentLoadLabel = activeLoad
    ? `L${activeLoad.number} · ${activeLoad.status}`
    : latestLoad
      ? `L${latestLoad.number} · last delivered`
      : "Unassigned";
  const loadLinkId = activeLoad?.id ?? latestLoad?.id ?? null;

  return {
    driverId,
    driverName: review.driverName,
    status: effective,
    statusLabel,
    dispatchEligibilityLabel,
    complianceLabel,
    documentsLabel: review.documentsColumnLabel,
    safetyLabel: safetyTier,
    settlementLabel,
    currentLoadLabel,
    loadLinkId,
    pendingPay,
    primaryReviewReason,
    reviewReasonSource,
    recommendedFix: primary?.recommendedFix ?? review.recommendedNextStepText,
    actionHref: primary?.actionHref ?? review.primaryAction?.href,
    actionLabel: primary?.actionLabel ?? review.primaryAction?.label,
    issues: review.issues,
    hardBlockers: eligibility.hardBlockers,
    blockerHref: eligibility.recommendedAction?.href,
    primaryDispatchBlockerId: eligibility.hardBlockerDetails[0]?.id,
  };
}
