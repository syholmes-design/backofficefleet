"use client";

import dynamic from "next/dynamic";
import type { LoadRouteMapModel } from "@/lib/load-route-map";

const LoadRouteMap = dynamic(
  () => import("@/components/LoadRouteMap").then((m) => m.LoadRouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="bof-route-map-skeleton" role="status">
        Loading route map…
      </div>
    ),
  }
);

export function LoadRouteMapClient({ model }: { model: LoadRouteMapModel }) {
  return <LoadRouteMap model={model} />;
}
