"use client";

import { useState, useEffect } from "react";
import { AssetCard, type AssetCardProps } from "@/components/shared/AssetCard";

interface DispatchAssetCardsProps {
  loadId?: string;
  driverId?: string;
}

export function DispatchAssetCards({ loadId, driverId }: DispatchAssetCardsProps) {
  const [assets, setAssets] = useState<AssetCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDispatchAssets();
  }, [loadId, driverId]);

  const loadDispatchAssets = async () => {
    try {
      setLoading(true);
      const assetCards: AssetCardProps[] = [];

      if (loadId) {
        // Rate Confirmation
        assetCards.push({
          title: "Rate Confirmation",
          status: "ready",
          thumbnail: "/evidence/support/document-support/rate-confirmation-preview.png",
          openLink: `/generated/loads/${loadId}/rate-confirmation.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Confirmed rate and terms for this load",
          fileSize: "~15 KB",
          lastUpdated: "Today",
        });

        // Bill of Lading (BOL)
        assetCards.push({
          title: "Bill of Lading",
          status: "ready",
          thumbnail: "/evidence/support/document-support/bol-preview.png",
          openLink: `/generated/loads/${loadId}/bol.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Official bill of lading document",
          fileSize: "~25 KB",
          lastUpdated: "Today",
        });

        // Proof of Delivery (POD)
        assetCards.push({
          title: "Proof of Delivery",
          status: "ready",
          thumbnail: "/evidence/support/document-support/delivery-pod-photo.png",
          openLink: `/generated/loads/${loadId}/pod.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Signed proof of delivery confirmation",
          fileSize: "~18 KB",
          lastUpdated: "Today",
        });

        // Seal Photo
        assetCards.push({
          title: "Seal Verification",
          status: "ready",
          thumbnail: `/evidence/loads/${loadId}/seal-photo.png`,
          openLink: `/evidence/loads/${loadId}/seal-photo.png`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Container seal verification photos",
          fileSize: "~10 KB",
          lastUpdated: "Today",
        });

        // Cargo Photo
        assetCards.push({
          title: "Cargo Photos",
          status: "ready",
          thumbnail: `/evidence/loads/${loadId}/cargo-photo.png`,
          openLink: `/evidence/loads/${loadId}/cargo-photo.png`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Cargo condition photos at pickup and delivery",
          fileSize: "~2 MB",
          lastUpdated: "Today",
        });

        // RFID Proof
        assetCards.push({
          title: "RFID Proof Chain",
          status: "ready",
          thumbnail: `/evidence/loads/${loadId}/rfid-dock-proof.png`,
          openLink: `/generated/loads/${loadId}/rfid-proof.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "RFID scan proof and chain of custody",
          fileSize: "~8 KB",
          lastUpdated: "Today",
        });

        // Route/Fuel/Rest Evidence
        assetCards.push({
          title: "Route Evidence",
          status: "ready",
          thumbnail: "/evidence/support/document-support/route-map-preview.png",
          openLink: "/evidence/support/document-support/route-map-preview.png",
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Route map, fuel receipts, and rest stop documentation",
          fileSize: "~45 KB",
          lastUpdated: "Today",
        });
      }

      setAssets(assetCards);
    } catch (error) {
      console.error("Failed to load dispatch assets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dispatch assets...</p>
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="text-center">
          <p className="text-slate-400">No assets available for this load</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Load Documents & Proof</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset, index) => (
            <AssetCard key={index} {...asset} />
          ))}
        </div>
      </div>
    </div>
  );
}
