"use client";

import { useMemo } from "react";

import { AssetCard, type AssetCardProps } from "@/components/shared/AssetCard";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildLoadPacketRegistry, type LoadPacketItem } from "@/lib/load-artifact-registry";

interface DispatchAssetCardsProps {
  loadId?: string;
  driverId?: string;
}

type DispatchAssetDefinition = {
  key: string;
  fallbackTitle: string;
  thumbnail: string;
  description: string;
  fileSize: string;
};

const DISPATCH_ASSETS: DispatchAssetDefinition[] = [
  {
    key: "rate_confirmation",
    fallbackTitle: "Rate Confirmation",
    thumbnail: "/evidence/support/document-support/rate-confirmation-preview.png",
    description: "Confirmed rate, accessorial rules, pickup, delivery, and dispatch terms.",
    fileSize: "~15 KB",
  },
  {
    key: "bol",
    fallbackTitle: "Bill of Lading",
    thumbnail: "/evidence/support/document-support/bol-preview.png",
    description: "Official shipment document tied to pickup and customer proof.",
    fileSize: "~25 KB",
  },
  {
    key: "pod",
    fallbackTitle: "Proof of Delivery",
    thumbnail: "/evidence/support/document-support/delivery-pod-photo.png",
    description: "Receiver delivery proof used for billing, settlement, and factoring.",
    fileSize: "~18 KB",
  },
  {
    key: "seal_pickup_photo",
    fallbackTitle: "Pickup Seal Proof",
    thumbnail: "/evidence/support/document-support/seal-records-preview.png",
    description: "Seal number and pickup photo before the driver leaves shipper custody.",
    fileSize: "~10 KB",
  },
  {
    key: "cargo_photo",
    fallbackTitle: "Pre-trip Cargo Photo",
    thumbnail: "/evidence/support/document-support/cargo-securement-preview.png",
    description: "Cargo condition, count, and securement proof before departure.",
    fileSize: "~2 MB",
  },
  {
    key: "rfid_geo",
    fallbackTitle: "RFID Proof Chain",
    thumbnail: "/evidence/support/document-support/rfid-proof-preview.png",
    description: "RFID scan and geofence proof for custody, dock, and route continuity.",
    fileSize: "~8 KB",
  },
  {
    key: "traffic_weather_hos",
    fallbackTitle: "Route, Weather, HOS",
    thumbnail: "/evidence/support/document-support/route-map-preview.png",
    description: "Route plan, traffic/weather watch, rest-stop posture, and HOS context.",
    fileSize: "~45 KB",
  },
];

function assetStatus(item?: LoadPacketItem): AssetCardProps["status"] {
  if (!item) return "missing";
  if (item.category === "exceptions" && item.status !== "not_applicable" && item.status !== "ready") return "exception";
  if (item.status === "ready") return "ready";
  if (item.status === "missing") return "missing";
  return "pending";
}

function toAssetCard(loadId: string, definition: DispatchAssetDefinition, item?: LoadPacketItem): AssetCardProps {
  return {
    title: item?.title ?? definition.fallbackTitle,
    status: assetStatus(item),
    thumbnail: definition.thumbnail,
    openLink: item?.actionUrl,
    openLabel: item?.actionLabel,
    relatedEntity: {
      type: "load",
      id: loadId,
      name: loadId,
    },
    description: item?.description ?? definition.description,
    fileSize: definition.fileSize,
    lastUpdated: "Today",
  };
}

export function DispatchAssetCards({ loadId }: DispatchAssetCardsProps) {
  const { data } = useBofDemoData();
  const assets = useMemo(() => {
    if (!loadId) return [];
    const registry = buildLoadPacketRegistry(data, loadId);
    if (!registry) return [];
    return DISPATCH_ASSETS.flatMap((definition) => {
      const item = registry.packetItemsByKey[definition.key];
      if (!item || item.status === "not_applicable") return [];
      return [toAssetCard(loadId, definition, item)];
    });
  }, [data, loadId]);

  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <div className="text-center">
          <p className="text-slate-400">No load packet assets available for this load</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <h3 className="mb-6 text-lg font-semibold text-white">Load Documents & Proof</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <AssetCard key={`${asset.relatedEntity?.id}-${asset.title}`} {...asset} />
          ))}
        </div>
      </div>
    </div>
  );
}
