"use client";

import { useState, useEffect } from "react";
import { AssetCard, type AssetCardProps } from "@/components/shared/AssetCard";

interface SafetyAssetCardsProps {
  driverId?: string;
  safetyEventId?: string;
  relatedLoadId?: string;
}

export function SafetyAssetCards({ driverId, safetyEventId, relatedLoadId }: SafetyAssetCardsProps) {
  const [assets, setAssets] = useState<AssetCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSafetyAssets();
  }, [driverId, safetyEventId, relatedLoadId]);

  const loadSafetyAssets = async () => {
    try {
      setLoading(true);
      const assetCards: AssetCardProps[] = [];

      // Safety Event Photo
      assetCards.push({
        title: "Safety Event Photo",
        status: "ready",
        thumbnail: "/assets/images/safety_event_evidence_1.png",
        openLink: "/assets/images/safety_event_evidence_1.png",
        relatedEntity: safetyEventId ? {
          type: "safety-event",
          id: safetyEventId,
          name: `Event ${safetyEventId}`,
        } : driverId ? {
          type: "driver",
          id: driverId,
          name: driverId,
        } : undefined,
        description: "Photo documentation of safety event",
        fileSize: "~185 KB",
        lastUpdated: "Today",
      });

      // Dashcam Still
      assetCards.push({
        title: "Dashcam Recording",
        status: "ready",
        thumbnail: "/evidence/support/document-support/camera-status-photo.png",
        openLink: "/evidence/support/document-support/camera-status-photo.png",
        relatedEntity: driverId ? {
          type: "driver",
          id: driverId,
          name: driverId,
        } : undefined,
        description: "Dashcam still frame from incident",
        fileSize: "~40 KB",
        lastUpdated: "Today",
      });

      // Claim Photo
      assetCards.push({
        title: "Claim Documentation",
        status: relatedLoadId ? "ready" : "pending",
        thumbnail: relatedLoadId ? `/evidence/loads/${relatedLoadId}/claim-evidence.png` : "/assets/images/safety_event_evidence_2.png",
        openLink: relatedLoadId ? `/evidence/loads/${relatedLoadId}/claim-evidence.png` : undefined,
        relatedEntity: relatedLoadId ? {
          type: "load",
          id: relatedLoadId,
          name: relatedLoadId,
        } : driverId ? {
          type: "driver",
          id: driverId,
          name: driverId,
        } : undefined,
        description: "Photo evidence for insurance claim",
        fileSize: "~928 KB",
        lastUpdated: "Today",
      });

      // Driver Statement
      assetCards.push({
        title: "Driver Statement",
        status: driverId ? "ready" : "pending",
        thumbnail: undefined,
        openLink: driverId ? `/generated/drivers/${driverId}/incident-report.html` : undefined,
        relatedEntity: driverId ? {
          type: "driver",
          id: driverId,
          name: driverId,
        } : undefined,
        description: "Driver's written statement of the incident",
        fileSize: "~3 KB",
        lastUpdated: "Today",
      });

      // Coaching Form
      assetCards.push({
        title: "Coaching Form",
        status: driverId ? "ready" : "pending",
        thumbnail: undefined,
        openLink: driverId ? `/generated/drivers/${driverId}/safety-acknowledgment.html` : undefined,
        relatedEntity: driverId ? {
          type: "driver",
          id: driverId,
          name: driverId,
        } : undefined,
        description: "Safety coaching and corrective action form",
        fileSize: "~2.5 KB",
        lastUpdated: "Today",
      });

      // Insurance Claim Packet
      assetCards.push({
        title: "Insurance Claim Packet",
        status: relatedLoadId ? "ready" : "pending",
        thumbnail: "/evidence/support/document-support/insurance-certificate-preview.png",
        openLink: relatedLoadId ? `/generated/loads/${relatedLoadId}/insurance-packet.html` : undefined,
        relatedEntity: relatedLoadId ? {
          type: "load",
          id: relatedLoadId,
          name: relatedLoadId,
        } : driverId ? {
          type: "driver",
          id: driverId,
          name: driverId,
        } : undefined,
        description: "Complete insurance claim documentation",
        fileSize: "~15 KB",
        lastUpdated: "Today",
      });

      // Related Load Proof
      if (relatedLoadId) {
        assetCards.push({
          title: "Related Load Proof",
          status: "ready",
          thumbnail: `/evidence/loads/${relatedLoadId}/cargo-photo.png`,
          openLink: `/evidence/loads/${relatedLoadId}/cargo-photo.png`,
          relatedEntity: {
            type: "load",
            id: relatedLoadId,
            name: relatedLoadId,
          },
          description: "Load documentation related to safety event",
          fileSize: "~2 MB",
          lastUpdated: "Today",
        });
      }

      setAssets(assetCards);
    } catch (error) {
      console.error("Failed to load safety assets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading safety assets...</p>
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="text-center">
          <p className="text-slate-400">No safety assets available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Safety Documentation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset, index) => (
            <AssetCard key={index} {...asset} />
          ))}
        </div>
      </div>
    </div>
  );
}
