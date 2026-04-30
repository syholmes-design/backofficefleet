import type { BofData } from "@/lib/load-bof-data";
import { getOrderedDocumentsForDriver, type DocumentRow } from "@/lib/driver-queries";
import {
  getSafetyScorecardRows,
  getSafetyViolationActions,
  type SafetyScorecardRow,
} from "@/lib/safety-scorecard";

export type DispatchEligibilityStatus = "ready" | "needs_review" | "blocked";

export type DriverDispatchEligibility = {
  status: DispatchEligibilityStatus;
  label: string;
  reasons: string[];
  hardBlockers: string[];
  softWarnings: string[];
  recommendedAction: { label: string; href: string } | null;
  /** Table / panel helpers */
  complianceLabel: string;
  documentSummaryLabel: string;
  hardBlockerCount: number;
  softWarningCount: number;
};

const CORE_DISPATCH_TYPES = ["CDL", "Medical Card", "MVR", "FMCSA"] as const;

function docByType(docs: DocumentRow[], type: string): DocumentRow | undefined {
  return docs.find((d) => d.type === type);
}

function statusU(doc: DocumentRow | undefined): string {
  return (doc?.status ?? "MISSING").toUpperCase();
}

function isHardDocMissingOrExpired(doc: DocumentRow | undefined): boolean {
  const s = statusU(doc);
  return s === "MISSING" || s === "EXPIRED";
}

function isFmcsaHardGate(doc: DocumentRow | undefined): boolean {
  if (!doc) return true;
  const s = statusU(doc);
  if (s === "MISSING" || s === "EXPIRED") return true;
  if (doc.blocksPayment === true) return true;
  return false;
}

function safetyRow(driverId: string): SafetyScorecardRow | undefined {
  return getSafetyScorecardRows().find((r) => r.driverId === driverId);
}

function hasHighSeveritySafetyViolation(driverId: string): boolean {
  return getSafetyViolationActions().some(
    (v) => v.driverId === driverId && v.severity === "High"
  );
}

function isSafetyHardGate(driverId: string): boolean {
  const row = safetyRow(driverId);
  if (!row || row.performanceTier !== "At Risk") return false;
  if (hasHighSeveritySafetyViolation(driverId)) return true;
  if (row.tireAssetInspection === "Fail" && row.cargoDamageUsd > 200) return true;
  if (row.oosViolations >= 2 && row.hosCompliancePct < 90) return true;
  return false;
}

function isSafetySoftWarning(driverId: string): boolean {
  const row = safetyRow(driverId);
  if (!row) return false;
  if (row.performanceTier !== "At Risk") return false;
  return !isSafetyHardGate(driverId);
}

/**
 * Dispatch eligibility keyed by `driverId` only — no name joins, no shared global blockers.
 */
export function getDriverDispatchEligibility(
  data: BofData,
  driverId: string
): DriverDispatchEligibility {
  const docs = getOrderedDocumentsForDriver(data, driverId);
  const cdl = docByType(docs, "CDL");
  const medical = docByType(docs, "Medical Card");
  const mvr = docByType(docs, "MVR");
  const fmcsa = docByType(docs, "FMCSA");
  const i9 = docByType(docs, "I-9");
  const w9 = docByType(docs, "W-9");
  const bank = docByType(docs, "Bank Info");

  const hardBlockers: string[] = [];
  const softWarnings: string[] = [];

  if (isHardDocMissingOrExpired(cdl)) {
    hardBlockers.push(
      statusU(cdl) === "EXPIRED" ? "CDL expired" : "CDL missing or not on file"
    );
  } else if (statusU(cdl) !== "VALID") {
    const s = statusU(cdl);
    if (s === "EXPIRING_SOON") softWarnings.push("CDL expiring soon");
    else softWarnings.push(`CDL status: ${cdl?.status ?? "Unknown"}`);
  }

  if (isHardDocMissingOrExpired(medical)) {
    hardBlockers.push(
      statusU(medical) === "EXPIRED"
        ? "Medical Card expired"
        : "Medical Card missing or not on file"
    );
  } else if (statusU(medical) !== "VALID") {
    const s = statusU(medical);
    if (s === "EXPIRING_SOON") softWarnings.push("Medical Card expiring soon");
    else softWarnings.push(`Medical Card status: ${medical?.status ?? "Unknown"}`);
  }

  if (isHardDocMissingOrExpired(mvr)) {
    hardBlockers.push(
      statusU(mvr) === "EXPIRED" ? "MVR expired" : "MVR missing or not on file"
    );
  } else if (statusU(mvr) !== "VALID") {
    const s = statusU(mvr);
    if (s === "EXPIRING_SOON" || s === "PENDING REVIEW")
      softWarnings.push(`MVR: ${mvr?.status ?? "Review"}`);
    else softWarnings.push(`MVR status: ${mvr?.status ?? "Unknown"}`);
  }

  if (isFmcsaHardGate(fmcsa)) {
    if (statusU(fmcsa) === "MISSING" || statusU(fmcsa) === "EXPIRED") {
      hardBlockers.push("FMCSA / Clearinghouse not cleared");
    } else if (fmcsa?.blocksPayment) {
      hardBlockers.push("FMCSA compliance blocks dispatch until reviewed");
    }
  } else if (statusU(fmcsa) !== "VALID") {
    softWarnings.push(`FMCSA: ${fmcsa?.status ?? "Review"}`);
  }

  const complianceOpen = data.complianceIncidents.filter(
    (c) =>
      c.driverId === driverId &&
      !["CLOSED", "RESOLVED"].includes(String(c.status ?? "").toUpperCase())
  );
  const criticalOpen = complianceOpen.filter((c) => c.severity === "CRITICAL");
  const highOpen = complianceOpen.filter((c) => c.severity === "HIGH");

  for (const c of criticalOpen) {
    hardBlockers.push(`Open compliance: ${c.type} (critical)`);
  }
  for (const c of highOpen) {
    softWarnings.push(`Open compliance: ${c.type} (high)`);
  }

  const hasMoneyBlock = data.moneyAtRisk.some(
    (m) => m.driverId === driverId && String(m.status ?? "").toUpperCase() === "BLOCKED"
  );
  if (hasMoneyBlock) {
    hardBlockers.push("Settlement / pay pipeline blocked for this driver");
  }

  if (isSafetyHardGate(driverId)) {
    hardBlockers.push("Safety hard gate — at-risk profile with unresolved severe findings");
  } else if (isSafetySoftWarning(driverId)) {
    softWarnings.push("Safety tier At Risk — review before long haul");
  }

  if (statusU(i9) === "MISSING" || !i9?.fileUrl) {
    softWarnings.push("I-9 missing or needs HR upload");
  } else if (statusU(i9) !== "VALID") {
    softWarnings.push(`I-9: ${i9.status}`);
  }

  if (statusU(w9) === "MISSING" || !w9?.fileUrl) {
    softWarnings.push("W-9 missing or needs HR upload");
  } else if (statusU(w9) !== "VALID") {
    softWarnings.push(`W-9: ${w9.status}`);
  }

  if (statusU(bank) === "MISSING" || !bank?.fileUrl) {
    softWarnings.push("Bank / direct deposit info incomplete");
  } else if (statusU(bank) !== "VALID") {
    softWarnings.push(`Bank info: ${bank.status}`);
  }

  const settlement = data.settlements.find((s) => s.driverId === driverId);
  if (settlement?.status?.toUpperCase() === "PENDING") {
    softWarnings.push("Settlement pending review");
  }

  const reasons = [...hardBlockers, ...softWarnings];

  let status: DispatchEligibilityStatus;
  if (hardBlockers.length > 0) {
    status = "blocked";
  } else if (softWarnings.length > 0) {
    status = "needs_review";
  } else {
    status = "ready";
  }

  const label =
    status === "ready"
      ? "Ready for Dispatch"
      : status === "needs_review"
        ? "Needs Review"
        : `Blocked: ${hardBlockers[0] ?? "Resolve hard gates"}`;

  let recommendedAction: DriverDispatchEligibility["recommendedAction"] = null;
  if (status === "blocked") {
    const firstDocHard = hardBlockers.find(
      (h) =>
        h.includes("CDL") ||
        h.includes("Medical") ||
        h.includes("MVR") ||
        h.includes("FMCSA")
    );
    recommendedAction = firstDocHard
      ? { label: "Resolve Blocker", href: `/drivers/${driverId}/vault` }
      : isSafetyHardGate(driverId)
        ? { label: "Resolve Blocker", href: `/drivers/${driverId}/safety` }
        : hasMoneyBlock
          ? { label: "Resolve Blocker", href: `/drivers/${driverId}/settlements` }
          : { label: "Resolve Blocker", href: `/drivers/${driverId}/dispatch` };
  } else if (status === "needs_review") {
    recommendedAction = { label: "Review Docs", href: `/drivers/${driverId}/profile` };
  }

  const expiredCore = CORE_DISPATCH_TYPES.filter((t) => statusU(docByType(docs, t)) === "EXPIRED")
    .length;
  const missingCore = CORE_DISPATCH_TYPES.filter((t) => statusU(docByType(docs, t)) === "MISSING")
    .length;

  let complianceLabel = "Valid";
  if (missingCore > 0) complianceLabel = "Missing Required Doc";
  else if (expiredCore > 0) complianceLabel = "Expired";
  else if (docs.some((d) => statusU(d) === "EXPIRING_SOON")) complianceLabel = "Expiring Soon";
  else if (complianceOpen.some((c) => c.severity === "HIGH")) complianceLabel = "Pending Review";
  else if (complianceOpen.length > 0) complianceLabel = "Pending Review";

  let documentSummaryLabel = "Ready";
  if (missingCore > 0) documentSummaryLabel = "Missing required docs";
  else if (expiredCore > 0) documentSummaryLabel = "Missing required docs";
  else if (
    softWarnings.some((w) => w.includes("I-9") || w.includes("W-9") || w.includes("Bank"))
  ) {
    documentSummaryLabel = "Needs HR update";
  } else if (softWarnings.length > 0) {
    documentSummaryLabel = "Needs HR update";
  }

  return {
    status,
    label,
    reasons,
    hardBlockers,
    softWarnings,
    recommendedAction,
    complianceLabel,
    documentSummaryLabel,
    hardBlockerCount: hardBlockers.length,
    softWarningCount: softWarnings.length,
  };
}

export function warnDispatchEligibilityAllBlocked(
  eligibilities: DriverDispatchEligibility[]
): void {
  if (process.env.NODE_ENV === "production") return;
  if (eligibilities.length === 0) return;
  const blocked = eligibilities.filter((e) => e.status === "blocked").length;
  if (blocked === eligibilities.length) {
    console.warn(
      "[dispatch-eligibility] All drivers are marked blocked. Check dispatch eligibility helper."
    );
  }
  const reasonCounts = new Map<string, number>();
  for (const e of eligibilities) {
    const key = e.hardBlockers[0] ?? "(none)";
    reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1);
  }
  const max = Math.max(...reasonCounts.values());
  if (max >= Math.ceil(eligibilities.length * 0.75) && eligibilities.length >= 6) {
    console.warn(
      "[dispatch-eligibility] Identical blocker reason applied to most drivers.",
      { max, total: eligibilities.length }
    );
  }
}
