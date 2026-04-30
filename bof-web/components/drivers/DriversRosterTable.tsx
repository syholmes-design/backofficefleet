"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { DriverAvatar } from "@/components/DriverAvatar";
import { driverPhotoPath } from "@/lib/driver-photo";
import { readinessFromDocuments, getOrderedDocumentsForDriver, assignedTrucksForDriver, primaryAssignedTruck, complianceNotesForDriver } from "@/lib/driver-queries";
import { getSafetyScorecardRows } from "@/lib/safety-scorecard";

type DriverRow = {
  id: string;
  name: string;
  photo: string;
  asset: string;
  status: string;
  statusLink?: string;
  compliance: {
    status: "ok" | "warn" | "danger";
    label: string;
    blocker?: string;
  };
  blocked: boolean;
  needsReview: boolean;
  dispatchReady: boolean;
  settlementState: "Paid" | "Pending" | "Hold / Review";
  safetyTier: "Elite" | "Standard" | "At Risk";
  primaryBlocker: "compliance" | "safety" | "settlement" | "hr" | null;
  pendingPay: number;
  pendingPayReason?: string;
  actions: {
    profile: string;
    hr: string;
    vault: string;
    safety: string;
    settlements: string;
    dispatch: string;
  };
};

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatCityStateFromAddress(address?: string): string {
  if (!address) return "Unknown terminal";
  const parts = address.split(",");
  if (parts.length < 2) return address;
  const city = parts[parts.length - 2]?.trim();
  const stateZip = parts[parts.length - 1]?.trim() ?? "";
  const state = stateZip.split(" ")[0];
  if (!city || !state) return address;
  return `${city}, ${state}`;
}

function formatCityStateFromStop(stop?: string): string {
  if (!stop) return "Unknown destination";
  const parts = stop.split(" - ");
  return parts[parts.length - 1]?.trim() || stop;
}

export function DriversRosterTable() {
  const { data } = useBofDemoData();
  const [filterMode, setFilterMode] = useState<"all" | "blocked" | "ready" | "at-risk" | "expiring">("all");

  const driverRows = useMemo(() => {
    const settlements =
      (data as typeof data & {
        settlements?: Array<{
          driverId: string;
          netPay?: number;
          status?: string;
          pendingReason?: string;
        }>;
      }).settlements ?? [];
    const moneyAtRisk = data.moneyAtRisk ?? [];
    const safetyByDriver = new Map(getSafetyScorecardRows().map((r) => [r.driverId, r.performanceTier]));

    return data.drivers.map((driver) => {
      const documents = getOrderedDocumentsForDriver(data, driver.id);
      const readiness = readinessFromDocuments(documents);
      const trucks = assignedTrucksForDriver(data, driver.id);
      const primary = primaryAssignedTruck(data, driver.id);
      const compliance = complianceNotesForDriver(data, driver.id);
      const settlementRow = settlements.find((row) => row.driverId === driver.id);

      const assetLabel =
        trucks.length === 0
          ? "Unassigned"
          : trucks.length === 1
            ? trucks[0]
            : `${primary ?? trucks[0]} (${trucks.length} assets)`;

      const activeLoad = data.loads.find(
        (l) =>
          l.driverId === driver.id && (l.status === "En Route" || l.status === "Pending")
      );
      const latestLoad = data.loads.find((l) => l.driverId === driver.id);
      const terminalLabel = formatCityStateFromAddress(driver.address);
      let status = `Available · ${terminalLabel} terminal`;
      let statusLink = undefined;

      if (activeLoad) {
        if (activeLoad.status === "En Route") {
          status = `In transit · L${activeLoad.number}`;
          statusLink = `/loads/${activeLoad.id}`;
        } else {
          status = `At receiver · ${formatCityStateFromStop(activeLoad.destination)}`;
          statusLink = `/loads/${activeLoad.id}`;
        }
      } else if (readiness.missing + readiness.expired > 0) {
        status = "In pipeline · Onboarding";
      } else if (latestLoad?.status === "Delivered") {
        status = `Off duty · Rest stop · ${terminalLabel.split(", ")[1] ?? "PA"}`;
      }

      let complianceStatus: "ok" | "warn" | "danger" = "ok";
      let complianceLabel = "Compliant";
      let blocker = undefined;

      const openHighRisk = compliance.filter(
        (c) =>
          (c.severity.toUpperCase() === "HIGH" || c.severity.toUpperCase() === "CRITICAL") &&
          c.status.toUpperCase() !== "CLOSED"
      );
      const openAnyRisk = compliance.filter(
        (c) => c.status.toUpperCase() !== "CLOSED" && c.status.toUpperCase() !== "RESOLVED"
      );

      if (readiness.missing + readiness.expired > 0) {
        complianceStatus = "danger";
        complianceLabel = "Action required";
        blocker = `${readiness.missing + readiness.expired} items need attention`;
      } else if (openHighRisk.length > 0) {
        complianceStatus = "warn";
        complianceLabel = "At risk";
        blocker = `${openHighRisk.length} incident item(s) open`;
      }

      const driverMar = moneyAtRisk.filter(
        (row) =>
          row.driverId === driver.id &&
          !["CLOSED", "RESOLVED", "PAID"].includes((row.status ?? "").toUpperCase())
      );
      const pendingFromMar = driverMar.reduce((sum, row) => sum + (row.amount ?? 0), 0);

      const pendingSettlement = settlements.find(
        (row) => row.driverId === driver.id && row.status?.toUpperCase() === "PENDING"
      );
      const pendingFromSettlement = pendingSettlement?.netPay ?? 0;
      const pendingPay = pendingFromMar > 0 ? pendingFromMar : pendingFromSettlement;
      const pendingPayReason =
        driverMar[0]?.rootCause ??
        (pendingSettlement?.pendingReason
          ? `Settlement pending: ${pendingSettlement.pendingReason}`
          : undefined);

      const safetyTier = (safetyByDriver.get(driver.id) ?? "Standard") as DriverRow["safetyTier"];
      const settlementState: DriverRow["settlementState"] =
        settlementRow?.status === "Paid"
          ? "Paid"
          : settlementRow?.status === "On Hold" || pendingPay > 0
            ? "Hold / Review"
            : "Pending";
      const blocked = readiness.expired > 0 || openHighRisk.length > 0 || settlementState === "Hold / Review";
      const needsReview = !blocked && (readiness.missing > 0 || openAnyRisk.length > 0 || settlementState === "Pending");
      const dispatchReady = !blocked && !needsReview;
      const primaryBlocker: DriverRow["primaryBlocker"] =
        readiness.expired > 0 || readiness.missing > 0
          ? "compliance"
          : openHighRisk.length > 0 || safetyTier === "At Risk"
            ? "safety"
            : settlementState === "Hold / Review"
              ? "settlement"
              : null;

      return {
        id: driver.id,
        name: driver.name,
        photo: (driver as { photoUrl?: string }).photoUrl?.trim() || driverPhotoPath(driver.id),
        asset: assetLabel,
        status,
        statusLink,
        compliance: {
          status: complianceStatus,
          label: complianceLabel,
          blocker,
        },
        blocked,
        needsReview,
        dispatchReady,
        settlementState,
        safetyTier,
        primaryBlocker,
        pendingPay,
        pendingPayReason,
        actions: {
          profile: `/drivers/${driver.id}/profile`,
          hr: `/drivers/${driver.id}/hr`,
          vault: `/drivers/${driver.id}/vault`,
          safety: `/drivers/${driver.id}/safety`,
          settlements: `/drivers/${driver.id}/settlements`,
          dispatch: `/drivers/${driver.id}/dispatch`,
        },
      };
    });
  }, [data]);

  const filteredRows = useMemo(() => {
    if (filterMode === "blocked") return driverRows.filter((r) => r.blocked);
    if (filterMode === "ready") return driverRows.filter((r) => r.dispatchReady);
    if (filterMode === "at-risk") return driverRows.filter((r) => r.safetyTier === "At Risk");
    if (filterMode === "expiring") {
      return driverRows.filter((r) => {
        const docs = getOrderedDocumentsForDriver(data, r.id);
        return docs.some((d) => {
          const exp = d.expirationDate ? new Date(d.expirationDate) : null;
          if (!exp || Number.isNaN(exp.getTime())) return false;
          const days = Math.ceil((exp.getTime() - Date.now()) / 86400000);
          return days >= 0 && days <= 60;
        });
      });
    }
    return driverRows;
  }, [driverRows, filterMode, data]);

  const readinessBreakdown = useMemo(() => {
    const total = driverRows.length || 1;
    const ready = driverRows.filter((r) => r.dispatchReady).length;
    const blocked = driverRows.filter((r) => r.blocked).length;
    const review = total - ready - blocked;
    return [
      { label: "Dispatch Ready", value: ready, color: "bg-emerald-500" },
      { label: "Needs Review", value: review, color: "bg-amber-500" },
      { label: "Blocked", value: blocked, color: "bg-rose-500" },
    ];
  }, [driverRows]);

  const safetyTierData = useMemo(() => {
    const elite = driverRows.filter((r) => r.safetyTier === "Elite").length;
    const standard = driverRows.filter((r) => r.safetyTier === "Standard").length;
    const atRisk = driverRows.filter((r) => r.safetyTier === "At Risk").length;
    return [
      { label: "Elite", value: elite, color: "bg-emerald-500" },
      { label: "Standard", value: standard, color: "bg-sky-500" },
      { label: "At Risk", value: atRisk, color: "bg-rose-500" },
    ];
  }, [driverRows]);

  const settlementStatusData = useMemo(() => {
    const paid = driverRows.filter((r) => r.settlementState === "Paid").length;
    const pending = driverRows.filter((r) => r.settlementState === "Pending").length;
    const hold = driverRows.filter((r) => r.settlementState === "Hold / Review").length;
    return [
      { label: "Paid", value: paid, color: "bg-emerald-500" },
      { label: "Pending", value: pending, color: "bg-amber-500" },
      { label: "Hold / Review", value: hold, color: "bg-rose-500" },
    ];
  }, [driverRows]);

  const expirationForecast = useMemo(() => {
    const buckets = { b30: 0, b60: 0, b90: 0, b90p: 0 };
    for (const r of driverRows) {
      const docs = getOrderedDocumentsForDriver(data, r.id).filter((d) => d.type === "CDL" || d.type === "Medical Card");
      for (const d of docs) {
        const exp = d.expirationDate ? new Date(d.expirationDate) : null;
        if (!exp || Number.isNaN(exp.getTime())) continue;
        const days = Math.ceil((exp.getTime() - Date.now()) / 86400000);
        if (days <= 30) buckets.b30 += 1;
        else if (days <= 60) buckets.b60 += 1;
        else if (days <= 90) buckets.b90 += 1;
        else buckets.b90p += 1;
      }
    }
    return [
      { label: "0-30 days", value: buckets.b30, color: "bg-rose-500" },
      { label: "31-60 days", value: buckets.b60, color: "bg-amber-500" },
      { label: "61-90 days", value: buckets.b90, color: "bg-sky-500" },
      { label: "90+ days", value: buckets.b90p, color: "bg-emerald-500" },
    ];
  }, [driverRows, data]);

  const expiringPanel = useMemo(() => {
    const items: Array<{ driverId: string; name: string; doc: string; days: number }> = [];
    for (const r of driverRows) {
      for (const d of getOrderedDocumentsForDriver(data, r.id)) {
        if (d.type !== "CDL" && d.type !== "Medical Card") continue;
        const exp = d.expirationDate ? new Date(d.expirationDate) : null;
        if (!exp || Number.isNaN(exp.getTime())) continue;
        const days = Math.ceil((exp.getTime() - Date.now()) / 86400000);
        if (days >= 0 && days <= 90) items.push({ driverId: r.id, name: r.name, doc: d.type, days });
      }
    }
    return items.sort((a, b) => a.days - b.days).slice(0, 6);
  }, [driverRows, data]);

  const safetyPanel = useMemo(
    () =>
      driverRows
        .filter((r) => r.safetyTier === "At Risk" || r.compliance.status === "warn")
        .slice(0, 6)
        .map((r) => ({
          driverId: r.id,
          name: r.name,
          issue: r.compliance.blocker || "Safety review required",
          severity: r.safetyTier === "At Risk" ? "High" : "Medium",
        })),
    [driverRows]
  );

  const settlementPanel = useMemo(
    () =>
      driverRows
        .filter((r) => r.settlementState === "Hold / Review")
        .slice(0, 6)
        .map((r) => ({
          driverId: r.id,
          name: r.name,
          reason: r.pendingPayReason || "Settlement hold/review pending",
        })),
    [driverRows]
  );

  function exportRosterCsv() {
    const header = ["driverId", "name", "asset", "status", "compliance", "safetyTier", "settlementState"];
    const rows = driverRows.map((r) => [r.id, r.name, r.asset, r.status, r.compliance.label, r.safetyTier, r.settlementState]);
    const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bof-driver-roster.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function resolveBlockerHref(row: DriverRow): string {
    if (row.primaryBlocker === "compliance") return row.actions.vault;
    if (row.primaryBlocker === "safety") return row.actions.safety;
    if (row.primaryBlocker === "settlement") return row.actions.settlements;
    if (row.primaryBlocker === "hr") return row.actions.hr;
    return row.actions.profile;
  }

  return (
    <div className="bof-page">
      <div className="bof-roster-header">
        <h1 className="bof-title">Driver Operations Roster</h1>
        <p className="bof-lead">
          Fleet-wide operations view with dispatch status, compliance posture, and pending pay exposure.
          Use Actions to route into each driver module without leaving roster context.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300 opacity-70" disabled>
          Add Driver (Demo only)
        </button>
        <button onClick={() => setFilterMode("blocked")} className="rounded border border-rose-700 bg-rose-900/30 px-3 py-1.5 text-xs text-rose-100">
          Review Blocked Drivers
        </button>
        <button onClick={exportRosterCsv} className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-200">
          Export Driver Roster
        </button>
        <Link href="/documents" className="rounded border border-teal-700 bg-teal-900/30 px-3 py-1.5 text-xs text-teal-100">
          Open BOF Vault
        </Link>
        <button onClick={() => setFilterMode("ready")} className="rounded border border-emerald-700 bg-emerald-900/30 px-3 py-1.5 text-xs text-emerald-100">
          Dispatch Ready Drivers
        </button>
        <button onClick={() => setFilterMode("all")} className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
          Clear Filters
        </button>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ChartCard title="Driver Readiness Breakdown" data={readinessBreakdown} onClickLabel={(label) => setFilterMode(label === "Blocked" ? "blocked" : label === "Dispatch Ready" ? "ready" : "all")} />
        <ChartCard title="Safety Tier Distribution" data={safetyTierData} onClickLabel={(label) => setFilterMode(label === "At Risk" ? "at-risk" : "all")} />
        <ChartCard title="Settlement Status Breakdown" data={settlementStatusData} onClickLabel={(label) => setFilterMode(label === "Hold / Review" ? "blocked" : "all")} />
        <ChartCard title="Credential Expiration Forecast" data={expirationForecast} onClickLabel={(label) => setFilterMode(label !== "90+ days" ? "expiring" : "all")} />
      </div>

      <div className="bof-roster-table-container">
        <table className="bof-roster-table">
          <thead>
            <tr>
              <th className="bof-roster-header-cell">Driver</th>
              <th className="bof-roster-header-cell">Asset</th>
              <th className="bof-roster-header-cell">Status</th>
              <th className="bof-roster-header-cell">Compliance</th>
              <th className="bof-roster-header-cell">Safety Tier</th>
              <th className="bof-roster-header-cell">Settlement</th>
              <th className="bof-roster-header-cell">Pending Pay</th>
              <th className="bof-roster-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((driver) => (
              <tr key={driver.id} className="bof-roster-row">
                <td className="bof-roster-cell bof-roster-driver-cell">
                  <div className="bof-roster-driver">
                    <DriverAvatar name={driver.name} photoUrl={driver.photo} size={40} />
                    <div className="bof-roster-driver-info">
                      <div className="bof-roster-driver-name">{driver.name}</div>
                      <div className="bof-roster-driver-id">
                        {driver.id} · {formatCityStateFromAddress(data.drivers.find((d) => d.id === driver.id)?.address)}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="bof-roster-cell">
                  <span className="bof-roster-asset">{driver.asset}</span>
                </td>
                <td className="bof-roster-cell">
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs ${driver.safetyTier === "At Risk" ? "bg-rose-900/30 text-rose-200" : driver.safetyTier === "Elite" ? "bg-emerald-900/30 text-emerald-200" : "bg-sky-900/30 text-sky-200"}`}>
                    {driver.safetyTier}
                  </span>
                </td>
                <td className="bof-roster-cell">
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs ${driver.settlementState === "Hold / Review" ? "bg-rose-900/30 text-rose-200" : driver.settlementState === "Paid" ? "bg-emerald-900/30 text-emerald-200" : "bg-amber-900/30 text-amber-200"}`}>
                    {driver.settlementState}
                  </span>
                </td>
                
                <td className="bof-roster-cell">
                  {driver.statusLink ? (
                    <Link href={driver.statusLink} className="bof-roster-status-link">
                      {driver.status}
                    </Link>
                  ) : (
                    <span className="bof-roster-status">{driver.status}</span>
                  )}
                </td>
                
                <td className="bof-roster-cell">
                  <div className="bof-roster-compliance">
                    <span className={`bof-roster-compliance-pill bof-roster-compliance-${driver.compliance.status}`}>
                      {driver.compliance.label}
                    </span>
                    {driver.compliance.blocker && (
                      <div className="bof-roster-compliance-blocker">
                        {driver.compliance.blocker}
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="bof-roster-cell">
                  <span className="bof-roster-pay">
                    {driver.pendingPay > 0 ? CURRENCY.format(driver.pendingPay) : "—"}
                  </span>
                  {driver.pendingPayReason && (
                    <div className="bof-roster-pay-reason">{driver.pendingPayReason}</div>
                  )}
                </td>
                
                <td className="bof-roster-cell">
                  <div className="flex flex-wrap gap-1">
                    <Link href={driver.actions.profile} className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200">Open Profile</Link>
                    <Link href={driver.actions.vault} className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200">Documents</Link>
                    <Link href={driver.actions.hr} className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200">HR Packet</Link>
                    <Link href={driver.actions.safety} className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200">Safety</Link>
                    <Link href={driver.actions.settlements} className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200">Settlement</Link>
                    <Link href={`/dispatch?driverId=${driver.id}`} className="rounded border border-teal-700 bg-teal-900/30 px-2 py-1 text-[11px] text-teal-100">Assign Load</Link>
                    {(driver.blocked || driver.needsReview) && (
                      <Link href={resolveBlockerHref(driver)} className="rounded border border-rose-700 bg-rose-900/30 px-2 py-1 text-[11px] text-rose-100">
                        Resolve Blocker
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <ExceptionPanel
          title="Expiring Credentials"
          rows={expiringPanel.map((r) => ({
            key: `${r.driverId}-${r.doc}`,
            line: `${r.name} · ${r.doc} · ${r.days} day(s)`,
            href: `/drivers/${r.driverId}/vault`,
            action: "Open Documents",
          }))}
        />
        <ExceptionPanel
          title="Safety / Risk Items"
          rows={safetyPanel.map((r) => ({
            key: `${r.driverId}-${r.issue}`,
            line: `${r.name} · ${r.issue} · ${r.severity}`,
            href: `/drivers/${r.driverId}/safety`,
            action: "Open Safety",
          }))}
        />
        <ExceptionPanel
          title="Settlement Holds"
          rows={settlementPanel.map((r) => ({
            key: `${r.driverId}-${r.reason}`,
            line: `${r.name} · ${r.reason}`,
            href: `/drivers/${r.driverId}/settlements`,
            action: "Open Settlement",
          }))}
        />
        <ExceptionPanel
          title="Dispatch Blockers"
          rows={driverRows.filter((r) => r.blocked).slice(0, 6).map((r) => ({
            key: r.id,
            line: `${r.name} · ${r.compliance.blocker || "Dispatch blocker"}`,
            href: resolveBlockerHref(r),
            action: "Resolve",
          }))}
        />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  data,
  onClickLabel,
}: {
  title: string;
  data: Array<{ label: string; value: number; color: string }>;
  onClickLabel?: (label: string) => void;
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="space-y-2">
        {data.map((d) => (
          <button key={d.label} type="button" onClick={() => onClickLabel?.(d.label)} className="w-full text-left">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{d.label}</span>
              <span>{d.value}</span>
            </div>
            <div className="mt-1 h-2 rounded bg-slate-800">
              <div className={`${d.color} h-2 rounded`} style={{ width: `${Math.max(6, (d.value / total) * 100)}%` }} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ExceptionPanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; line: string; href: string; action: string }>;
}) {
  return (
    <section className="rounded border border-slate-800 bg-slate-950/40 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">No items.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-900/40 px-2 py-1.5">
              <p className="text-xs text-slate-200">{r.line}</p>
              <Link href={r.href} className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200">
                {r.action}
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
