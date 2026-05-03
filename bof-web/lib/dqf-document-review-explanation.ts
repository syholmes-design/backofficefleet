import type { DriverDqfDocumentRow } from "@/lib/driver-dqf-readiness";
import type { ReviewDrawerIssue } from "@/components/review/review-types";

export const DQF_DOCUMENT_ISSUE_PREFIX = "dqf:" as const;

export function dqfDocumentIssueId(canonicalType: string): string {
  return `${DQF_DOCUMENT_ISSUE_PREFIX}${canonicalType}`;
}

function defaultWhy(row: DriverDqfDocumentRow): string {
  if (row.source === "missing") {
    return "No public file or generated artifact is linked for this canonical document slot.";
  }
  if (row.status === "missing") {
    return "Fleet readiness treats this slot as absent until a file is filed.";
  }
  if (row.status === "expired") {
    return "Expired credentials break dispatch continuity until renewed and rescanned.";
  }
  if (row.status === "expiring_soon") {
    return "Soon-to-expire credentials need proactive renewal to avoid hard gates.";
  }
  if ((row.status === "needs_review" || row.status === "pending_review") && !row.expirationDate?.trim()) {
    return "Expiration metadata is missing or inconsistent with the underlying record.";
  }
  if (row.source === "generated_summary" && row.status === "needs_review") {
    return "Generated summaries must be regenerated when source documents change.";
  }
  if ((row.status === "needs_review" || row.status === "pending_review") && !row.reviewDate?.trim()) {
    return "Reviewer attestation or review date is missing for this row.";
  }
  return "DQF rows in review status increase audit risk until verified.";
}

function defaultFix(row: DriverDqfDocumentRow, driverId: string): string {
  if (row.source === "missing") return `Attach the canonical file for ${row.label} or regenerate from fleet source.`;
  if (row.status === "missing") return `Upload ${row.label} through the vault or HR workflow.`;
  if (row.status === "expired") return `Renew ${row.label}, update expiration metadata, and re-run readiness.`;
  if (row.source === "generated_summary") return `Regenerate administrative summaries after core documents are current.`;
  return `Open the vault for ${driverId} and reconcile status, dates, and scans for ${row.label}.`;
}

/** Build a single drawer issue from DQF row machine state (driverId-keyed). */
export function dqfRowToReviewIssue(row: DriverDqfDocumentRow, driverId: string): ReviewDrawerIssue {
  const vault = `/drivers/${driverId}/vault`;
  const hr = `/drivers/${driverId}/hr`;
  const issueId = dqfDocumentIssueId(row.canonicalType);
  const detailParts = [
    `Driver ${driverId}`,
    `canonical ${row.canonicalType}`,
    row.notes?.trim() ? row.notes.trim() : null,
    row.expirationDate ? `expiration ${row.expirationDate}` : null,
    row.reviewDate ? `review date ${row.reviewDate}` : null,
  ].filter(Boolean);
  const detail = detailParts.join(" · ");

  const demoResolvable =
    row.status === "needs_review" ||
    row.status === "pending_review" ||
    row.status === "expiring_soon";

  return {
    id: issueId,
    severity:
      row.status === "expired" || row.status === "missing"
        ? "high"
        : row.status === "expiring_soon"
          ? "warning"
          : "warning",
    category: "documents",
    title: `${row.label}: ${row.status.replace(/_/g, " ")}`,
    detail,
    whyItMatters: row.whyItMatters ?? defaultWhy(row),
    recommendedFix: row.recommendedFix ?? defaultFix(row, driverId),
    actionHref: row.actionHref ?? (/HR|I-9|W-9|Bank/i.test(row.label) ? hr : vault),
    actionLabel: row.actionLabel ?? (/HR|I-9|W-9|Bank/i.test(row.label) ? "Open HR" : "Open vault"),
    canResolveInDemo: demoResolvable,
  };
}
