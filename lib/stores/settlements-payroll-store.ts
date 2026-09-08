"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getBofData } from "@/lib/load-bof-data";
import { resolveExistingSettlementWorkflowTarget } from "@/lib/load-file-proof-settlement-display";
import {
  bootstrapPayrollFromBof,
  recomputeSettlementTotals,
} from "@/lib/settlements-payroll-bootstrap";
import type {
  Settlement,
  SettlementLine,
  SettlementStatus,
  Load,
} from "@/types/settlements-payroll";

type HoldOverride = {
  settlement_hold: boolean;
  settlement_hold_reason: string | null;
};

function initialState() {
  const data = getBofData();
  const { settlements: s0, lines: l0, loads } = bootstrapPayrollFromBof(data);
  const settlements = s0.map((s) => recomputeSettlementTotals(s, l0));
  return { settlements, lines: l0, loads, exportBatchSeq: 1024 };
}

function recalcSettlements(
  settlements: Settlement[],
  lines: SettlementLine[]
): Settlement[] {
  return settlements.map((s) => recomputeSettlementTotals(s, lines));
}

function withHoldOverrides(
  settlements: Settlement[],
  overrides: Record<string, HoldOverride>
): Settlement[] {
  return settlements.map((s) => {
    const override = overrides[s.settlement_id];
    return override ? { ...s, ...override } : s;
  });
}

type Store = {
  settlements: Settlement[];
  lines: SettlementLine[];
  loads: Load[];
  generatedDocsBySettlementId: Record<
    string,
    { summaryUrl?: string; holdUrl?: string; insuranceUrl?: string; invoiceUrl?: string }
  >;
  exportBatchSeq: number;
  drawerSettlementId: string | null;
  holdOverrides: Record<string, HoldOverride>;

  openDrawer: (settlement_id: string) => void;
  closeDrawer: () => void;

  markReadyForExport: (settlement_id: string) => string | null;
  placeHold: (settlement_id: string, reason?: string) => void;
  placeHoldFromLoadProof: (loadId: string, driverId?: string | null, reason?: string) => string | null;
  clearHold: (settlement_id: string) => void;
  addLine: (settlement_id: string) => void;
  setGeneratedDocument: (
    settlement_id: string,
    kind: "summary" | "hold" | "insurance" | "invoice",
    url: string
  ) => void;
  exportSelectedToPayroll: (settlement_ids: string[]) => string;
  /** Demo: clear hold / proof gate friction for payroll review rehearsal */
  markSettlementReviewedDemo: (settlement_id: string) => void;
};

export const useSettlementsPayrollStore = create<Store>()(
  persist(
    (set, get) => ({
  ...initialState(),
  generatedDocsBySettlementId: {},
  drawerSettlementId: null,
  holdOverrides: {},

  openDrawer: (settlement_id) => set({ drawerSettlementId: settlement_id }),

  closeDrawer: () => set({ drawerSettlementId: null }),

  markReadyForExport: (settlement_id) => {
    const { settlements, lines } = get();
    const s = settlements.find((x) => x.settlement_id === settlement_id);
    if (!s) return "Settlement not found.";
    if (s.status === "Exported") return "Already exported.";
    if (s.settlement_hold) return "Clear settlement hold before marking ready.";
    const n = lines.filter((l) => l.settlement_id === settlement_id).length;
    if (n === 0) return "Add at least one settlement line before export.";
    set({
      settlements: settlements.map((x) =>
        x.settlement_id === settlement_id
          ? { ...x, status: "Ready for Export" as const }
          : x
      ),
    });
    return null;
  },

      placeHold: (settlement_id, reason) =>
        set((st) => {
          const settlement_hold_reason =
            reason?.trim() || "Manual settlement hold (payroll review)";
          const holdOverrides = {
            ...st.holdOverrides,
            [settlement_id]: { settlement_hold: true, settlement_hold_reason },
          };
          return {
            holdOverrides,
            settlements: withHoldOverrides(
              st.settlements.map((x) =>
                x.settlement_id === settlement_id
                  ? { ...x, settlement_hold: true, settlement_hold_reason }
                  : x
              ),
              holdOverrides
            ),
          };
        }),

      placeHoldFromLoadProof: (loadId, driverId, reason) => {
        const { settlements, lines } = get();
        const target = resolveExistingSettlementWorkflowTarget({
          settlements,
          lines,
          driverId,
          loadId,
        });
        if (!target.settlementId) return null;
        get().placeHold(
          target.settlementId,
          reason?.trim() || `Documentation hold from load ${loadId}`
        );
        return target.settlementId;
      },

      clearHold: (settlement_id) =>
        set((st) => {
          const holdOverrides = {
            ...st.holdOverrides,
            [settlement_id]: { settlement_hold: false, settlement_hold_reason: null },
          };
          return {
            holdOverrides,
            settlements: withHoldOverrides(
              st.settlements.map((x) =>
                x.settlement_id === settlement_id
                  ? { ...x, settlement_hold: false, settlement_hold_reason: null }
                  : x
              ),
              holdOverrides
            ),
          };
        }),

  addLine: (settlement_id) => {
    const amtStr = window.prompt("Line amount (positive number):", "100");
    if (!amtStr) return;
    const amt = parseFloat(amtStr);
    if (!Number.isFinite(amt) || amt <= 0) {
      window.alert("Invalid amount.");
      return;
    }
    const type =
      window.prompt("Type: type E for earnings, D for deduction:", "E")
        ?.toUpperCase() === "D"
        ? ("Deduction" as const)
        : ("Earnings" as const);
    const desc =
      window.prompt("Description:", "Manual adjustment")?.trim() ||
      "Manual adjustment";
    const id = `LINE-${settlement_id}-${Date.now()}`;
    set((st) => {
      const lines = [
        ...st.lines,
        {
          line_id: id,
          settlement_id,
          type,
          description: desc,
          amount: amt,
          load_id: null,
          proof_status: null,
        },
      ];
      return {
        lines,
        settlements: recalcSettlements(st.settlements, lines),
      };
    });
  },

  setGeneratedDocument: (settlement_id, kind, url) =>
    set((st) => {
      const prev = st.generatedDocsBySettlementId[settlement_id] ?? {};
          const next =
            kind === "summary"
              ? { ...prev, summaryUrl: url }
              : kind === "hold"
                ? { ...prev, holdUrl: url }
                : kind === "invoice"
                  ? { ...prev, invoiceUrl: url }
                  : { ...prev, insuranceUrl: url };
      return {
        generatedDocsBySettlementId: {
          ...st.generatedDocsBySettlementId,
          [settlement_id]: next,
        },
      };
    }),

  exportSelectedToPayroll: (settlement_ids) => {
    const batch = `BATCH-${get().exportBatchSeq}`;
    set((st) => ({
      exportBatchSeq: st.exportBatchSeq + 1,
      settlements: st.settlements.map((x) =>
        settlement_ids.includes(x.settlement_id) &&
        x.status === "Ready for Export"
          ? {
              ...x,
              status: "Exported" as const,
              export_reference: batch,
            }
          : x
      ),
    }));
    return batch;
  },

      markSettlementReviewedDemo: (settlement_id) =>
        set((st) => {
          const holdOverrides = {
            ...st.holdOverrides,
            [settlement_id]: { settlement_hold: false, settlement_hold_reason: null },
          };
          return {
            holdOverrides,
            settlements: withHoldOverrides(
              st.settlements.map((x) =>
                x.settlement_id === settlement_id
                  ? {
                      ...x,
                      settlement_hold: false,
                      settlement_hold_reason: null,
                      status:
                        x.status === "Exported"
                          ? x.status
                          : ("Draft" as SettlementStatus),
                    }
                  : x
              ),
              holdOverrides
            ),
          };
        }),
    }),
    {
      name: "bof-settlements-payroll-hold-overrides",
      partialize: (state) => ({ holdOverrides: state.holdOverrides }),
      merge: (persisted, current) => {
        const holdOverrides =
          (persisted as { holdOverrides?: Record<string, HoldOverride> } | undefined)
            ?.holdOverrides ?? {};
        return {
          ...current,
          holdOverrides,
          settlements: withHoldOverrides(current.settlements, holdOverrides),
        };
      },
    }
  )
);

export function countByStatus(
  settlements: Settlement[],
  st: Settlement["status"]
): number {
  return settlements.filter((s) => s.status === st).length;
}

export function sumNetPendingExport(settlements: Settlement[]): number {
  return settlements
    .filter((s) => s.status !== "Exported")
    .reduce((a, s) => a + s.net_pay, 0);
}
