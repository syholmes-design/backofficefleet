import type { BofData } from "@/lib/load-bof-data";
import { enrichSettlementRows } from "@/lib/executive-layer";
import {
  getLoadProofItems,
  proofBlockingCount,
  proofItemsForDriverLoads,
} from "@/lib/load-proof";
import { getBookedOrApprovedBackhaulForDriver } from "@/lib/backhaul-opportunity-engine";
import { getSafetyBonusByDriverId } from "@/lib/safety-scorecard";
import type {
  Load,
  Settlement,
  SettlementLine,
  SettlementStatus,
} from "@/types/settlements-payroll";

export type RawSettlement = NonNullable<BofData["settlements"]>[number] & {
  lifeInsuranceAbove50k?: number;
  safetyBonus?: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function scalePctAmount(previousAmount: number, oldGross: number, newGross: number): number {
  if (!previousAmount || !Number.isFinite(previousAmount)) return 0;
  if (!oldGross || oldGross <= 0) return previousAmount;
  return round2((previousAmount / oldGross) * newGross);
}

function customerFromOrigin(origin: string): string {
  const part = origin.split(" - ")[0]?.trim() || origin;
  return part.length > 56 ? `${part.slice(0, 53)}…` : part;
}

function bolPodProofSummary(
  data: BofData,
  loadId: string
): { proof_status: Load["proof_status"]; bolPodIssue: boolean } {
  const items = getLoadProofItems(data, loadId);
  const types = ["BOL", "Signed BOL", "POD"] as const;
  let worst: Load["proof_status"] = "Complete";
  let bolPodIssue = false;
  for (const t of types) {
    const it = items.find((i) => i.type === t);
    if (!it) continue;
    if (it.status === "Missing") {
      worst = "Missing";
      bolPodIssue = true;
    } else if (it.status !== "Complete" && it.status !== "Not required") {
      if (worst === "Complete") worst = "Incomplete";
      bolPodIssue = true;
    }
  }
  return { proof_status: worst, bolPodIssue };
}

export function buildPayrollLoadSnapshots(data: BofData): Load[] {
  return data.loads.map((l) => {
    const items = getLoadProofItems(data, l.id);
    const blocking = proofBlockingCount(items);
    const { proof_status, bolPodIssue } = bolPodProofSummary(data, l.id);
    const insurance_claim_needed =
      Boolean(l.dispatchExceptionFlag) &&
      (l.sealStatus === "Mismatch" || l.podStatus === "pending");
    return {
      load_id: l.id,
      customer_name: customerFromOrigin(l.origin),
      status: l.status,
      proof_status,
      settlement_hold: blocking > 0,
      settlement_hold_reason:
        blocking > 0
          ? `${blocking} proof item(s) blocking payment on this load`
          : bolPodIssue && proof_status !== "Complete"
            ? "BOL / POD stack incomplete — review before release"
            : null,
      exception_flag: Boolean(l.dispatchExceptionFlag),
      insurance_claim_needed,
    };
  });
}

function driverHasProofBlockers(data: BofData, driverId: string): boolean {
  return proofItemsForDriverLoads(data, driverId).some((x) => x.blocking > 0);
}

function workbookHold(s: RawSettlement): boolean {
  if (s.status === "On Hold") return true;
  const pr = (s.pendingReason ?? "").toLowerCase();
  return pr.includes("awaiting receipts") || pr.includes("payroll hold");
}

function mapToSettlementStatus(
  data: BofData,
  s: RawSettlement
): SettlementStatus {
  if (s.status === "Paid") return "Exported";
  const hold = workbookHold(s);
  const blockers = driverHasProofBlockers(data, s.driverId);
  if (
    s.status === "Pending" &&
    !hold &&
    s.exportStatus === "READY" &&
    !blockers
  ) {
    return "Ready for Export";
  }
  return "Draft";
}

function periodForIndex(i: number): { start: string; end: string } {
  const starts = ["2026-03-16", "2026-03-01", "2026-02-16"];
  const ends = ["2026-03-31", "2026-03-15", "2026-02-28"];
  return {
    start: starts[i % starts.length]!,
    end: ends[i % ends.length]!,
  };
}

function exportRefFor(s: RawSettlement): string | null {
  if (s.status !== "Paid") return null;
  return `WORKBOOK-${String(s.exportStatus ?? "EXPORTED")}-${s.settlementId ?? s.driverId}`;
}

export function bootstrapPayrollFromBof(data: BofData): {
  settlements: Settlement[];
  lines: SettlementLine[];
  loads: Load[];
} {
  const loads = buildPayrollLoadSnapshots(data);
  if (!("settlements" in data) || !Array.isArray(data.settlements)) {
    return { settlements: [], lines: [], loads };
  }

  const enriched = enrichSettlementRows(data);
  const settlements: Settlement[] = [];
  const lines: SettlementLine[] = [];

  enriched.forEach((row, idx) => {
    const s = row as unknown as RawSettlement;
    const period = periodForIndex(idx);
    const hold = workbookHold(s);
    const safetyBonus = getSafetyBonusByDriverId(s.driverId);
    const oldGrossBase = s.grossPay || s.baseEarnings + s.backhaulPay;
    const workbookBackhaulPay = s.backhaulPay;
    const adjustedGross = round2(s.baseEarnings + workbookBackhaulPay + safetyBonus);
    const status = mapToSettlementStatus(data, s);

    const settlement_id = s.settlementId ?? `GEN-${s.driverId}`;
    settlements.push({
      settlement_id,
      driver_id: s.driverId,
      driver_name: row.name,
      period_start: period.start,
      period_end: period.end,
      total_gross_pay: adjustedGross,
      total_deductions: s.deductions,
      net_pay: s.netPay,
      status,
      export_reference: exportRefFor(s),
      settlement_hold: hold,
      settlement_hold_reason: hold ? (s.pendingReason || "Workbook hold") : null,
    });

    const driverLoads = data.loads.filter((l) => l.driverId === s.driverId);
    const primaryLoad = driverLoads[0];
    const secondaryLoad = driverLoads[1];

    let lineIdx = 0;
    const pushLine = (line: Omit<SettlementLine, "line_id">) => {
      lines.push({
        ...line,
        line_id: `LINE-${settlement_id}-${++lineIdx}`,
      });
    };

    pushLine({
      settlement_id,
      type: "Earnings",
      description: "Base earnings (Payroll_Clean)",
      amount: s.baseEarnings,
      load_id: primaryLoad?.id ?? null,
      proof_status: primaryLoad
        ? bolPodProofSummary(data, primaryLoad.id).proof_status
        : null,
      exception_flag: primaryLoad?.dispatchExceptionFlag,
    });

    const backhaulOpp = getBookedOrApprovedBackhaulForDriver(data, s.driverId);
    const modeledBackhaulPay = backhaulOpp?.driverBackhaulPay ?? 0;
    const effectiveBackhaulPay = Math.max(workbookBackhaulPay, modeledBackhaulPay);

    if (effectiveBackhaulPay > 0) {
      pushLine({
        settlement_id,
        type: "Earnings",
        description: backhaulOpp
          ? `Backhaul pay (${backhaulOpp.opportunityId})`
          : "Backhaul pay",
        amount: effectiveBackhaulPay,
        load_id: backhaulOpp?.linkedLoadId ?? secondaryLoad?.id ?? primaryLoad?.id ?? null,
        proof_status:
          backhaulOpp?.linkedLoadId
            ? bolPodProofSummary(data, backhaulOpp.linkedLoadId).proof_status
            : secondaryLoad != null
              ? bolPodProofSummary(data, secondaryLoad.id).proof_status
              : primaryLoad
                ? bolPodProofSummary(data, primaryLoad.id).proof_status
                : null,
        exception_flag: backhaulOpp
          ? data.loads.find((l) => l.id === backhaulOpp.linkedLoadId)
              ?.dispatchExceptionFlag
            : primaryLoad
              ? primaryLoad.dispatchExceptionFlag
              : undefined,
      });
    }

    if (safetyBonus > 0) {
      pushLine({
        settlement_id,
        type: "Earnings",
        description: "Safety bonus (Safety & Compliance)",
        amount: safetyBonus,
        load_id: null,
        proof_status: null,
      });
    }

    if (s.fuelReimbursement > 0) {
      pushLine({
        settlement_id,
        type: "Earnings",
        description: "Fuel reimbursement",
        amount: s.fuelReimbursement,
        load_id: primaryLoad?.id ?? null,
        proof_status: primaryLoad
          ? bolPodProofSummary(data, primaryLoad.id).proof_status
          : null,
        exception_flag: primaryLoad?.dispatchExceptionFlag,
      });
    }

    const rawDeductionSpecs: [string, number][] = [
      ["FICA", s.fica],
      ["OASDI", s.oasdi],
      ["Federal withholding", s.federalWithholding],
      ["State withholding", s.stateWithholding],
      ["SDI", s.sdi],
      ["FM leave", s.fmLeave],
      ["Family support", s.familySupport],
      ["Insurance premiums", s.insurancePremiums],
      ["Credit union / savings club", s.creditUnionSavingsClub],
      ["401(k) contribution", s.contribution401k],
      ["HSA/FSA health", s.hsaFsaHealthDeduction],
      ["Health insurance premiums", s.healthInsurancePremiums],
      ["Life insurance (>50k)", s.lifeInsuranceAbove50k],
    ];

    const deductionSpecs: [string, number][] = [
      [
        "FICA",
        scalePctAmount(s.fica, oldGrossBase, adjustedGross),
      ],
      [
        "OASDI",
        scalePctAmount(s.oasdi, oldGrossBase, adjustedGross),
      ],
      [
        "Federal withholding",
        scalePctAmount(s.federalWithholding, oldGrossBase, adjustedGross),
      ],
      [
        "State withholding",
        scalePctAmount(s.stateWithholding, oldGrossBase, adjustedGross),
      ],
      [
        "SDI",
        scalePctAmount(s.sdi, oldGrossBase, adjustedGross),
      ],
      [
        "FM leave",
        scalePctAmount(s.fmLeave, oldGrossBase, adjustedGross),
      ],
      ["Family support", s.familySupport],
      ["Insurance premiums", s.insurancePremiums],
      ["Credit union / savings club", s.creditUnionSavingsClub],
      [
        "401(k) contribution",
        scalePctAmount(s.contribution401k, oldGrossBase, adjustedGross),
      ],
      ["HSA/FSA health", s.hsaFsaHealthDeduction],
      ["Health insurance premiums", s.healthInsurancePremiums],
      ["Life insurance (>50k)", s.lifeInsuranceAbove50k],
    ];

    for (const [label, amt] of deductionSpecs) {
      if (amt && amt > 0) {
        pushLine({
          settlement_id,
          type: "Deduction",
          description: label,
          amount: amt,
          load_id: null,
          proof_status: null,
        });
      }
    }

    const originalDeductionSum = rawDeductionSpecs.reduce((a, [, amt]) => a + (amt || 0), 0);
    const carryThroughRemainder = round2(s.deductions - originalDeductionSum);
    const remainder = round2(carryThroughRemainder);
    if (remainder > 0.005) {
      pushLine({
        settlement_id,
        type: "Deduction",
        description: "Other deductions (workbook rollup)",
        amount: remainder,
        load_id: null,
        proof_status: null,
      });
    }
  });

  return { settlements, lines, loads };
}

export function recomputeSettlementTotals(
  settlement: Settlement,
  lines: SettlementLine[]
): Settlement {
  const mine = lines.filter((l) => l.settlement_id === settlement.settlement_id);
  let gross = 0;
  let ded = 0;
  for (const l of mine) {
    if (l.type === "Earnings") gross += l.amount;
    else ded += l.amount;
  }
  const net = Math.round((gross - ded) * 100) / 100;
  return {
    ...settlement,
    total_gross_pay: gross,
    total_deductions: ded,
    net_pay: net,
  };
}

export function settlementHasProofOrExceptionIssues(
  data: BofData,
  settlementId: string,
  lines: SettlementLine[],
  loads: Load[]
): { recommendHold: boolean; messages: string[] } {
  const messages: string[] = [];
  const loadIds = new Set(
    lines
      .filter((l) => l.settlement_id === settlementId && l.load_id)
      .map((l) => l.load_id as string)
  );
  for (const id of loadIds) {
    const snap = loads.find((x) => x.load_id === id);
    if (!snap) continue;
    const { bolPodIssue } = bolPodProofSummary(data, id);
    if (bolPodIssue) {
      messages.push(
        `${id}: BOL/POD proof incomplete or missing — verify load proof stack`
      );
    }
    if (snap.proof_status !== "Complete") {
      messages.push(`${id}: Proof status ${snap.proof_status}`);
    }
    if (snap.exception_flag) {
      messages.push(`${id}: Dispatch exception flag set — resolve before export`);
    }
    if (snap.insurance_claim_needed) {
      messages.push(`${id}: Insurance / claim path active — coordinate with claims`);
    }
  }
  return {
    recommendHold: messages.length > 0,
    messages,
  };
}
