import type { BofData } from "@/lib/load-bof-data";
import {
  getDriverMedicalCardStatus,
  medicalCardHardBlockReason,
  medicalCardSoftWarningReason,
} from "@/lib/driver-doc-registry";
import { getOrderedDocumentsForDriver, type DocumentRow } from "@/lib/driver-queries";
import {
  getSafetyScorecardRows,
  getSafetyViolationActions,
  type SafetyScorecardRow,
} from "@/lib/safety-scorecard";

export type DispatchEligibilityStatus = "ready" | "needs_review" | "blocked";

/** Stable id for demo “resolve blocker” / validation; unique per underlying gate where possible. */
export type DispatchHardBlocker = { id: string; message: string };

export const DISPATCH_BLOCKER_REASON_IDS = {
  cdl_expired: "cdl_expired",
  cdl_missing: "cdl_missing",
  medical_card_expired: "medical_card_expired",
  medical_card_missing: "medical_card_missing",
  mvr_expired: "mvr_expired",
  mvr_missing: "mvr_missing",
  fmcsa_not_cleared: "fmcsa_not_cleared",
  fmcsa_dispatch_block: "fmcsa_dispatch_block",
  finance_dispatch_hold: "finance_dispatch_hold",
  safety_hard_gate: "safety_hard_gate",
} as const;

export type DriverDispatchEligibility = {
  driverId: string;
  status: DispatchEligibilityStatus;
  label: string;
  reasons: string[];
  hardBlockers: string[];
  /** Active hard gates after demo overrides */
  hardBlockerDetails: DispatchHardBlocker[];
  /** Hard gates acknowledged for demo (still listed for transparency) */
  demoResolvedHardBlockers: DispatchHardBlocker[];
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
 * Raw hard gates from canonical demo data (no demo overrides applied).
 */
export function collectDispatchHardBlockers(data: BofData, driverId: string): DispatchHardBlocker[] {
  const docs = getOrderedDocumentsForDriver(data, driverId);
  const rawByType = new Map(
    data.documents.filter((doc) => doc.driverId === driverId).map((doc) => [doc.type, doc as DocumentRow])
  );
  const preferDriverDoc = (type: string): DocumentRow | undefined => {
    const ordered = docByType(docs, type);
    const raw = rawByType.get(type);
    if (!raw) return ordered;
    return {
      ...ordered,
      ...raw,
      status: raw.status ?? ordered?.status ?? "MISSING",
      expirationDate: raw.expirationDate ?? ordered?.expirationDate,
      fileUrl: ordered?.fileUrl ?? raw.fileUrl,
      previewUrl: ordered?.previewUrl ?? raw.previewUrl,
    };
  };

  const cdl = preferDriverDoc("CDL");
  const fmcsa = preferDriverDoc("FMCSA");

  const hard: DispatchHardBlocker[] = [];

  if (isHardDocMissingOrExpired(cdl)) {
    hard.push({
      id: statusU(cdl) === "EXPIRED" ? DISPATCH_BLOCKER_REASON_IDS.cdl_expired : DISPATCH_BLOCKER_REASON_IDS.cdl_missing,
      message: statusU(cdl) === "EXPIRED" ? "CDL expired" : "CDL missing or not on file",
    });
  }

  const medicalCanon = getDriverMedicalCardStatus(data, driverId);
  const medicalHard = medicalCardHardBlockReason(medicalCanon);
  if (medicalHard) {
    hard.push({
      id:
        medicalCanon.status === "missing"
          ? DISPATCH_BLOCKER_REASON_IDS.medical_card_missing
          : DISPATCH_BLOCKER_REASON_IDS.medical_card_expired,
      message: medicalHard,
    });
  }

  /** Demo BOF: MVR-only gaps surface as soft warnings — they do not hard-block dispatch here. */

  if (isFmcsaHardGate(fmcsa)) {
    if (statusU(fmcsa) === "MISSING" || statusU(fmcsa) === "EXPIRED") {
      hard.push({
        id: DISPATCH_BLOCKER_REASON_IDS.fmcsa_not_cleared,
        message: "FMCSA / Clearinghouse not cleared",
      });
    } else if (fmcsa?.blocksPayment) {
      hard.push({
        id: DISPATCH_BLOCKER_REASON_IDS.fmcsa_dispatch_block,
        message: "FMCSA compliance blocks dispatch until reviewed",
      });
    }
  }

  const complianceOpen = data.complianceIncidents.filter(
    (c) =>
      c.driverId === driverId &&
      !["CLOSED", "RESOLVED"].includes(String(c.status ?? "").toUpperCase())
  );
  const criticalOpen = complianceOpen.filter((c) => c.severity === "CRITICAL");

  for (const c of criticalOpen) {
    hard.push({
      id: `open_compliance_critical:${c.incidentId}`,
      message: `Open compliance: ${c.type} (critical)`,
    });
  }

  const hasDispatchSpecificMoneyBlock = data.moneyAtRisk.some(
    (m) =>
      m.driverId === driverId &&
      String(m.status ?? "").toUpperCase() === "BLOCKED" &&
      /dispatch|out[- ]of[- ]service|oos|safety hold/i.test(
        `${m.category ?? ""} ${m.rootCause ?? ""} ${m.nextBestAction ?? ""}`
      )
  );
  if (hasDispatchSpecificMoneyBlock) {
    hard.push({
      id: DISPATCH_BLOCKER_REASON_IDS.finance_dispatch_hold,
      message: "Dispatch blocked by active finance/compliance hold",
    });
  }

  if (isSafetyHardGate(driverId)) {
    hard.push({
      id: DISPATCH_BLOCKER_REASON_IDS.safety_hard_gate,
      message: "Safety hard gate — at-risk profile with unresolved severe findings",
    });
  }

  return hard;
}

/**
 * Dispatch eligibility keyed by `driverId` only — medical card uses canonical structured rows
 * via `getDriverMedicalCardStatus`. Demo overrides in `data.driverDispatchBlockerOverrides` suppress
 * acknowledged hard gates without mutating seed JSON.
 */
export function getDriverDispatchEligibility(data: BofData, driverId: string): DriverDispatchEligibility {
  const docs = getOrderedDocumentsForDriver(data, driverId);
  const rawByType = new Map(
    data.documents.filter((doc) => doc.driverId === driverId).map((doc) => [doc.type, doc as DocumentRow])
  );
  const preferDriverDoc = (type: string): DocumentRow | undefined => {
    const ordered = docByType(docs, type);
    const raw = rawByType.get(type);
    if (!raw) return ordered;
    return {
      ...ordered,
      ...raw,
      status: raw.status ?? ordered?.status ?? "MISSING",
      expirationDate: raw.expirationDate ?? ordered?.expirationDate,
      fileUrl: ordered?.fileUrl ?? raw.fileUrl,
      previewUrl: ordered?.previewUrl ?? raw.previewUrl,
    };
  };

  const cdl = preferDriverDoc("CDL");
  const mvr = preferDriverDoc("MVR");
  const fmcsa = preferDriverDoc("FMCSA");
  const i9 = preferDriverDoc("I-9");
  const w9 = preferDriverDoc("W-9");
  const bank = preferDriverDoc("Bank Info");

  const rawHard = collectDispatchHardBlockers(data, driverId);
  const resolved = new Set(data.driverDispatchBlockerOverrides?.[driverId]?.resolvedReasonIds ?? []);
  const demoResolvedHardBlockers = rawHard.filter((b) => resolved.has(b.id));
  const hardBlockerDetails = rawHard.filter((b) => !resolved.has(b.id));
  const hardBlockers = hardBlockerDetails.map((b) => b.message);

  const softWarnings: string[] = [];

  if (demoResolvedHardBlockers.length > 0) {
    softWarnings.push(
      `Demo override active — ${demoResolvedHardBlockers.length} hard gate(s) acknowledged for this session`
    );
  }

  if (!isHardDocMissingOrExpired(cdl) && cdl && statusU(cdl) !== "VALID") {
    const s = statusU(cdl);
    if (s === "EXPIRING_SOON") softWarnings.push("CDL expiring soon");
    else softWarnings.push(`CDL status: ${cdl?.status ?? "Unknown"}`);
  }

  const medicalCanon = getDriverMedicalCardStatus(data, driverId);
  if (!medicalCardHardBlockReason(medicalCanon)) {
    const medicalSoft = medicalCardSoftWarningReason(medicalCanon);
    if (medicalSoft) softWarnings.push(medicalSoft);
  }

  if (!isHardDocMissingOrExpired(mvr) && mvr && statusU(mvr) !== "VALID") {
    const s = statusU(mvr);
    if (s === "EXPIRING_SOON" || s === "PENDING REVIEW")
      softWarnings.push(`MVR: ${mvr?.status ?? "Review"}`);
    else softWarnings.push(`MVR status: ${mvr?.status ?? "Unknown"}`);
  }

  if (!isFmcsaHardGate(fmcsa) && fmcsa && statusU(fmcsa) !== "VALID") {
    softWarnings.push(`FMCSA: ${fmcsa?.status ?? "Review"}`);
  }

  const complianceOpen = data.complianceIncidents.filter(
    (c) =>
      c.driverId === driverId &&
      !["CLOSED", "RESOLVED"].includes(String(c.status ?? "").toUpperCase())
  );
  const highOpen = complianceOpen.filter((c) => c.severity === "HIGH");

  for (const c of highOpen) {
    softWarnings.push(`Open compliance: ${c.type} (high)`);
  }

  const hasSettlementOrPayBlock = data.moneyAtRisk.some(
    (m) => m.driverId === driverId && String(m.status ?? "").toUpperCase() === "BLOCKED"
  );
  const hasDispatchSpecificMoneyBlock = data.moneyAtRisk.some(
    (m) =>
      m.driverId === driverId &&
      String(m.status ?? "").toUpperCase() === "BLOCKED" &&
      /dispatch|out[- ]of[- ]service|oos|safety hold/i.test(
        `${m.category ?? ""} ${m.rootCause ?? ""} ${m.nextBestAction ?? ""}`
      )
  );
  if (!hasDispatchSpecificMoneyBlock && hasSettlementOrPayBlock) {
    softWarnings.push("Settlement / pay hold active — dispatch review recommended");
  }

  if (isSafetySoftWarning(driverId)) {
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
        h.includes("Medical Card") ||
        h.includes("MVR") ||
        h.includes("FMCSA")
    );
    recommendedAction = firstDocHard
      ? { label: "Resolve Blocker", href: `/drivers/${driverId}/vault` }
      : isSafetyHardGate(driverId)
        ? { label: "Resolve Blocker", href: `/drivers/${driverId}/safety` }
        : hasDispatchSpecificMoneyBlock
          ? { label: "Resolve Blocker", href: `/drivers/${driverId}/settlements` }
          : { label: "Resolve Blocker", href: `/drivers/${driverId}/dispatch` };
  } else if (status === "needs_review") {
    recommendedAction = {
      label: "Open documents",
      href: `/drivers/${driverId}#driver-hub-documents-heading`,
    };
  }

  const expiredCore = CORE_DISPATCH_TYPES.filter((t) => {
    if (t === "Medical Card") return medicalCanon.rowStatus === "EXPIRED";
    return statusU(preferDriverDoc(t)) === "EXPIRED";
  }).length;
  const missingCore = CORE_DISPATCH_TYPES.filter((t) => {
    if (t === "Medical Card") return medicalCanon.rowStatus === "MISSING";
    return statusU(preferDriverDoc(t)) === "MISSING";
  }).length;

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
    driverId,
    status,
    label,
    reasons,
    hardBlockers,
    hardBlockerDetails,
    demoResolvedHardBlockers,
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

export function devLogDriverEligibilitySnapshot(data: BofData): void {
  if (process.env.NODE_ENV === "production") return;
  const rows = data.drivers.map((driver) => {
    const eligibility = getDriverDispatchEligibility(data, driver.id);
    return {
      driverId: driver.id,
      name: driver.name,
      eligibilityStatus: eligibility.status,
      hardBlockers: eligibility.hardBlockers.join(" | ") || "—",
      softWarnings: eligibility.softWarnings.join(" | ") || "—",
    };
  });
  console.table(rows);
}
