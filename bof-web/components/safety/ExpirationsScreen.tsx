"use client";

import { useMemo, useState } from "react";
import { useSafetyStore } from "@/lib/stores/safety-store";
import {
  buildExpirationRows,
  dispatchEligibilityLabel,
  type ExpirationRow,
} from "@/lib/safety-rules";

export function ExpirationsScreen() {
  const drivers = useSafetyStore((s) => s.drivers);
  const events = useSafetyStore((s) => s.events);

  const [terminalQ, setTerminalQ] = useState("");
  const [docType, setDocType] = useState<"" | ExpirationRow["document_type"]>("");
  const [statusF, setStatusF] = useState<"" | "Expired" | "Expiring soon">("");

  const rows = useMemo(() => buildExpirationRows(drivers), [drivers]);
  const totals = useMemo(() => {
    const expired = rows.filter((r) => r.status === "Expired").length;
    const expiring = rows.filter((r) => r.status === "Expiring soon").length;
    return { expired, expiring };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (terminalQ && !r.home_terminal.toLowerCase().includes(terminalQ.toLowerCase()))
        return false;
      if (docType && r.document_type !== docType) return false;
      if (statusF && r.status !== statusF) return false;
      return true;
    });
  }, [rows, terminalQ, docType, statusF]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Credential expirations
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          CDL, med card, and MVR windows (60-day horizon). Expired rows highlighted;
          MVR-only expiry does not block dispatch in this configuration.
        </p>
      </header>

      <section className="flex flex-wrap gap-3 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <label className="text-xs text-slate-500">
          Terminal contains
          <input
            value={terminalQ}
            onChange={(e) => setTerminalQ(e.target.value)}
            className="mt-1 block rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            placeholder="City, OH"
          />
        </label>
        <label className="text-xs text-slate-500">
          Document type
          <select
            value={docType}
            onChange={(e) =>
              setDocType((e.target.value || "") as typeof docType)
            }
            className="mt-1 block rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
          >
            <option value="">All</option>
            <option value="CDL">CDL</option>
            <option value="Med Card">Med Card</option>
            <option value="MVR">MVR</option>
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Status
          <select
            value={statusF}
            onChange={(e) =>
              setStatusF((e.target.value || "") as typeof statusF)
            }
            className="mt-1 block rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
          >
            <option value="">All</option>
            <option value="Expired">Expired</option>
            <option value="Expiring soon">Expiring soon</option>
          </select>
        </label>
      </section>
      <div className="flex flex-wrap gap-2">
        <span className="bof-status-pill bof-status-pill-danger">Expired: {totals.expired}</span>
        <span className="bof-status-pill bof-status-pill-warn">Expiring soon: {totals.expiring}</span>
        <span className="bof-status-pill bof-status-pill-info">
          Blocking / at risk language mirrors BOF document vault
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead className="bg-slate-900/90 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Driver
                </th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Document
                </th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Expiration
                </th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Signal
                </th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Terminal
                </th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Dispatch
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const d = drivers.find((x) => x.driver_id === r.driver_id)!;
                const expired = r.status === "Expired";
                return (
                  <tr
                    key={`${r.driver_id}-${r.document_type}`}
                    className={[
                      "border-b border-slate-800/80",
                      expired ? "bg-red-950/25" : "hover:bg-slate-900/60",
                    ].join(" ")}
                  >
                    <td className="px-3 py-2 text-slate-100">{r.driver_name}</td>
                    <td className="px-3 py-2 text-slate-300">{r.document_type}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-400">
                      {r.expiration_date}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          expired
                            ? "bof-status-pill bof-status-pill-danger"
                            : "bof-status-pill bof-status-pill-warn"
                        }
                      >
                        {expired ? "Blocking action" : "At risk"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {r.home_terminal}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-300">
                      {dispatchEligibilityLabel(d, events)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bof-empty-state">
          <h3 className="text-sm font-semibold text-slate-100">No expiration rows match</h3>
          <p className="mt-1 text-xs text-slate-400">Adjust filters to view compliance risk rows.</p>
        </div>
      )}
    </div>
  );
}
