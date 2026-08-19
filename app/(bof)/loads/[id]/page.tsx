/**
 * BOF Route Owner:
 * URL: /loads/:id
 * Type: DISPATCH
 * Primary component: LoadDetailContent
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { LoadDetailContent } from "@/components/dispatch/LoadDetailContent";
import { getLoadById } from "@/lib/services/loadService";
import { type DispatchLoadRecord } from "@/lib/dispatch-workflow-ui";
import { type SessionWithMemberships } from "@/lib/session-fleet";

type Props = { params: Promise<{ id: string }> };

function serializeLoad(load: Awaited<ReturnType<typeof getLoadById>>): DispatchLoadRecord {
  return {
    ...load,
    pickupWindowStart: load.pickupWindowStart?.toISOString() ?? null,
    pickupWindowEnd: load.pickupWindowEnd?.toISOString() ?? null,
    deliveryWindowStart: load.deliveryWindowStart?.toISOString() ?? null,
    deliveryWindowEnd: load.deliveryWindowEnd?.toISOString() ?? null,
    createdAt: load.createdAt.toISOString(),
    updatedAt: load.updatedAt.toISOString(),
  };
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `Load ${id} | BOF`,
  };
}

export default async function LoadDetailPage({ params }: Props) {
  const { id } = await params;
  const session = (await auth()) as SessionWithMemberships;

  if (!session?.user?.id) {
    return (
      <div className="bof-page">
        <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-6 text-sm text-amber-50">
          Session expired. Sign in again to review the dispatch load file.
        </div>
      </div>
    );
  }

  try {
    const load = await getLoadById(session.user, id);

    return (
      <div className="bof-page">
        <nav className="bof-breadcrumb" aria-label="Breadcrumb">
          <Link href="/dispatch">Dispatch</Link>
          <span aria-hidden> / </span>
          <span>Load {id}</span>
        </nav>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <LoadDetailContent load={serializeLoad(load)} />
        </div>
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dispatch file.";
    return (
      <div className="bof-page">
        <nav className="bof-breadcrumb" aria-label="Breadcrumb">
          <Link href="/dispatch">Dispatch</Link>
          <span aria-hidden> / </span>
          <span>Load {id}</span>
        </nav>
        <div className="mt-4 rounded-xl border border-rose-700/40 bg-rose-950/20 p-6 text-sm text-rose-100">
          {message}
        </div>
      </div>
    );
  }
}
