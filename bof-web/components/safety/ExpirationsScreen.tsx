"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSafetyStore } from "@/lib/stores/safety-store";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import type { Driver } from "@/types/safety";
import {
  buildExpirationRows,
  dispatchEligibilityLabel,
  expirationSignalLabel,
  type ExpirationRow,
} from "@/lib/safety-rules";
import { deriveDocStatusFromExpiration } from "@/lib/driver-operational-edit";

export function ExpirationsScreen() {
  const drivers = useSafetyStore((s) => s.drivers);
  const events = useSafetyStore((s) => s.events);
  const {
    data,
    updateDocument,
    updateDriverCredentialOverride,
    resetDriverCredentialOverrides,
  } = useBofDemoData();

  const [terminalQ, setTerminalQ] = useState("");
  const [docType, setDocType] = useState<"" | ExpirationRow["document_type"]>("");
  const [statusF, setStatusF] = useState<"" | ExpirationRow["status"]>("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState("");
  const [demoBanner, setDemoBanner] = useState<string | null>(null);

  const rows = useMemo(() => buildExpirationRows(data), [data]);
  const totals = useMemo(() => {
    const expired = rows.filter((r) => r.status === "Expired").length;
    const expiring = rows.filter((r) => r.status === "Expiring soon").length;
    const needs = rows.filter((r) => r.status === "Needs review").length;
    return { expired, expiring, needs };
  }, [rows]);

  const hasCredentialOverrides = useMemo(
    () => Object.keys(data.driverCredentialOverrides ?? {}).length > 0,
    [data.driverCredentialOverrides]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (terminalQ && !r.home_terminal.toLowerCase().includes(terminalQ.toLowerCase()))
        return false;
      if (docType && r.document_type !== docType) return false;
      if (statusF && r.status !== statusF) return false;
      return true;
    });
  }, [rows, terminalQ, docType, statusF]);

  function openRowEditor(row: ExpirationRow) {
    setEditingKey(`${row.driver_id}-${row.document_type}`);
    setDraftDate(row.expiration_date?.trim() ?? "");
  }

  function saveRowEdit(row: ExpirationRow) {
    const iso = draftDate.trim();
    if (row.document_type === "Med Card") {
      updateDriverCredentialOverride(row.driver_id, { medicalCardExpirationDate: iso });
    } else if (row.document_type === "CDL") {
      updateDriverCredentialOverride(row.driver_id, { cdlExpirationDate: iso });
    } else {
      updateDriverCredentialOverride(row.driver_id, { mvrReviewDate: iso });
    }

    const docTypeMap: Record<ExpirationRow["document_type"], string> = {
      CDL: "CDL",
      "Med Card": "Medical Card",
      MVR: "MVR",
    };
    updateDocument(row.driver_id, docTypeMap[row.document_type], {
      expirationDate: iso || null,
      status: deriveDocStatusFromExpiration(iso),
    });
    setEditingKey(null);
    setDemoBanner("Updated for demo");
    window.setTimeout(() => setDemoBanner(null), 4000);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Credential expirations
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          CDL, med card, and MVR windows (60-day horizon). Rows below use the same canonical credential
          resolver as dispatch eligibility and driver documents. Medical Card gaps hard-block dispatch;
          MVR-only issues follow soft-review policy for this configuration.
        </p>
      </header>

      {demoBanner ? (
        <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/35 px-3 py-2 text-xs text-emerald-100">
          {demoBanner}
        </div>
      ) : null}

      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
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
            <option value="Needs review">Needs review</option>
          </select>
        </label>
        {hasCredentialOverrides ? (
          <button
            type="button"
            className="bof-intake-engine-btn mt-5"
            onClick={() => {
              resetDriverCredentialOverrides();
              setDemoBanner("Credential demo overrides cleared — documents JSON drives dates again");
              window.setTimeout(() => setDemoBanner(null), 5000);
            }}
          >
            Reset credential demo overrides
          </button>
        ) : null}
      </section>
      <div className="flex flex-wrap gap-2">
        <span className="bof-status-pill bof-status-pill-danger">Expired: {totals.expired}</span>
        <span className="bof-status-pill bof-status-pill-warn">Expiring soon: {totals.expiring}</span>
        <span className="bof-status-pill bof-status-pill-info">Needs review: {totals.needs}</span>
        <span className="bof-status-pill bof-status-pill-info">
          Dispatch column mirrors live eligibility + safety critical events
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
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Review
                </th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const shell: Pick<Driver, "status"> = {
                  status:
                    drivers.find((x) => x.driver_id === r.driver_id)?.status ?? "Active",
                };
                const blockingLook = r.signal === "blocking_action";
                return (
                  <tr
                    key={`${r.driver_id}-${r.document_type}-${r.status}-${r.expiration_date}`}
                    className={[
                      "border-b border-slate-800/80",
                      blockingLook ? "bg-red-950/25" : "hover:bg-slate-900/60",
                    ].join(" ")}
                  >
                    <td className="px-3 py-2 text-slate-100">{r.driver_name}</td>
                    <td className="px-3 py-2 text-slate-300">{r.document_type}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-400">
                      {r.expiration_date?.trim() ? r.expiration_date : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          r.signal === "blocking_action"
                            ? "bof-status-pill bof-status-pill-danger"
                            : r.signal === "review_warning"
                              ? "bof-status-pill bof-status-pill-warn"
                              : "bof-status-pill bof-status-pill-info"
                        }
                      >
                        {expirationSignalLabel(r.signal)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {r.home_terminal}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-300">
                      {dispatchEligibilityLabel(data, r.driver_id, shell, events)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-300">
                      {r.status === "Needs review" ||
                      dispatchEligibilityLabel(data, r.driver_id, shell, events).toLowerCase().includes("review") ? (
                        <Link href={`/drivers/${r.driver_id}#driver-review`} className="text-teal-300 hover:text-teal-200">
                          View review details
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-300">
                      {editingKey === `${r.driver_id}-${r.document_type}` ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={draftDate}
                            onChange={(e) => setDraftDate(e.target.value)}
                            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                          />
                          <button
                            type="button"
                            className="bof-intake-engine-btn bof-intake-engine-btn--primary"
                            onClick={() => saveRowEdit(r)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="bof-intake-engine-btn"
                            onClick={() => setEditingKey(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="bof-intake-engine-btn"
                          onClick={() => openRowEditor(r)}
                        >
                          Edit date
                        </button>
                      )}
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
