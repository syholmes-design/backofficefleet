/**
 * BOF Route Owner:
 * URL: /dispatch/pickup/dock
 * Type: DISPATCH
 * Primary component: PickupDockClient
 */
import { PickupDockClient } from "@/components/dispatch/PickupDockClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shipper dock verification | BOF",
  description: "Phase 2 physical-arrival reconciliation for Secure Pickup",
};

export default async function PickupDockPage({
  searchParams,
}: {
  searchParams: Promise<{ authorizationId?: string }>;
}) {
  const params = await searchParams;
  return <PickupDockClient initialAuthorizationId={params.authorizationId ?? ""} />;
}
