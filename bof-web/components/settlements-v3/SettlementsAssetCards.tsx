"use client";

import { useState, useEffect } from "react";
import { AssetCard, type AssetCardProps } from "@/components/shared/AssetCard";

interface SettlementsAssetCardsProps {
  loadId?: string;
  driverId?: string;
  settlementWeek?: string;
}

export function SettlementsAssetCards({ loadId, driverId, settlementWeek }: SettlementsAssetCardsProps) {
  const [assets, setAssets] = useState<AssetCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettlementAssets();
  }, [loadId, driverId, settlementWeek]);

  const loadSettlementAssets = async () => {
    try {
      setLoading(true);
      const assetCards: AssetCardProps[] = [];

      if (loadId) {
        // Settlement Packet
        assetCards.push({
          title: "Settlement Packet",
          status: "ready",
          thumbnail: "/evidence/support/document-support/settlement-statement-preview.png",
          openLink: `/generated/settlements/${loadId}/settlement-summary.html`,
          relatedEntity: {
            type: "settlement",
            id: loadId,
            name: `Settlement ${loadId}`,
          },
          description: "Complete settlement packet with all documentation",
          fileSize: "~50 KB",
          lastUpdated: settlementWeek || "This week",
        });

        // Invoice
        assetCards.push({
          title: "Invoice",
          status: "ready",
          thumbnail: "/evidence/support/document-support/invoice-paid-preview.png",
          openLink: `/generated/loads/${loadId}/invoice.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Load invoice and billing details",
          fileSize: "~10 KB",
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

        // Hold Reason Evidence
        assetCards.push({
          title: "Hold Evidence",
          status: "pending",
          thumbnail: "/evidence/loads/${loadId}/claim-evidence.png",
          openLink: `/generated/loads/${loadId}/claim-packet.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Documentation for settlement holds",
          fileSize: "~20 KB",
          lastUpdated: "Today",
        });

        // Lumper Receipt (if relevant)
        assetCards.push({
          title: "Lumper Receipt",
          status: loadId === "L003" || loadId === "L004" ? "ready" : "pending",
          thumbnail: "/evidence/support/document-support/lumper-receipt-preview.png",
          openLink: loadId === "L003" || loadId === "L004" 
            ? `/evidence/loads/${loadId}/lumper-receipt-photo.jpg`
            : undefined,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Lumper service receipt and reimbursement",
          fileSize: "~900 KB",
          lastUpdated: "Today",
        });

        // Claim/Chargeback Evidence (if relevant)
        assetCards.push({
          title: "Claim Evidence",
          status: "pending",
          thumbnail: "/evidence/loads/${loadId}/damage-photo.png",
          openLink: `/generated/loads/${loadId}/damage-photo-packet.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Claim and chargeback documentation",
          fileSize: "~8 KB",
          lastUpdated: "Today",
        });
      }

      setAssets(assetCards);
    } catch (error) {
      console.error("Failed to load settlement assets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading settlement assets...</p>
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="text-center">
          <p className="text-slate-400">No settlement assets available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Settlement Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset, index) => (
            <AssetCard key={index} {...asset} />
          ))}
        </div>
      </div>
    </div>
  );
}
