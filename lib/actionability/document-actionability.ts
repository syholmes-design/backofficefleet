import type { BofData } from "@/lib/load-bof-data";
import { getDriverDqfReadinessSummary } from "@/lib/driver-dqf-readiness";
import type { ActionableIssue } from "@/lib/actionability/types";

export function getDocumentActionabilityIssues(data: BofData): ActionableIssue[] {
  const out: ActionableIssue[] = [];
  for (const d of data.drivers) {
    const summary = getDriverDqfReadinessSummary(data, d.id);
    for (const row of summary.documents) {
      if (row.status === "ready") continue;
      const isMissing = row.status === "missing";
      const isExpired = row.status === "expired";
      out.push({
        id: `document-${d.id}-${row.canonicalType}`,
        label: row.label,
        entityType: "document",
        entityId: d.id,
        entityName: d.name,
        headline: isMissing
          ? `${d.name} missing ${row.label}`
          : isExpired
            ? `${d.name} ${row.label} expired`
            : `${d.name} ${row.label} needs review`,
        severity: isMissing || isExpired ? "high" : "medium",
        whyItMatters:
          row.whyItMatters ||
          "This review item is not specific enough and needs clarification.",
        recommendedFix:
          row.recommendedFix ||
          "Replace generic review flag with exact document issue and link.",
        owner: "Compliance",
        primaryAction: {
          label: `Open ${d.name} vault`,
          href: `/drivers/${d.id}/vault`,
        },
        secondaryActions: row.actionHref
          ? [{ label: row.actionLabel ?? "Open related item", href: row.actionHref }]
          : [],
      });
    }
  }
  return out;
}

