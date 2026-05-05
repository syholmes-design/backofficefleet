/**
 * BOF Route Owner:
 * URL: /command-center
 * Type: DEMO
 * Primary component: CommandCenterPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { CommandCenterPageClient } from "@/components/command-center/CommandCenterPageClient";

export const metadata = {
  title: "Command Center | BOF",
  description: "Executive action layer",
};

export default function CommandCenterPage() {
  return <CommandCenterPageClient />;
}
