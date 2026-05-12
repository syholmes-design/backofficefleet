/**
 * BOF Route Owner:
 * URL: /documents
 * Type: DRIVER_DOCS
 * Primary component: DocumentsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { OperationsFileCabinetClient } from "@/components/documents/OperationsFileCabinetClient";

export const metadata = {
  title: "Operations File Cabinet | BOF",
  description: "Driver files, company policies, dispatch forms, training materials, SOPs, claims documents, and back-office templates in one organized operating library",
};

export default function DocumentsPage() {
  return <OperationsFileCabinetClient />;
}
