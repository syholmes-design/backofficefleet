/**
 * BOF Route Owner:
 * URL: /demo/settlements
 * Type: DEMO / WORKBOOK
 */
import { Suspense } from "react";
import { SettlementsPayrollShell } from "@/components/settlements-payroll/SettlementsPayrollShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DEMO Settlements payroll | BOF",
  description: "Workbook payroll Hold/review — not LIVE Prisma settlement authority",
};

export default function DemoSettlementsPage() {
  return (
    <div className="bof-settlements-payroll-wrap min-h-0">
      <div className="border-b border-amber-500/40 bg-amber-950/90 px-4 py-3 text-sm text-amber-50">
        WORKBOOK / DEMO payroll. Hold/review here is not Prisma Settlement.status. LIVE holds: /settlements
      </div>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
            Loading DEMO settlements workbook...
          </div>
        }
      >
        <SettlementsPayrollShell />
      </Suspense>
    </div>
  );
}
