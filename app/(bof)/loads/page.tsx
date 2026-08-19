/**
 * BOF Route Owner:
 * URL: /loads
 * Type: DISPATCH
 * Primary component: LoadsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { auth } from "@/auth";
import { LoadsPageClient } from "@/components/loads/LoadsPageClient";
import { getPrimaryFleetId, type SessionWithMemberships } from "@/lib/session-fleet";

export const metadata = {
  title: "Loads / Dispatch | BOF",
  description: "Active and recent dispatch loads",
};

export default async function LoadsPage() {
  const session = (await auth()) as SessionWithMemberships;
  const fleetId = getPrimaryFleetId(session);

  return <LoadsPageClient fleetId={fleetId} />;
}
