"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  ALL_BOF_DOCUMENT_STAKEHOLDERS,
  BOF_STAKEHOLDER_LABELS,
  deriveDocumentAudienceModel,
  surfaceLabel,
  workflowImpactLabel,
  type BofDocumentStakeholder,
} from "@/lib/bof-document-audience";
import {
  buildTemplateArtifactHtml,
  buildTemplateDefaultBody,
  findBofTemplateById,
  findPackForTemplate,
  type BofTemplatePackId,
} from "@/lib/bof-template-system";
import { buildBofLoadRfidReadiness } from "@/lib/bof-rfid-readiness";
import { useBofTemplateWorkspaceStore } from "@/lib/stores/bof-template-workspace-store";

type ViewerTab = "form" | "final" | "metadata" | "access" | "workflow";

function docStatusLabel(
  s: "ready" | "at_risk" | "blocked"
): { pill: string; text: string } {
  if (s === "ready") return { pill: "bof-status-pill-ok", text: "Ready" };
  if (s === "at_risk") return { pill: "bof-status-pill-warn", text: "At Risk" };
  return { pill: "bof-status-pill-warn", text: "Blocked" };
}

export function BofDocumentViewerClient() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId") ?? "";
  const entityId = searchParams.get("entityId") ?? "";
  const packIdParam = searchParams.get("packId") as BofTemplatePackId | null;
  const returnTo = searchParams.get("returnTo") ?? "/documents/template-packs";

  const { data } = useBofDemoData();
  const upsertDraft = useBofTemplateWorkspaceStore((s) => s.upsertDraft);
  const getDraft = useBofTemplateWorkspaceStore((s) => s.getDraft);
  const saveArtifact = useBofTemplateWorkspaceStore((s) => s.saveArtifact);
  const getArtifact = useBofTemplateWorkspaceStore((s) => s.getArtifact);
  const getDocumentMeta = useBofTemplateWorkspaceStore((s) => s.getDocumentMeta);
  const markDocumentReviewed = useBofTemplateWorkspaceStore((s) => s.markDocumentReviewed);
  const setDocumentVisibleStakeholders = useBofTemplateWorkspaceStore(
    (s) => s.setDocumentVisibleStakeholders
  );

  const [tab, setTab] = useState<ViewerTab>("form");
  const [editor, setEditor] = useState("");
  const [reviewer, setReviewer] = useState("BOF Ops Review (demo)");
  const [selectedStakeholders, setSelectedStakeholders] = useState<BofDocumentStakeholder[]>([]);

  const template = useMemo(() => findBofTemplateById(templateId), [templateId]);
  const pack = useMemo(() => findPackForTemplate(templateId), [templateId]);

  const draftKey = `${templateId}::${entityId}`;
  const artifactKey = draftKey;

  const draft = getDraft(draftKey);
  const artifact = getArtifact(artifactKey);
  const meta = getDocumentMeta(draftKey);
  const audience = useMemo(
    () => (template ? deriveDocumentAudienceModel(template) : null),
    [template]
  );

  useEffect(() => {
    if (!template || !entityId) return;
    const body = draft?.body ?? buildTemplateDefaultBody(data, template, entityId);
    setEditor(body);
  }, [draft?.body, data, entityId, template]);

  useEffect(() => {
    if (!audience) return;
    const saved = meta?.visibleTo;
    setSelectedStakeholders(saved?.length ? saved : [...audience.recommendedRecipients]);
  }, [audience, meta?.visibleTo]);

  const entityRows = useMemo(() => {
    const rows: { label: string; value: string }[] = [{ label: "Entity ID", value: entityId || "—" }];
    const load = data.loads.find((l) => l.id === entityId);
    if (load) {
      rows.push(
        { label: "Load", value: `${load.number} (${load.id})` },
        { label: "Driver ID", value: load.driverId },
        { label: "Asset", value: load.assetId },
        { label: "Origin / Destination", value: `${load.origin} → ${load.destination}` }
      );
    }
    if (entityId.startsWith("STL-") && "settlements" in data && Array.isArray(data.settlements)) {
      const raw = data.settlements.find(
        (s) => (s as { settlementId?: string }).settlementId === entityId
      ) as { driverId?: string } | undefined;
      if (raw?.driverId) rows.push({ label: "Settlement (driver)", value: raw.driverId });
    }
    if (template?.contextType === "facility") {
      rows.push({ label: "Facility context", value: "Resolved via load / facility rules in BOF demo" });
    }
    if (template?.contextType === "customer") {
      rows.push({ label: "Customer context", value: "Commercial / customer controls (demo)" });
    }
    return rows;
  }, [data, entityId, template]);

  const rfidLine = useMemo(() => {
    const load = data.loads.find((l) => l.id === entityId);
    if (!load) return null;
    const r = buildBofLoadRfidReadiness(data, load.id);
    if (!r) return null;
    const parts = [
      r.rfidEnabled ? "RFID active (demo model)" : "RFID inactive",
      `mode ${r.rfidMode.replace(/_/g, " ")}`,
    ];
    if (r.rfidRequiredBeforeRelease) parts.push("release-sensitive");
    if (r.rfidRequiredBeforeBilling) parts.push("billing-sensitive");
    if (r.rfidRequiredForClaimSupport) parts.push("claim-support posture");
    if (r.rfidCustodyGapDetected) parts.push("custody gap flagged");
    return parts.join(" · ");
  }, [data, entityId]);

  const saveDraft = useCallback(() => {
    if (!template || !entityId) return;
    upsertDraft(draftKey, template.templateId, entityId, editor);
  }, [draftKey, editor, entityId, template, upsertDraft]);

  const generateFinal = useCallback(() => {
    if (!template || !entityId) return;
    if (!draft) upsertDraft(draftKey, template.templateId, entityId, editor);
    const html = buildTemplateArtifactHtml(
      `${template.templateName} · ${entityId}`,
      editor,
      new Date().toISOString(),
      template
    );
    saveArtifact(
      artifactKey,
      template.templateId,
      entityId,
      `${entityId}_${template.templateId}_final.html`,
      html
    );
    setTab("final");
  }, [artifactKey, draft, draftKey, editor, entityId, saveArtifact, template, upsertDraft]);

  const openFinal = useCallback(() => {
    const a = getArtifact(artifactKey);
    if (a?.artifactUrl) window.open(a.artifactUrl, "_blank", "noopener,noreferrer");
  }, [artifactKey, getArtifact]);

  if (!templateId || !entityId) {
    return (
      <div className="bof-page">
        <p className="bof-muted">
          Missing <code className="bof-code">templateId</code> or <code className="bof-code">entityId</code>{" "}
          query. Open the viewer from a template usage row or the template workspace.
        </p>
        <Link href="/documents/template-packs" className="bof-link-secondary">
          Template packs
        </Link>
      </div>
    );
  }

  if (!template || !pack) {
    return (
      <div className="bof-page">
        <p className="bof-muted">
          Unknown template <code className="bof-code">{templateId}</code>.
        </p>
        <Link href="/documents/template-packs" className="bof-link-secondary">
          Back to workspace
        </Link>
      </div>
    );
  }

  const packOk = !packIdParam || pack.packId === packIdParam;
  const docS = docStatusLabel(template.documentStatus);

  return (
    <div className="bof-page bof-doc-viewer">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/documents">Documents</Link>
        <span aria-hidden> / </span>
        <Link href="/documents/template-packs">Template packs</Link>
        <span aria-hidden> / </span>
        <span>Document viewer</span>
      </nav>

      <header className="bof-doc-viewer-head">
        <div>
          <p className="bof-muted bof-small" style={{ marginBottom: 6 }}>
            BOF operational document viewer · demo persistence (local)
          </p>
          <h1 className="bof-title bof-title-tight">{template.templateName}</h1>
          <p className="bof-muted bof-small">
            Pack: <strong>{pack.title}</strong> ({pack.version}) · Type:{" "}
            <strong>
              {template.documentType === "generated_autofill_output"
                ? "Generated / Autofill Output"
                : "Editable Template"}
            </strong>
            {!packOk && (
              <>
                {" "}
                · <span className="bof-status-pill bof-status-pill-warn">Pack query mismatch</span>
              </>
            )}
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span className={`bof-status-pill ${docS.pill}`}>Document: {docS.text}</span>
          <span className="bof-status-pill bof-status-pill-muted">
            Dispatch gate: {template.dispatchGate.replace(/_/g, " ")}
          </span>
          <span className="bof-status-pill bof-status-pill-muted">
            Settlement gate: {template.settlementGate.replace(/_/g, " ")}
          </span>
          {template.claimsSensitiveLoad && (
            <span className="bof-status-pill bof-status-pill-warn">Claim support required</span>
          )}
          {meta?.reviewedAt ? (
            <span className="bof-status-pill bof-status-pill-ok">
              Reviewed {new Date(meta.reviewedAt).toLocaleString()} · {meta.reviewedBy}
            </span>
          ) : (
            <span className="bof-status-pill bof-status-pill-muted">Not reviewed in BOF viewer</span>
          )}
        </div>
      </header>

      <div className="bof-doc-viewer-tabs" role="tablist" aria-label="Document sections">
        {(
          [
            ["form", "Form / Draft"],
            ["final", "Final"],
            ["metadata", "Metadata"],
            ["access", "Usage / Access"],
            ["workflow", "Workflow impact"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className={`bof-doc-viewer-tab ${tab === k ? "is-active" : ""}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bof-doc-viewer-body">
        {tab === "form" && (
          <section className="bof-doc-viewer-panel" aria-label="Draft editor">
            <textarea
              className="bof-doc-viewer-editor"
              value={editor}
              onChange={(e) => setEditor(e.target.value)}
              spellCheck={false}
            />
          </section>
        )}

        {tab === "final" && (
          <section className="bof-doc-viewer-panel" aria-label="Final artifact">
            {artifact ? (
              <iframe
                title="BOF final artifact"
                srcDoc={artifact.html}
                className="bof-doc-viewer-iframe"
              />
            ) : (
              <p className="bof-muted">No final artifact yet — generate from the draft.</p>
            )}
          </section>
        )}

        {tab === "metadata" && (
          <section className="bof-doc-viewer-panel" aria-label="Metadata">
            <table className="bof-table">
              <tbody>
                <tr>
                  <th>Template ID</th>
                  <td>
                    <code className="bof-code">{template.templateId}</code>
                  </td>
                </tr>
                <tr>
                  <th>Pack ID</th>
                  <td>
                    <code className="bof-code">{pack.packId}</code>
                    {packIdParam && packIdParam !== pack.packId ? (
                      <span className="bof-status-pill bof-status-pill-warn" style={{ marginLeft: 8 }}>
                        URL pack {packIdParam} ≠ template pack
                      </span>
                    ) : null}
                  </td>
                </tr>
                {entityRows.map((r) => (
                  <tr key={r.label}>
                    <th>{r.label}</th>
                    <td>{r.value}</td>
                  </tr>
                ))}
                <tr>
                  <th>Approval status</th>
                  <td>{template.approvalStatus.replace(/_/g, " ")}</td>
                </tr>
                <tr>
                  <th>Review outcome (template seed)</th>
                  <td>{template.reviewOutcome.replace(/_/g, " ")}</td>
                </tr>
                <tr>
                  <th>Command center</th>
                  <td>{template.commandCenterStatus.replace(/_/g, " ")}</td>
                </tr>
                <tr>
                  <th>Draft saved</th>
                  <td>{draft ? new Date(draft.updatedAt).toLocaleString() : "—"}</td>
                </tr>
                <tr>
                  <th>Final generated</th>
                  <td>{artifact ? new Date(artifact.generatedAt).toLocaleString() : "—"}</td>
                </tr>
                {rfidLine && (
                  <tr>
                    <th>RFID posture</th>
                    <td>{rfidLine}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {tab === "access" && audience && (
          <section className="bof-doc-viewer-panel" aria-label="Usage and access">
            <h2 className="bof-h3">Appears in</h2>
            <ul className="bof-doc-viewer-list">
              {audience.appearsIn.map((s) => (
                <li key={s}>{surfaceLabel(s)}</li>
              ))}
            </ul>
            <p className="bof-muted bof-small" style={{ marginBottom: 12 }}>
              Recommended recipients:{" "}
              {audience.recommendedRecipients.map((id) => BOF_STAKEHOLDER_LABELS[id]).join(" · ")}
            </p>
            <h2 className="bof-h3">Visible to (BOF routing — demo)</h2>
            <p className="bof-muted bof-small">
              Toggle who should see this document inside BOF. Saved with the same persistence as drafts
              / finals.
            </p>
            <div className="bof-doc-viewer-chip-grid">
              {ALL_BOF_DOCUMENT_STAKEHOLDERS.map((id) => (
                <label key={id} className="bof-doc-viewer-chip">
                  <input
                    type="checkbox"
                    checked={selectedStakeholders.includes(id)}
                    onChange={(e) => {
                      setSelectedStakeholders((prev) =>
                        e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)
                      );
                    }}
                  />
                  <span>{BOF_STAKEHOLDER_LABELS[id]}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              className="bof-intake-engine-btn"
              style={{ marginTop: 12 }}
              onClick={() =>
                setDocumentVisibleStakeholders(
                  draftKey,
                  selectedStakeholders.length ? selectedStakeholders : audience.recommendedRecipients
                )
              }
            >
              Save audience selection
            </button>
            <h2 className="bof-h3" style={{ marginTop: 20 }}>
              Packet inclusion
            </h2>
            <ul className="bof-doc-viewer-list">
              {audience.packetInclusion.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="bof-muted bof-small" style={{ marginTop: 8 }}>
              Workflow audience: {audience.workflowAudienceSummary}
            </p>
          </section>
        )}

        {tab === "workflow" && audience && (
          <section className="bof-doc-viewer-panel" aria-label="Workflow impact">
            <h2 className="bof-h3">Workflow impact</h2>
            <ul className="bof-doc-viewer-list">
              {audience.workflowImpacts.map((w) => (
                <li key={w}>
                  <span className="bof-status-pill bof-status-pill-warn">{workflowImpactLabel(w)}</span>
                </li>
              ))}
            </ul>
            <h2 className="bof-h3">Triggers in BOF</h2>
            <ul className="bof-doc-viewer-list">
              {template.triggerInBof.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
            {template.escalationReviewBlock && (
              <p className="bof-small" style={{ marginTop: 12, color: "#fca5a5" }}>
                Escalation: {template.escalationReviewBlock}
              </p>
            )}
          </section>
        )}
      </div>

      <footer className="bof-doc-viewer-actions">
        <button type="button" className="bof-intake-engine-btn" onClick={saveDraft}>
          Save draft
        </button>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <input
            className="bof-doc-viewer-reviewer"
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            aria-label="Reviewer name"
            placeholder="Reviewer"
          />
          <button
            type="button"
            className="bof-intake-engine-btn"
            onClick={() => markDocumentReviewed(draftKey, reviewer)}
          >
            Mark reviewed
          </button>
        </div>
        <button type="button" className="bof-intake-engine-btn bof-intake-engine-btn--primary" onClick={generateFinal}>
          Generate final
        </button>
        <button
          type="button"
          className="bof-intake-engine-btn"
          onClick={openFinal}
          disabled={!artifact}
        >
          Open final
        </button>
        <Link href={returnTo} className="bof-link-secondary">
          Back to workflow
        </Link>
      </footer>
    </div>
  );
}
