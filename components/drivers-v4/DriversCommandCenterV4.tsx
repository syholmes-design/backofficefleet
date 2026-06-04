"use client";

import { DriversRosterTable } from "@/components/drivers/DriversRosterTable";
import { ComplianceDashboardV4 } from "@/components/compliance-v4/ComplianceDashboardV4";
import { DemoPageExplainerById } from "@/components/demo/DemoPageExplainerById";

export function DriversCommandCenterV4() {
  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Driver readiness</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Who can safely take the next load?</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          This view turns driver files into dispatch decisions: expired credentials, missing documents,
          acknowledgments, compliance incidents, and eligibility blockers are visible before a planner assigns work.
        </p>
        <div className="mt-4">
          <DemoPageExplainerById pageId="drivers" />
        </div>
      </header>

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
