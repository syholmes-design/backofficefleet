/**
 * BOF Route Owner:
 * URL: /dispatch-v2
 * Type: DISPATCH V2
 * Primary component: DispatchV2Page
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { Suspense } from "react";
import { DispatchV2Page } from "@/components/dispatch-v2/DispatchV2Page";

export const metadata = {
  title: "Dispatch Board v2 | BOF",
  description: "Advanced dispatch board with pre-trip packets, photo documentation, and compliance workflows",
};

export default function DispatchV2Route() {
  return (
    <div className="bof-page bof-dispatch-v2-page-wrap min-h-screen bg-slate-950">
      <Suspense
        fallback={
          <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-950 text-sm text-slate-400">
            Loading Dispatch Board v2…
          </div>
        }
      >
        <DispatchV2Page />
      </Suspense>
    </div>
  );
}
