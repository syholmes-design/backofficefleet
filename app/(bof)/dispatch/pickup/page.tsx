/**
 * BOF Route Owner:
 * URL: /dispatch/pickup
 * Type: DISPATCH
 * Primary component: PickupAuthorizationClient
 */
import { PickupAuthorizationClient } from "@/components/dispatch/PickupAuthorizationClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pickup authorization | BOF",
  description: "Issue and verify BOF Secure Pickup authorizations",
};

export default async function PickupAuthorizationPage({
  searchParams,
}: {
  searchParams: Promise<{ loadId?: string }>;
}) {
  const params = await searchParams;
  return <PickupAuthorizationClient initialLoadId={params.loadId ?? ""} />;
}
