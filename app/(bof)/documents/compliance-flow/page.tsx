/**
 * BOF Route Owner:
 * URL: /documents/compliance-flow
 * Type: DRIVER_DOCS
 * Primary component: ComplianceFlowPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { ComplianceFlowDashboard } from "@/components/compliance-flow-pro/ComplianceFlowDashboard";

export const metadata = {
  title: "ComplianceFlow Pro | BOF Vault",
  description: "Active driver qualification file management and compliance state monitoring",
};

export default function ComplianceFlowPage() {
  return <ComplianceFlowDashboard />;
}
