/**
 * BOF Route Owner:
 * URL: /settlements/workbook
 * Type: SETTLEMENTS
 * Primary component: SettlementsWorkbookPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { SettlementsWorkbookGrid } from "@/components/settlements/SettlementsWorkbookGrid";

export const metadata = {
  title: "Settlements (Workbook) | BOF",
  description: "Payroll and settlement detail — full workbook-derived grid",
};

export default function SettlementsWorkbookPage() {
  return <SettlementsWorkbookGrid />;
}
