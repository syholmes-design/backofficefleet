/**
 * BOF Route Owner:
 * URL: /dispatch/intake
 * Type: DISPATCH
 * Primary component: DispatchIntakePage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { Suspense } from "react";

import { DispatchIntakePageClient } from "@/components/dispatch/DispatchIntakePageClient";

export const metadata = {
  title: "Trip Packet Intake | Dispatch | BOF",
  description:
    "Dispatch trip-packet intake for parser upload, client request review, load document control, role visibility, and signatures.",
};

export default function DispatchIntakePage() {
  return (
    <Suspense
      fallback={
        <div className="bof-page bof-dispatch-page-wrap">
          <p className="text-sm text-slate-400">Loading dispatch intake...</p>
        </div>
      }
    >
      <DispatchIntakePageClient />
    </Suspense>
  );
}
