/**
 * BOF Route Owner:
 * URL: /demo/dispatch
 * Type: DEMO
 */
import { Suspense } from "react";
import { DispatchShell } from "@/components/dispatch/DispatchShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DEMO Dispatch | BOF",
  description: "DEMO dispatch board using BOF JSON — not LIVE Prisma authority",
};

export default function DemoDispatchPage() {
  return (
    <div className="bof-page bof-dispatch-page-wrap">
      <Suspense
        fallback={
          <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-950 text-sm text-slate-400">
            Loading DEMO dispatch...
          </div>
        }
      >
        <DispatchShell fleetId={null} drivers={[]} driverOperationalSummaries={[]} sandbox />
      </Suspense>
    </div>
  );
}
