"use client";

import { useMemo } from "react";
import type { BofData } from "@/lib/load-bof-data";
import {
  getDriverReviewExplanation,
  type DriverReviewIssue,
  type DriverReviewIssueCategory,
} from "@/lib/driver-review-explanation";
import { ReviewDetailsDrawer } from "@/components/review/ReviewDetailsDrawer";
import type { ReviewDrawerIssue } from "@/components/review/review-types";

const CATEGORY_ORDER: DriverReviewIssueCategory[] = [
  "dispatch",
  "credentials",
  "documents",
  "compliance",
  "safety",
  "settlement",
];

const CATEGORY_LABEL: Record<DriverReviewIssueCategory, string> = {
  dispatch: "Dispatch",
  credentials: "Credentials",
  documents: "Documents",
  compliance: "Compliance",
  safety: "Safety",
  settlement: "Settlement",
};

function mapIssue(i: DriverReviewIssue): ReviewDrawerIssue {
  return {
    id: i.id,
    severity: i.severity,
    category: i.category,
    title: i.title,
    detail: i.detail,
    whyItMatters: i.whyItMatters,
    recommendedFix: i.recommendedFix,
    actionHref: i.actionHref,
    actionLabel: i.actionLabel,
    canResolveInDemo: i.canResolveInDemo,
    resolved: i.resolved,
    dispatchBlockerId: i.dispatchBlockerId,
  };
}

export type DriverReviewDrawerProps = {
  data: BofData;
  driverId: string;
  filterCategory?: DriverReviewIssueCategory | null;
  onClose: () => void;
  resolveDriverDispatchBlocker: (driverId: string, reasonId: string, note?: string) => void;
  resolveDriverReviewIssue: (driverId: string, issueId: string, note?: string) => void;
  resetDriverReviewOverrides: (driverId: string) => void;
};

export function DriverReviewDrawer({
  data,
  driverId,
  filterCategory,
  onClose,
  resolveDriverDispatchBlocker,
  resolveDriverReviewIssue,
  resetDriverReviewOverrides,
}: DriverReviewDrawerProps) {
  const explanation = useMemo(() => getDriverReviewExplanation(data, driverId), [data, driverId]);

  const displayIssues = useMemo(() => {
    let list = [...explanation.issues];
    if (filterCategory) {
      list = list.filter((i) => i.category === filterCategory);
    }
    list.sort((a, b) => {
      const order = (s: DriverReviewIssue["severity"]) =>
        s === "critical" ? 0 : s === "high" ? 1 : s === "warning" ? 2 : 3;
      const o = order(a.severity) - order(b.severity);
      if (o !== 0) return o;
      return a.title.localeCompare(b.title);
    });
    return list.map(mapIssue);
  }, [explanation.issues, filterCategory]);

  const topStatus =
    explanation.reviewStatus === "ready"
      ? "Ready"
      : explanation.reviewStatus === "needs_review"
        ? "Needs Review"
        : "Blocked";

  const quickLinks = [
    { label: "Open Documents", href: `/drivers/${driverId}/vault` },
    { label: "Open Safety", href: `/drivers/${driverId}/safety` },
    { label: "Open Settlement", href: `/drivers/${driverId}/settlements` },
    { label: "Open Dispatch", href: `/dispatch?driverId=${encodeURIComponent(driverId)}` },
  ];

  const subtitle =
    filterCategory != null
      ? `${explanation.entityId} · filter: ${CATEGORY_LABEL[filterCategory]}`
      : explanation.entityId;

  return (
    <ReviewDetailsDrawer
      open
      onClose={onClose}
      title={`Driver review — ${explanation.driverName} (${driverId})`}
      subtitle={subtitle}
      summary={`${explanation.primaryGuidance.headline}: ${explanation.primaryGuidance.plainEnglishReason}`}
      statusChip={
        filterCategory != null ? `${topStatus} (${CATEGORY_LABEL[filterCategory]})` : topStatus
      }
      primaryAction={
        explanation.primaryGuidance.primaryActionHref
          ? {
              label: explanation.primaryGuidance.primaryActionLabel,
              href: explanation.primaryGuidance.primaryActionHref,
            }
          : explanation.primaryAction
      }
      quickLinks={quickLinks}
      issues={displayIssues}
      categoryOrder={[...CATEGORY_ORDER]}
      categoryLabels={CATEGORY_LABEL}
      onResolveIssue={(issueId) => {
        const issue = explanation.issues.find((x) => x.id === issueId);
        if (!issue) return;
        if (issue.dispatchBlockerId) {
          resolveDriverDispatchBlocker(
            driverId,
            issue.dispatchBlockerId,
            "Driver review — resolve blocker (demo)"
          );
        } else {
          resolveDriverReviewIssue(driverId, issue.id, "Driver review — mark reviewed (demo)");
        }
      }}
      headerExtra={
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <button type="button" className="bof-cc-action-btn" onClick={() => resetDriverReviewOverrides(driverId)}>
            Reset demo review marks (this driver)
          </button>
        </div>
      }
    />
  );
}
