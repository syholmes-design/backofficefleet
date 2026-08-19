/**
 * BOF Route Owner:
 * URL: /pretrip/:loadId
 * Type: DISPATCH
 * Primary component: PretripTabletDashboard
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { PretripTabletDashboard } from "@/components/PretripTabletDashboard";
import { getPrimaryFleetId, type SessionWithMemberships } from "@/lib/session-fleet";

type Props = { params: Promise<{ loadId: string }> };

export async function generateMetadata({ params }: Props) {
  const { loadId } = await params;
  return {
    title: `Pre-trip - ${loadId} | BOF`,
  };
}

export default async function PretripTabletPage({ params }: Props) {
  const { loadId } = await params;
  const session = (await auth()) as SessionWithMemberships;
  const fleetId = getPrimaryFleetId(session);

  return (
    <div className="bof-page bof-tablet-page">
      <nav className="bof-breadcrumb bof-tablet-breadcrumb" aria-label="Breadcrumb">
        <Link href="/dispatch">Dispatch</Link>
        <span aria-hidden> / </span>
        <Link href={`/loads/${loadId}`}>Load {loadId}</Link>
        <span aria-hidden> / </span>
        <span>Pre-trip tablet</span>
      </nav>

      <PretripTabletDashboard loadId={loadId} fleetId={fleetId} />
    </div>
  );
}
