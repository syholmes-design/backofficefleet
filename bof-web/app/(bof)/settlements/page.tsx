/**
 * BOF Route Owner:
 * URL: /settlements
 * Type: SETTLEMENTS
 * Primary component: SettlementsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { Suspense } from "react";
import { SettlementsV3Simple } from "@/components/settlements-v3/SettlementsV3Simple";

export const metadata = {
  title: "Settlements Command Center | BOF",
  description: "Driver pay, deductions, reimbursements, and settlement readiness from source-of-truth data",
};

export default function SettlementsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
          Loading settlements…
        </div>
      }
    >
      <SettlementsV3Simple />
    </Suspense>
  );
}
