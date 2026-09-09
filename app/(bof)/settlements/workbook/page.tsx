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
  return (
    <>
      <div className="border-b border-amber-500/40 bg-amber-950/90 px-4 py-3 text-sm text-amber-50">
        WORKBOOK / NON-AUTHORITATIVE payroll grid. Not Prisma Settlement.status. LIVE holds: /settlements
      </div>
      <SettlementsWorkbookGrid />
    </>
  );
}
