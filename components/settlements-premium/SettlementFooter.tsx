"use client";

import { Download, FileText, User, ArrowLeft, ExternalLink } from "lucide-react";
import type { DriverSettlementRow } from "./SettlementsCommandCenter";

interface SettlementFooterProps {
  driverSettlement: DriverSettlementRow;
  onBackToSettlements?: () => void;
}

export function SettlementFooter({ driverSettlement, onBackToSettlements }: SettlementFooterProps) {
  const settlementSummaryHref = `/generated/settlements/${driverSettlement.settlementId}/settlement-summary.svg`;
  const settlementPacketHref = driverSettlement.holds.length > 0
    ? `/generated/settlements/${driverSettlement.settlementId}/settlement-hold-explanation.svg`
    : "/documents/accounting-templates/driver-settlement-statement.html";

  const handleDownloadPDF = () => {
    window.open(settlementSummaryHref, "_blank", "noopener,noreferrer");
  };

  const handleViewSettlementPacket = () => {
    window.open(settlementPacketHref, "_blank", "noopener,noreferrer");
  };

  const handleOpenDriverProfile = () => {
    // Link to existing driver route if available
    window.location.href = `/drivers/${driverSettlement.driverId}`;
  };

  return (
    <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-700">
      <div className="px-6 py-4">
        <h4 className="font-medium text-slate-100 mb-4">Actions</h4>
        <div className="space-y-2">
          {/* Download Settlement PDF */}
          <button
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Open Settlement Summary
            <ExternalLink className="h-3 w-3" />
          </button>

          {/* View Settlement Packet */}
          <button
            onClick={handleViewSettlementPacket}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            <FileText className="h-4 w-4" />
            View Settlement Packet
            <ExternalLink className="h-3 w-3" />
          </button>

          {/* Open Driver Profile */}
          <button
            onClick={handleOpenDriverProfile}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            <User className="h-4 w-4" />
            Open Driver Profile
            <ExternalLink className="h-3 w-3" />
          </button>

          {/* Back to Settlements */}
          <button
            onClick={onBackToSettlements}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settlements
          </button>
        </div>
      </div>
    </div>
  );
}
