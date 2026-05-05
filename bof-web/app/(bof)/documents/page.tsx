/**
 * BOF Route Owner:
 * URL: /documents
 * Type: DRIVER_DOCS
 * Primary component: DocumentsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { DocumentsPageClient } from "@/components/documents/DocumentsPageClient";

export const metadata = {
  title: "Document Vault | BOF",
  description: "Fleet-wide driver credentials and compliance documents",
};

export default function DocumentsPage() {
  return <DocumentsPageClient />;
}
