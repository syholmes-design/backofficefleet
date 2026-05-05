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
import { useIntakeEngineStore } from "@/lib/stores/intake-engine-store";
import { devTraceDriverMedicalStatuses } from "@/lib/dev-driver-medical-trace";
import {
  getDriverReviewExplanation,
  type DriverReviewIssueCategory,
} from "@/lib/driver-review-explanation";
import { getDriverTableRowModel } from "@/lib/drivers/driver-table-row-model";
import {
  getSafetyEvidenceByDriverId,
  getSafetyScorecardRows,
} from "@/lib/safety-scorecard";
import { getSafetyEvidenceOpenHref } from "@/components/safety/SafetyEvidenceThumb";
import { DriverReviewDrawer } from "@/components/drivers/DriverReviewDrawer";
import {
  getDriverCommandSummary,
  driverHasExpiringSoonDoc,
  driverHasMissingOrInvalidDoc,
} from "@/lib/drivers/drivers-command-metrics";

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
  primaryDispatchBlockerId?: string;
  pendingPay: number;
  /** BOF load id for dispatch / proof deep links */
  loadLinkId: string | null;
  /** First matching open issue category for compliance-focused review */
  complianceDrawerCategory?: DriverReviewIssueCategory;
  primaryReviewReason: string;
};

type DriverStatusFilter =
  | "all"
  | "ready"
  | "needs_review"
  | "blocked"
  | "expiring_soon"
  | "missing_docs";

type ExceptionItem = {
  key: string;
  driver: string;
  issue: string;
  severity: Severity;
  nextStep: string;
  actionHref: string;
  actionLabel: string;
  /** Primary dispatch blocker id for one-click demo resolve */
  resolveDriverId?: string;
  resolveReasonId?: string;
  onResolveAllDemo?: () => void;
  reviewDriverId?: string;
  reviewFilter?: DriverReviewIssueCategory;
  secondaryActions?: { label: string; href: string }[];
  detailLines?: string[];
};

export function DriversRosterTable() {
  const {
    data,
    resolveDriverDispatchBlocker,
    resolveAllDriverDispatchBlockersForDemo,
    resolveDriverReviewIssue,
    resetDriverReviewOverrides,
  } = useBofDemoData();
  const intakeCommandCenterItems = useIntakeEngineStore((s) => s.commandCenterIntakeItems);

  const [reviewDrawer, setReviewDrawer] = useState<{
    driverId: string;
    filter?: DriverReviewIssueCategory;
  } | null>(null);
  const [driverStatusFilter, setDriverStatusFilter] = useState<DriverStatusFilter>("all");
  const summary = useMemo(() => getDriverDashboardSummary(data), [data]);
  const readinessData = useMemo(() => getDriverReadinessChartData(data), [data]);
  const safetyData = useMemo(() => getSafetyTierChartData(data), [data]);
  const complianceData = useMemo(() => getComplianceStatusChartData(data), [data]);
  const settlementData = useMemo(() => getSettlementStatusChartData(data), [data]);

  const commandSummary = useMemo(() => getDriverCommandSummary(data), [data]);

  const commandHeroChips = useMemo(() => {
    const ready = readinessData.find((p) => p.label === "Ready")?.value ?? 0;
    const needsReview = readinessData.find((p) => p.label === "Action needed")?.value ?? 0;
    const blocked = readinessData.find((p) => p.label === "Dispatch blocked")?.value ?? 0;
    let availableForDispatch = 0;
    for (const driver of data.drivers) {
      const m = getDriverTableRowModel(data, driver.id);
      if (m.status === "ready" && m.safetyLabel !== "At Risk") availableForDispatch += 1;
    }
    return [
      { label: "Drivers Ready", value: ready, hint: "Dispatch eligibility status: Ready" },
      { label: "Action needed", value: needsReview, hint: "Review issues listed on the driver file" },
      { label: "Dispatch blocked", value: blocked, hint: "Hard gates on credentials, safety, or finance" },
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
      const m = getDriverTableRowModel(data, driver.id);
      const openIssues = m.issues.filter((i) => !i.resolved);
      const complianceFocusOrder: DriverReviewIssueCategory[] = [
        "dispatch",
        "credentials",
        "documents",
        "compliance",
      ];
      const complianceDrawerCategory = complianceFocusOrder.find((c) =>
        openIssues.some((i) => i.category === c)
      );

      return {
        driverId: m.driverId,
        name: m.driverName,
        email: driver.email,
        phone: driver.phone,
        avatar: driverPhotoPath(driver.id),
        status: m.statusLabel,
        eligibilityStatus: m.status,
        dispatchEligibility: m.dispatchEligibilityLabel,
        compliance: m.complianceLabel,
        safety: m.safetyLabel,
        settlement: m.settlementLabel,
        currentOrNextLoad: m.currentLoadLabel,
        documentSummary: m.documentsLabel,
        hardBlockers: m.hardBlockers,
        blockerHref: m.blockerHref,
        primaryDispatchBlockerId: m.primaryDispatchBlockerId,
        pendingPay: m.pendingPay,
        loadLinkId: m.loadLinkId,
        complianceDrawerCategory,
        primaryReviewReason: m.primaryReviewReason,
      };
    });
  }, [data]);

  const filteredDriverRows = useMemo(() => {
    if (driverStatusFilter === "all") return driverRows;
    if (driverStatusFilter === "expiring_soon") {
      return driverRows.filter((row) => driverHasExpiringSoonDoc(data, row.driverId));
    }
    if (driverStatusFilter === "missing_docs") {
      return driverRows.filter((row) => driverHasMissingOrInvalidDoc(data, row.driverId));
    }
    return driverRows.filter((row) => row.eligibilityStatus === driverStatusFilter);
  }, [data, driverRows, driverStatusFilter]);

  const applyReadinessBarFilter = (label: string) => {
    if (label === "Ready") setDriverStatusFilter("ready");
    else if (label === "Action needed") setDriverStatusFilter("needs_review");
    else if (label === "Dispatch blocked") setDriverStatusFilter("blocked");
    else return;
    requestAnimationFrame(() => {
      document.getElementById("primary-driver-table")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    const list = data.drivers.map((d) => getDriverDispatchEligibility(data, d.id));
    warnDispatchEligibilityAllBlocked(list);
    devLogDriverEligibilitySnapshot(data);
    devTraceDriverMedicalStatuses(data);
  }, [data]);

  const blockedDriverRows = useMemo(
    () => driverRows.filter((row) => row.eligibilityStatus === "blocked").slice(0, 6),
    [driverRows]
  );

  const expiringRows = useMemo<ExceptionItem[]>(() => {
    const items: ExceptionItem[] = [];
    for (const row of driverRows) {
      const activeLoad = data.loads.find(
        (load) =>
          load.driverId === row.driverId && (load.status === "En Route" || load.status === "Pending")
      );
      const docs = getOrderedDocumentsForDriver(data, row.driverId);
      for (const doc of docs) {
        if (!doc.expirationDate || doc.status.toUpperCase() !== "VALID") continue;
        const days = Math.ceil((new Date(doc.expirationDate).getTime() - Date.now()) / 86400000);
        if (!Number.isFinite(days) || days < 0 || days > 60) continue;
        const secondaryActions =
          activeLoad?.id != null
            ? [
                {
                  label: "Open Load Proof",
                  href: `/dispatch?loadId=${encodeURIComponent(activeLoad.id)}&driverId=${encodeURIComponent(row.driverId)}`,
                },
              ]
            : undefined;
        items.push({
          key: `${row.driverId}-${doc.type}`,
          driver: row.name,
          issue: `${doc.type} expires in ${days} day(s)`,
          severity: days <= 15 ? "high" : "medium",
          nextStep: "Collect renewal and verify in vault",
          actionHref: `/drivers/${row.driverId}/vault`,
          actionLabel: "Open Documents",
          reviewDriverId: row.driverId,
          reviewFilter: "credentials" as const,
          secondaryActions,
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
        const activeLoad = data.loads.find(
          (load) =>
            load.driverId === r.driverId && (load.status === "En Route" || load.status === "Pending")
        );
        const evidence = getSafetyEvidenceByDriverId(r.driverId);
        const firstEvidence = evidence[0];
        const evidenceHref = firstEvidence
          ? getSafetyEvidenceOpenHref(firstEvidence.url) ?? `/drivers/${r.driverId}/safety`
          : null;
        const secondaryActions: { label: string; href: string }[] = [];
        if (activeLoad?.id) {
          secondaryActions.push({
            label: "Open Load Proof",
            href: `/dispatch?loadId=${encodeURIComponent(activeLoad.id)}&driverId=${encodeURIComponent(r.driverId)}`,
          });
        }
        if (evidenceHref) {
          secondaryActions.push({ label: "Review Evidence", href: evidenceHref });
        }
        return {
          key: `safety-${r.driverId}`,
          driver: name,
          issue,
          severity,
          nextStep: "Run safety workflow and clear findings before long haul",
          actionHref: `/drivers/${r.driverId}/safety`,
          actionLabel: "Open Safety",
          reviewDriverId: r.driverId,
          reviewFilter: "safety" as const,
          secondaryActions: secondaryActions.length ? secondaryActions : undefined,
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
          const expl = getDriverReviewExplanation(data, row.driverId);
          const stIssues = expl.issues.filter((i) => !i.resolved && i.category === "settlement");
          const settlementRec = data.settlements?.find((s) => s.driverId === row.driverId);
          const activeLoad = data.loads.find(
            (load) =>
              load.driverId === row.driverId && (load.status === "En Route" || load.status === "Pending")
          );
          const issueTitle =
            stIssues[0]?.title ??
            (row.settlement === "Hold / Review"
              ? "Settlement hold/review active"
              : settlementRec?.pendingReason && settlementRec.pendingReason !== "N/A"
                ? settlementRec.pendingReason
                : "Settlement pending release");
          const whyHold = stIssues[0]?.detail ?? settlementRec?.pendingReason;
          const financialLine =
            row.pendingPay > 0
              ? `Financial exposure: ${formatUsd(row.pendingPay)} pending (money at risk / holds)`
              : settlementRec?.netPay != null && row.settlement !== "Paid"
                ? `Scheduled net pay: ${formatUsd(settlementRec.netPay)}`
                : undefined;
          const recommendedFix =
            stIssues[0]?.recommendedFix ?? "Complete proof + finance review to release pay";
          const docsBlob = stIssues.map((i) => `${i.title} ${i.detail}`).join(" ").toLowerCase();
          const needsFinanceDocs = /\bw-9\b|bank|direct deposit|routing|account/i.test(docsBlob);

          const secondaryActions: { label: string; href: string }[] = [];
          if (settlementRec?.settlementId) {
            secondaryActions.push({
              label: "Open fleet settlement",
              href: `/settlements?settlementId=${encodeURIComponent(settlementRec.settlementId)}`,
            });
          }
          if (activeLoad?.id) {
            secondaryActions.push({
              label: "Open Load Proof",
              href: `/dispatch?loadId=${encodeURIComponent(activeLoad.id)}&driverId=${encodeURIComponent(row.driverId)}`,
            });
          }
          if (needsFinanceDocs) {
            secondaryActions.push({
              label: "Open Documents",
              href: `/drivers/${row.driverId}/vault`,
            });
          }

          const detailLines = [whyHold, financialLine, stIssues[0]?.whyItMatters].filter(
            (x): x is string => Boolean(x && x.trim())
          );

          return {
            key: `settlement-${row.driverId}`,
            driver: row.name,
            issue: issueTitle,
            severity,
            nextStep: recommendedFix,
            actionHref: `/drivers/${row.driverId}/settlements`,
            actionLabel: "Open Settlement",
            reviewDriverId: row.driverId,
            reviewFilter: "settlement" as const,
            secondaryActions: secondaryActions.length ? secondaryActions : undefined,
            detailLines: detailLines.length ? detailLines : undefined,
          };
        })
        .slice(0, 6),
    [data, driverRows]
  );

  const commandCenterRows = useMemo(
    () =>
      getOwnerAttentionQueue(data, intakeCommandCenterItems)
        .filter((item) => item.target.includes("DRV-") || item.area === "Driver readiness")
        .slice(0, 6)
        .map((item) => {
          const severity: Severity =
            item.severity === "critical" || item.severity === "high" ? "high" : "medium";
          const hrefMatch = item.actionHref.match(/\/drivers\/(DRV-[0-9]+)/i);
          const reviewDriverId = item.reviewDriverId ?? hrefMatch?.[1];
          const secondaryActions: { label: string; href: string }[] = [];
          if (item.reviewLoadId) {
            secondaryActions.push({
              label: "Open Load Proof",
              href: `/dispatch?loadId=${encodeURIComponent(item.reviewLoadId)}${
                reviewDriverId ? `&driverId=${encodeURIComponent(reviewDriverId)}` : ""
              }`,
            });
          }
          if (reviewDriverId) {
            const st = data.settlements?.find((s) => s.driverId === reviewDriverId);
            if (st?.settlementId) {
              secondaryActions.push({
                label: "Open fleet settlement",
                href: `/settlements?settlementId=${encodeURIComponent(st.settlementId)}`,
              });
            }
          }
          const detailLines = [
            item.financialImpact != null && item.financialImpact > 0
              ? `Financial impact: ${formatUsd(item.financialImpact)}`
              : undefined,
          ].filter((x): x is string => Boolean(x));
          return {
            key: item.id,
            driver: item.target,
            issue: item.issue,
            severity,
            nextStep: item.recommendedFix,
            actionHref: item.actionHref,
            actionLabel: item.actionLabel,
            reviewDriverId,
            reviewFilter:
              item.area?.includes("Settlement") || item.area?.includes("payroll")
                ? ("settlement" as const)
                : undefined,
            secondaryActions: secondaryActions.length ? secondaryActions : undefined,
            detailLines: detailLines.length ? detailLines : undefined,
          };
        }) satisfies ExceptionItem[],
    [data, intakeCommandCenterItems]
  );

  return (
    <div className="bof-page bof-cc-page">
      <section
        className="bof-drivers-command-header"
        aria-labelledby="bof-drivers-command-title"
      >
        <div className="bof-drivers-command-header__intro">
          <p className="bof-cc-hero-eyebrow">Driver operations</p>
          <h1 id="bof-drivers-command-title" className="bof-cc-hero-title">
            Driver readiness &amp; vault command
          </h1>
          <p className="bof-cc-hero-tagline">
            Canonical driver credentials, vault documents, dispatch gates, and safety posture — one roster view tied
            to the same eligibility engine as dispatch.
          </p>
          <div className="bof-cc-hero-actions">
            <a href="#blocked-roster" className="bof-cc-hero-cta bof-cc-hero-cta-primary">
              Review blocked drivers
            </a>
            <Link href="/bof-vault" className="bof-cc-hero-cta bof-cc-hero-cta-secondary">
              Open BOF Vault
            </Link>
            <Link href="/dispatch" className="bof-cc-hero-cta bof-cc-hero-cta-secondary">
              Open dispatch board
            </Link>
            <Link href="/command-center" className="bof-cc-hero-cta bof-cc-hero-cta-secondary">
              Command Center queue
            </Link>
          </div>
        </div>

        <section className="bof-oper-metrics bof-drivers-kpi-strip" aria-label="Fleet readiness summary">
          <div className="bof-oper-metric">
            <span className="bof-oper-metric-label">Total drivers</span>
            <strong className="bof-oper-metric-value">{commandSummary.totalDrivers}</strong>
          </div>
          <div className="bof-oper-metric">
            <span className="bof-oper-metric-label">Ready</span>
            <strong className="bof-oper-metric-value">{commandSummary.ready}</strong>
          </div>
          <div className="bof-oper-metric">
            <span className="bof-oper-metric-label">Needs review</span>
            <strong className="bof-oper-metric-value">{commandSummary.needsReview}</strong>
          </div>
          <div className="bof-oper-metric">
            <span className="bof-oper-metric-label">Dispatch blocked</span>
            <strong className="bof-oper-metric-value">{commandSummary.dispatchBlocked}</strong>
          </div>
          <div className="bof-oper-metric">
            <span className="bof-oper-metric-label">Expiring soon</span>
            <strong className="bof-oper-metric-value">{commandSummary.expiringSoonDrivers}</strong>
          </div>
          <div className="bof-oper-metric">
            <span className="bof-oper-metric-label">Missing / invalid docs</span>
            <strong className="bof-oper-metric-value">{commandSummary.missingOrInvalidDocsDrivers}</strong>
          </div>
          <div className="bof-oper-metric">
            <span className="bof-oper-metric-label">Safety at risk</span>
            <strong className="bof-oper-metric-value">{commandSummary.safetyAtRiskDrivers}</strong>
          </div>
        </section>

        <div className="bof-drivers-filter-bar" role="toolbar" aria-label="Filter driver roster">
          {[
            { id: "all" as const, label: "All" },
            { id: "ready" as const, label: "Ready" },
            { id: "needs_review" as const, label: "Needs review" },
            { id: "blocked" as const, label: "Dispatch blocked" },
            { id: "expiring_soon" as const, label: "Expiring soon" },
            { id: "missing_docs" as const, label: "Missing docs" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`bof-drivers-filter-pill ${driverStatusFilter === f.id ? "bof-drivers-filter-pill--active" : ""}`}
              onClick={() => {
                setDriverStatusFilter(f.id);
                requestAnimationFrame(() => {
                  document.getElementById("primary-driver-table")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                });
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bof-drivers-secondary-metrics" aria-label="Secondary readiness breakdown">
          {commandHeroChips.map((chip) => (
            <div key={chip.label} className="bof-drivers-secondary-metric">
              <span className="bof-drivers-secondary-metric__label">{chip.label}</span>
              <span className="bof-drivers-secondary-metric__value">{chip.value}</span>
              <span className="bof-drivers-secondary-metric__hint">{chip.hint}</span>
            </div>
          ))}
        </div>
      </section>

      <nav className="bof-drivers-quick-actions" id="bof-drivers-quick-actions" aria-label="Quick filters and actions">
        <span className="bof-drivers-quick-actions__label">Quick</span>
        <a href="#blocked-roster">Blocked roster</a>
        <span className="text-slate-600">·</span>
        <a href="#readiness-charts">Readiness charts</a>
        <span className="text-slate-600">·</span>
        <a href="#exception-panels">Exception panels</a>
        <span className="text-slate-600">·</span>
        <a href="#primary-driver-table">Primary table</a>
      </nav>

      <section id="readiness-charts" className="bof-cc-chart-grid" aria-label="Driver chart breakdowns">
        <ChartCard
          title="Driver Readiness Breakdown"
          data={readinessData}
          onBarClick={applyReadinessBarFilter}
        />
        <ChartCard title="Safety Tier Distribution" data={safetyData} />
        <ChartCard title="Compliance Status Breakdown" data={complianceData} />
        <ChartCard title="Settlement Status Breakdown" data={settlementData} />
      </section>

      <section id="exception-panels" className="bof-cc-grid-2" aria-label="Driver exception panels">
        <ExceptionPanel
          panelId="blocked-roster"
          title="Drivers Blocked From Dispatch"
          items={blockedDriverRows.map((row) => {
            const elig = getDriverDispatchEligibility(data, row.driverId);
            const first = elig.hardBlockerDetails[0];
            const expl = getDriverReviewExplanation(data, row.driverId);
            const openIssues = expl.issues.filter((i) => !i.resolved);
            const reasonLine =
              openIssues.length > 0
                ? openIssues
                    .slice(0, 3)
                    .map((i) => i.title)
                    .join(" · ")
                : row.hardBlockers.length
                  ? row.hardBlockers.slice(0, 2).join(" · ")
                  : row.dispatchEligibility;
            return {
              key: `blocked-${row.driverId}`,
              driver: row.name,
              issue: reasonLine,
              severity: "high" as const,
              nextStep:
                "Clear hard gates in vault / safety / finance, or use a demo override to rehearse downstream flows.",
              actionHref: row.blockerHref ?? `/drivers/${row.driverId}/vault`,
              actionLabel: "Open workspace",
              resolveDriverId: row.driverId,
              resolveReasonId: first?.id,
              onResolveAllDemo: () => resolveAllDriverDispatchBlockersForDemo(row.driverId),
              reviewDriverId: row.driverId,
            };
          })}
          onResolveDispatchDemo={(driverId, reasonId) =>
            resolveDriverDispatchBlocker(driverId, reasonId, "Drivers command — resolve blocker (demo)")
          }
          onOpenReview={(driverId, filter) => setReviewDrawer({ driverId, filter })}
        />
        <ExceptionPanel
          title="Credentials Expiring Soon"
          items={expiringRows}
          onOpenReview={(driverId, filter) => setReviewDrawer({ driverId, filter })}
        />
        <ExceptionPanel
          title="Safety Issues Requiring Action"
          items={safetyRows}
          onOpenReview={(driverId, filter) => setReviewDrawer({ driverId, filter })}
        />
        <ExceptionPanel
          title="Settlement Holds / Pending"
          items={settlementRows.length > 0 ? settlementRows : commandCenterRows}
          onOpenReview={(driverId, filter) => setReviewDrawer({ driverId, filter })}
        />
      </section>

      <section id="primary-driver-table" className="bof-cc-panel" aria-label="Driver roster table">
        <div className="bof-cc-panel-head">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="bof-h2">Primary Driver Table</h2>
              <p className="bof-cc-panel-sub">All 12 drivers with readiness, risk posture, and owner actions.</p>
            </div>
            {driverStatusFilter !== "all" ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="bof-cc-chip bof-cc-chip-warn" title="Roster filter active">
                  Filter:{" "}
                  {driverStatusFilter === "ready"
                    ? "Ready"
                    : driverStatusFilter === "needs_review"
                      ? "Needs review"
                      : driverStatusFilter === "blocked"
                        ? "Dispatch blocked"
                        : driverStatusFilter === "expiring_soon"
                          ? "Expiring soon"
                          : driverStatusFilter === "missing_docs"
                            ? "Missing docs"
                            : "—"}
                </span>
                <button
                  type="button"
                  className="bof-cc-action-btn"
                  onClick={() => setDriverStatusFilter("all")}
                >
                  Clear filter
                </button>
              </div>
            ) : null}
          </div>
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
              {filteredDriverRows.map((row) => (
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
                  <td>
                    <StatusChip
                      label={row.status}
                      onClick={() =>
                        setReviewDrawer({
                          driverId: row.driverId,
                          filter: row.status === "Blocked" ? "dispatch" : undefined,
                        })
                      }
                    />
                    {row.eligibilityStatus === "needs_review" && row.primaryReviewReason ? (
                      <p className="bof-cc-driver-meta" style={{ marginTop: "0.35rem" }}>
                        Reason: {row.primaryReviewReason}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    {row.eligibilityStatus === "needs_review" || row.eligibilityStatus === "blocked" ? (
                      <button
                        type="button"
                        className="bof-driver-review-dispatch-link text-left"
                        onClick={() => setReviewDrawer({ driverId: row.driverId })}
                      >
                        {row.dispatchEligibility}
                      </button>
                    ) : (
                      row.dispatchEligibility
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="bof-driver-review-dispatch-link text-left"
                      onClick={() =>
                        setReviewDrawer({
                          driverId: row.driverId,
                          filter: row.complianceDrawerCategory,
                        })
                      }
                    >
                      {row.compliance}
                    </button>
                  </td>
                  <td>
                    {row.safety === "At Risk" ? (
                      <button
                        type="button"
                        className="bof-cc-chip bof-cc-chip-danger bof-cc-chip-action"
                        onClick={() =>
                          setReviewDrawer({ driverId: row.driverId, filter: "safety" })
                        }
                        title="Open driver review — safety"
                      >
                        {row.safety}
                      </button>
                    ) : (
                      <Link
                        href={`/drivers/${row.driverId}/safety`}
                        className={[
                          "bof-cc-chip inline-flex no-underline hover:opacity-90",
                          row.safety === "Elite" ? "bof-cc-chip-ok" : "bof-cc-chip-warn",
                        ].join(" ")}
                      >
                        {row.safety}
                      </Link>
                    )}
                  </td>
                  <td>
                    {row.settlement === "Paid" ? (
                      <Link
                        href={`/drivers/${row.driverId}/settlements`}
                        className="bof-cc-chip bof-cc-chip-ok inline-flex no-underline hover:opacity-90"
                      >
                        {row.settlement}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={`bof-cc-chip ${row.settlement === "Hold / Review" ? "bof-cc-chip-danger" : "bof-cc-chip-warn"} bof-cc-chip-action`}
                        onClick={() =>
                          setReviewDrawer({ driverId: row.driverId, filter: "settlement" })
                        }
                        title="Open driver review — settlement"
                      >
                        {row.settlement}
                      </button>
                    )}
                    {row.pendingPay > 0 ? <p className="bof-cc-driver-meta">{formatUsd(row.pendingPay)} pending</p> : null}
                  </td>
                  <td>
                    {row.loadLinkId ? (
                      <Link
                        href={`/dispatch?loadId=${encodeURIComponent(row.loadLinkId)}&driverId=${encodeURIComponent(row.driverId)}`}
                        className="bof-driver-review-dispatch-link"
                      >
                        {row.currentOrNextLoad}
                      </Link>
                    ) : (
                      row.currentOrNextLoad
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="bof-driver-review-dispatch-link text-left"
                      onClick={() =>
                        setReviewDrawer({
                          driverId: row.driverId,
                          filter: "documents",
                        })
                      }
                    >
                      {row.documentSummary}
                    </button>
                  </td>
                  <td>
                    <div className="bof-cc-action-wrap">
                      <Link href={`/drivers/${row.driverId}`} className="bof-cc-action-btn">Profile</Link>
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
                      {row.eligibilityStatus === "needs_review" || row.eligibilityStatus === "blocked" ? (
                        <button
                          type="button"
                          className="bof-cc-action-btn"
                          onClick={() => setReviewDrawer({ driverId: row.driverId })}
                        >
                          Review Docs
                        </button>
                      ) : null}
                      {row.eligibilityStatus === "blocked" && row.primaryDispatchBlockerId ? (
                        <>
                          <button
                            type="button"
                            className="bof-cc-action-btn bof-cc-action-btn-danger"
                            onClick={() =>
                              resolveDriverDispatchBlocker(
                                row.driverId,
                                row.primaryDispatchBlockerId!,
                                "Primary dispatch blocker — demo override"
                              )
                            }
                          >
                            Resolve blocker (demo)
                          </button>
                          <Link href={row.blockerHref ?? `/drivers/${row.driverId}/vault`} className="bof-cc-action-btn">
                            Open workspace
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {reviewDrawer ? (
        <DriverReviewDrawer
          data={data}
          driverId={reviewDrawer.driverId}
          filterCategory={reviewDrawer.filter}
          onClose={() => setReviewDrawer(null)}
          resolveDriverDispatchBlocker={resolveDriverDispatchBlocker}
          resolveDriverReviewIssue={resolveDriverReviewIssue}
          resetDriverReviewOverrides={resetDriverReviewOverrides}
        />
      ) : null}
    </div>
  );
}

function toneClass(tone: BreakdownPoint["tone"]): string {
  if (tone === "ok") return "bof-cc-bar-ok";
  if (tone === "warn") return "bof-cc-bar-warn";
  if (tone === "danger") return "bof-cc-bar-danger";
  return "bof-cc-bar-info";
}

function ChartCard({
  title,
  data,
  onBarClick,
}: {
  title: string;
  data: BreakdownPoint[];
  onBarClick?: (label: string) => void;
}) {
  const total = data.reduce((sum, point) => sum + point.value, 0) || 1;
  const readinessInteractive =
    Boolean(onBarClick) &&
    (title === "Driver Readiness Breakdown" || title.toLowerCase().includes("readiness breakdown"));
  return (
    <article className="bof-cc-panel">
      <h3 className="bof-cc-panel-title">{title}</h3>
      <div className="bof-cc-bars">
        {data.map((point) => {
          const isFilterBar =
            readinessInteractive &&
            (point.label === "Ready" ||
              point.label === "Action needed" ||
              point.label === "Dispatch blocked");
          return (
            <div key={point.label} className="bof-cc-bar-row">
              <div className="bof-cc-bar-meta">
                {isFilterBar ? (
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded border border-transparent bg-transparent px-0 py-0.5 text-left font-inherit text-inherit hover:border-teal-600/35 hover:bg-teal-950/25"
                    onClick={() => onBarClick?.(point.label)}
                    title="Apply this readiness filter to the primary table"
                  >
                    <span>{point.label}</span>
                    <strong>{point.value}</strong>
                  </button>
                ) : (
                  <>
                    <span>{point.label}</span>
                    <strong>{point.value}</strong>
                  </>
                )}
              </div>
              <div className="bof-cc-bar-track">
                <div
                  className={`bof-cc-bar-fill ${toneClass(point.tone)}`}
                  style={{ width: `${Math.max(8, (point.value / total) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function StatusChip({ label, onClick }: { label: string; onClick?: () => void }) {
  const cls =
    label === "Active" || label === "Elite" || label === "Paid"
      ? "bof-cc-chip bof-cc-chip-ok"
      : label === "Blocked" || label === "At Risk" || label === "Hold / Review"
        ? "bof-cc-chip bof-cc-chip-danger"
        : "bof-cc-chip bof-cc-chip-warn";
  if (onClick) {
    return (
      <button
        type="button"
        className={`${cls} bof-cc-chip-action`}
        onClick={onClick}
        title="Open driver review"
      >
        {label}
      </button>
    );
  }
  return <span className={cls}>{label}</span>;
}

function ExceptionPanel({
  title,
  items,
  panelId,
  onResolveDispatchDemo,
  onOpenReview,
}: {
  title: string;
  items: ExceptionItem[];
  panelId?: string;
  onResolveDispatchDemo?: (driverId: string, reasonId: string) => void;
  onOpenReview?: (driverId: string, filter?: DriverReviewIssueCategory) => void;
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
                {item.detailLines?.map((line, idx) => (
                  <p key={`${item.key}-ctx-${idx}`} className="bof-cc-exception-next text-slate-400">
                    {line}
                  </p>
                ))}
                <p className="bof-cc-exception-next">{item.nextStep}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "stretch" }}>
                {item.resolveDriverId && item.resolveReasonId && onResolveDispatchDemo ? (
                  <button
                    type="button"
                    className="bof-cc-action-btn bof-cc-action-btn-danger"
                    onClick={() => onResolveDispatchDemo(item.resolveDriverId!, item.resolveReasonId!)}
                  >
                    Resolve blocker (demo)
                  </button>
                ) : null}
                {item.onResolveAllDemo ? (
                  <button type="button" className="bof-cc-action-btn" onClick={item.onResolveAllDemo}>
                    Resolve all for demo
                  </button>
                ) : null}
                {item.reviewDriverId && onOpenReview ? (
                  <button
                    type="button"
                    className="bof-cc-action-btn bof-cc-action-btn-primary"
                    onClick={() => onOpenReview(item.reviewDriverId!, item.reviewFilter)}
                  >
                    View review
                  </button>
                ) : null}
                <Link href={item.actionHref} className="bof-cc-action-btn">
                  {item.actionLabel}
                </Link>
                {item.secondaryActions?.map((a) => (
                  <Link key={a.label + a.href} href={a.href} className="bof-cc-action-btn">
                    {a.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
