"use client";

import Link from "next/link";
import { useState } from "react";
import { useSettlementsPayrollStore } from "@/lib/stores/settlements-payroll-store";
import type { SettlementsPayrollNavId } from "@/types/settlements-payroll";
import { SettlementsDashboardScreen } from "./SettlementsDashboardScreen";
import { ExportPayrollScreen } from "./ExportPayrollScreen";
import { SettlementDetailDrawer } from "./SettlementDetailDrawer";

const tabs: { id: SettlementsPayrollNavId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "export", label: "Export to payroll" },
];

export function SettlementsPayrollShell() {
  const [nav, setNav] = useState<SettlementsPayrollNavId>("dashboard");
  const drawerSettlementId = useSettlementsPayrollStore((s) => s.drawerSettlementId);
  const closeDrawer = useSettlementsPayrollStore((s) => s.closeDrawer);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-3">
        <nav className="flex gap-1" aria-label="Settlements payroll">
          {tabs.map((t) => {
            const sel = nav === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setNav(t.id)}
                className={[
                  "rounded-md px-3 py-2 text-sm font-medium",
                  sel
                    ? "bg-teal-900/45 text-teal-50 ring-1 ring-teal-600/50"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
        <Link
          href="/settlements/workbook"
          className="text-xs font-medium text-teal-400 hover:text-teal-300"
        >
          Workbook grid (legacy) →
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        {nav === "dashboard" && <SettlementsDashboardScreen />}
        {nav === "export" && <ExportPayrollScreen />}
      </div>
      <SettlementDetailDrawer
        settlementId={drawerSettlementId}
        open={Boolean(drawerSettlementId)}
        onClose={closeDrawer}
      />
    </div>
  );
}
