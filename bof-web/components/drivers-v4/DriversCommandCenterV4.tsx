"use client";

import { DriversRosterTable } from "@/components/drivers/DriversRosterTable";
import { ComplianceDashboardV4 } from "@/components/compliance-v4/ComplianceDashboardV4";
import { DemoPageExplainerById } from "@/components/demo/DemoPageExplainerById";

export function DriversCommandCenterV4() {
  return (
    <div className="space-y-6">
      <DemoPageExplainerById pageId="drivers" />
      {/* Driver Roster Section */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Driver Roster
          </h2>
          <p className="text-slate-400 mt-2">
            Complete driver management with dispatch eligibility, document readiness, and compliance status
          </p>
        </div>
        <DriversRosterTable />
      </section>

      {/* Compliance Action Queue Section */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Compliance Actions & Document Review
          </h2>
          <p className="text-slate-400 mt-2">
            Detailed compliance issues and required actions - no more vague &quot;Needs Review&quot; without explanation
          </p>
        </div>
        <ComplianceDashboardV4 />
      </section>
    </div>
  );
}
