/**
 * BOF Route Owner:
 * URL: /demo/loads
 * Type: DEMO
 */
import { LoadsPageClient } from "@/components/loads/LoadsPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DEMO Loads | BOF",
  description: "DEMO load roster from BOF JSON — not LIVE Prisma authority",
};

export default function DemoLoadsPage() {
  return <LoadsPageClient fleetId={null} sandbox />;
}
