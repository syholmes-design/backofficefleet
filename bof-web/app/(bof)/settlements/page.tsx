import { Suspense } from "react";
import { SettlementsPayrollPageClient } from "@/components/settlements-payroll/SettlementsPayrollPageClient";

export const metadata = {
  title: "Settlements | BOF",
  description: "Payroll operations, export readiness, and settlement detail",
};

export default function SettlementsPage() {
  return (
    <div className="bof-page">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
            Loading settlements…
          </div>
        }
      >
        <SettlementsPayrollPageClient />
      </Suspense>
    </div>
  );
}
