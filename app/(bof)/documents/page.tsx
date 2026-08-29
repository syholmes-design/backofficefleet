/**
 * BOF Route Owner:
 * URL: /documents
 * Type: DRIVER_DOCS
 * Primary component: DocumentsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { OperationsFileCabinetClient } from "@/components/documents/OperationsFileCabinetClient";
import { buildFeaturedDocumentIndex, buildVerifiedDocumentIndex } from "@/lib/verified-document-index";

export const metadata = {
  title: "Operations File Cabinet",
  description: "Delta Advanced Trucking, Inc.'s driver files, company policies, dispatch forms, SOPs, claims documents, training resources, and back-office templates organized in one operating library through BOF",
};

export default async function DocumentsPage() {
  const [canonicalIndex, featuredDocuments] = await Promise.all([
    buildVerifiedDocumentIndex(),
    buildFeaturedDocumentIndex(),
  ]);
  return <OperationsFileCabinetClient canonicalIndex={canonicalIndex} featuredDocuments={featuredDocuments} />;
}
