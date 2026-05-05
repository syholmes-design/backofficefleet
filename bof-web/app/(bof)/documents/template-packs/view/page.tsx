/**
 * BOF Route Owner:
 * URL: /documents/template-packs/view
 * Type: DRIVER_DOCS
 * Primary component: BofDocumentViewerPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { Suspense } from "react";
import { BofDocumentViewerClient } from "@/components/documents/BofDocumentViewerClient";

export const metadata = {
  title: "Document Viewer | BOF",
  description: "BOF operational document viewer — drafts, finals, metadata, and stakeholder routing (demo).",
};

export default function BofDocumentViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="bof-page">
          <p className="bof-muted">Loading document viewer…</p>
        </div>
      }
    >
      <BofDocumentViewerClient />
    </Suspense>
  );
}
