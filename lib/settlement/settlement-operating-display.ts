/**
 * Presentation mapping for the Settlement operating layer.
 * Copies existing BOF authorities. Does not calculate pay, invent holds,
 * or equate load identity with driver/week payroll identity.
 */

import type { BofData } from "@/lib/load-bof-data";
import { getCanonicalDispatchLoadState } from "@/lib/dispatch/canonical-dispatch-operating-state";
import { normalizeCanonicalLoadId } from "@/lib/canonical-load-stories";
import {
  existingSettlementWorkflowHref,
  factoringRow,
  invoiceRowsFromGenerated,
  paymentRowsFromPrisma,
  type CashRecordRow,
  type MoneyLine,
} from "@/lib/load-file-proof-settlement-display";
import type { PayrollSettlementDetail, V3OperationalData, WeeklySettlement } from "@/lib/v3-operational-types";

export type SettlementSourceClass = "AUTHORITATIVE" | "DERIVED" | "REFERENCE_DEMO" | "UNSUPPORTED";
export type SettlementRelationshipClass = "AUTHORITATIVE" | "NAVIGATIONAL" | "UNSUPPORTED";

export type SettlementOperatingCta = { label: string; href: string };

export type SettlementMoneyLine = MoneyLine & {
  sourceClass: SettlementSourceClass;
  field: string;
};

export type SettlementHoldRow = {
  id: string;
  kind: "hold" | "exception" | "review_required";
  category: string;
  problem: string;
  owner: string;
  whyItMatters: string;
  requiredAction: string;
  status: string;
  href?: string;
  source: string;
  sourceClass: SettlementSourceClass;
};

export type SettlementLoadTraceRow = {
  loadId: string;
  relationship: SettlementRelationshipClass;
  note: string;
  href: string;
  sourceClass: SettlementSourceClass;
};

export type SettlementCertification = {
  identity: SettlementSourceClass;
  loadTrace: SettlementSourceClass;
  inputs: SettlementSourceClass;
  evidence: SettlementSourceClass;
  holds: SettlementSourceClass;
  blockers: SettlementSourceClass;
  readiness: SettlementSourceClass;
  calculation: SettlementSourceClass;
  adjustments: SettlementSourceClass;
  deductions: SettlementSourceClass;
  reimbursements: SettlementSourceClass;
  advances: SettlementSourceClass;
  netAmount: SettlementSourceClass;
  approval: SettlementSourceClass;
  status: SettlementSourceClass;
  payroll: SettlementSourceClass;
  payment: SettlementSourceClass;
  invoice: SettlementSourceClass;
  invoicePayment: SettlementSourceClass;
  factoring: SettlementSourceClass;
  safety: SettlementSourceClass;
  processIntelligence: SettlementSourceClass;
  packet: SettlementSourceClass;
};

export type SettlementOperatingView = {
  authorityNote: string;
  permissionNote: string;
  workbookAvailable: boolean;
  certification: SettlementCertification;
  identity: {
    driverWeekLabel: string;
    driverId: string;
    weekEnding: string;
    loadRelevance: string;
    note: string;
    sourceClass: SettlementSourceClass;
  };
  loadTrace: {
    note: string;
    contributingLoadJoin: SettlementRelationshipClass;
    rows: SettlementLoadTraceRow[];
  };
  payrollStatus: string;
  settlementStatus: string;
  driverPaymentStatus: string;
  approval: string;
  packetComplete: string;
  packetNote: string;
  calculation: { status: string; note: string; lines: SettlementMoneyLine[] };
  inputs: SettlementMoneyLine[];
  readiness: Array<{ label: string; value: string; note: string; sourceClass: SettlementSourceClass }>;
  holds: SettlementHoldRow[];
  safetyImpact: { status: string; note: string; sourceClass: SettlementSourceClass };
  evidenceLinks: SettlementOperatingCta[];
  invoices: CashRecordRow[];
  payments: CashRecordRow[];
  factoring: CashRecordRow;
  payrollBoundary: string;
  nextAction: SettlementOperatingCta | null;
  actions: SettlementOperatingCta[];
};

function normalizeId(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function loadKey(value: string | null | undefined): string {
  const trimmed = normalizeId(value);
  if (!trimmed) return "";
  if (/^PI-TEST-/i.test(trimmed)) return trimmed.toUpperCase();
  return normalizeCanonicalLoadId(trimmed);
}

/** Copy stored values. Never coerce null/undefined/blank to 0. */
function storedAmount(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Not recorded";
  return String(value);
}

function isOpenHoldStatus(status: string): boolean {
  const value = status.trim().toLowerCase();
  return value !== "resolved" && value !== "closed" && value !== "released" && value !== "complete";
}

function holdKind(status: string, managerActionRequired?: boolean): SettlementHoldRow["kind"] {
  const value = status.trim().toLowerCase();
  if (value.includes("exception")) return "exception";
  if (managerActionRequired) return "review_required";
  return "hold";
}

function latestWeeklyForDriver(rows: WeeklySettlement[], driverId: string | null): WeeklySettlement | null {
  if (!driverId) return null;
  const matches = rows.filter((row) => row.driverId === driverId);
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => String(a.weekEnding).localeCompare(String(b.weekEnding))).at(-1) ?? null;
}

function moneyLine(
  label: string,
  value: number | string | null | undefined,
  field: string,
  sourceClass: SettlementSourceClass,
): SettlementMoneyLine {
  return { label, value: storedAmount(value), field, sourceClass };
}

function payrollComponentLines(payroll: PayrollSettlementDetail): SettlementMoneyLine[] {
  const cls: SettlementSourceClass = "AUTHORITATIVE";
  return [
    moneyLine("Base earnings", payroll.baseEarnings, "PayrollSettlementDetail.baseEarnings", cls),
    moneyLine("Backhaul pay", payroll.backhaulPay, "PayrollSettlementDetail.backhaulPay", cls),
    moneyLine("Safety bonus", payroll.safetyBonus, "PayrollSettlementDetail.safetyBonus", cls),
    moneyLine("Safety bonus amount", payroll.safetyBonusAmount, "PayrollSettlementDetail.safetyBonusAmount", cls),
    moneyLine("Inspection bonus", payroll.inspectionBonus, "PayrollSettlementDetail.inspectionBonus", cls),
    moneyLine("Admin excellence bonus", payroll.adminExcellenceBonus, "PayrollSettlementDetail.adminExcellenceBonus", cls),
    moneyLine("Asset care bonus", payroll.assetCareBonus, "PayrollSettlementDetail.assetCareBonus", cls),
    moneyLine("Gross pay", payroll.grossPay, "PayrollSettlementDetail.grossPay", cls),
    moneyLine("FICA", payroll.fica, "PayrollSettlementDetail.fica", cls),
    moneyLine("OASDI", payroll.oasdi, "PayrollSettlementDetail.oasdi", cls),
    moneyLine("Federal withholding", payroll.federalWithholding, "PayrollSettlementDetail.federalWithholding", cls),
    moneyLine("State withholding", payroll.stateWithholding, "PayrollSettlementDetail.stateWithholding", cls),
    moneyLine("SDI", payroll.sdi, "PayrollSettlementDetail.sdi", cls),
    moneyLine("FM leave", payroll.fmLeave, "PayrollSettlementDetail.fmLeave", cls),
    moneyLine("Family support", payroll.familySupport, "PayrollSettlementDetail.familySupport", cls),
    moneyLine("Insurance premiums", payroll.insurancePremiums, "PayrollSettlementDetail.insurancePremiums", cls),
    moneyLine("Credit union", payroll.creditUnionSavingsClub, "PayrollSettlementDetail.creditUnionSavingsClub", cls),
    moneyLine("401(k)", payroll.contribution401k, "PayrollSettlementDetail.contribution401k", cls),
    moneyLine("HSA/FSA", payroll.hsaFsaHealthDeduction, "PayrollSettlementDetail.hsaFsaHealthDeduction", cls),
    moneyLine("Health insurance", payroll.healthInsurancePremiums, "PayrollSettlementDetail.healthInsurancePremiums", cls),
    moneyLine("Life insurance above 50k", payroll.lifeInsuranceAbove50k, "PayrollSettlementDetail.lifeInsuranceAbove50k", cls),
    moneyLine("Total deductions", payroll.totalDeductions, "PayrollSettlementDetail.totalDeductions", cls),
    moneyLine("Fuel reimbursement", payroll.fuelReimbursement, "PayrollSettlementDetail.fuelReimbursement", cls),
    moneyLine("Advance taken", payroll.advanceTaken, "PayrollSettlementDetail.advanceTaken", cls),
    moneyLine("Advance repayment", payroll.advanceRepayment, "PayrollSettlementDetail.advanceRepayment", cls),
    moneyLine("Chargeback total", payroll.chargebackTotal, "PayrollSettlementDetail.chargebackTotal", cls),
    moneyLine("Chargebacks itemized", payroll.chargebacksItemized, "PayrollSettlementDetail.chargebacksItemized", cls),
    moneyLine("Garnishment", payroll.garnishmentAmount, "PayrollSettlementDetail.garnishmentAmount", cls),
    moneyLine("Escrow contribution", payroll.escrowContribution, "PayrollSettlementDetail.escrowContribution", cls),
    moneyLine("Escrow balance", payroll.escrowBalance, "PayrollSettlementDetail.escrowBalance", cls),
    moneyLine("Net pay", payroll.netPay, "PayrollSettlementDetail.netPay", cls),
  ];
}

function payrollInputLines(payroll: PayrollSettlementDetail): SettlementMoneyLine[] {
  const cls: SettlementSourceClass = "AUTHORITATIVE";
  return [
    moneyLine("Pay model", payroll.payModelType, "PayrollSettlementDetail.payModelType", cls),
    moneyLine("Percentage rate", payroll.percentageRate, "PayrollSettlementDetail.percentageRate", cls),
    moneyLine("CPM loaded", payroll.cpmRateLoaded, "PayrollSettlementDetail.cpmRateLoaded", cls),
    moneyLine("CPM empty", payroll.cpmRateEmpty, "PayrollSettlementDetail.cpmRateEmpty", cls),
    moneyLine("Hourly rate", payroll.hourlyRate, "PayrollSettlementDetail.hourlyRate", cls),
    moneyLine("Minimum weekly guarantee", payroll.minimumWeeklyGuarantee, "PayrollSettlementDetail.minimumWeeklyGuarantee", cls),
    moneyLine("Detention rate", payroll.detentionRate, "PayrollSettlementDetail.detentionRate", cls),
    moneyLine("Layover rate", payroll.layoverRate, "PayrollSettlementDetail.layoverRate", cls),
    moneyLine("Breakdown pay rate", payroll.breakdownPayRate, "PayrollSettlementDetail.breakdownPayRate", cls),
    moneyLine("Stop pay", payroll.stopPay, "PayrollSettlementDetail.stopPay", cls),
    moneyLine("Tarp pay", payroll.tarpPay, "PayrollSettlementDetail.tarpPay", cls),
    moneyLine("Hazmat premium", payroll.hazmatPremium, "PayrollSettlementDetail.hazmatPremium", cls),
    moneyLine("Tanker premium", payroll.tankerPremium, "PayrollSettlementDetail.tankerPremium", cls),
    moneyLine("TWIC premium", payroll.twicPremium, "PayrollSettlementDetail.twicPremium", cls),
  ];
}

export function buildSettlementOperatingView(args: {
  data: BofData;
  v3?: V3OperationalData | null;
  loadId?: string | null;
  driverId?: string | null;
}): SettlementOperatingView {
  const loadId = normalizeId(args.loadId) || null;
  const canonicalLoadId = loadId ? loadKey(loadId) : "";
  const load = canonicalLoadId
    ? args.data.loads.find((row) => loadKey(row.id) === canonicalLoadId || row.id === loadId)
    : undefined;
  const driverId = normalizeId(args.driverId) || load?.driverId || null;
  const operating = canonicalLoadId ? getCanonicalDispatchLoadState(args.data, canonicalLoadId) : null;
  const weekly = latestWeeklyForDriver(args.v3?.weeklySettlements ?? [], driverId);
  const payroll = driverId
    ? (args.v3?.payrollSettlements ?? []).find((row) => row.driverId === driverId) ?? null
    : null;
  const mainSafety = driverId
    ? (args.v3?.mainSafety ?? []).find((row) => row.driverId === driverId) ?? null
    : null;
  const safetyHolds = (args.v3?.safetyEvents ?? []).filter((event) => {
    if (!event.settlementHold) return false;
    if (canonicalLoadId && loadKey(event.linkedLoadId) === canonicalLoadId) return true;
    if (driverId && event.driverId === driverId) return true;
    return false;
  });
  const workbookHolds = (args.v3?.settlementHolds ?? []).filter((hold) => {
    if (canonicalLoadId && loadKey(hold.loadId) === canonicalLoadId) return true;
    if (driverId && hold.driverId === driverId) return true;
    return false;
  });

  const settlementsHref = existingSettlementWorkflowHref({
    driverId,
    loadId: canonicalLoadId || null,
  });
  const loadHref = canonicalLoadId ? `/loads/${encodeURIComponent(canonicalLoadId)}` : undefined;
  const proofHref = canonicalLoadId ? `/loads/${encodeURIComponent(canonicalLoadId)}#load-proof` : undefined;
  const driverHref = driverId ? `/drivers/${encodeURIComponent(driverId)}` : undefined;

  const loadHold = Boolean(
    (load as { settlementHold?: boolean } | undefined)?.settlementHold || operating?.settlementHold,
  );
  const loadHoldReason =
    (load as { settlementHoldReason?: string } | undefined)?.settlementHoldReason
    || operating?.settlementHoldReason
    || "";

  const holds: SettlementHoldRow[] = [];
  if (loadHold) {
    holds.push({
      id: `load-hold-${canonicalLoadId}`,
      kind: "hold",
      category: "Load settlement hold",
      problem: loadHoldReason.trim() || "Load settlementHold is true",
      owner: "Settlement / Back Office",
      whyItMatters: "This is a load-level hold field. It is not the driver/week payroll identity and does not itself pay the driver.",
      requiredAction: "Review settlement workspace",
      status: "HOLD",
      href: settlementsHref,
      source: "Load / canonical operating state settlementHold",
      sourceClass: "AUTHORITATIVE",
    });
  }
  for (const hold of workbookHolds) {
    holds.push({
      id: hold.holdId,
      kind: holdKind(hold.status, hold.managerActionRequired),
      category: hold.holdType || hold.relatedModule || "Settlement hold",
      problem: hold.holdReason || "Hold recorded",
      owner: hold.releaseAuthorizedBy?.trim() || hold.approvedBy?.trim() || "Not recorded",
      whyItMatters: `Workbook Settlement Holds row ${hold.holdId} for load ${hold.loadId || "not recorded"} week ${hold.weekEnding || "not recorded"}. Amount ${storedAmount(hold.holdAmount)} is copied, not calculated here.`,
      requiredAction: hold.managerActionRequired ? "Manager action is flagged on the hold row" : "Review settlement hold",
      status: hold.status || "Recorded",
      href: settlementsHref,
      source: "Workbook Settlement Holds",
      sourceClass: "AUTHORITATIVE",
    });
  }
  for (const event of safetyHolds) {
    holds.push({
      id: `${event.eventId}-settlement-hold`,
      kind: "hold",
      category: "Safety settlement hold",
      problem: event.details || event.eventType,
      owner: event.coachingAssignedTo?.trim() || "Not recorded",
      whyItMatters: `${event.eventId} records settlementHold=${String(event.settlementHold)}. Amount ${storedAmount(event.settlementHoldAmount)} is copied from the Safety Event.`,
      requiredAction: "Open driver safety / Safety workspace",
      status: "HOLD RECORDED ON SAFETY EVENT",
      href: driverId ? `/drivers/${encodeURIComponent(driverId)}/safety` : "/safety",
      source: "Workbook Safety_Events.settlementHold",
      sourceClass: "AUTHORITATIVE",
    });
  }

  const calcLines: SettlementMoneyLine[] = payroll
    ? payrollComponentLines(payroll)
    : weekly
      ? [
          moneyLine("Gross pay", weekly.grossPay, "Weekly_Settlements.grossPay", "AUTHORITATIVE"),
          moneyLine("Total deductions", weekly.totalDeductions, "Weekly_Settlements.totalDeductions", "AUTHORITATIVE"),
          moneyLine("Net pay", weekly.netPay, "Weekly_Settlements.netPay", "AUTHORITATIVE"),
          moneyLine("Fleet owner profit", weekly.fleetOwnerProfit, "Weekly_Settlements.fleetOwnerProfit", "AUTHORITATIVE"),
        ]
      : [];

  const inputs: SettlementMoneyLine[] = payroll ? payrollInputLines(payroll) : [];

  const calculation = {
    status: payroll?.status || weekly?.settlementStatus || "NOT YET CALCULATED",
    note: payroll
      ? `${payroll.pendingReason || "Copied from workbook PayrollSettlementDetail."} Amounts are stored results. This panel does not recalculate payroll.`
      : weekly
        ? "Copied from workbook Weekly_Settlements stored amounts. This panel does not recalculate."
        : "No driver/week payroll or weekly settlement row is linked in this scope.",
    lines: calcLines,
  };

  const packetComplete = weekly
    ? weekly.settlementPacketComplete ? "COMPLETE FLAG ON WEEKLY ROW" : "NOT MARKED COMPLETE ON WEEKLY ROW"
    : "NOT EVALUATED";

  const readiness = [
    {
      label: "Driver/week packet flag",
      value: packetComplete,
      note: weekly
        ? `Weekly_Settlements.settlementPacketComplete for ${weekly.driverId} week ending ${weekly.weekEnding}. This is a stored boolean, not a packet document engine.`
        : "No weekly settlement row is linked. Blank packet fields are not treated as blockers.",
      sourceClass: weekly ? "AUTHORITATIVE" as const : "UNSUPPORTED" as const,
    },
    {
      label: "Load-level hold",
      value: loadHold ? "HOLD" : "NO LOAD HOLD RECORDED",
      note: loadHold ? (loadHoldReason || "Copied from load settlementHold.") : "Load settlementHold is false or not present.",
      sourceClass: canonicalLoadId ? "AUTHORITATIVE" as const : "UNSUPPORTED" as const,
    },
    {
      label: "Workbook settlement holds",
      value: workbookHolds.some((row) => isOpenHoldStatus(row.status)) ? "OPEN HOLD ROWS" : workbookHolds.length ? "HOLD ROWS RECORDED" : "NO HOLD ROWS IN SCOPE",
      note: "Copied from workbook Settlement Holds. Counts are not a new readiness engine.",
      sourceClass: "AUTHORITATIVE" as const,
    },
    {
      label: "Safety settlement hold",
      value: safetyHolds.length > 0 ? "HOLD FLAGGED ON SAFETY EVENT" : "NO SAFETY SETTLEMENT FLAG",
      note: "Only Safety Events with settlementHold=true. MainSafety.settlementImpact text is not converted into a hold here.",
      sourceClass: "AUTHORITATIVE" as const,
    },
  ];

  const evidenceLinks: SettlementOperatingCta[] = [];
  if (proofHref) evidenceLinks.push({ label: "Open load-file proof", href: proofHref });
  if (canonicalLoadId) evidenceLinks.push({ label: "Open load file", href: `/loads/${encodeURIComponent(canonicalLoadId)}` });

  const invoices = canonicalLoadId ? invoiceRowsFromGenerated(canonicalLoadId) : [{ label: "Customer invoice", status: "NOT IN LOAD SCOPE", detail: "Invoice artifacts are load-filed. Select a load to inspect invoice records." }];
  const payments: CashRecordRow[] = canonicalLoadId
    ? paymentRowsFromPrisma([])
    : [{ label: "Invoice payment", status: "NOT IN LOAD SCOPE", detail: "InvoicePayment is a customer-invoice record, not driver payroll." }];
  const factoring = canonicalLoadId
    ? factoringRow(canonicalLoadId, null)
    : { label: "Factoring", status: "NOT IN LOAD SCOPE", detail: "Factoring is not the settlement calculation engine." };

  const loadTraceRows: SettlementLoadTraceRow[] = [];
  if (canonicalLoadId) {
    loadTraceRows.push({
      loadId: canonicalLoadId,
      relationship: "NAVIGATIONAL",
      note: "Load currently in operating scope via route or query. Not a stored contributing-load join on Weekly_Settlements.",
      href: `/loads/${encodeURIComponent(canonicalLoadId)}`,
      sourceClass: "AUTHORITATIVE",
    });
  }
  for (const hold of workbookHolds) {
    const holdLoadId = loadKey(hold.loadId) || hold.loadId;
    if (!holdLoadId) continue;
    if (loadTraceRows.some((row) => row.loadId === holdLoadId && row.relationship === "AUTHORITATIVE")) continue;
    loadTraceRows.push({
      loadId: holdLoadId,
      relationship: "AUTHORITATIVE",
      note: `Settlement Holds row ${hold.holdId} stores loadId. This is a hold relationship, not proof that the load is included in weekly pay.`,
      href: `/loads/${encodeURIComponent(holdLoadId)}`,
      sourceClass: "AUTHORITATIVE",
    });
  }
  for (const event of safetyHolds) {
    const eventLoadId = loadKey(event.linkedLoadId) || event.linkedLoadId;
    if (!eventLoadId) continue;
    if (loadTraceRows.some((row) => row.loadId === eventLoadId)) continue;
    loadTraceRows.push({
      loadId: eventLoadId,
      relationship: "AUTHORITATIVE",
      note: `Safety Event ${event.eventId} links this load with settlementHold=true.`,
      href: `/loads/${encodeURIComponent(eventLoadId)}`,
      sourceClass: "AUTHORITATIVE",
    });
  }

  const actions: SettlementOperatingCta[] = [];
  const pushAction = (cta: SettlementOperatingCta | null | undefined) => {
    if (!cta?.href) return;
    if (actions.some((row) => row.href === cta.href && row.label === cta.label)) return;
    actions.push(cta);
  };
  pushAction({ label: "Open settlement workspace", href: settlementsHref });
  if (loadHref) pushAction({ label: "Open load file", href: loadHref });
  if (proofHref) pushAction({ label: "Review proof", href: proofHref });
  if (driverHref) pushAction({ label: "Review driver", href: driverHref });
  if (canonicalLoadId) pushAction({ label: "View process history", href: `/loads/${encodeURIComponent(canonicalLoadId)}#process-intelligence` });
  pushAction({ label: "Open Command Center settlement summary", href: "/command-center#cc-settlement-summary" });
  if (holds[0]?.href) pushAction({ label: holds[0].requiredAction, href: holds[0].href });
  if (safetyHolds[0]) pushAction({ label: "Review safety settlement hold", href: driverId ? `/drivers/${encodeURIComponent(driverId)}/safety` : "/safety" });

  const nextAction = holds[0]?.href
    ? { label: holds[0].requiredAction, href: holds[0].href }
    : { label: "Open settlement workspace", href: settlementsHref };

  const payrollPresent = Boolean(payroll);
  const weeklyPresent = Boolean(weekly);
  const certification: SettlementCertification = {
    identity: weeklyPresent ? "AUTHORITATIVE" : driverId ? "UNSUPPORTED" : "UNSUPPORTED",
    loadTrace: loadTraceRows.some((row) => row.relationship === "AUTHORITATIVE") ? "AUTHORITATIVE" : canonicalLoadId ? "DERIVED" : "UNSUPPORTED",
    inputs: payrollPresent ? "AUTHORITATIVE" : "UNSUPPORTED",
    evidence: canonicalLoadId ? "AUTHORITATIVE" : "UNSUPPORTED",
    holds: "AUTHORITATIVE",
    blockers: "AUTHORITATIVE",
    readiness: weeklyPresent || canonicalLoadId ? "AUTHORITATIVE" : "UNSUPPORTED",
    calculation: payrollPresent || weeklyPresent ? "AUTHORITATIVE" : "UNSUPPORTED",
    adjustments: payrollPresent ? "AUTHORITATIVE" : "UNSUPPORTED",
    deductions: payrollPresent || weeklyPresent ? "AUTHORITATIVE" : "UNSUPPORTED",
    reimbursements: payrollPresent ? "AUTHORITATIVE" : "UNSUPPORTED",
    advances: payrollPresent ? "AUTHORITATIVE" : "UNSUPPORTED",
    netAmount: payrollPresent || weeklyPresent ? "AUTHORITATIVE" : "UNSUPPORTED",
    approval: weeklyPresent ? "AUTHORITATIVE" : "UNSUPPORTED",
    status: weeklyPresent || payrollPresent ? "AUTHORITATIVE" : "UNSUPPORTED",
    payroll: payrollPresent ? "AUTHORITATIVE" : "UNSUPPORTED",
    payment: "UNSUPPORTED",
    invoice: canonicalLoadId ? "REFERENCE_DEMO" : "UNSUPPORTED",
    invoicePayment: "UNSUPPORTED",
    factoring: canonicalLoadId ? "REFERENCE_DEMO" : "UNSUPPORTED",
    safety: "AUTHORITATIVE",
    processIntelligence: canonicalLoadId ? "AUTHORITATIVE" : "UNSUPPORTED",
    packet: weeklyPresent ? "AUTHORITATIVE" : "UNSUPPORTED",
  };

  return {
    authorityNote:
      "Driver/week payroll identity comes from workbook Weekly_Settlements and PayrollSettlementDetail. Load ID is settlement-relevant only. Prisma Settlement is a separate load-keyed live-fleet record and is not the /settlements navigation key. Invoice, InvoicePayment, and factoring are separate records. This panel does not calculate pay or mark PAID.",
    permissionNote:
      "This operating layer is read-only. It does not approve, pay, submit payroll, or write financial records. Viewing follows the same authenticated BOF session as Load File, Dispatch, Driver, and /settlements. No additional settlement permission bypass is created here.",
    workbookAvailable: Boolean(args.v3),
    certification,
    identity: {
      driverWeekLabel: weekly
        ? `${weekly.driverId} · week ending ${weekly.weekEnding}`
        : driverId
          ? `${driverId} · week not recorded on Weekly_Settlements`
          : "NOT EVALUATED",
      driverId: driverId || "Not linked",
      weekEnding: weekly?.weekEnding || "Not recorded",
      loadRelevance: canonicalLoadId
        ? `Load ${canonicalLoadId} may contribute proof/holds; it is not the settlement identity.`
        : "No load is in scope.",
      note: "Do not treat Load ID as Settlement ID. Prisma Settlement.id is not used as a /settlements navigation key for demo payroll rows.",
      sourceClass: weeklyPresent ? "AUTHORITATIVE" : "UNSUPPORTED",
    },
    loadTrace: {
      note: "Weekly_Settlements has no contributing-load array. Authoritative load links come from Settlement Holds.loadId and Safety Event linkedLoadId when settlementHold is stored. The current Load File route is navigational only.",
      contributingLoadJoin: loadTraceRows.some((row) => row.relationship === "AUTHORITATIVE") ? "AUTHORITATIVE" : canonicalLoadId ? "NAVIGATIONAL" : "UNSUPPORTED",
      rows: loadTraceRows,
    },
    payrollStatus: payroll?.status || "NO PAYROLL ROW IN SCOPE",
    settlementStatus: weekly?.settlementStatus || "NO WEEKLY SETTLEMENT ROW IN SCOPE",
    driverPaymentStatus: "NO DRIVER PAYMENT RECORD IN THIS LAYER — payroll row status is not payment confirmation",
    approval: weekly?.settlementApprovedBy
      ? `${weekly.settlementApprovedBy}${weekly.settlementApprovalTimestamp ? ` · ${weekly.settlementApprovalTimestamp}` : ""}`
      : "No approval identity stored on the weekly row",
    packetComplete,
    packetNote:
      "settlementPacketComplete is a stored flag on Weekly_Settlements. This panel does not assemble or verify a formal packet document set.",
    calculation,
    inputs,
    readiness,
    holds,
    safetyImpact: {
      status: safetyHolds.length > 0
        ? "HOLD RECORDED ON SAFETY EVENT"
        : mainSafety?.settlementImpact?.trim()
          ? mainSafety.settlementImpact
          : "NO SAFETY SETTLEMENT FLAG",
      note: safetyHolds.length > 0
        ? "Safety Event settlementHold is the hold authority. MainSafety.settlementImpact is copied as text only and is not converted into a hold unless the event flag is true."
        : mainSafety?.settlementImpact?.trim()
          ? `Copied from MainSafety.settlementImpact for ${driverId}. This text is not treated as a settlement hold.`
          : "No Safety Event in this scope has settlementHold=true, and no MainSafety.settlementImpact text is stored.",
      sourceClass: "AUTHORITATIVE",
    },
    evidenceLinks,
    invoices,
    payments,
    factoring,
    payrollBoundary:
      "Paylocity is not connected. Workbook payroll columns are the displayed payroll authority. Future payroll handoff remains BOF inputs → authorized integration → external execution → status returned to BOF. No live submission or payment confirmation exists here.",
    nextAction,
    actions,
  };
}

export function isSettlementRelatedOperatingActivity(
  activity: string,
  processStage?: string | null,
  relatedException?: string | null,
): boolean {
  const token = /\b(SETTLEMENT|INVOICE|PAYROLL|FACTORING|PAYMENT)\b/i;
  return token.test(activity) || token.test(processStage ?? "") || token.test(relatedException ?? "");
}

export type SettlementStatusBucket = {
  status: string;
  count: number;
  sourceClass: SettlementSourceClass;
};

export type SettlementCommandCenterHoldPreview = SettlementHoldRow;

export type SettlementCommandCenterSummary = {
  available: boolean;
  source: string;
  openHolds: number | null;
  pendingWeekly: number | null;
  pendingPayroll: number | null;
  safetySettlementHolds: number | null;
  weeklyRowCount: number | null;
  payrollRowCount: number | null;
  packetCompleteCount: number | null;
  packetNotMarkedCompleteCount: number | null;
  weeklyStatusBuckets: SettlementStatusBucket[];
  payrollStatusBuckets: SettlementStatusBucket[];
  holdPreviews: SettlementCommandCenterHoldPreview[];
  safetyHoldPreviews: SettlementCommandCenterHoldPreview[];
  fleetGross: string;
  fleetNet: string;
  fleetDeductions: string;
  fleetReimbursements: string;
  fleetAdvances: string;
  fleetAdjustments: string;
  readinessFleet: string;
  readinessNote: string;
  calculationNote: string;
  packetNote: string;
  evidenceNote: string;
  workflowNote: string;
  payrollBoundary: string;
  actions: SettlementOperatingCta[];
  note: string;
};

const HOLD_PREVIEW_LIMIT = 8;

function statusBuckets(values: string[]): SettlementStatusBucket[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const status = raw.trim() || "BLANK STORED STATUS";
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([status, count]) => ({ status, count, sourceClass: "DERIVED" as const }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
}

function emptySettlementCommandCenterSummary(source: string, note: string): SettlementCommandCenterSummary {
  return {
    available: false,
    source,
    openHolds: null,
    pendingWeekly: null,
    pendingPayroll: null,
    safetySettlementHolds: null,
    weeklyRowCount: null,
    payrollRowCount: null,
    packetCompleteCount: null,
    packetNotMarkedCompleteCount: null,
    weeklyStatusBuckets: [],
    payrollStatusBuckets: [],
    holdPreviews: [],
    safetyHoldPreviews: [],
    fleetGross: "Unavailable",
    fleetNet: "Unavailable",
    fleetDeductions: "Unavailable",
    fleetReimbursements: "Unavailable",
    fleetAdvances: "Unavailable",
    fleetAdjustments: "Unavailable",
    readinessFleet: "NOT EVALUATED",
    readinessNote:
      "There is no fleet-wide Settlement READY engine. Copied readiness flags live on the Settlement operating layer for a driver/week or load. Command Center does not infer READY from missing information.",
    calculationNote: "Fleet-wide gross and net are not calculated here. Open a driver/week row on /settlements to see stored amounts.",
    packetNote: "Packet completeness is a stored Weekly_Settlements boolean, not a packet document engine.",
    evidenceNote: "Proof remains on the Load File. Command Center does not host a second evidence repository.",
    workflowNote: "Settlement-related process events remain on Load File Process Intelligence. This summary does not synthesize settlement history.",
    payrollBoundary:
      "Paylocity is not connected. Workbook payroll columns remain the displayed payroll authority. This summary does not submit payroll or confirm payment.",
    actions: [
      { label: "Open settlement workspace", href: "/settlements" },
      { label: "Open dispatch command center", href: "/dispatch/command-center" },
      { label: "Open settlement documents", href: "/documents" },
    ],
    note,
  };
}

export function buildSettlementCommandCenterSummary(v3: V3OperationalData | null): SettlementCommandCenterSummary {
  if (!v3) {
    return emptySettlementCommandCenterSummary(
      "Operational workbook not loaded",
      "Fleet-wide settlement amounts are not invented from UI counts. Load Weekly_Settlements / Settlement Holds or open /settlements.",
    );
  }
  const openHoldRows = v3.settlementHolds.filter((hold) => isOpenHoldStatus(hold.status));
  const safetyHoldEvents = v3.safetyEvents.filter((event) => event.settlementHold);
  const holdPreviews: SettlementCommandCenterHoldPreview[] = openHoldRows.slice(0, HOLD_PREVIEW_LIMIT).map((hold) => ({
    id: hold.holdId,
    kind: holdKind(hold.status, hold.managerActionRequired),
    category: hold.holdType || hold.relatedModule || "Settlement hold",
    problem: hold.holdReason || "Hold recorded",
    owner: hold.releaseAuthorizedBy?.trim() || hold.approvedBy?.trim() || "Not recorded",
    whyItMatters: `Workbook Settlement Holds row ${hold.holdId}. Amount ${storedAmount(hold.holdAmount)} is copied, not calculated here.`,
    requiredAction: hold.managerActionRequired ? "Manager action is flagged on the hold row" : "Review settlement hold",
    status: hold.status || "Recorded",
    href: existingSettlementWorkflowHref({ driverId: hold.driverId, loadId: hold.loadId }),
    source: "Workbook Settlement Holds",
    sourceClass: "AUTHORITATIVE",
  }));
  const safetyHoldPreviews: SettlementCommandCenterHoldPreview[] = safetyHoldEvents.slice(0, HOLD_PREVIEW_LIMIT).map((event) => ({
    id: `${event.eventId}-settlement-hold`,
    kind: "hold",
    category: "Safety settlement hold",
    problem: event.details || event.eventType,
    owner: event.coachingAssignedTo?.trim() || "Not recorded",
    whyItMatters: `${event.eventId} records settlementHold=${String(event.settlementHold)}. Amount ${storedAmount(event.settlementHoldAmount)} is copied from the Safety Event.`,
    requiredAction: "Open driver safety / Safety workspace",
    status: event.status || "HOLD RECORDED ON SAFETY EVENT",
    href: event.driverId ? `/drivers/${encodeURIComponent(event.driverId)}/safety` : "/safety",
    source: "Workbook Safety_Events.settlementHold",
    sourceClass: "AUTHORITATIVE",
  }));
  return {
    available: true,
    source: "Workbook Weekly_Settlements, PayrollSettlementDetail, Settlement Holds, Safety_Events.settlementHold",
    openHolds: openHoldRows.length,
    pendingWeekly: v3.weeklySettlements.filter((row) => /pending|hold|review/i.test(row.settlementStatus)).length,
    pendingPayroll: v3.payrollSettlements.filter((row) => /pending|hold/i.test(row.status)).length,
    safetySettlementHolds: safetyHoldEvents.length,
    weeklyRowCount: v3.weeklySettlements.length,
    payrollRowCount: v3.payrollSettlements.length,
    packetCompleteCount: v3.weeklySettlements.filter((row) => row.settlementPacketComplete === true).length,
    packetNotMarkedCompleteCount: v3.weeklySettlements.filter((row) => row.settlementPacketComplete !== true).length,
    weeklyStatusBuckets: statusBuckets(v3.weeklySettlements.map((row) => row.settlementStatus)),
    payrollStatusBuckets: statusBuckets(v3.payrollSettlements.map((row) => row.status)),
    holdPreviews,
    safetyHoldPreviews,
    fleetGross: "Unavailable",
    fleetNet: "Unavailable",
    fleetDeductions: "Unavailable",
    fleetReimbursements: "Unavailable",
    fleetAdvances: "Unavailable",
    fleetAdjustments: "Unavailable",
    readinessFleet: "NOT EVALUATED",
    readinessNote:
      "There is no fleet-wide Settlement READY engine. Copied readiness flags live on the Settlement operating layer for a driver/week or load. Command Center does not infer READY from missing information.",
    calculationNote:
      "Command Center does not sum stored settlement amounts. Gross, adjustments, deductions, reimbursements, advances, and net remain on the driver/week row. Fleet totals are UNAVAILABLE.",
    packetNote:
      "Packet counts are DERIVED from Weekly_Settlements.settlementPacketComplete. They are not packet verification and are not a packet engine.",
    evidenceNote:
      "Proof-of-work, POD, and accessorial evidence remain on the Load File. Open a load or the settlement workspace; this summary does not copy artifacts.",
    workflowNote:
      "Next actions open existing routes. Settlement-related OperatingProcessEvent rows remain on Load File Process Intelligence. This summary does not invent workflow history, exceptions, or corrective actions.",
    payrollBoundary:
      "Paylocity is not connected. Invoice, InvoicePayment, and factoring remain separate from driver/week settlement. PAID is not inferred from counts.",
    actions: [
      { label: "Open settlement workspace", href: "/settlements" },
      { label: "Open dispatch command center", href: "/dispatch/command-center" },
      { label: "Open Safety workspace", href: "/safety" },
      { label: "Open settlement documents", href: "/documents" },
      { label: "Open load files", href: "/loads" },
    ],
    note: "Row counts are DERIVED over stored workbook fields. Hold previews copy AUTHORITATIVE hold rows. Fleet money KPIs are not created.",
  };
}
