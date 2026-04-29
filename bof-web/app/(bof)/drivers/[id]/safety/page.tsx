"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { complianceNotesForDriver, getOrderedDocumentsForDriver } from "@/lib/driver-queries";
import {
  getSafetyEvidenceByDriverId,
  getSafetyScorecardRows,
  getSafetyViolationActions,
} from "@/lib/safety-scorecard";

type Props = {
  params: Promise<{ id: string }>;
};

export default function DriverSafetyPage({ params }: Props) {
  const { id } = use(params);
  const { data } = useBofDemoData();
  const driver = data.drivers.find((d) => d.id === id);

  if (!driver) {
    notFound();
  }

  const compliance = complianceNotesForDriver(data, id);
  const credentialDocs = getOrderedDocumentsForDriver(data, id).filter(
    (d) => d.type === "CDL" || d.type === "Medical Card" || d.type === "MVR"
  );
  const scoreRow = getSafetyScorecardRows().find((r) => r.driverId === id) ?? null;
  const evidence = getSafetyEvidenceByDriverId(id);
  const violationActions = getSafetyViolationActions().filter((r) => r.driverId === id);

  const openHigh = compliance.filter((c) => {
    const sev = c.severity.toUpperCase();
    const status = c.status.toUpperCase();
    return (sev === "HIGH" || sev === "CRITICAL") && status !== "CLOSED" && status !== "RESOLVED";
  }).length;
  const openMedium = compliance.filter((c) => {
    const sev = c.severity.toUpperCase();
    const status = c.status.toUpperCase();
    return sev === "MEDIUM" && status !== "CLOSED" && status !== "RESOLVED";
  }).length;
  const resolved = compliance.filter((c) => {
    const status = c.status.toUpperCase();
    return status === "CLOSED" || status === "RESOLVED";
  }).length;

  const riskStatus =
    openHigh > 0 ? "High Risk" : openMedium > 0 ? "At Risk" : "Clean";
  const riskChipClass =
    openHigh > 0
      ? "bg-rose-900/40 text-rose-300 ring-1 ring-rose-700/50"
      : openMedium > 0
        ? "bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/40"
        : "bg-emerald-900/35 text-emerald-300 ring-1 ring-emerald-700/50";

  const trainingRequired = Array.from(
    new Set(
      [
        ...evidence.map((e) => e.type),
        ...violationActions.map((v) => (v.code || "").toLowerCase()),
      ]
        .map((t) => {
          if (t.includes("hos") || t.includes("logbook")) {
            return "Hours of Service compliance refresher";
          }
          if (t.includes("tire") || t.includes("brake") || t.includes("equipment")) {
            return "Vehicle inspection and defect criteria refresher";
          }
          if (t.includes("cargo")) {
            return "Cargo securement and damage prevention refresher";
          }
          return "";
        })
        .filter(Boolean)
    )
  );

  return (
    <div className="bof-page">
      <div className="flex min-h-0 flex-1 flex-col gap-5 p-5 text-slate-200">
        <header className="rounded-lg border border-slate-800 bg-slate-900/35 p-4">
          <Link href="/safety" className="text-xs font-semibold text-teal-300 hover:text-teal-200">
            ← Back to Safety & Compliance
          </Link>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                {driver.name} - Safety & Risk Management
              </h1>
              <p className="mt-1 font-mono text-xs text-slate-500">{driver.id}</p>
            </div>
            <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${riskChipClass}`}>
              {riskStatus}
            </span>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi label="Open High Risk Items" value={openHigh} />
          <Kpi label="Open Medium Risk Items" value={openMedium} />
          <Kpi label="Resolved Items" value={resolved} />
          <Kpi label="Current Performance Tier" value={scoreRow?.performanceTier ?? "No score"} />
          <Kpi
            label="Safety Bonus"
            value={scoreRow ? `$${scoreRow.safetyBonusUsd.toFixed(2)}` : "No score"}
          />
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-100">Credential status</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {credentialDocs.map((doc) => {
              const status = doc.status.toUpperCase();
              const chipClass =
                status === "VALID"
                  ? "bg-emerald-900/35 text-emerald-300 ring-1 ring-emerald-700/50"
                  : status === "EXPIRED"
                    ? "bg-rose-900/40 text-rose-300 ring-1 ring-rose-700/50"
                    : "bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/40";
              const href = doc.fileUrl || doc.previewUrl || `/drivers/${id}/vault`;
              return (
                <div key={doc.type} className="rounded border border-slate-800 bg-slate-950/50 p-3">
                  <p className="text-xs font-semibold text-slate-100">{doc.type}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {doc.expirationDate ? `Expires ${doc.expirationDate}` : "No expiration date on file"}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${chipClass}`}>
                      {doc.status}
                    </span>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-teal-300 hover:text-teal-200"
                    >
                      Open document
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-100">Safety Events / Evidence Photos</h2>
          {evidence.length === 0 ? (
            <p className="text-xs text-slate-500">No safety evidence photos on file for this driver.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {evidence.map((item) => (
                <div key={item.id} className="rounded border border-slate-800 bg-slate-950/50 p-3 text-xs">
                  <EvidenceThumb url={item.url} alt={item.label} />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-100">{item.label}</span>
                    <span
                      className={[
                        "inline-flex rounded px-2 py-0.5 text-[10px] font-semibold",
                        item.severity === "high"
                          ? "bg-rose-900/40 text-rose-300 ring-1 ring-rose-700/50"
                          : "bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/40",
                      ].join(" ")}
                    >
                      {item.severity === "high" ? "High" : "Medium"}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-400">{item.note}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {item.date}
                    {item.location ? ` · ${item.location}` : ""}
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex font-semibold text-teal-300 hover:text-teal-200"
                  >
                    Open evidence
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-100">Required Training</h2>
            {trainingRequired.length === 0 ? (
              <p className="text-xs text-slate-500">No corrective action required.</p>
            ) : (
              <ul className="space-y-1 text-xs text-slate-300">
                {trainingRequired.map((item) => (
                  <li key={item} className="rounded border border-slate-800 bg-slate-950/50 px-2 py-1.5">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-100">Corrective Actions</h2>
            {violationActions.length === 0 ? (
              <p className="text-xs text-slate-500">No corrective action required.</p>
            ) : (
              <ul className="space-y-1 text-xs text-slate-300">
                {violationActions.map((row) => (
                  <li key={row.driverId + row.code} className="rounded border border-slate-800 bg-slate-950/50 px-2 py-1.5">
                    <span className="font-semibold text-slate-100">{row.code}</span> - {row.action}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-100">Open safety reviews</h2>
          {openHigh + openMedium === 0 ? (
            <p className="text-xs text-slate-500">No open safety events for this driver.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {compliance
                .filter((c) => {
                  const st = c.status.toUpperCase();
                  return st !== "CLOSED" && st !== "RESOLVED";
                })
                .map((item) => (
                  <div key={item.incidentId} className="rounded border border-slate-800 bg-slate-950/50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-100">{item.type}</span>
                      <span
                        className={[
                          "inline-flex rounded px-2 py-0.5 text-[10px] font-semibold",
                          item.severity.toUpperCase() === "HIGH" || item.severity.toUpperCase() === "CRITICAL"
                            ? "bg-rose-900/40 text-rose-300 ring-1 ring-rose-700/50"
                            : "bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/40",
                        ].join(" ")}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-400">Status: {item.status}</p>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function EvidenceThumb({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="mb-2 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-400">
        Evidence image unavailable
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="mb-2 h-28 w-full rounded border border-slate-800 object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
