/**
 * BOF Route Owner:
 * URL: /drivers/:id
 * Type: DISPATCH
 * Primary component: DriverDetailPageClient
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { DriverDetailPageClient } from "@/components/drivers/DriverDetailPageClient";
import { getDriverByIdForSession } from "@/lib/services/driverService";
import { type SessionWithMemberships } from "@/lib/session-fleet";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `Driver ${id} | BOF`,
  };
}

export default async function DriverDetailPage({ params }: Props) {
  const { id } = await params;
  const session = (await auth()) as SessionWithMemberships;

  if (!session?.user?.id) {
    return (
      <div className="bof-page">
        <nav className="bof-breadcrumb" aria-label="Breadcrumb">
          <Link href="/drivers">Drivers</Link>
          <span aria-hidden> / </span>
          <span>Driver {id}</span>
        </nav>
        <div className="mt-4 rounded-xl border border-amber-700/40 bg-amber-950/20 p-6 text-sm text-amber-50">
          Session expired. Sign in again to review the driver file.
        </div>
      </div>
    );
  }

  try {
    const driver = await getDriverByIdForSession(session.user, id);

    return (
      <div className="bof-page">
        <nav className="bof-breadcrumb" aria-label="Breadcrumb">
          <Link href="/drivers">Drivers</Link>
          <span aria-hidden> / </span>
          <span>Driver {driver.firstName} {driver.lastName}</span>
        </nav>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <DriverDetailPageClient driverId={driver.id} />
        </div>
      </div>
    );
  } catch (error) {
    const statusCode = typeof error === "object" && error && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode)
      : 500;

    if (statusCode === 404) {
      notFound();
    }

    return (
      <div className="bof-page">
        <nav className="bof-breadcrumb" aria-label="Breadcrumb">
          <Link href="/drivers">Drivers</Link>
          <span aria-hidden> / </span>
          <span>Driver {id}</span>
        </nav>
        <div className="mt-4 rounded-xl border border-rose-700/40 bg-rose-950/20 p-6 text-sm text-rose-100">
          {error instanceof Error ? error.message : "Unable to load driver file."}
        </div>
      </div>
    );
  }
}
