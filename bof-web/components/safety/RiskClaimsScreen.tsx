"use client";

import { useMemo } from "react";
import { useSafetyStore } from "@/lib/stores/safety-store";
import {
  eventStatusChipClass,
  severityChipClass,
} from "@/lib/safety-rules";
import { formatExposure } from "./safety-ui";

export function RiskClaimsScreen() {
  const events = useSafetyStore((s) => s.events);
  const openEventDrawer = useSafetyStore((s) => s.openEventDrawer);

  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      ),
    [events]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Risk &amp; claims
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Open pipeline exposure and claim flags. Non-zero exposure rows highlighted.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-slate-900/90 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Event date
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Driver
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Type
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Severity
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Load
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Claim
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Exposure
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => {
              const hot = e.estimated_claim_exposure > 0;
              return (
                <tr
                  key={e.event_id}
                  className={[
                    "cursor-pointer border-b border-slate-800/80 hover:bg-slate-900/80",
                    hot ? "bg-amber-950/20" : "",
                  ].join(" ")}
                  onClick={() => openEventDrawer(e.event_id)}
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">
                    {e.event_date.replace("T", " ").slice(0, 16)}
                  </td>
                  <td className="px-3 py-2 text-xs">{e.driver_name}</td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-xs">
                    {e.event_type}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={[
                        "inline-flex rounded px-2 py-0.5 text-[11px] font-semibold",
                        severityChipClass(e.severity),
                      ].join(" ")}
                    >
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-teal-300">
                    {e.linked_load_id ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {e.insurance_claim_needed ? (
                      <span className="font-medium text-rose-300">Yes</span>
                    ) : (
                      <span className="text-slate-600">No</span>
                    )}
                  </td>
                  <td
                    className={[
                      "px-3 py-2 font-mono text-xs tabular-nums",
                      hot ? "font-semibold text-amber-200" : "text-slate-400",
                    ].join(" ")}
                  >
                    {formatExposure(e.estimated_claim_exposure)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={[
                        "inline-flex rounded px-2 py-0.5 text-[11px] font-semibold",
                        eventStatusChipClass(e.status),
                      ].join(" ")}
                    >
                      {e.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
