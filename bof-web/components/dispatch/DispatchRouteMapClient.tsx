"use client";

import dynamic from "next/dynamic";
import type { Load } from "@/types/dispatch";

const DispatchRouteMap = dynamic(
  () => import("./DispatchRouteMap").then((m) => m.DispatchRouteMap),
  { ssr: false }
);

type Props = {
  loads: Load[];
  selectedLoadId?: string;
  onSelectLoad?: (loadId: string) => void;
  mode?: "all" | "selected";
  compact?: boolean;
};

export function DispatchRouteMapClient(props: Props) {
  return <DispatchRouteMap {...props} />;
}

