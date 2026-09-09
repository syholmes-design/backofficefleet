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
import { normalizeCanonicalLoadId } from "@/lib/canonical-load-stories";
import { DEMO_SOURCE_REJECTED, isDemoOperationalKey } from "@/lib/uos/demo-operational-keys";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function resolveLoadPageId(rawId: string) {
  if (/^PI-TEST-/i.test(rawId.trim())) return rawId.trim();
  return normalizeCanonicalLoadId(rawId);
}

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
  const { id: rawId } = await params;
  const id = resolveLoadPageId(rawId);
  return {
    title: `Load ${id} | BOF`,
  };
}

export default async function LoadDetailPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = resolveLoadPageId(rawId);
  const session = (await auth()) as SessionWithMemberships;

  if (!session?.user?.id) {
    return (
      <div className="bof-page">
        <h1 className="text-2xl font-semibold text-slate-100">Operator load file</h1>
        <p className="mt-3 max-w-xl text-sm text-slate-300">
          Load {id} is an operator workflow. An existing BOF operator session is required. Customer-visible
          shipment status remains on /portals/customer. This page does not render driver pay, dispatch
          controls, or demo fallback identities without authentication.
        </p>
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
    const message = error instanceof Error ? error.message : "";
    if (isDemoOperationalKey(id) || message.includes(DEMO_SOURCE_REJECTED)) {
      return (
        <div className="bof-page">
          <h1 className="text-2xl font-semibold text-amber-100">DEMO key isolated</h1>
          <p className="mt-3 max-w-xl text-sm text-slate-300">
            {id} is a DEMO operational identifier. It is not LIVE Prisma load authority and was not promoted
            into production state. DEMO load presentation remains at{" "}
            <Link className="text-amber-200 underline" href="/demo/loads">
              /demo/loads
            </Link>
            .
          </p>
        </div>
      );
    }
    return <RuntimeLoadDetailFallback loadId={id} />;
  }
}
