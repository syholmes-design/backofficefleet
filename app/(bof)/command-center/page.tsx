/**
 * BOF Route Owner:
 * URL: /command-center
 * Type: LIVE production Command Center
 * Primary component: ProductionCommandCenter
 * Route map: docs/BOF_ROUTE_MAP.md
 */
import { ProductionCommandCenter } from "@/components/command-center/ProductionCommandCenter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Command Center | BOF",
  description: "LIVE production operating feeds",
};

export default function CommandCenterPage() {
  return <ProductionCommandCenter />;
}
