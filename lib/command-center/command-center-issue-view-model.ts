import type { BofData } from "@/lib/load-bof-data";
import type { EnrichedCommandCenterItem } from "@/lib/command-center-system";
import { formatUsd } from "@/lib/format-money";

export type CommandCenterIssueType =
  | "dispatch"
  | "driver_compliance"
  | "proof_documents"
  | "settlement"
  | "safety_claims"
  | "revenue";

export type UserFacingSeverity = "Critical" | "High" | "Medium" | "Watch";

export type CommandCenterIssueViewModel = {
  id: string;
  headline: string;
  severityLabel: UserFacingSeverity;
  severityMeaning: string;
  issueType: CommandCenterIssueType;
  whyItMatters: string;
  recommendedFix: string;
  owner: string;
  exposureLabel?: string;
  driverId?: string;
  driverName?: string;
  loadId?: string;
  documentLabel?: string;
  settlementId?: string;
  primaryAction: { label: string; href: string };
  secondaryActions: Array<{ label: string; href: string }>;
};

export function getUserFacingSeverity(severity: string): {
  label: UserFacingSeverity;
  meaning: string;
  tone: "danger" | "warning" | "attention" | "neutral";
} {
  if (severity === "critical")
    return {
      label: "Critical",
      meaning: "Blocks dispatch, payment, compliance, or claim readiness.",
      tone: "danger",
    };
  if (severity === "high")
    return {
      label: "High",
      meaning: "Needs action soon to prevent delay, hold, or customer issue.",
      tone: "warning",
    };
  if (severity === "medium")
    return {
      label: "Medium",
      meaning: "Should be resolved, but does not currently block the operation.",
      tone: "attention",
    };
  return {
    label: "Watch",
    meaning: "Monitor this item and confirm it does not escalate.",
    tone: "neutral",
  };
}

function issueTypeFrom(item: EnrichedCommandCenterItem): CommandCenterIssueType {
  const blob = `${item.title} ${item.detail} ${item.nextAction}`.toLowerCase();
  if (/settlement|payroll|hold|net pay/.test(blob)) return "settlement";
  if (/proof|pod|bol|seal|document/.test(blob)) return "proof_documents";
  if (/compliance|credential|medical|cdl|mvr|fmcsa/.test(blob)) return "driver_compliance";
  if (/safety|claim/.test(blob)) return "safety_claims";
  if (item.bucket === "Dispatch / proof") return "dispatch";
  return "revenue";
}

function cleanHeadline(item: EnrichedCommandCenterItem): string {
  if (item.loadId && /proof/i.test(item.title)) return `${item.loadId} has a proof issue`;
  if (item.loadId && /dispatch/i.test(item.bucket)) return `${item.loadId} needs dispatch review`;
  if (item.driver && /compliance|document|credential/i.test(`${item.title} ${item.detail}`))
    return `${item.driver} needs driver-file review`;
  if (/settlement|hold/i.test(`${item.title} ${item.detail}`) && item.driver)
    return `${item.driver} has a settlement hold`;
  return item.title
    .replace(/\bP[0-3]\b/g, "")
    .replace(/\bcanonical\b/gi, "")
    .trim();
}

function buildActions(data: BofData, item: EnrichedCommandCenterItem, issueType: CommandCenterIssueType) {
  const secondary: Array<{ label: string; href: string }> = [];
  if (item.loadId) secondary.push({ label: `Open ${item.loadId}`, href: `/loads/${item.loadId}` });
  if (item.driverId) secondary.push({ label: "Open driver vault", href: `/drivers/${item.driverId}/vault` });
  if (issueType === "safety_claims" && item.driverId)
    secondary.push({ label: "Open safety review", href: `/safety?driver=${item.driverId}` });
  if (issueType === "settlement" && item.driverId)
    secondary.push({ label: "Open settlement hold", href: `/settlements?driver=${item.driverId}` });
  if (issueType === "dispatch" && item.driverId)
    secondary.push({ label: "Review dispatch eligibility", href: `/drivers/${item.driverId}` });

  const primary =
    secondary[0] ??
    (item.driverId
      ? { label: "Open driver issue", href: `/drivers/${item.driverId}` }
      : { label: "Open command issue", href: "/command-center" });

  const dedup = secondary.filter(
    (a, idx) => secondary.findIndex((x) => x.label === a.label && x.href === a.href) === idx
  );
  return { primary, secondary: dedup };
}

export function buildCommandCenterIssueViewModels(
  data: BofData,
  items: EnrichedCommandCenterItem[]
): CommandCenterIssueViewModel[] {
  return items.map((item) => {
    const sev = getUserFacingSeverity(item.severity);
    const issueType = issueTypeFrom(item);
    const { primary, secondary } = buildActions(data, item, issueType);
    const settlementId = data.settlements.find((s) => s.driverId === item.driverId)?.settlementId;
    return {
      id: item.id,
      headline: cleanHeadline(item),
      severityLabel: sev.label,
      severityMeaning: sev.meaning,
      issueType,
      whyItMatters: item.detail,
      recommendedFix: item.nextAction,
      owner: item.owner,
      exposureLabel: item.moneyImpactUsd != null ? `${formatUsd(item.moneyImpactUsd)} at risk` : "Payment hold risk",
      driverId: item.driverId,
      driverName: item.driver,
      loadId: item.loadId,
      settlementId,
      primaryAction: primary,
      secondaryActions: secondary,
    };
  });
}
