"use client";

import { useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  buildDemoEquipmentScenario,
  DEMO_SCENARIO_PRESETS,
  NORMAL_DEMO_SCENARIO,
  type DemoEquipmentScenarioPreset,
  type DemoEquipmentScenarioState,
} from "@/lib/demo-equipment-scenario";

const PRESET_KEYS: DemoEquipmentScenarioPreset[] = ["normal", "capacity", "maintenance", "recovery"];

function labelize(value: string): string {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

export function EquipmentScenarioDemoClient() {
  const { data } = useBofDemoData();
  const [scenario, setScenario] = useState<DemoEquipmentScenarioState>(NORMAL_DEMO_SCENARIO);
  const result = useMemo(() => buildDemoEquipmentScenario(data, scenario), [data, scenario]);

  function updateNumber(key: keyof DemoEquipmentScenarioState, value: string) {
    setScenario((current) => ({ ...current, [key]: Number(value) }));
  }

  function applyPreset(key: DemoEquipmentScenarioPreset) {
    setScenario({ ...DEMO_SCENARIO_PRESETS[key].state });
  }

  return (
    <div className="bof-page">
      <section className="rounded-2xl border border-teal-400/30 bg-slate-950 p-6 shadow-2xl shadow-black/25 md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-teal-300">DEMO MODE · What-if operations</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.62fr] lg:items-end">
          <div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
              What happens when operations change?
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              Change a small number of operating conditions and BOF will show the consequence through the same Equipment
              readiness and dispatchability logic used across the demo.
            </p>
          </div>
          <div className="rounded-xl border border-teal-400/30 bg-teal-400/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-200">Controlled demonstration</p>
            <p className="mt-3 text-sm leading-6 text-teal-50">
              This is a DEMO-only projection. It does not create or change live records.
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-teal-300">Source: DEMO_ONLY</p>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="scenario-presets">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Prepared scenarios</p>
            <h2 id="scenario-presets" className="mt-2 text-3xl font-black text-white">Choose the operating moment</h2>
          </div>
          <button
            type="button"
            onClick={() => setScenario({ ...NORMAL_DEMO_SCENARIO })}
            className="rounded-lg border border-amber-300/50 px-4 py-2 text-sm font-black text-amber-100 hover:bg-amber-300/10"
          >
            Reset scenario
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PRESET_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-left transition hover:border-teal-400/60 hover:bg-slate-900"
            >
              <span className="block text-base font-black text-white">{DEMO_SCENARIO_PRESETS[key].label}</span>
              <span className="mt-2 block text-xs leading-5 text-slate-400">
                {key === "normal" && "Start with the canonical demo operating picture."}
                {key === "capacity" && "Reduce people and equipment while demand rises."}
                {key === "maintenance" && "Take two canonical assets into a maintenance hold."}
                {key === "recovery" && "Resolve the hold and restore the normal picture."}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.7fr_1.3fr]">
        <section className="rounded-2xl border border-slate-700 bg-slate-950 p-6" aria-labelledby="scenario-controls">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Operating conditions</p>
          <h2 id="scenario-controls" className="mt-2 text-2xl font-black text-white">Change the scenario</h2>
          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-bold text-slate-300">
              Available drivers
              <input type="number" min={0} max={data.drivers.length} value={scenario.availableDriverLimit} onChange={(event) => updateNumber("availableDriverLimit", event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-white" />
              <span className="text-xs font-normal text-slate-500">Existing demo drivers available for assignment.</span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-300">
              Available equipment
              <input type="number" min={0} max={25} value={scenario.availableEquipmentLimit} onChange={(event) => updateNumber("availableEquipmentLimit", event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-white" />
              <span className="text-xs font-normal text-slate-500">Target capacity across canonical T-101 through T-125.</span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-300">
              Equipment placed OOS
              <input type="number" min={0} max={25} value={scenario.equipmentOosCount} onChange={(event) => updateNumber("equipmentOosCount", event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-white" />
              <span className="text-xs font-normal text-slate-500">The first available canonical assets are affected deterministically.</span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-300">
              Maintenance holds
              <input type="number" min={0} max={25} value={scenario.maintenanceHoldCount} onChange={(event) => updateNumber("maintenanceHoldCount", event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-white" />
              <span className="text-xs font-normal text-slate-500">Adds a DEMO-only maintenance blocker to canonical assets.</span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-300">
              Open load demand adjustment
              <input type="number" min={-data.loads.length} max={data.loads.length} value={scenario.loadDemandAdjustment} onChange={(event) => updateNumber("loadDemandAdjustment", event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-white" />
              <span className="text-xs font-normal text-slate-500">Shows pressure against the dispatchable Equipment supported by this demo.</span>
            </label>
          </div>
        </section>

        <section aria-labelledby="operating-picture">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Operating picture</p>
              <h2 id="operating-picture" className="mt-2 text-3xl font-black text-white">The consequence of this scenario</h2>
            </div>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Canonical DEMO state</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Total Equipment" value={result.rows.length} />
            <Metric label="Available Equipment" value={result.rows.filter((row) => row.evaluation.availability === "AVAILABLE").length} />
            <Metric label="Unavailable Equipment" value={result.rows.filter((row) => row.evaluation.availability === "UNAVAILABLE").length} />
            <Metric label="Assigned Equipment" value={result.rows.filter((row) => row.record.currentAssignment.value).length} />
            <Metric label="Assignable Equipment" value={result.rows.filter((row) => row.evaluation.assignability === "ASSIGNABLE").length} />
            <Metric label="Ready Equipment" value={result.rows.filter((row) => row.evaluation.readiness === "READY").length} />
            <Metric label="Dispatchable Equipment" value={result.rows.filter((row) => row.evaluation.dispatchability === "DISPATCHABLE").length} />
            <Metric label="Available Drivers" value={`${result.availableDriverIds.length} / ${data.drivers.length}`} />
            <Metric label="Active Assignments" value={result.activeAssignments} />
            <Metric label="Open Load Demand" value={result.openLoadDemand} />
            <Metric label="Exceptions" value={result.exceptions.length} />
            <Metric label="Affected Assets" value={result.affectedEquipmentIds.length} />
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-700 bg-slate-950 p-6" aria-labelledby="what-changed">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">What changed?</p>
          <h2 id="what-changed" className="mt-2 text-2xl font-black text-white">Cause to consequence</h2>
          <ul className="mt-5 grid gap-3">
            {result.changedSummary.map((item) => <li key={item} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-sm leading-6 text-slate-300">{item}</li>)}
          </ul>
        </section>
        <section className="rounded-2xl border border-rose-400/25 bg-slate-950 p-6" aria-labelledby="exceptions">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-300">Operational exceptions</p>
          <h2 id="exceptions" className="mt-2 text-2xl font-black text-white">What requires attention?</h2>
          {result.exceptions.length ? (
            <ul className="mt-5 grid gap-3">{result.exceptions.map((item) => <li key={item} className="rounded-lg border border-rose-400/20 bg-rose-400/5 p-3 text-sm leading-6 text-rose-100">{item}</li>)}</ul>
          ) : <p className="mt-5 text-sm leading-6 text-slate-400">No operational exceptions in this scenario.</p>}
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-950 p-6" aria-labelledby="affected-assets">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Affected assets and people</p>
            <h2 id="affected-assets" className="mt-2 text-2xl font-black text-white">Follow the operational impact</h2>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{result.provenance}</p>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Equipment</h3>
            {result.affectedEquipmentIds.length ? <div className="mt-3 flex flex-wrap gap-2">{result.affectedEquipmentIds.map((id) => <span key={id} className="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm font-black text-amber-100">{id}</span>)}</div> : <p className="mt-3 text-sm text-slate-400">No equipment is affected.</p>}
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Drivers</h3>
            {result.affectedDriverIds.length ? <div className="mt-3 flex flex-wrap gap-2">{result.affectedDriverIds.map((id) => <span key={id} className="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm font-black text-amber-100">{id}</span>)}</div> : <p className="mt-3 text-sm text-slate-400">No assigned drivers fall below the available-driver limit.</p>}
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-700 text-xs uppercase tracking-[0.14em] text-slate-500"><tr><th className="px-3 py-3">Equipment</th><th className="px-3 py-3">Assignment</th><th className="px-3 py-3">Availability</th><th className="px-3 py-3">Readiness</th><th className="px-3 py-3">Dispatchability</th></tr></thead>
            <tbody>{result.rows.filter((row) => result.affectedEquipmentIds.includes(row.record.canonicalAssetId)).map((row) => <tr key={row.record.canonicalAssetId} className="border-b border-slate-800"><td className="px-3 py-3 font-black text-white">{row.record.canonicalAssetId}</td><td className="px-3 py-3 text-slate-300">{row.record.currentAssignment.value || "Unassigned"}</td><td className="px-3 py-3 text-slate-300">{labelize(row.evaluation.availability)}</td><td className="px-3 py-3 text-slate-300">{labelize(row.evaluation.readiness)}</td><td className="px-3 py-3 text-slate-300">{labelize(row.evaluation.dispatchability)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}