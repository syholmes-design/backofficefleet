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
      const settlementDocumentPath = "/evidence/support/settlement-documents";
      const hasLumperSupport = loadId === "L003" || loadId === "L008";

      if (loadId) {
        // Settlement Packet
        assetCards.push({
          title: "Settlement Packet",
          status: "ready",
          thumbnail: `${settlementDocumentPath}/settlement-packet-preview.svg`,
          openLink: `/generated/settlements/${loadId}/settlement-summary.html`,
          relatedEntity: {
            type: "settlement",
            id: loadId,
            name: `Settlement ${loadId}`,
          },
          description: "Driver gross-to-net settlement summary, deductions, holds, and release status",
          fileSize: "~50 KB",
          lastUpdated: settlementWeek || "This week",
        });

        // Invoice
        assetCards.push({
          title: "Invoice",
          status: "ready",
          thumbnail: `${settlementDocumentPath}/invoice-preview.svg`,
          openLink: `/generated/loads/${loadId}/invoice.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Customer invoice with linehaul, accessorials, and billing status",
          fileSize: "~10 KB",
          lastUpdated: "Today",
        });

        // Bill of Lading (BOL)
        assetCards.push({
          title: "Bill of Lading",
          status: "ready",
          thumbnail: `${settlementDocumentPath}/bill-of-lading-preview.svg`,
          openLink: `/generated/loads/${loadId}/bol.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Signed BOL reference tied to load and settlement release",
          fileSize: "~25 KB",
          lastUpdated: "Today",
        });

        // Proof of Delivery (POD)
        assetCards.push({
          title: "Proof of Delivery",
          status: "ready",
          thumbnail: `${settlementDocumentPath}/proof-of-delivery-preview.svg`,
          openLink: `/generated/loads/${loadId}/pod.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Delivery signature and timestamp used for settlement release",
          fileSize: "~18 KB",
          lastUpdated: "Today",
        });

        // Rate Confirmation
        assetCards.push({
          title: "Rate Confirmation",
          status: "ready",
          thumbnail: `${settlementDocumentPath}/rate-confirmation-preview.svg`,
          openLink: `/generated/loads/${loadId}/rate-confirmation.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Broker/customer rate confirmation and accessorial terms",
          fileSize: "~15 KB",
          lastUpdated: "Today",
        });

        // Hold Reason Evidence
        assetCards.push({
          title: "Hold Evidence",
          status: "pending",
          thumbnail: `${settlementDocumentPath}/settlement-hold-evidence-preview.svg`,
          openLink: `/generated/loads/${loadId}/claim-packet.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Settlement hold evidence summary with reason, amount, and required fix",
          fileSize: "~20 KB",
          lastUpdated: "Today",
        });

        // Lumper Receipt (if relevant)
        assetCards.push({
          title: "Lumper Receipt",
          status: hasLumperSupport ? "ready" : "pending",
          thumbnail: `${settlementDocumentPath}/lumper-receipt-preview.svg`,
          openLink: hasLumperSupport
            ? `/generated/settlements/${loadId}/lumper-reimbursement-support.html`
            : undefined,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Lumper receipt with vendor, amount, and reimbursement status",
          fileSize: "~900 KB",
          lastUpdated: "Today",
        });

        // Claim/Chargeback Evidence (if relevant)
        assetCards.push({
          title: "Claim Evidence",
          status: "pending",
          thumbnail: `${settlementDocumentPath}/claim-chargeback-preview.svg`,
          openLink: `/generated/loads/${loadId}/damage-photo-packet.html`,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Chargeback/claim evidence packet tied to cargo condition and amount at risk",
          fileSize: "~8 KB",
          lastUpdated: "Today",
        });

        // Post-Trip Factoring Packet
        assetCards.push({
          title: "Post-Trip Factoring Packet",
          status: loadId === "L011" ? "ready" : "missing",
          thumbnail: `${settlementDocumentPath}/factoring-packet-preview.svg`,
          openLink: loadId === "L011" 
            ? `/generated/factoring/${loadId}/post-trip-factoring-packet.html`
            : undefined,
          relatedEntity: {
            type: "load",
            id: loadId,
            name: loadId,
          },
          description: "Invoice, BOL, POD, rate-con, and proof checklist for factoring",
          fileSize: "~45 KB",
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
