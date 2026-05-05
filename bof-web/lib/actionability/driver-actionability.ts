import type { BofData } from "@/lib/load-bof-data";
import { getDriverReviewExplanation } from "@/lib/driver-review-explanation";
import type { ActionableIssue } from "@/lib/actionability/types";

function sev(s: string): ActionableIssue["severity"] {
  if (s === "blocked") return "critical";
  if (s === "needs_review") return "high";
  if (s === "watch") return "medium";
  return "watch";
}

export function getDriverActionabilityIssues(data: BofData): ActionableIssue[] {
  return data.drivers.map((d) => {
    const ex = getDriverReviewExplanation(data, d.id);
    return {
      id: `driver-${d.id}`,
      label: d.name,
      entityType: "driver",
      entityId: d.id,
      entityName: d.name,
      headline: ex.headline || "Review reason needs clarification",
      severity: sev(ex.severity),
      whyItMatters:
        ex.impact ||
        "BOF marked this driver for review, but the exact issue is not identified.",
      recommendedFix:
        ex.recommendedFix ||
        "Open the driver file and replace the generic review flag with the exact issue.",
      owner: "Driver Ops",
      primaryAction: {
        label: `Open ${d.name} vault`,
        href: `/drivers/${d.id}/vault`,
      },
      secondaryActions: [{ label: "Open driver profile", href: `/drivers/${d.id}` }],
    };
  });
}

