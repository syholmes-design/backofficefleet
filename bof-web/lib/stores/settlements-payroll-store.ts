"use client";

import { create } from "zustand";
import { getBofData } from "@/lib/load-bof-data";
import {
  bootstrapPayrollFromBof,
  recomputeSettlementTotals,
} from "@/lib/settlements-payroll-bootstrap";
import type {
  Settlement,
  SettlementLine,
  Load,
} from "@/types/settlements-payroll";

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

type Store = {
  settlements: Settlement[];
  lines: SettlementLine[];
  loads: Load[];
  generatedDocsBySettlementId: Record<
    string,
    { summaryUrl?: string; holdUrl?: string; insuranceUrl?: string }
  >;
  exportBatchSeq: number;
  drawerSettlementId: string | null;

  openDrawer: (settlement_id: string) => void;
  closeDrawer: () => void;

  markReadyForExport: (settlement_id: string) => string | null;
  placeHold: (settlement_id: string, reason?: string) => void;
  clearHold: (settlement_id: string) => void;
  addLine: (settlement_id: string) => void;
  setGeneratedDocument: (
    settlement_id: string,
    kind: "summary" | "hold" | "insurance",
    url: string
  ) => void;
  exportSelectedToPayroll: (settlement_ids: string[]) => string;
};

export const useSettlementsPayrollStore = create<Store>((set, get) => ({
  ...initialState(),
  generatedDocsBySettlementId: {},
  drawerSettlementId: null,

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
    set((st) => ({
      settlements: st.settlements.map((x) =>
        x.settlement_id === settlement_id
          ? {
              ...x,
              settlement_hold: true,
              settlement_hold_reason:
                reason?.trim() || "Manual settlement hold (payroll review)",
            }
          : x
      ),
    })),

  clearHold: (settlement_id) =>
    set((st) => ({
      settlements: st.settlements.map((x) =>
        x.settlement_id === settlement_id
          ? { ...x, settlement_hold: false, settlement_hold_reason: null }
          : x
      ),
    })),

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
}));

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
