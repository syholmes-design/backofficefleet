"use client";

import { useMemo } from "react";
import type { BofData } from "@/lib/load-bof-data";
import type { DemoRiskOverrides } from "@/lib/load-risk-explanation";
import { getLoadReviewExplanation, loadRiskReasonUsesDriverOverride } from "@/lib/load-review-explanation";
import { ReviewDetailsDrawer } from "./ReviewDetailsDrawer";

const LOAD_CATEGORY_ORDER = [
  "driver",
  "compliance",
  "documents",
  "proof",
  "settlement",
  "safety",
  "route",
];

const LOAD_CATEGORY_LABEL: Record<string, string> = {
  driver: "Driver eligibility",
  compliance: "Compliance",
  documents: "Documents",
  proof: "Proof / POD",
  settlement: "Settlement",
  safety: "Safety",
  route: "Route / exceptions",
};

export type LoadReviewDrawerProps = {
  data: BofData;
  loadId: string;
  demoRiskOverrides: DemoRiskOverrides;
  open: boolean;
  onClose: () => void;
  resolveLoadRiskReason: (loadId: string, reasonId: string, note?: string) => void;
  resolveDriverRiskReason: (driverId: string, reasonId: string, note?: string) => void;
};

export function LoadReviewDrawer({
  data,
  loadId,
  demoRiskOverrides,
  open,
  onClose,
  resolveLoadRiskReason,
  resolveDriverRiskReason,
}: LoadReviewDrawerProps) {
  const explanation = useMemo(
    () => getLoadReviewExplanation(data, loadId, demoRiskOverrides),
    [data, loadId, demoRiskOverrides]
  );

  const load = data.loads.find((l) => l.id === loadId);

  const statusChip =
    explanation.status === "ready"
      ? "Clean"
      : explanation.status === "blocked"
        ? "Blocked"
        : explanation.status === "at_risk"
          ? "At risk"
          : "Needs review";

  const onResolveIssue = (issueId: string) => {
    const reason = explanation.issues.find((i) => i.id === issueId);
    if (!reason || !load?.driverId) return;
    if (loadRiskReasonUsesDriverOverride(issueId)) {
      resolveDriverRiskReason(load.driverId, issueId, "Load review — clear driver-linked risk (demo)");
    } else {
      resolveLoadRiskReason(loadId, issueId, "Load review — clear load risk (demo)");
    }
  };

  return (
    <ReviewDetailsDrawer
      open={open}
      onClose={onClose}
      title={`Load review — ${loadId}`}
      subtitle={load ? `Load #${load.number} · assigned ${load.driverId}` : undefined}
      summary={explanation.summary}
      statusChip={statusChip}
      primaryAction={
        explanation.primaryActionHref && explanation.primaryActionLabel
          ? { href: explanation.primaryActionHref, label: explanation.primaryActionLabel }
          : undefined
      }
      issues={explanation.issues}
      categoryOrder={LOAD_CATEGORY_ORDER}
      categoryLabels={LOAD_CATEGORY_LABEL}
      onResolveIssue={onResolveIssue}
      footerNote={
        explanation.demoOverridesActive
          ? "Demo risk override active — some reasons were cleared for this session."
          : undefined
      }
    />
  );
}
