"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  BOF_TEMPLATE_PACKS,
  type BofTemplatePack,
  buildTemplateArtifactHtml,
  buildTemplateDefaultBody,
  type BofTemplateDefinition,
  type BofTemplatePackId,
} from "@/lib/bof-template-system";
import { useBofTemplateWorkspaceStore } from "@/lib/stores/bof-template-workspace-store";
import {
  computeTemplateRowReadiness,
  primaryStateLabel,
  resolveTemplateSurfaceBundle,
} from "@/lib/template-usage-readiness";
import { describeRfidSurfacePosture, rfidRelevantForTemplate } from "@/lib/bof-rfid-readiness";
import { buildBofDocumentViewerHref } from "@/lib/bof-document-viewer-href";

type SurfaceContext = "dispatch_load" | "settlement_billing" | "claims_insurance";

const CONTEXT_PACKS: Record<SurfaceContext, BofTemplatePackId[]> = {
  dispatch_load: ["load-intake-v3", "driver-dispatch-readiness-v2", "field-operations-v3"],
  settlement_billing: ["billing-settlement-v3", "field-operations-v3"],
  claims_insurance: ["insurance-claims-v2", "field-operations-v3", "billing-settlement-v3"],
};

function filterTemplatesForContext<T extends BofTemplateDefinition>(
  context: SurfaceContext,
  templates: T[]
) {
  if (context === "dispatch_load") {
    return templates.filter(
      (t) =>
        t.contextType === "load" ||
        t.contextType === "dispatch_packet" ||
        t.templateId === "service-schedule-work-order"
    );
  }
  if (context === "settlement_billing") {
    return templates.filter(
      (t) =>
        t.contextType === "billing_packet" ||
        t.templateId === "pod" ||
        t.templateId === "bol" ||
        t.templateId === "lumper-cover-sheet" ||
        t.templateId === "settlement-hold-notice"
    );
  }
  return templates.filter(
    (t) =>
      t.contextType === "claim_packet" ||
      t.templateId === "pod" ||
      t.templateId === "bol" ||
      t.templateId === "seal-verification" ||
      t.templateId === "cargo-photo-checklist" ||
      t.templateId === "settlement-hold-notice" ||
      t.templateId === "invoice"
  );
}

function primaryPillClass(primary: string) {
  if (primary === "final_available") return "bof-status-pill bof-status-pill-ok";
  if (primary === "draft_exists") return "bof-status-pill bof-status-pill-info";
  if (primary === "missing_context") return "bof-status-pill bof-status-pill-warn";
  if (primary === "context_inferred") return "bof-status-pill bof-status-pill-info";
  return "bof-status-pill bof-status-pill-muted";
}

function rfidGateToneClass(level: string) {
  if (level === "hard_block") return "#fca5a5";
  if (level === "soft_block") return "#fdba74";
  return "#94a3b8";
}

export function BofTemplateUsageSurface({
  context,
  entityId,
  title,
  subtitle,
  linkedLoadIds,
}: {
  context: SurfaceContext;
  entityId: string;
  title?: string;
  subtitle?: string;
  /** Optional explicit load ids (e.g. from settlement lines) for RFID + proof chain. */
  linkedLoadIds?: string[];
}) {
  const pathname = usePathname();
  const { data } = useBofDemoData();
  const upsertDraft = useBofTemplateWorkspaceStore((s) => s.upsertDraft);
  const getDraft = useBofTemplateWorkspaceStore((s) => s.getDraft);
  const saveArtifact = useBofTemplateWorkspaceStore((s) => s.saveArtifact);
  const getArtifact = useBofTemplateWorkspaceStore((s) => s.getArtifact);

  const rows = useMemo(() => {
    const packs = CONTEXT_PACKS[context];
    const templates: Array<BofTemplateDefinition & { packTitle: string }> = BOF_TEMPLATE_PACKS
      .filter((p: BofTemplatePack) => packs.includes(p.packId))
      .flatMap((p: BofTemplatePack) =>
        p.templates.map((t) => ({ ...t, packTitle: p.title }))
      );
    return filterTemplatesForContext(context, templates);
  }, [context]);

  const { resolved: resolvedEntity, rfid: rfidSummary } = useMemo(
    () => resolveTemplateSurfaceBundle(data, context, entityId, linkedLoadIds),
    [data, context, entityId, linkedLoadIds]
  );

  const rfidPostureLine = useMemo(
    () => describeRfidSurfacePosture(rfidSummary),
    [rfidSummary]
  );

  return (
    <section className="bof-card" style={{ marginTop: 20 }}>
      <h2 className="bof-h2">{title ?? "BOF Template Usage"}</h2>
      <p className="bof-muted bof-small">
        {subtitle ?? "Context-aware BOF workflow documents for the current entity."}
      </p>
      {rfidPostureLine && (
        <p className="bof-muted bof-small" style={{ marginTop: 8 }}>
          {rfidPostureLine}
        </p>
      )}
      <div className="bof-table-wrap">
        <table className="bof-table">
          <thead>
            <tr>
              <th>Template</th>
              <th>Pack</th>
              <th>Type</th>
              <th>Readiness</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const draftKey = `${row.templateId}::${entityId}`;
              const artifactKey = `${row.templateId}::${entityId}`;
              const draft = getDraft(draftKey);
              const artifact = getArtifact(artifactKey);
              const hasDraft = Boolean(draft);
              const hasFinal = Boolean(artifact);
              const packId = row.packId;
              const readiness = computeTemplateRowReadiness({
                context,
                resolved: resolvedEntity,
                template: row,
                hasDraft,
                hasFinal,
                rfid: rfidSummary,
              });
              const showRfid = Boolean(rfidSummary && rfidRelevantForTemplate(row.templateId));
              const blockGenerate =
                readiness.primary === "missing_context" ||
                (readiness.rfidGate.level === "hard_block" && !hasFinal);
              return (
                <tr key={`${row.templateId}:${entityId}`}>
                  <td>{row.templateName}</td>
                  <td>{row.packTitle}</td>
                  <td>
                    {row.documentType === "generated_autofill_output"
                      ? "Generated / Autofill Output"
                      : "Editable Template"}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 360 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                        <span className={primaryPillClass(readiness.primary)}>
                          {primaryStateLabel(readiness.primary)}
                        </span>
                        <span
                          className={
                            readiness.workflowRole === "optional_reference"
                              ? "bof-status-pill bof-status-pill-muted"
                              : "bof-status-pill bof-status-pill-warn"
                          }
                        >
                          {readiness.workflowLabel}
                        </span>
                      </div>
                      <span className="bof-muted bof-small">{readiness.whyMatters}</span>
                      {(readiness.missingContext.length > 0 || readiness.presentContext.length > 0) && (
                        <span className="bof-small" style={{ color: "#94a3b8", lineHeight: 1.35 }}>
                          {readiness.presentContext.length > 0 && (
                            <>
                              <span style={{ color: "#cbd5e1" }}>Present:</span>{" "}
                              {readiness.presentContext.slice(0, 3).join(" · ")}
                              <br />
                            </>
                          )}
                          {readiness.missingContext.length > 0 && (
                            <>
                              <span style={{ color: "#fcd34d" }}>Missing:</span>{" "}
                              {readiness.missingContext.join(" · ")}
                            </>
                          )}
                        </span>
                      )}
                      {showRfid && readiness.rfidHints.length > 0 && (
                        <span className="bof-small" style={{ color: "#a5b4fc", lineHeight: 1.35 }}>
                          RFID: {readiness.rfidHints.join(" · ")}
                        </span>
                      )}
                      {(readiness.rfidGate.level === "hard_block" ||
                        readiness.rfidGate.level === "soft_block") && (
                        <span
                          className="bof-small"
                          style={{ color: rfidGateToneClass(readiness.rfidGate.level), lineHeight: 1.35 }}
                        >
                          <strong>{readiness.rfidGate.label}:</strong> {readiness.rfidGate.reason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <Link
                        href={`/documents/template-packs?packId=${encodeURIComponent(
                          packId
                        )}&entityId=${encodeURIComponent(entityId)}&templateId=${encodeURIComponent(
                          row.templateId
                        )}`}
                        className="bof-link-secondary"
                      >
                        Open Draft
                      </Link>
                      <Link
                        href={buildBofDocumentViewerHref({
                          templateId: row.templateId,
                          entityId,
                          packId,
                          returnTo: pathname || undefined,
                        })}
                        className="bof-link-secondary"
                      >
                        Document viewer
                      </Link>
                      {hasFinal ? (
                        <a
                          href={artifact?.artifactUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bof-link-secondary"
                        >
                          Open Final
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="bof-intake-engine-btn"
                          disabled={blockGenerate}
                          title={
                            blockGenerate
                              ? readiness.primary === "missing_context"
                                ? "Resolve missing BOF context before generating this artifact."
                                : readiness.rfidGate.reason
                              : undefined
                          }
                          onClick={() => {
                            const body =
                              draft?.body ?? buildTemplateDefaultBody(data, row, entityId);
                            if (!draft) {
                              upsertDraft(draftKey, row.templateId, entityId, body);
                            }
                            const html = buildTemplateArtifactHtml(
                              `${row.templateName} · ${entityId}`,
                              body,
                              new Date().toISOString(),
                              row
                            );
                            const next = saveArtifact(
                              artifactKey,
                              row.templateId,
                              entityId,
                              `${entityId}_${row.templateId}_final.html`,
                              html
                            );
                            window.open(next.artifactUrl, "_blank", "noopener,noreferrer");
                          }}
                        >
                          {row.documentType === "generated_autofill_output"
                            ? "Generate"
                            : "Create / Generate"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="bof-muted bof-small" style={{ marginTop: 10 }}>
        <Link href="/documents/template-packs" className="bof-link-secondary">
          Go to Full Template Workspace
        </Link>
      </p>
    </section>
  );
}
