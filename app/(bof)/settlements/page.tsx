/**
 * BOF Route Owner:
 * URL: /settlements
 * Type: SETTLEMENTS
 * Primary component: SettlementsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { Suspense } from "react";
import { SettlementsPayrollPageClient } from "@/components/settlements-payroll/SettlementsPayrollPageClient";

export const metadata = {
  title: "Settlements | BOF",
  description: "Stored live settlement records and proof holds. This page is not driver-week payroll.",
};

export default function SettlementsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
          Loading settlements...
        </div>
      }
    >
      <SettlementsPayrollPageClient />
    </Suspense>
  );
}
