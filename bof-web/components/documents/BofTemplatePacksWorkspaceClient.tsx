"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildBofDocumentViewerHref } from "@/lib/bof-document-viewer-href";
import {
  BOF_TEMPLATE_PACKS,
  buildTemplateArtifactHtml,
  buildTemplateDefaultBody,
  type BofTemplatePackId,
} from "@/lib/bof-template-system";
import { useBofTemplateWorkspaceStore } from "@/lib/stores/bof-template-workspace-store";

export function BofTemplatePacksWorkspaceClient({
  initialPackId,
  initialEntityId,
  initialTemplateId,
}: {
  initialPackId?: BofTemplatePackId;
  initialEntityId?: string;
  initialTemplateId?: string;
}) {
  const { data } = useBofDemoData();
  const [packId, setPackId] = useState<BofTemplatePackId>(
    initialPackId ?? BOF_TEMPLATE_PACKS[0].packId
  );
  const [entityId, setEntityId] = useState(initialEntityId ?? data.loads[0]?.id ?? "L001");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(initialTemplateId ?? null);
  const [editor, setEditor] = useState("");
  const upsertDraft = useBofTemplateWorkspaceStore((s) => s.upsertDraft);
  const getDraft = useBofTemplateWorkspaceStore((s) => s.getDraft);
  const saveArtifact = useBofTemplateWorkspaceStore((s) => s.saveArtifact);
  const getArtifact = useBofTemplateWorkspaceStore((s) => s.getArtifact);

  const pack = BOF_TEMPLATE_PACKS.find((p) => p.packId === packId) ?? BOF_TEMPLATE_PACKS[0];
  const selectedTemplate = pack.templates.find((t) => t.templateId === selectedTemplateId) ?? pack.templates[0];

  const draftKey = `${selectedTemplate.templateId}::${entityId}`;
  const artifactKey = `${selectedTemplate.templateId}::${entityId}`;
  const activeDraft = getDraft(draftKey);
  const activeArtifact = getArtifact(artifactKey);

  useEffect(() => {
    const next = activeDraft?.body ?? buildTemplateDefaultBody(data, selectedTemplate, entityId);
    setEditor(next);
  }, [activeDraft?.body, data, entityId, selectedTemplate]);

  return (
    <div className="bof-page bof-driver-vault">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/documents" className="bof-link-secondary">
          Documents
        </Link>
        <span aria-hidden> / </span>
        <span>Template Packs Workspace</span>
      </nav>
      <h1 className="bof-title">BOF Unified Template Packs Workspace</h1>
      <p className="bof-lead">
        Cleaned and standardized templates from all five latest packs, wired for BOF on-screen workflow,
        editable drafts, and generated final artifacts.
      </p>

      <aside
        className="bof-driver-vault-panel"
        aria-label="Internal workspace notice"
        style={{ marginBottom: 18 }}
      >
        <p className="bof-small">
          <strong>Internal BOF template workspace.</strong> Used to inspect and test template mappings,
          standardized metadata (including demo gates such as{" "}
          <code className="bof-code">dispatch_hold_active</code>), editable HTML drafts, and in-browser
          artifacts stored in this session.{" "}
          <strong>Not part of the client-facing load intake workflow</strong> — canonical intake runs
          through Load Intake / Intake Engine and BOF demo JSON; fleet credential and load evidence files
          are produced by the document engines and <code className="bof-code">npm</code> generators, not
          this page.
        </p>
        <p className="bof-muted bof-small" style={{ marginTop: 10 }}>
          Quick links:{" "}
          <Link href="/load-intake" className="bof-link-secondary">
            Canonical load intake
          </Link>
          {" · "}
          <Link href="/documents" className="bof-link-secondary">
            Document vault
          </Link>
          {" · "}
          <Link href="/loads" className="bof-link-secondary">
            Loads
          </Link>
          {" · "}
          <Link href="/dispatch" className="bof-link-secondary">
            Dispatch
          </Link>
        </p>
      </aside>

      <section className="bof-driver-vault-detail-grid">
        <article className="bof-driver-vault-panel">
          <h2 className="bof-h2">Pack Selection</h2>
          <label>
            <span className="bof-muted">Pack</span>
            <select value={packId} onChange={(e) => setPackId(e.target.value as BofTemplatePackId)}>
              {BOF_TEMPLATE_PACKS.map((p) => (
                <option key={p.packId} value={p.packId}>
                  {p.title} {p.version}
                </option>
              ))}
            </select>
          </label>
          <p className="bof-muted bof-small">
            Source file: <code className="bof-code">{pack.sourceFileName}</code>
          </p>
          <p className="bof-small">{pack.roleSummary}</p>

          <label>
            <span className="bof-muted">Entity ID (load/driver/packet/facility/claim)</span>
            <input value={entityId} onChange={(e) => setEntityId(e.target.value)} />
          </label>

          <div className="bof-driver-vault-categories">
            {pack.templates.map((tpl) => (
              <button
                type="button"
                key={tpl.templateId}
                className={`bof-driver-vault-cat-btn ${tpl.templateId === selectedTemplate.templateId ? "is-active" : ""}`}
                onClick={() => setSelectedTemplateId(tpl.templateId)}
              >
                <span>{tpl.templateName}</span>
                <span className="bof-status-pill bof-status-pill-muted">
                  {tpl.documentType === "generated_autofill_output"
                    ? "Generated / Autofill Output"
                    : "Editable Template"}
                </span>
              </button>
            ))}
          </div>
        </article>

        <article className="bof-driver-vault-panel">
          <h2 className="bof-h2">Template Standardization Panel</h2>
          <table className="trip-release-table">
            <tbody>
              <tr><th>Document Type</th><td>{selectedTemplate.documentType === "generated_autofill_output" ? "Generated / Autofill Output" : "Editable Template"}</td></tr>
              <tr><th>Approval Status</th><td>{selectedTemplate.approvalStatus}</td></tr>
              <tr><th>Document Status</th><td>{selectedTemplate.documentStatus}</td></tr>
              <tr><th>Command Center Status</th><td>{selectedTemplate.commandCenterStatus}</td></tr>
              <tr><th>Reviewed By</th><td>{selectedTemplate.reviewedBy}</td></tr>
              <tr><th>Review Outcome</th><td>{selectedTemplate.reviewOutcome}</td></tr>
              <tr><th>Dispatch Gate</th><td>{selectedTemplate.dispatchGate}</td></tr>
              <tr><th>Settlement Gate</th><td>{selectedTemplate.settlementGate}</td></tr>
              <tr><th>Claims-Sensitive Load</th><td>{selectedTemplate.claimsSensitiveLoad ? "Yes" : "No"}</td></tr>
              <tr><th>Insurance Review Required</th><td>{selectedTemplate.insuranceReviewRequired ? "Yes" : "No"}</td></tr>
              <tr><th>Escalation / Review Block</th><td>{selectedTemplate.escalationReviewBlock}</td></tr>
              <tr><th>What Does This Document Trigger in BOF?</th><td>{selectedTemplate.triggerInBof.map((x, i) => `${i + 1}. ${x}`).join(" ")}</td></tr>
            </tbody>
          </table>
        </article>

        <article className="bof-driver-vault-panel">
          <h2 className="bof-h2">Editable Workspace</h2>
          <textarea
            value={editor}
            onChange={(e) => setEditor(e.target.value)}
            style={{ width: "100%", minHeight: 360 }}
          />
          <div className="bof-driver-vault-actions">
            <Link
              href={buildBofDocumentViewerHref({
                templateId: selectedTemplate.templateId,
                entityId,
                packId,
                returnTo: "/documents/template-packs",
              })}
              className="bof-link-secondary"
              style={{ alignSelf: "center" }}
            >
              Open in document viewer
            </Link>
            <button
              type="button"
              className="bof-intake-engine-btn"
              onClick={() => upsertDraft(draftKey, selectedTemplate.templateId, entityId, editor)}
            >
              Save Editable Template
            </button>
            <button
              type="button"
              className="bof-intake-engine-btn"
              onClick={() => setEditor(buildTemplateDefaultBody(data, selectedTemplate, entityId))}
            >
              Regenerate from BOF data
            </button>
            <button
              type="button"
              className="bof-intake-engine-btn bof-intake-engine-btn--primary"
              onClick={() => {
                const html = buildTemplateArtifactHtml(
                  `${selectedTemplate.templateName} · ${entityId}`,
                  editor,
                  new Date().toISOString(),
                  selectedTemplate
                );
                const artifact = saveArtifact(
                  artifactKey,
                  selectedTemplate.templateId,
                  entityId,
                  `${entityId}_${selectedTemplate.templateId}_final.html`,
                  html
                );
                window.open(artifact.artifactUrl, "_blank", "noopener,noreferrer");
              }}
            >
              Generate / Open Final Artifact
            </button>
          </div>
          {activeArtifact ? (
            <p className="bof-muted bof-small">
              Stored artifact: <code className="bof-code">{activeArtifact.artifactFileName}</code> ·{" "}
              {new Date(activeArtifact.generatedAt).toLocaleString()}
            </p>
          ) : null}
        </article>
      </section>
    </div>
  );
}
