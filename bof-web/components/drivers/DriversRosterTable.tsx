"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
} from "@/lib/dashboard-insights";
import { formatUsd } from "@/lib/format-money";
import { driverPhotoPath } from "@/lib/driver-photo";
import { getOrderedDocumentsForDriver } from "@/lib/driver-queries";
import {
  devLogDriverEligibilitySnapshot,
  getDriverDispatchEligibility,
  warnDispatchEligibilityAllBlocked,
} from "@/lib/driver-dispatch-eligibility";
import { getSafetyScorecardRows } from "@/lib/safety-scorecard";

type Severity = "high" | "medium" | "low";

type DriverRow = {
  driverId: string;
  name: string;
  email?: string;
  phone?: string;
  avatar: string;
  /** Dispatch / roster status */
  status: "Active" | "Review" | "Blocked";
  eligibilityStatus: "ready" | "needs_review" | "blocked";
  dispatchEligibility: string;
  compliance: string;
  safety: "Elite" | "Standard" | "At Risk";
  settlement: "Paid" | "Pending" | "Hold / Review";
  currentOrNextLoad: string;
  documentSummary: string;
  hardBlockers: string[];
  blockerHref?: string;
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

  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const heroImageSrc = "/images/drivers-emma-brown-hero.png";

  const commandHeroChips = useMemo(() => {
    const ready = readinessData.find((p) => p.label === "Ready")?.value ?? 0;
    const needsReview = readinessData.find((p) => p.label === "Needs Review")?.value ?? 0;
    const blocked = readinessData.find((p) => p.label === "Blocked")?.value ?? 0;
    const safetyTierMap = new Map(getSafetyScorecardRows().map((row) => [row.driverId, row.performanceTier]));
    let availableForDispatch = 0;
    for (const driver of data.drivers) {
      const el = getDriverDispatchEligibility(data, driver.id);
      const tier = safetyTierMap.get(driver.id) ?? "Standard";
      if (el.status === "ready" && tier !== "At Risk") availableForDispatch += 1;
    }
    return [
      { label: "Drivers Ready", value: ready, hint: "Dispatch eligibility status: Ready" },
      { label: "Needs Review", value: needsReview, hint: "Soft warnings — review before long haul" },
      { label: "Blocked", value: blocked, hint: "Hard gates on credentials, safety, or finance" },
      { label: "Expiring Documents", value: summary.expiringCredentials, hint: "Drivers with credentials expiring ≤60 days" },
      { label: "Safety At Risk", value: summary.safetyAtRisk, hint: "Drivers in At Risk safety tier" },
      {
        label: "Available for Dispatch",
        value: availableForDispatch,
        hint: "Ready + not safety At Risk (premium lane gate)",
      },
    ];
  }, [data, readinessData, summary]);

  const driverRows = useMemo<DriverRow[]>(() => {
    return data.drivers.map((driver) => {
      const eligibility = getDriverDispatchEligibility(data, driver.id);
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

      const status: DriverRow["status"] =
        eligibility.status === "blocked"
          ? "Blocked"
          : eligibility.status === "needs_review"
            ? "Review"
            : "Active";

      const settlementState: DriverRow["settlement"] =
        hasHold || settlement?.status === "On Hold"
          ? "Hold / Review"
          : settlement?.status === "Paid"
            ? "Paid"
            : "Pending";

      const complianceText =
        eligibility.hardBlockerCount > 0
          ? `${eligibility.complianceLabel} · ${eligibility.hardBlockerCount} hard gate(s)`
          : eligibility.complianceLabel;

      return {
        driverId: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        avatar: driverPhotoPath(driver.id),
        status,
        eligibilityStatus: eligibility.status,
        dispatchEligibility: eligibility.label,
        compliance: complianceText,
        safety: safetyTier,
        settlement: settlementState,
        currentOrNextLoad: activeLoad
          ? `L${activeLoad.number} · ${activeLoad.status}`
          : latestLoad
            ? `L${latestLoad.number} · last delivered`
            : "Unassigned",
        documentSummary: eligibility.documentSummaryLabel,
        hardBlockers: eligibility.hardBlockers,
        blockerHref: eligibility.recommendedAction?.href,
        pendingPay,
      };
    });
  }, [data, safetyTierMap]);

  /** Hero photo subject — caption lines come only from this roster row (no invented status). */
  const emmaSpotlightRow = useMemo(
    () => driverRows.find((r) => r.driverId === "DRV-009") ?? null,
    [driverRows]
  );

  useEffect(() => {
    const list = data.drivers.map((d) => getDriverDispatchEligibility(data, d.id));
    warnDispatchEligibilityAllBlocked(list);
    devLogDriverEligibilitySnapshot(data);
  }, [data]);

  const blockedDriverRows = useMemo(
    () => driverRows.filter((row) => row.eligibilityStatus === "blocked").slice(0, 6),
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

  const safetyRows = useMemo<ExceptionItem[]>(() => {
    return getSafetyScorecardRows()
      .filter((r) => r.performanceTier === "At Risk")
      .map((r) => {
        const name = data.drivers.find((d) => d.id === r.driverId)?.name ?? r.driverName;
        const bits: string[] = [];
        if (r.tireAssetInspection === "Fail") bits.push("Tire / asset inspection failed");
        if (r.cargoDamageUsd > 0) bits.push(`Cargo / claim exposure ${formatUsd(r.cargoDamageUsd)}`);
        if (r.hosCompliancePct < 92) bits.push(`HOS compliance ${r.hosCompliancePct}%`);
        const issue = bits.join(" · ") || "At-risk safety profile — review required";
        const severity: Severity =
          r.driverId === "DRV-008" || (r.driverId === "DRV-004" && r.tireAssetInspection === "Fail")
            ? "high"
            : "medium";
        return {
          key: `safety-${r.driverId}`,
          driver: name,
          issue,
          severity,
          nextStep: "Run safety workflow and clear findings before long haul",
          actionHref: `/drivers/${r.driverId}/safety`,
          actionLabel: "Open Safety",
        };
      })
      .slice(0, 6);
  }, [data]);

  const settlementRows = useMemo<ExceptionItem[]>(
    () =>
      driverRows
        .filter((row) => row.settlement === "Hold / Review" || row.settlement === "Pending")
        .map((row) => {
          const severity: Severity = row.settlement === "Hold / Review" ? "high" : "medium";
          return {
          key: `settlement-${row.driverId}`,
          driver: row.name,
          issue: row.settlement === "Hold / Review" ? "Settlement hold/review active" : "Settlement pending release",
          severity,
          nextStep: "Complete proof + finance review to release pay",
          actionHref: `/drivers/${row.driverId}/settlements`,
          actionLabel: "Open Settlement",
          };
        })
        .slice(0, 6),
    [driverRows]
  );

  const commandCenterRows = useMemo(
    () =>
      getOwnerAttentionQueue(data)
        .filter((item) => item.target.includes("DRV-") || item.area === "Driver readiness")
        .slice(0, 6)
        .map((item) => {
          const severity: Severity =
            item.severity === "critical" || item.severity === "high" ? "high" : "medium";
          return {
            key: item.id,
            driver: item.target,
            issue: item.issue,
            severity,
            nextStep: item.recommendedFix,
            actionHref: item.actionHref,
            actionLabel: item.actionLabel,
          };
        }) satisfies ExceptionItem[],
    [data]
  );

  return (
    <div className="bof-page bof-cc-page">
      <section className="bof-drivers-command-hero" aria-labelledby="bof-drivers-command-title">
        <div className="bof-drivers-command-hero__grid">
          <div className="bof-drivers-command-hero__copy">
            <p className="bof-cc-hero-eyebrow">Driver Operations</p>
            <h1 id="bof-drivers-command-title" className="bof-cc-hero-title">
              Drivers Command Center
            </h1>
            <p className="bof-cc-hero-tagline">
              Track driver readiness, compliance documents, safety risk, dispatch eligibility, and settlement readiness
              across the fleet.
            </p>
            <div className="bof-cc-hero-actions">
              <a href="#driver-blocked-dispatch" className="bof-cc-hero-cta bof-cc-hero-cta-primary">
                Review Blocked Drivers
              </a>
              <Link href="/bof-vault" className="bof-cc-hero-cta bof-cc-hero-cta-secondary">
                Open BOF Vault
              </Link>
              <Link href="/dispatch" className="bof-cc-hero-cta bof-cc-hero-cta-secondary">
                Dispatch Ready Drivers
              </Link>
            </div>
            <div className="bof-drivers-command-hero__chips" aria-label="Live dispatch and readiness metrics">
              {commandHeroChips.map((chip) => (
                <div key={chip.label} className="bof-drivers-command-hero__chip">
                  <span className="bof-drivers-command-hero__chip-label">{chip.label}</span>
                  <span className="bof-drivers-command-hero__chip-value">{chip.value}</span>
                  <span className="bof-drivers-command-hero__chip-hint">{chip.hint}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bof-drivers-command-hero__visual">
            <div className="bof-drivers-command-hero__imagePanel">
              {!heroImageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="bof-drivers-hero__image"
                  src={heroImageSrc}
                  alt="Emma Brown standing in front of a BOF truck at a fleet terminal."
                  onError={() => setHeroImageFailed(true)}
                />
              ) : (
                <div className="bof-drivers-command-hero__placeholder">
                  <strong>Hero image not found</strong>
                  <p>
                    Add <code className="text-teal-300/90">public/images/drivers-emma-brown-hero.png</code> (Emma
                    Brown, DRV-009) for the professional terminal photo. Metrics above remain live from BOF data.
                  </p>
                </div>
              )}
            </div>
            {emmaSpotlightRow ? (
              <div className="bof-drivers-command-hero__caption">
                <Link href={`/drivers/${emmaSpotlightRow.driverId}`} className="bof-drivers-command-hero__caption-title">
                  {emmaSpotlightRow.name} · {emmaSpotlightRow.driverId}
                </Link>
                <p className="bof-drivers-command-hero__caption-line">{emmaSpotlightRow.dispatchEligibility}</p>
                <p className="bof-drivers-command-hero__caption-line bof-drivers-command-hero__caption-muted">
                  {emmaSpotlightRow.currentOrNextLoad}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <nav className="bof-drivers-quick-actions" id="bof-drivers-quick-actions" aria-label="Quick filters and actions">
        <span className="bof-drivers-quick-actions__label">Quick</span>
        <a href="#driver-blocked-dispatch">Blocked roster</a>
        <span className="text-slate-600">·</span>
        <a href="#driver-readiness-charts">Readiness charts</a>
        <span className="text-slate-600">·</span>
        <a href="#driver-exception-panels">Exception panels</a>
        <span className="text-slate-600">·</span>
        <a href="#driver-primary-table">Primary table</a>
      </nav>

      <section id="driver-readiness-charts" className="bof-cc-chart-grid" aria-label="Driver chart breakdowns">
        <ChartCard title="Driver Readiness Breakdown" data={readinessData} />
        <ChartCard title="Safety Tier Distribution" data={safetyData} />
        <ChartCard title="Compliance Status Breakdown" data={complianceData} />
        <ChartCard title="Settlement Status Breakdown" data={settlementData} />
      </section>

      <section id="driver-exception-panels" className="bof-cc-grid-2" aria-label="Driver exception panels">
        <ExceptionPanel
          panelId="driver-blocked-dispatch"
          title="Drivers Blocked From Dispatch"
          items={blockedDriverRows.map((row) => ({
            key: `blocked-${row.driverId}`,
            driver: row.name,
            issue: row.hardBlockers.length ? row.hardBlockers.slice(0, 2).join(" · ") : row.dispatchEligibility,
            severity: "high",
            nextStep: "Clear hard gates (credentials, safety, or settlement block) before dispatch",
            actionHref: row.blockerHref ?? `/drivers/${row.driverId}/dispatch`,
            actionLabel: "Resolve Blocker",
          }))}
        />
        <ExceptionPanel title="Credentials Expiring Soon" items={expiringRows} />
        <ExceptionPanel title="Safety Issues Requiring Action" items={safetyRows} />
        <ExceptionPanel title="Settlement Holds / Pending" items={settlementRows.length > 0 ? settlementRows : commandCenterRows} />
      </section>

      <section id="driver-primary-table" className="bof-cc-panel" aria-label="Driver roster table">
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
                      {row.eligibilityStatus === "blocked" ? (
                        <span className="bof-cc-action-btn bof-cc-action-btn-disabled" aria-disabled="true">
                          Assign Load
                        </span>
                      ) : (
                        <Link
                          href={`/dispatch?driverId=${row.driverId}`}
                          className={[
                            "bof-cc-action-btn",
                            row.eligibilityStatus === "ready" ? "bof-cc-action-btn-primary" : "",
                          ].join(" ")}
                        >
                          Assign Load
                        </Link>
                      )}
                      {row.eligibilityStatus === "needs_review" ? (
                        <Link href={`/drivers/${row.driverId}/profile`} className="bof-cc-action-btn">
                          Review Docs
                        </Link>
                      ) : null}
                      {row.eligibilityStatus === "blocked" ? (
                        <Link
                          href={row.blockerHref ?? `/drivers/${row.driverId}/dispatch`}
                          className="bof-cc-action-btn bof-cc-action-btn-danger"
                        >
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
    label === "Active" || label === "Elite" || label === "Paid"
      ? "bof-cc-chip bof-cc-chip-ok"
      : label === "Blocked" || label === "At Risk" || label === "Hold / Review"
        ? "bof-cc-chip bof-cc-chip-danger"
        : "bof-cc-chip bof-cc-chip-warn";
  return <span className={cls}>{label}</span>;
}

function ExceptionPanel({
  title,
  items,
  panelId,
}: {
  title: string;
  items: ExceptionItem[];
  panelId?: string;
}) {
  return (
    <article className="bof-cc-panel" id={panelId}>
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
