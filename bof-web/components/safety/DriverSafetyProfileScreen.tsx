"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import type { Driver } from "@/types/safety";
import { useSafetyStore } from "@/lib/stores/safety-store";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  complianceChipClass,
  eventStatusChipClass,
  hasOpenCriticalEvent,
  isHighSeverityOpen,
  severityChipClass,
} from "@/lib/safety-rules";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import {
  credentialDisplayText,
  getDriverCredentialStatus,
  type CanonicalCredentialStatus,
} from "@/lib/driver-credential-status";
import { getSafetyEvidenceByDriverId } from "@/lib/safety-scorecard";
import {
  getSafetyEvidenceOpenHref,
  SafetyEvidenceThumb,
} from "@/components/safety/SafetyEvidenceThumb";

export function DriverSafetyProfileScreen() {
  const { data } = useBofDemoData();
  const drivers = useSafetyStore((s) => s.drivers);
  const events = useSafetyStore((s) => s.events);
  const selectedDriverId = useSafetyStore((s) => s.selectedDriverId);
  const setSelectedDriverId = useSafetyStore((s) => s.setSelectedDriverId);
  const openEventDrawer = useSafetyStore((s) => s.openEventDrawer);

  const driver = useMemo(
    () => drivers.find((d) => d.driver_id === selectedDriverId) ?? drivers[0],
    [drivers, selectedDriverId]
  );

  const credential = useMemo(() => {
    if (!driver) return null;
    return getDriverCredentialStatus(data, driver.driver_id);
  }, [data, driver]);

  const blocked = !driver
    ? true
    : driver.status === "Inactive" ||
      hasOpenCriticalEvent(driver.driver_id, events) ||
      getDriverDispatchEligibility(data, driver.driver_id).status === "blocked";

  const mvrStale =
    credential !== null && Boolean(driver) && !blocked && credential.mvr.status === "expired";

  const driverEvents = useMemo(
    () =>
      [...events]
        .filter((e) => e.driver_id === driver?.driver_id)
        .sort(
          (a, b) =>
            new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        ),
    [events, driver?.driver_id]
  );
  const evidence = useMemo(
    () => getSafetyEvidenceByDriverId(driver.driver_id),
    [driver.driver_id]
  );

  if (!driver || !credential) {
    return <p className="p-5 text-sm text-slate-500">No drivers in demo set.</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            Driver safety profile
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Credential posture, acknowledgements, and driver-scoped events.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Driver
          <span className="relative inline-flex">
            <select
              value={driver.driver_id}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="appearance-none rounded border border-slate-700 bg-slate-950 py-2 pl-3 pr-8 text-sm text-slate-100"
            >
              {drivers.map((d) => (
                <option key={d.driver_id} value={d.driver_id}>
                  {d.name} ({d.driver_id})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </span>
        </label>
      </header>

      <ProfileHeader driver={driver} blocked={blocked} mvrStale={mvrStale} />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-200">
          Compliance &amp; qualification
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <ComplianceCard
            title="CDL"
            status={credential.cdl.status}
            value={credentialDisplayText(credential.cdl)}
            hasFile={Boolean(credential.cdl.fileUrl)}
          />
          <ComplianceCard
            title="Med card"
            status={credential.medicalCard.status}
            value={credentialDisplayText(credential.medicalCard)}
            hasFile={Boolean(credential.medicalCard.fileUrl)}
          />
          <ComplianceCard
            title="MVR"
            status={credential.mvr.status}
            value={credentialDisplayText(credential.mvr)}
            hasFile={Boolean(credential.mvr.fileUrl)}
            warn={mvrStale}
          />
          <ComplianceCard
            title="FMCSA"
            status={credential.fmcsa.status}
            value={credentialDisplayText(credential.fmcsa)}
            hasFile={Boolean(credential.fmcsa.fileUrl)}
          />
          <QualCard
            title="Driver qual file"
            status={driver.qual_file_status}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Rule: expired CDL or med card sets compliance to{" "}
          <strong className="text-slate-400">EXPIRED</strong> and blocks dispatch.
          Stale MVR is surfaced as review — dispatch remains eligible unless a{" "}
          <strong className="text-slate-400">Critical</strong> open event blocks.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-200">
          Safety events (this driver)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="bg-slate-900/90 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Date
                </th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Type
                </th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Severity
                </th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Status
                </th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Load
                </th>
              </tr>
            </thead>
            <tbody>
              {driverEvents.map((e) => (
                <tr
                  key={e.event_id}
                  className={[
                    "cursor-pointer border-b border-slate-800/80 hover:bg-slate-900/80",
                    isHighSeverityOpen(e) ? "bg-orange-950/15" : "",
                  ].join(" ")}
                  onClick={() => openEventDrawer(e.event_id)}
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">
                    {e.event_date.replace("T", " ").slice(0, 16)}
                  </td>
                  <td className="max-w-[240px] truncate px-3 py-2 text-xs">
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
                  <td className="px-3 py-2 font-mono text-xs text-teal-300">
                    {e.linked_load_id ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {evidence.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-200">Linked evidence</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {evidence.map((item) => (
              <div
                key={item.id}
                className="rounded border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs"
              >
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
                <SafetyEvidenceThumb
                  rawUrl={item.url}
                  alt={item.label}
                  driverId={driver.driver_id}
                  className="mb-2 h-24 w-full rounded border border-slate-800 bg-slate-950 object-cover object-center"
                />
                <p className="mt-1 text-slate-400">{item.note}</p>
                {getSafetyEvidenceOpenHref(item.url) ? (
                  <a
                    href={getSafetyEvidenceOpenHref(item.url)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex text-[11px] font-semibold text-teal-300 hover:text-teal-200"
                  >
                    Open evidence
                  </a>
                ) : (
                  <span className="mt-1 inline-flex text-[11px] font-semibold text-slate-500">
                    Open evidence unavailable
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProfileHeader({
  driver,
  blocked,
  mvrStale,
}: {
  driver: Driver;
  blocked: boolean;
  mvrStale: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">{driver.name}</h2>
          <p className="mt-0.5 font-mono text-xs text-teal-400">{driver.driver_id}</p>
          <p className="mt-2 text-sm text-slate-400">
            <span className="text-slate-500">Terminal: </span>
            {driver.home_terminal}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            <span className="text-slate-500">Driver status: </span>
            {driver.status}
            <span className="mx-2 text-slate-600">·</span>
            <span className="text-slate-500">Compliance: </span>
            <span
              className={[
                "inline-flex rounded px-2 py-0.5 text-[11px] font-semibold",
                complianceChipClass(driver.compliance_status),
              ].join(" ")}
            >
              {driver.compliance_status}
            </span>
          </p>
        </div>
      </div>
      <div
        className={[
          "mt-4 rounded border px-3 py-2 text-sm font-medium",
          blocked
            ? "border-red-800/60 bg-red-950/35 text-red-100"
            : "border-emerald-800/50 bg-emerald-950/30 text-emerald-100",
        ].join(" ")}
      >
        {blocked
          ? "Blocked from dispatch — expired CDL/med compliance, inactive status, or critical open event."
          : "Eligible for dispatch — no blocking credential or critical open event."}
      </div>
      {mvrStale && (
        <p className="mt-2 text-xs text-amber-200/90">
          MVR past due: schedule pull and review (warning-only for dispatch in this
          configuration).
        </p>
      )}
    </div>
  );
}

function ComplianceCard({
  title,
  value,
  status,
  hasFile,
  warn,
}: {
  title: string;
  value: string;
  status: CanonicalCredentialStatus;
  hasFile: boolean;
  warn?: boolean;
}) {
  const statusLabel =
    status === "valid"
      ? "Valid"
      : status === "expiring_soon"
        ? "Expiring soon"
        : status === "expired"
          ? "Expired"
          : status === "pending_review"
            ? "Pending review"
            : "Missing";

  return (
    <div
      className={[
        "rounded-lg border p-3",
        status === "expired"
          ? "border-red-800/60 bg-red-950/25"
          : warn
          ? "border-amber-800/50 bg-amber-950/20"
          : "border-slate-800 bg-slate-950/50",
      ].join(" ")}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-slate-300">{statusLabel}</p>
      <p className="mt-1 font-mono text-sm text-slate-100">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">
        {hasFile ? "File on record" : "File missing"}
      </p>
      {warn && (
        <p className="mt-1 text-[11px] text-amber-300">Review required</p>
      )}
    </div>
  );
}

function QualCard({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  const ok = status === "Complete" || status === "Signed";
  return (
    <div
      className={[
        "rounded-lg border p-3",
        ok ? "border-slate-800 bg-slate-950/50" : "border-amber-900/40 bg-amber-950/15",
      ].join(" ")}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-100">{status}</p>
    </div>
  );
}
