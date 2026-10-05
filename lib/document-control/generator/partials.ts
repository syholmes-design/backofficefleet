import type { DocumentTypeCode } from "@/lib/document-control/types";
import type { ControlledDocumentMetadata } from "@/lib/document-control/generator/contract";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(label: string, value: string): string {
  return `<th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td>`;
}

export function renderStatusChip(meta: ControlledDocumentMetadata): string {
  const kind = meta.appearsApproved ? "active" : "review";
  return `<span class="status-chip status-chip--${kind}">${escapeHtml(meta.status)}</span>`;
}

export function renderControlledHeader(meta: ControlledDocumentMetadata): string {
  const reviewClass = meta.appearsApproved ? "" : " ident--review";
  return `<header class="ident${reviewClass}">
      <div>
        <div class="org">BackOfficeFleet · Controlled document</div>
        <h1 class="doc-title">${escapeHtml(meta.title)}</h1>
        <p class="doc-class">${escapeHtml(meta.documentClass)} · ${escapeHtml(meta.workflow)}</p>
      </div>
      <div class="code">
        ${escapeHtml(meta.documentCode)}<br />
        Version ${escapeHtml(meta.version)}<br />
        ${renderStatusChip(meta)}
      </div>
    </header>`;
}

export function renderMetadataBlock(meta: ControlledDocumentMetadata, documentClass: DocumentTypeCode): string {
  const compact = documentClass === "FORM" || documentClass === "CHK" || documentClass === "ACK";
  const formDates =
    documentClass === "FORM"
      ? [`<tr>${cell("Effective date", meta.effectiveDate)}${cell("Review date", meta.reviewDate)}</tr>`]
      : [];
  const rows = compact
    ? [
        `<tr>${cell("Document code", meta.documentCode)}${cell("Version", meta.version)}</tr>`,
        `<tr>${cell("Class", meta.documentClass)}${cell("Status", meta.status)}</tr>`,
        ...formDates,
        `<tr>${cell("Owner", meta.owner)}${cell("Approver", meta.approver)}</tr>`,
        `<tr><th>Workflow</th><td colspan="3">${escapeHtml(meta.workflow)}</td></tr>`,
      ]
    : [
        `<tr>${cell("Document code", meta.documentCode)}${cell("Version", meta.version)}</tr>`,
        `<tr>${cell("Class", meta.documentClass)}${cell("Status", meta.status)}</tr>`,
        `<tr>${cell("Effective date", meta.effectiveDate)}${cell("Review date", meta.reviewDate)}</tr>`,
        `<tr>${cell("Owner", meta.owner)}${cell("Approver", meta.approver)}</tr>`,
        `<tr>${cell("Steward", meta.steward)}${cell("Compliance reviewer", meta.complianceReviewer)}</tr>`,
        `<tr>${cell("Classification", meta.classification)}${cell("Source type", meta.sourceType)}</tr>`,
        `<tr><th>Workflow</th><td colspan="3">${escapeHtml(meta.workflow)}</td></tr>`,
        `<tr><th>Supersedes</th><td colspan="3">${escapeHtml(meta.supersedes)}</td></tr>`,
      ];
  return `<table class="meta">${rows.join("")}</table>`;
}

export function renderRelatedDocuments(meta: ControlledDocumentMetadata): string {
  return `<table class="grid related-docs">
      <tr><th>Related policy</th><th>Related SOP</th><th>Related form</th></tr>
      <tr><td>${escapeHtml(meta.relatedPolicy)}</td><td>${escapeHtml(meta.relatedSop)}</td><td>${escapeHtml(meta.relatedForm)}</td></tr>
    </table>`;
}

export function renderRevisionHistory(meta: ControlledDocumentMetadata): string {
  if (meta.revisionHistory.length === 0) {
    return `<p class="check">No recorded revisions in the controlled registry.</p>`;
  }
  const rows = meta.revisionHistory
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.version)}</td><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.description)}</td><td>${escapeHtml(row.author)}</td><td>${escapeHtml(row.approvalStatus)}</td></tr>`
    )
    .join("");
  return `<table class="grid">
      <tr><th>Version</th><th>Date</th><th>Description</th><th>Author / owner</th><th>Approval status</th></tr>
      ${rows}
    </table>`;
}

export function renderApprovalBlock(meta: ControlledDocumentMetadata): string {
  if (meta.appearsApproved) {
    return `<p class="check">Status <strong>ACTIVE</strong>. Upload still does not substitute for a later revision’s approval.</p>
    <div class="two">
      <div class="ctrl-sig">Document owner · ${escapeHtml(meta.owner)}</div>
      <div class="ctrl-sig">Approver · ${escapeHtml(meta.approver)}</div>
    </div>`;
  }
  return `<div class="callout approval-pending">
      ${escapeHtml(meta.status)} — not approved. A generated or uploaded file is not an approved controlled document.
    </div>
    <div class="two">
      <div class="ctrl-sig">Prepared by / date</div>
      <div class="ctrl-sig">Approval / date (required before ACTIVE)</div>
    </div>`;
}

export function renderControlledFooter(meta: ControlledDocumentMetadata): string {
  return `<footer class="footer">
      <span>${escapeHtml(meta.documentCode)} | Version ${escapeHtml(meta.version)} | ${escapeHtml(meta.controlledCopy)}</span>
      <span>${escapeHtml(meta.classification)} · ${escapeHtml(meta.sourceType)}</span>
    </footer>`;
}

export function renderApprovalBanner(meta: ControlledDocumentMetadata): string {
  if (meta.appearsApproved) return "";
  return `<p><span class="tag tag-review">${escapeHtml(meta.status)} · not approved</span></p>`;
}
