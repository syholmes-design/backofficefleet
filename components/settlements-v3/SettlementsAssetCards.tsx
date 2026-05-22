"use client";

import { useMemo } from "react";

import { AssetCard, type AssetCardProps } from "@/components/shared/AssetCard";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildLoadPacketRegistry, type LoadPacketItem } from "@/lib/load-artifact-registry";

interface SettlementsAssetCardsProps {
  loadId?: string;
  driverId?: string;
  settlementWeek?: string;
}

type SettlementAssetDefinition = {
  key: string;
  fallbackTitle: string;
  thumbnail: string;
  description: string;
  fileSize: string;
  settlementOnly?: boolean;
};

const SETTLEMENT_DOCUMENT_PATH = "/evidence/support/settlement-documents";

const SETTLEMENT_ASSETS: SettlementAssetDefinition[] = [
  {
    key: "settlement_packet",
    fallbackTitle: "Settlement Packet",
    thumbnail: `${SETTLEMENT_DOCUMENT_PATH}/settlement-packet-preview.svg`,
    description: "Driver gross-to-net settlement summary, deductions, holds, and release status.",
    fileSize: "~50 KB",
    settlementOnly: true,
  },
  {
    key: "proof_card_composite",
    fallbackTitle: "Proof Packet Preview",
    thumbnail: "",
    description: "Visual proof summary for quick review; individual proof documents remain linked below.",
    fileSize: "~350 KB",
  },
  {
    key: "invoice",
    fallbackTitle: "Invoice",
    thumbnail: `${SETTLEMENT_DOCUMENT_PATH}/invoice-preview.svg`,
    description: "Customer invoice with linehaul, accessorials, and billing status.",
    fileSize: "~10 KB",
  },
  {
    key: "bol",
    fallbackTitle: "Bill of Lading",
    thumbnail: `${SETTLEMENT_DOCUMENT_PATH}/bill-of-lading-preview.svg`,
    description: "Signed BOL reference tied to load and settlement release.",
    fileSize: "~25 KB",
  },
  {
    key: "pod",
    fallbackTitle: "Proof of Delivery",
    thumbnail: `${SETTLEMENT_DOCUMENT_PATH}/proof-of-delivery-preview.svg`,
    description: "Delivery signature and timestamp used for settlement release.",
    fileSize: "~18 KB",
  },
  {
    key: "pickup_photo",
    fallbackTitle: "Pickup Photo",
    thumbnail: "",
    description: "Pickup facility proof tied to the load record.",
    fileSize: "~250 KB",
  },
  {
    key: "cargo_photo",
    fallbackTitle: "Cargo Pickup Photo",
    thumbnail: "",
    description: "Cargo condition, count, and securement photo before departure.",
    fileSize: "~300 KB",
  },
  {
    key: "seal_pickup_photo",
    fallbackTitle: "Pickup Seal Photo",
    thumbnail: "",
    description: "Seal photo captured before leaving shipper custody.",
    fileSize: "~220 KB",
  },
  {
    key: "seal_delivery_photo",
    fallbackTitle: "Delivery Seal Photo",
    thumbnail: "",
    description: "Receiver-side seal proof for proof-chain continuity.",
    fileSize: "~220 KB",
  },
  {
    key: "delivery_empty_trailer",
    fallbackTitle: "Delivery / Empty Trailer Proof",
    thumbnail: "",
    description: "Receiver-side delivery closeout and empty trailer proof.",
    fileSize: "~300 KB",
  },
  {
    key: "rate_confirmation",
    fallbackTitle: "Rate Confirmation",
    thumbnail: `${SETTLEMENT_DOCUMENT_PATH}/rate-confirmation-preview.svg`,
    description: "Broker/customer rate confirmation and accessorial terms.",
    fileSize: "~15 KB",
  },
  {
    key: "settlement_hold_notice",
    fallbackTitle: "Settlement Hold Notice",
    thumbnail: `${SETTLEMENT_DOCUMENT_PATH}/settlement-hold-evidence-preview.svg`,
    description: "Settlement hold evidence summary with reason, amount, and required fix.",
    fileSize: "~20 KB",
  },
  {
    key: "lumper_receipt",
    fallbackTitle: "QR Lumper Closeout",
    thumbnail: `${SETTLEMENT_DOCUMENT_PATH}/lumper-receipt-preview.svg`,
    description: "Trailer QR authorization, empty-trailer proof, and BOF payment support.",
    fileSize: "~900 KB",
  },
  {
    key: "claim_packet",
    fallbackTitle: "Claim Evidence",
    thumbnail: `${SETTLEMENT_DOCUMENT_PATH}/claim-chargeback-preview.svg`,
    description: "Chargeback/claim evidence packet tied to cargo condition and amount at risk.",
    fileSize: "~8 KB",
  },
  {
    key: "factoring_notification",
    fallbackTitle: "Post-Trip Factoring Packet",
    thumbnail: `${SETTLEMENT_DOCUMENT_PATH}/factoring-packet-preview.svg`,
    description: "Invoice, BOL, POD, rate confirmation, and proof checklist for factoring.",
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

function isImageUrl(url?: string) {
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(String(url ?? "").split("?")[0]);
}

function settlementPacketCard(loadId: string, driverId?: string, settlementWeek?: string): AssetCardProps {
  return {
    title: "Settlement Packet",
    status: "ready",
    thumbnail: `${SETTLEMENT_DOCUMENT_PATH}/settlement-packet-preview.svg`,
    openLink: driverId ? `/drivers/${driverId}/settlements` : "/settlements",
    openLabel: "Review pay",
    relatedEntity: {
      type: "settlement",
      id: loadId,
      name: loadId,
    },
    description: "Driver gross-to-net settlement summary, deductions, holds, and release status.",
    fileSize: "~50 KB",
    lastUpdated: settlementWeek || "This week",
  };
}

function toAssetCard(
  loadId: string,
  definition: SettlementAssetDefinition,
  item: LoadPacketItem | undefined,
  driverId?: string,
  settlementWeek?: string
): AssetCardProps {
  if (definition.settlementOnly) return settlementPacketCard(loadId, driverId, settlementWeek);
  return {
    title: item?.title ?? definition.fallbackTitle,
    status: assetStatus(item),
    thumbnail: isImageUrl(item?.canonicalUrl) ? item?.canonicalUrl : definition.thumbnail || undefined,
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

export function SettlementsAssetCards({ loadId, settlementWeek }: SettlementsAssetCardsProps) {
  const { data } = useBofDemoData();
  const assets = useMemo(() => {
    if (!loadId) return [];
    const registry = buildLoadPacketRegistry(data, loadId);
    if (!registry) return [];
    return SETTLEMENT_ASSETS.flatMap((definition) => {
      if (definition.settlementOnly) return [toAssetCard(loadId, definition, undefined, registry.load.driverId, settlementWeek)];
      const item = registry.packetItemsByKey[definition.key];
      if (!item || item.status === "not_applicable") return [];
      return [toAssetCard(loadId, definition, item, registry.load.driverId, settlementWeek)];
    });
  }, [data, loadId, settlementWeek]);

  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <div className="text-center">
          <p className="text-slate-400">No settlement assets available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <h3 className="mb-6 text-lg font-semibold text-white">Settlement Documents</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <AssetCard key={`${asset.relatedEntity?.id}-${asset.title}`} {...asset} />
          ))}
        </div>
      </div>
    </div>
  );
}
