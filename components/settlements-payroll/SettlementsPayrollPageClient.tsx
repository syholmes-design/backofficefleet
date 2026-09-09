"use client";

import { LiveOperatingSpinePanel } from "@/components/operations/LiveOperatingSpinePanel";
import { SettlementsPayrollShell } from "./SettlementsPayrollShell";

export function SettlementsPayrollPageClient() {
  return (
    <div className="bof-settlements-payroll-wrap min-h-0">
      <div className="px-4 pt-3">
        <LiveOperatingSpinePanel title="LIVE settlement holds from proof rejection" />
      </div>
      <SettlementsPayrollShell />
    </div>
  );
}
