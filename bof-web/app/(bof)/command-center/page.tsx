/**
 * BOF Route Owner:
 * URL: /command-center
 * Type: DEMO
 * Primary component: CommandCenterPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { CommandCenterV4 } from "@/components/command-center-v4/CommandCenterV4";

export const metadata = {
  title: "Command Center | BOF",
  description: "Executive action layer",
};

export default function CommandCenterPage() {
  return <CommandCenterV4 />;
}
