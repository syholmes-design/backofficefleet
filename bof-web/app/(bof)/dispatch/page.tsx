import { Suspense } from "react";
import { DispatchShell } from "@/components/dispatch/DispatchShell";

export const metadata = {
  title: "Dispatch | BOF",
  description: "Dispatch board, assignments, exceptions, and settlement readiness",
};

export default function DispatchPage() {
  return (
    <div className="bof-page bof-dispatch-page-wrap">
      <Suspense
        fallback={
          <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-950 text-sm text-slate-400">
            Loading dispatch…
          </div>
        }
      >
        <DispatchShell />
      </Suspense>
    </div>
  );
}
