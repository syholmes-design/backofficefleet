/**
 * BOF Route Owner:
 * URL: /demo/drivers
 * Type: DEMO
 */
import { DriversCommandCenterV4 } from "@/components/drivers-v4/DriversCommandCenterV4";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DEMO Drivers | BOF",
  description: "DEMO driver roster from BOF JSON — not LIVE Prisma authority",
};

export default function DemoDriversPage() {
  return <DriversCommandCenterV4 operationalSummaries={[]} driverRequirements={[]} hasFleetContext={false} sandbox />;
}
