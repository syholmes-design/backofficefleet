"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { IntakeFilterTab, IntakeRecord } from "@/lib/intake-engine-types";
import { intakeTriggerSummary } from "@/lib/intake-engine-triggers";
import { intakeKpis, useIntakeEngineStore } from "@/lib/stores/intake-engine-store";
import { BofIntakeFormPrimaryPanel } from "@/components/documents/BofIntakeFormPrimaryPanel";
import { BofWorkflowFormShortcuts } from "@/components/documents/BofWorkflowFormShortcuts";
import { BofTemplateUsageSurface } from "@/components/documents/BofTemplateUsageSurface";
import { DynamicIntakeDispatchPanel } from "@/components/intake-engine/DynamicIntakeDispatchPanel";
import { CollapsibleAdvancedPanel } from "@/components/intake-engine/CollapsibleAdvancedPanel";
import { toBofIntakeEntityId } from "@/lib/bof-intake-entity";
import { buildBofIntakeSurfaceContextFromInbox } from "@/lib/bof-intake-surface-context";

const TABS: { id: IntakeFilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "needs_review", label: "Needs review" },
  { id: "ready_for_approval", label: "Ready for approval" },
  { id: "single_trip", label: "Single trip" },
  { id: "multi_trip", label: "Multi trip" },
  { id: "driver_docs", label: "Driver docs" },
  { id: "claims", label: "Claims" },
];

function filterIntakes(tab: IntakeFilterTab, rows: IntakeRecord[]): IntakeRecord[] {
  switch (tab) {
    case "all":
      return rows;
    case "new":
      return rows.filter((i) => i.status === "new");
    case "needs_review":
      return rows.filter(
        (i) =>
          i.status === "needs_review" ||
          (i.needs_review && i.status !== "finalized" && i.status !== "rejected")
      );
    case "ready_for_approval":
      return rows.filter((i) => i.status === "ready_for_approval");
    case "single_trip":
      return rows.filter((i) => i.intake_kind === "single_trip");
    case "multi_trip":
      return rows.filter((i) => i.intake_kind === "multi_trip");
    case "driver_docs":
      return rows.filter((i) => i.intake_kind === "driver_document");
    case "claims":
      return rows.filter((i) => i.intake_kind === "claim_document");
    default:
      return rows;
  }
}

function kindLabel(k: IntakeRecord["intake_kind"]): string {
  const m: Record<IntakeRecord["intake_kind"], string> = {
    single_trip: "Single trip",
    multi_trip: "Multi trip",
    load_document: "Load document",
    driver_document: "Driver document",
    claim_document: "Claim",
    billing_document: "Billing",
  };
  return m[k];
}

function packetSummary(i: IntakeRecord): string {
  const types = [...new Set(i.attachments.map((a) => a.doc_classification))];
  if (types.length === 0) return "—";
  return types.slice(0, 3).join(", ") + (types.length > 3 ? "…" : "");
}

function statusPillClass(status: IntakeRecord["status"]): string {
  if (status === "finalized") return "bof-status-pill bof-status-pill-ok";
  if (status === "needs_review" || status === "awaiting_info") return "bof-status-pill bof-status-pill-warn";
  if (status === "on_hold" || status === "rejected") return "bof-status-pill bof-status-pill-danger";
  if (status === "ready_for_approval") return "bof-status-pill bof-status-pill-info";
  return "bof-status-pill bof-status-pill-muted";
}

export function IntakeEngineInboxClient() {
  const intakes = useIntakeEngineStore((s) => s.intakes);
  const [tab, setTab] = useState<IntakeFilterTab>("all");
  const kpis = useMemo(() => intakeKpis(intakes), [intakes]);
  const rows = useMemo(() => filterIntakes(tab, intakes), [tab, intakes]);
  const activeIntake = rows[0] ?? intakes[0] ?? null;
  const intakeEntityId = toBofIntakeEntityId(activeIntake?.intake_id ?? "IN-INTAKE-INBOX");
  const intakeSurfaceContext = useMemo(
    () => buildBofIntakeSurfaceContextFromInbox(intakeEntityId, activeIntake),
    [activeIntake, intakeEntityId]
  );

  return (
    <div className="bof-page bof-intake-engine">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/dashboard" className="bof-link-secondary">
          Dashboard
        </Link>
        <span aria-hidden> / </span>
        <span>Intake Engine</span>
      </nav>

      <header className="bof-intake-engine-header">
        <div>
          <h1 className="bof-title">BOF Intake Engine</h1>
          <p className="bof-lead bof-intake-engine-lead">
            Email to intake. Finalize in BOF. Classify packets, clear gaps, and release dispatch-ready
            work — operational front door for the demo.
          </p>
        </div>
      </header>

      <section
        className="bof-card"
        style={{ marginBottom: 16, borderColor: "rgba(45, 212, 191, 0.35)", background: "rgba(15, 118, 110, 0.12)" }}
      >
        <p className="bof-small" style={{ margin: 0, color: "#ccfbf1" }}>
          <strong>Dispatch-ready loads</strong> use the canonical pipeline:{" "}
          <Link href="/dispatch/intake" className="bof-link-secondary">
            BOF Load Intake
          </Link>
          . This inbox remains for packet classification and gap review; it does not replace the unified
          load save path.
        </p>
      </section>

      <BofIntakeFormPrimaryPanel entityId={intakeEntityId} intakeId={activeIntake?.intake_id} />
      <DynamicIntakeDispatchPanel
        activeIntake={activeIntake}
        entityId={intakeEntityId}
      />
      <BofWorkflowFormShortcuts
        context="intake"
        entityId={intakeEntityId}
        intakeId={activeIntake?.intake_id}
        title="From this screen — open BOF forms & packets"
      />
      <CollapsibleAdvancedPanel
        title="Template Mapping & Debug"
        subtitle="Advanced: BOF template registry, context mapping, and readiness diagnostics for power users."
        defaultOpen={false}
      >
        <BofTemplateUsageSurface
          context="load_intake"
          entityId={intakeEntityId}
          intakeContextPayload={intakeSurfaceContext}
          title="BOF Intake Template Registry"
          subtitle="Template readiness, context mapping, and document generation diagnostics."
        />
      </CollapsibleAdvancedPanel>

      <section className="bof-intake-engine-kpis" aria-label="Intake summary">
        <div className="bof-intake-engine-kpi">
          <span className="bof-intake-engine-kpi-label">New intake</span>
          <span className="bof-intake-engine-kpi-value">{kpis.newCount}</span>
        </div>
        <div className="bof-intake-engine-kpi">
          <span className="bof-intake-engine-kpi-label">Needs review</span>
          <span className="bof-intake-engine-kpi-value">{kpis.needsReview}</span>
        </div>
        <div className="bof-intake-engine-kpi">
          <span className="bof-intake-engine-kpi-label">Ready for approval</span>
          <span className="bof-intake-engine-kpi-value">{kpis.readyApproval}</span>
        </div>
        <div className="bof-intake-engine-kpi">
          <span className="bof-intake-engine-kpi-label">Finalized today</span>
          <span className="bof-intake-engine-kpi-value">{kpis.finalizedToday}</span>
        </div>
      </section>

      <section className="bof-intake-engine-panel" aria-label="Intake queue">
        <div className="bof-intake-engine-tabs" role="tablist" aria-label="Queue filters">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`bof-intake-engine-tab ${tab === t.id ? "bof-intake-engine-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bof-table-wrap">
          <table className="bof-table bof-intake-engine-table">
            <thead>
              <tr>
                <th>Intake ID</th>
                <th>Received</th>
                <th>Sender</th>
                <th>Type</th>
                <th>Detected packet</th>
                <th>Match</th>
                <th>Missing</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.intake_id}>
                  <td>
                    <code className="bof-code">{i.intake_id}</code>
                  </td>
                  <td className="bof-muted bof-intake-engine-nowrap">
                    {new Date(i.received_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <div className="bof-intake-engine-cell-title">{i.source_sender}</div>
                    <div className="bof-muted bof-intake-engine-sub">{i.subject_line}</div>
                  </td>
                  <td>{kindLabel(i.intake_kind)}</td>
                  <td className="bof-muted">{packetSummary(i)}</td>
                  <td>
                    <span className="bof-intake-engine-confidence">{i.match_confidence}</span>
                    {i.needs_review ? (
                      <span className="bof-intake-engine-flag" title="Needs review">
                        Review
                      </span>
                    ) : null}
                  </td>
                  <td className="bof-muted">
                    {i.missing_items.length ? `${i.missing_items.length} item(s)` : "—"}
                  </td>
                  <td className="bof-intake-engine-trigger-cell">
                    {(() => {
                      const { count, chips } = intakeTriggerSummary(i);
                      if (!count) return <span className="bof-muted">—</span>;
                      return (
                        <div className="bof-intake-engine-trigger-inbox">
                          <span className="bof-intake-engine-trigger-count" title="Derived trigger rows">
                            {count}
                          </span>
                          <div className="bof-intake-engine-trigger-chips">
                            {chips.map((c) => (
                              <span key={c} className="bof-intake-engine-trigger-chip">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <span className={statusPillClass(i.status)}>{i.status.replace(/_/g, " ")}</span>
                  </td>
                  <td>
                    <Link href={`/intake/${i.intake_id}`} className="bof-link-secondary">
                      Open
                    </Link>
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
