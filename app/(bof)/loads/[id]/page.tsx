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
import { RuntimeLoadDetailFallback } from "@/components/loads/RuntimeLoadDetailFallback";
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
    return <RuntimeLoadDetailFallback loadId={id} />;
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
  } catch {
    return <RuntimeLoadDetailFallback loadId={id} />;
  }
}
