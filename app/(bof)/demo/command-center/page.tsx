/**
 * BOF Route Owner:
 * URL: /demo/command-center
 * Type: DEMO
 * Primary component: CommandCenterV4
 * Route map: docs/BOF_ROUTE_MAP.md
 */
import { CommandCenterV4 } from "@/components/command-center-v4/CommandCenterV4";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DEMO Command Center | BOF",
  description: "DEMO sandbox executive action layer — not LIVE operational authority",
};

export default function DemoCommandCenterPage() {
  return (
    <>
      <div className="border-b border-amber-500/40 bg-amber-950/90 px-4 py-3 text-sm text-amber-50">
        DEMO Command Center. Canonical DEMO KPIs, workbook settlement summaries, and DEMO JSON remain here.
        They do not govern production operations. LIVE Command Center: /command-center
      </div>
      <CommandCenterV4 />
    </>
  );
}
