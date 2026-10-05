import type { DocumentTypeCode } from "@/lib/document-control/types";
import {
  type ControlledIdentityOverride,
  type ControlledNonIdentityInput,
} from "@/lib/document-control/generator/contract";
import { resolveControlledDocumentMetadata } from "@/lib/document-control/generator/resolve";
import {
  escapeHtml,
  renderApprovalBanner,
  renderApprovalBlock,
  renderControlledFooter,
  renderControlledHeader,
  renderMetadataBlock,
  renderRelatedDocuments,
  renderRevisionHistory,
} from "@/lib/document-control/generator/partials";

export type RenderControlledDocumentInput = {
  documentCode: string;
  bodyHtml: string;
  identity?: ControlledIdentityOverride;
  extras?: ControlledNonIdentityInput;
  stylesheetHref?: string;
  previewBanner?: string;
  /**
   * Optional HTML <title>. Use this to preserve an existing tokened instance title
   * (for example `Safety Policy Acknowledgment - {{driverName}}`).
   * Visible header title still comes from the registry.
   */
  pageTitle?: string;
};

function section(title: string, inner: string): string {
  return `<h2>${title}</h2>${inner}`;
}

function classLayout(documentClass: DocumentTypeCode): {
  showRelated: boolean;
  showRevision: boolean;
  showApproval: boolean;
} {
  switch (documentClass) {
    case "ACK":
      return { showRelated: true, showRevision: false, showApproval: true };
    case "FORM":
    case "CHK":
      return { showRelated: true, showRevision: true, showApproval: true };
    case "TPL":
    case "REF":
      return { showRelated: true, showRevision: false, showApproval: false };
    default:
      return { showRelated: true, showRevision: true, showApproval: true };
  }
}

export function renderControlledDocumentHtml(input: RenderControlledDocumentInput): string {
  const meta = resolveControlledDocumentMetadata(input.documentCode, input.identity, input.extras);
  const layout = classLayout(meta.documentClass);
  const css = input.stylesheetHref ?? "./bof-controlled-document.css";
  const banner = input.previewBanner
    ? `<div class="callout generator-preview-banner">${input.previewBanner}</div>`
    : "";

  const related = layout.showRelated ? section("Related documents", renderRelatedDocuments(meta)) : "";
  const revision = layout.showRevision ? section("Revision history", renderRevisionHistory(meta)) : "";
  const approval = layout.showApproval ? section("Approval", renderApprovalBlock(meta)) : "";
  const pageTitle = escapeHtml(input.pageTitle?.trim() || `${meta.documentCode} ${meta.title}`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${pageTitle}</title>
  <link rel="stylesheet" href="${css}" />
</head>
<body>
  <article class="sheet">
    ${renderControlledHeader(meta)}
    ${renderApprovalBanner(meta)}
    ${banner}
    ${renderMetadataBlock(meta, meta.documentClass)}
    ${related}
    <div class="doc-body">${input.bodyHtml}</div>
    ${revision}
    ${approval}
    ${renderControlledFooter(meta)}
  </article>
</body>
</html>
`;
}
