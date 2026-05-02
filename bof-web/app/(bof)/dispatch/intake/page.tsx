import { Suspense } from "react";
import { DispatchIntakePageClient } from "@/components/dispatch/DispatchIntakePageClient";

export const metadata = {
  title: "Load Intake | Dispatch | BOF",
  description:
    "Canonical BOF load intake inside Dispatch — manual, upload, client request, review, save to loads and sync dispatch.",
};

export default function DispatchIntakePage() {
  return (
    <Suspense
      fallback={
        <div className="bof-page bof-dispatch-page-wrap">
          <p className="text-sm text-slate-400">Loading dispatch intake…</p>
        </div>
      }
    >
      <DispatchIntakePageClient />
    </Suspense>
  );
}
