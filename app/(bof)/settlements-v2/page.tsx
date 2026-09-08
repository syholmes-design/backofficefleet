/**
 * BOF Route Owner:
 * URL: /settlements-v2
 * Type: SETTLEMENTS_V2
 * Primary component: SettlementsV2Page
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { Suspense } from "react";
import { SettlementsV2Page } from "@/components/settlements-v2/SettlementsV2Page";

export const metadata = {
  title: "Settlements v2 Preview | BOF",
  description: "Preview of the next-generation settlements page with unified accounting templates, driver settlements table, and settlement preview sidebar",
};

export default function SettlementsV2Route() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
          Loading settlements v2…
        </div>
      }
    >
      <p className="border-b border-amber-800/50 bg-amber-950/40 px-4 py-2 text-center text-xs font-semibold text-amber-100">
        REFERENCE / DEMO preview. Canonical driver-week payroll is <a className="underline" href="/settlements">/settlements</a>.
      </p>
      <SettlementsV2Page />
    </Suspense>
  );
}
