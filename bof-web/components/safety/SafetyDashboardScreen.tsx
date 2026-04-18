"use client";

import { useMemo } from "react";
import { AlertOctagon, FileWarning, ShieldAlert, UserX } from "lucide-react";
import { useSafetyStore } from "@/lib/stores/safety-store";
import {
  countBlockedDrivers,
  countDriversDocRisk,
  countHighSeverityOpen,
  countOpenEvents,
  sumOpenClaimExposure,
} from "@/lib/stores/safety-store";
import {
  buildExpirationRows,
  isDispatchBlocked,
  isHighSeverityOpen,
  severityChipClass,
  eventStatusChipClass,
} from "@/lib/safety-rules";
import { formatExposure } from "./safety-ui";

export function SafetyDashboardScreen() {
  const drivers = useSafetyStore((s) => s.drivers);
  const events = useSafetyStore((s) => s.events);
  const openEventDrawer = useSafetyStore((s) => s.openEventDrawer);

  const kpis = useMemo(() => {
    const expRows = buildExpirationRows(drivers);
    return {
      openEvents: countOpenEvents(events),
      highOpen: countHighSeverityOpen(events),
      docRiskDrivers: countDriversDocRisk(drivers),
      blockedDrivers: countBlockedDrivers(drivers, events),
      claimExposure: sumOpenClaimExposure(events),
      expirationsCount: expRows.length,
    };
  }, [drivers, events]);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      ),
    [events]
  );

  const expirations = useMemo(() => buildExpirationRows(drivers), [drivers]);

  const immediateAttention = useMemo(() => {
    const items: {
      key: string;
      tone: "critical" | "high" | "warn";
      title: string;
      subtitle: string;
      event_id?: string;
    }[] = [];

    for (const d of drivers) {
      if (d.compliance_status === "EXPIRED") {
        items.push({
          key: `exp-${d.driver_id}`,
          tone: "critical",
          title: `Expired credentials — ${d.name}`,
          subtitle: `${d.driver_id} · ${d.home_terminal} · dispatch blocked`,
        });
      }
    }
    for (const e of events) {
      if (isHighSeverityOpen(e)) {
        items.push({
          key: e.event_id,
          tone: e.severity === "Critical" ? "critical" : "high",
          title: `${e.severity} · ${e.event_type}`,
          subtitle: `${e.driver_name} · ${e.status} · ${e.linked_load_id ?? "no load"}`,
          event_id: e.event_id,
        });
      }
      if (
        e.status === "Open" &&
        e.insurance_claim_needed &&
        e.estimated_claim_exposure > 0
      ) {
        items.push({
          key: `claim-${e.event_id}`,
          tone: "warn",
          title: `Open claim exposure — ${e.driver_name}`,
          subtitle: formatExposure(e.estimated_claim_exposure),
          event_id: e.event_id,
        });
      }
    }
    return items;
  }, [drivers, events]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Safety dashboard
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Operational snapshot — open events, credential risk, dispatch blocks,
          and carrier claim exposure. Row opens event detail.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Open safety events"
          value={kpis.openEvents}
          icon={<ShieldAlert className="h-4 w-4 text-teal-500" />}
        />
        <KpiCard
          label="High / critical (open)"
          value={kpis.highOpen}
          icon={<AlertOctagon className="h-4 w-4 text-orange-400" />}
        />
        <KpiCard
          label="Drivers — doc risk"
          value={kpis.docRiskDrivers}
          sub={`${kpis.expirationsCount} expiring/expired lines`}
          icon={<FileWarning className="h-4 w-4 text-amber-400" />}
        />
        <KpiCard
          label="Blocked from dispatch"
          value={kpis.blockedDrivers}
          icon={<UserX className="h-4 w-4 text-red-400" />}
        />
        <KpiCard
          label="Est. claim exposure (open)"
          value={formatExposure(kpis.claimExposure)}
          icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-slate-200">
            Recent safety events
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
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
                    Status
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">
                    Load
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">
                    Evidence
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {sortedEvents.map((e) => (
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
                    <td className="px-3 py-2 text-center text-xs">
                      {e.evidence_image_url ? (
                        <span className="text-emerald-400">Y</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-200">
              Upcoming expirations
            </h2>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-800">
              <ul className="divide-y divide-slate-800 text-xs">
                {expirations.length === 0 ? (
                  <li className="px-3 py-3 text-slate-500">No windows in 60d.</li>
                ) : (
                  expirations.slice(0, 8).map((r) => {
                    const d = drivers.find((x) => x.driver_id === r.driver_id)!;
                    return (
                      <li key={`${r.driver_id}-${r.document_type}`} className="px-3 py-2">
                        <div className="font-medium text-slate-200">{r.driver_name}</div>
                        <div className="mt-0.5 text-slate-500">
                          {r.document_type} · {r.expiration_date} ·{" "}
                          <span
                            className={
                              r.status === "Expired"
                                ? "text-red-400"
                                : "text-amber-400"
                            }
                          >
                            {r.status}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-600">
                          {r.home_terminal} ·{" "}
                          {isDispatchBlocked(d, events) ? (
                            <span className="text-red-400">Dispatch blocked</span>
                          ) : r.document_type === "MVR" && r.status === "Expired" ? (
                            <span className="text-amber-400">MVR review — still eligible</span>
                          ) : (
                            <span className="text-slate-500">Eligible</span>
                          )}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-200">
              Immediate attention
            </h2>
            <ul className="space-y-2 text-xs">
              {immediateAttention.length === 0 ? (
                <li className="rounded border border-slate-800 px-3 py-2 text-slate-500">
                  No critical queue items.
                </li>
              ) : (
                immediateAttention.map((it) => (
                  <li key={it.key}>
                    <button
                      type="button"
                      onClick={() => it.event_id && openEventDrawer(it.event_id)}
                      className={[
                        "w-full rounded border px-3 py-2 text-left transition-colors",
                        it.tone === "critical"
                          ? "border-red-900/50 bg-red-950/25 hover:bg-red-950/40"
                          : it.tone === "high"
                            ? "border-orange-900/40 bg-orange-950/20 hover:bg-orange-950/35"
                            : "border-amber-900/40 bg-amber-950/15 hover:bg-amber-950/30",
                        it.event_id ? "cursor-pointer" : "cursor-default",
                      ].join(" ")}
                    >
                      <div className="font-semibold text-slate-100">{it.title}</div>
                      <div className="mt-0.5 text-slate-400">{it.subtitle}</div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}
