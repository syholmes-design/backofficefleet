"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DriverAvatar } from "@/components/DriverAvatar";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  getComplianceStatusChartData,
  getDriverDashboardSummary,
  getDriverReadinessChartData,
  getOwnerAttentionQueue,
  getSafetyTierChartData,
  getSettlementStatusChartData,
  type BreakdownPoint,
  type DashboardKpi,
} from "@/lib/dashboard-insights";
import { formatUsd } from "@/lib/format-money";
import { driverPhotoPath } from "@/lib/driver-photo";
import { getOrderedDocumentsForDriver, readinessFromDocuments } from "@/lib/driver-queries";
import { getSafetyScorecardRows } from "@/lib/safety-scorecard";

type Severity = "high" | "medium" | "low";

type DriverRow = {
  driverId: string;
  name: string;
  email?: string;
  phone?: string;
  avatar: string;
  status: "Dispatch Ready" | "Needs Review" | "Blocked";
  dispatchEligibility: string;
  compliance: string;
  safety: "Elite" | "Standard" | "At Risk";
  settlement: "Paid" | "Pending" | "Hold / Review";
  currentOrNextLoad: string;
  documentSummary: string;
  blocker?: string;
  pendingPay: number;
};

type ExceptionItem = {
  key: string;
  driver: string;
  issue: string;
  severity: Severity;
  nextStep: string;
  actionHref: string;
  actionLabel: string;
};

export function DriversRosterTable() {
  const { data } = useBofDemoData();
  const safetyTierMap = useMemo(
    () => new Map(getSafetyScorecardRows().map((row) => [row.driverId, row.performanceTier])),
    []
  );
  const summary = useMemo(() => getDriverDashboardSummary(data), [data]);
  const readinessData = useMemo(() => getDriverReadinessChartData(data), [data]);
  const safetyData = useMemo(() => getSafetyTierChartData(data), [data]);
  const complianceData = useMemo(() => getComplianceStatusChartData(data), [data]);
  const settlementData = useMemo(() => getSettlementStatusChartData(data), [data]);

  const driverRows = useMemo<DriverRow[]>(() => {
    return data.drivers.map((driver) => {
      const docs = getOrderedDocumentsForDriver(data, driver.id);
      const readiness = readinessFromDocuments(docs);
      const expiring = docs.filter((doc) => {
        if (!doc.expirationDate || doc.status.toUpperCase() !== "VALID") return false;
        const days = Math.ceil((new Date(doc.expirationDate).getTime() - Date.now()) / 86400000);
        return Number.isFinite(days) && days >= 0 && days <= 45;
      }).length;
      const complianceIncidents = data.complianceIncidents.filter(
        (incident) => incident.driverId === driver.id && incident.status.toUpperCase() === "OPEN"
      );
      const criticalIncident = complianceIncidents.find((incident) => incident.severity === "CRITICAL");
      const safetyTier = (safetyTierMap.get(driver.id) ?? "Standard") as DriverRow["safety"];
      const settlement = data.settlements.find((row) => row.driverId === driver.id);
      const hasHold = data.moneyAtRisk.some(
        (item) => item.driverId === driver.id && item.status.toUpperCase() === "BLOCKED"
      );
      const pendingPay = data.moneyAtRisk
        .filter((item) => item.driverId === driver.id && item.status.toUpperCase() !== "PAID")
        .reduce((sum, item) => sum + item.amount, 0);

      const activeLoad = data.loads.find(
        (load) => load.driverId === driver.id && (load.status === "En Route" || load.status === "Pending")
      );
      const latestLoad = data.loads.find((load) => load.driverId === driver.id);

      const isBlocked =
        readiness.expired > 0 ||
        readiness.missing > 0 ||
        !!criticalIncident ||
        hasHold ||
        safetyTier === "At Risk";
      const needsReview = !isBlocked && (expiring > 0 || complianceIncidents.length > 0 || settlement?.status === "Pending");
      const status: DriverRow["status"] = isBlocked ? "Blocked" : needsReview ? "Needs Review" : "Dispatch Ready";

      const settlementState: DriverRow["settlement"] =
        hasHold || settlement?.status === "On Hold"
          ? "Hold / Review"
          : settlement?.status === "Paid"
            ? "Paid"
            : "Pending";

      return {
        driverId: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        avatar: driverPhotoPath(driver.id),
        status,
        dispatchEligibility:
          status === "Dispatch Ready"
            ? "Eligible now"
            : status === "Needs Review"
              ? "Review before assign"
              : "Blocked until resolved",
        compliance:
          readiness.expired > 0 || readiness.missing > 0
            ? `${readiness.missing + readiness.expired} doc blocker(s)`
            : complianceIncidents.length > 0
              ? `${complianceIncidents.length} open incident(s)`
              : "Compliant",
        safety: safetyTier,
        settlement: settlementState,
        currentOrNextLoad: activeLoad
          ? `L${activeLoad.number} · ${activeLoad.status}`
          : latestLoad
            ? `L${latestLoad.number} · last delivered`
            : "Unassigned",
        documentSummary:
          expiring > 0 ? `${expiring} expiring soon` : readiness.missing + readiness.expired > 0 ? "Requires updates" : "All core docs valid",
        blocker: criticalIncident?.type ?? (isBlocked ? "Readiness blocker active" : undefined),
        pendingPay,
      };
    });
  }, [data, safetyTierMap]);

  const kpis = useMemo<DashboardKpi[]>(
    () => [
      { label: "Active Drivers", value: summary.activeDrivers, hint: "Total driver profiles in fleet demo.", tone: "info" },
      { label: "Dispatch Ready", value: summary.dispatchReady, hint: "Immediately assignable drivers.", tone: "ok" },
      { label: "Compliance Blocked", value: summary.complianceBlocked, hint: "Drivers blocked by doc/compliance gaps.", tone: "danger" },
      { label: "Safety At Risk", value: summary.safetyAtRisk, hint: "Drivers in at-risk safety tier.", tone: "danger" },
      { label: "Settlement Pending", value: summary.settlementPending, hint: "Pending or hold/review settlements.", tone: "warn" },
      { label: "Expiring Credentials", value: summary.expiringCredentials, hint: "Drivers with credentials expiring <= 60 days.", tone: "warn" },
    ],
    [summary]
  );

  const blockedDriverRows = useMemo(
    () => driverRows.filter((row) => row.status === "Blocked").slice(0, 6),
    [driverRows]
  );

  const expiringRows = useMemo<ExceptionItem[]>(() => {
    const items: ExceptionItem[] = [];
    for (const row of driverRows) {
      const docs = getOrderedDocumentsForDriver(data, row.driverId);
      for (const doc of docs) {
        if (!doc.expirationDate || doc.status.toUpperCase() !== "VALID") continue;
        const days = Math.ceil((new Date(doc.expirationDate).getTime() - Date.now()) / 86400000);
        if (!Number.isFinite(days) || days < 0 || days > 60) continue;
        items.push({
          key: `${row.driverId}-${doc.type}`,
          driver: row.name,
          issue: `${doc.type} expires in ${days} day(s)`,
          severity: days <= 15 ? "high" : "medium",
          nextStep: "Collect renewal and verify in vault",
          actionHref: `/drivers/${row.driverId}/vault`,
          actionLabel: "Open Documents",
        });
      }
    }
    return items.slice(0, 6);
  }, [data, driverRows]);

  const safetyRows = useMemo<ExceptionItem[]>(
    () =>
      driverRows
        .filter((row) => row.safety === "At Risk")
        .map((row) => ({
          key: `safety-${row.driverId}`,
          driver: row.name,
          issue: row.blocker ?? "Safety review required",
          severity: "high",
          nextStep: "Run safety action workflow and clear findings",
          actionHref: `/drivers/${row.driverId}/safety`,
          actionLabel: "Open Safety",
        }))
        .slice(0, 6),
    [driverRows]
  );

  const settlementRows = useMemo<ExceptionItem[]>(
    () =>
      driverRows
        .filter((row) => row.settlement === "Hold / Review" || row.settlement === "Pending")
        .map((row) => ({
          key: `settlement-${row.driverId}`,
          driver: row.name,
          issue: row.settlement === "Hold / Review" ? "Settlement hold/review active" : "Settlement pending release",
          severity: row.settlement === "Hold / Review" ? "high" : "medium",
          nextStep: "Complete proof + finance review to release pay",
          actionHref: `/drivers/${row.driverId}/settlements`,
          actionLabel: "Open Settlement",
        }))
        .slice(0, 6),
    [driverRows]
  );

  const commandCenterRows = useMemo(
    () =>
      getOwnerAttentionQueue(data)
        .filter((item) => item.target.includes("DRV-") || item.area === "Driver readiness")
        .slice(0, 6)
        .map((item) => ({
          key: item.id,
          driver: item.target,
          issue: item.issue,
          severity: item.severity === "critical" || item.severity === "high" ? "high" : "medium",
          nextStep: item.recommendedFix,
          actionHref: item.actionHref,
          actionLabel: item.actionLabel,
        })) satisfies ExceptionItem[],
    [data]
  );

  return (
    <div className="bof-page bof-cc-page">
      <section className="bof-cc-hero">
        <p className="bof-cc-kicker">Fleet-owner control surface</p>
        <h1 className="bof-title bof-cc-title">Drivers Command Center</h1>
        <p className="bof-lead bof-cc-lead">
          Monitor driver readiness, compliance, safety, settlement status, and dispatch eligibility from one view.
        </p>
        <div className="bof-cc-hero-actions">
          <Link href="/dispatch" className="bof-cc-btn bof-cc-btn-primary">Assign Loads</Link>
          <Link href="/documents" className="bof-cc-btn">Open Documents</Link>
          <Link href="/safety" className="bof-cc-btn">Open Safety</Link>
        </div>
      </section>

      <section className="bof-cc-kpi-grid" aria-label="Driver KPI cards">
        {kpis.map((kpi) => (
          <article key={kpi.label} className={`bof-cc-kpi bof-cc-tone-${kpi.tone}`}>
            <p className="bof-cc-kpi-label">{kpi.label}</p>
            <p className="bof-cc-kpi-value">{kpi.value}</p>
            <p className="bof-cc-kpi-hint">{kpi.hint}</p>
          </article>
        ))}
      </section>

      <section className="bof-cc-chart-grid" aria-label="Driver chart breakdowns">
        <ChartCard title="Driver Readiness Breakdown" data={readinessData} />
        <ChartCard title="Safety Tier Distribution" data={safetyData} />
        <ChartCard title="Compliance Status Breakdown" data={complianceData} />
        <ChartCard title="Settlement Status Breakdown" data={settlementData} />
      </section>

      <section className="bof-cc-panel" aria-label="Driver roster table">
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Primary Driver Table</h2>
          <p className="bof-cc-panel-sub">All 12 drivers with readiness, risk posture, and owner actions.</p>
        </div>
        <div className="bof-cc-table-wrap">
          <table className="bof-cc-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Status</th>
                <th>Dispatch Eligibility</th>
                <th>Compliance</th>
                <th>Safety</th>
                <th>Settlement</th>
                <th>Current / Next Load</th>
                <th>Documents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {driverRows.map((row) => (
                <tr key={row.driverId}>
                  <td>
                    <div className="bof-cc-driver-cell">
                      <DriverAvatar name={row.name} photoUrl={row.avatar} size={40} />
                      <div>
                        <p className="bof-cc-driver-name">{row.name}</p>
                        <p className="bof-cc-driver-meta">{row.driverId}</p>
                        <p className="bof-cc-driver-meta">{row.email ?? row.phone ?? "No contact on file"}</p>
                      </div>
                    </div>
                  </td>
                  <td><StatusChip label={row.status} /></td>
                  <td>{row.dispatchEligibility}</td>
                  <td>{row.compliance}</td>
                  <td><StatusChip label={row.safety} /></td>
                  <td>
                    <StatusChip label={row.settlement} />
                    {row.pendingPay > 0 ? <p className="bof-cc-driver-meta">{formatUsd(row.pendingPay)} pending</p> : null}
                  </td>
                  <td>{row.currentOrNextLoad}</td>
                  <td>{row.documentSummary}</td>
                  <td>
                    <div className="bof-cc-action-wrap">
                      <Link href={`/drivers/${row.driverId}/profile`} className="bof-cc-action-btn">Profile</Link>
                      <Link href={`/drivers/${row.driverId}/vault`} className="bof-cc-action-btn">Docs</Link>
                      <Link href={`/drivers/${row.driverId}/hr`} className="bof-cc-action-btn">HR</Link>
                      <Link href={`/drivers/${row.driverId}/safety`} className="bof-cc-action-btn">Safety</Link>
                      <Link href={`/drivers/${row.driverId}/settlements`} className="bof-cc-action-btn">Settlement</Link>
                      <Link href={`/dispatch?driverId=${row.driverId}`} className="bof-cc-action-btn bof-cc-action-btn-primary">Assign Load</Link>
                      {row.status === "Blocked" ? (
                        <Link href={`/drivers/${row.driverId}/dispatch`} className="bof-cc-action-btn bof-cc-action-btn-danger">
                          Resolve Blocker
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bof-cc-grid-2" aria-label="Driver exception panels">
        <ExceptionPanel title="Drivers Blocked From Dispatch" items={blockedDriverRows.map((row) => ({
          key: `blocked-${row.driverId}`,
          driver: row.name,
          issue: row.blocker ?? row.compliance,
          severity: "high",
          nextStep: "Open driver dispatch readiness and clear blocker",
          actionHref: `/drivers/${row.driverId}/dispatch`,
          actionLabel: "Resolve Blocker",
        }))} />
        <ExceptionPanel title="Credentials Expiring Soon" items={expiringRows} />
        <ExceptionPanel title="Safety Issues Requiring Action" items={safetyRows} />
        <ExceptionPanel title="Settlement Holds / Pending" items={settlementRows.length > 0 ? settlementRows : commandCenterRows} />
      </section>
    </div>
  );
}

function toneClass(tone: BreakdownPoint["tone"]): string {
  if (tone === "ok") return "bof-cc-bar-ok";
  if (tone === "warn") return "bof-cc-bar-warn";
  if (tone === "danger") return "bof-cc-bar-danger";
  return "bof-cc-bar-info";
}

function ChartCard({ title, data }: { title: string; data: BreakdownPoint[] }) {
  const total = data.reduce((sum, point) => sum + point.value, 0) || 1;
  return (
    <article className="bof-cc-panel">
      <h3 className="bof-cc-panel-title">{title}</h3>
      <div className="bof-cc-bars">
        {data.map((point) => (
          <div key={point.label} className="bof-cc-bar-row">
            <div className="bof-cc-bar-meta">
              <span>{point.label}</span>
              <strong>{point.value}</strong>
            </div>
            <div className="bof-cc-bar-track">
              <div className={`bof-cc-bar-fill ${toneClass(point.tone)}`} style={{ width: `${Math.max(8, (point.value / total) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function StatusChip({ label }: { label: string }) {
  const cls =
    label === "Dispatch Ready" || label === "Elite" || label === "Paid"
      ? "bof-cc-chip bof-cc-chip-ok"
      : label === "Blocked" || label === "At Risk" || label === "Hold / Review"
        ? "bof-cc-chip bof-cc-chip-danger"
        : "bof-cc-chip bof-cc-chip-warn";
  return <span className={cls}>{label}</span>;
}

function ExceptionPanel({ title, items }: { title: string; items: ExceptionItem[] }) {
  return (
    <article className="bof-cc-panel">
      <h3 className="bof-cc-panel-title">{title}</h3>
      {items.length === 0 ? (
        <p className="bof-cc-panel-sub">No active exceptions right now.</p>
      ) : (
        <div className="bof-cc-exception-list">
          {items.map((item) => (
            <div key={item.key} className={`bof-cc-exception-row bof-cc-exception-${item.severity}`}>
              <div>
                <p className="bof-cc-exception-title">{item.driver}</p>
                <p className="bof-cc-exception-issue">{item.issue}</p>
                <p className="bof-cc-exception-next">{item.nextStep}</p>
              </div>
              <Link href={item.actionHref} className="bof-cc-action-btn">
                {item.actionLabel}
              </Link>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
