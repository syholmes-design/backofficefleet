"use client";

import { User } from "lucide-react";
import { SettlementHeader } from "./SettlementHeader";
import { SettlementSummary } from "./SettlementSummary";
import { SettlementLineItems } from "./SettlementLineItems";
import { SettlementFooter } from "./SettlementFooter";
import type { DriverSettlementRow } from "./SettlementsCommandCenter";
import type { SettlementPeriodOption } from "@/lib/settlement-periods";

interface SettlementDetailPanelProps {
  driverSettlement: DriverSettlementRow | null;
  period: SettlementPeriodOption;
}

export function SettlementDetailPanel({ driverSettlement, period }: SettlementDetailPanelProps) {
  const handleBackToSettlements = () => {
    // Clear selected driver or scroll back to table
    // This will be handled by the parent component
    window.location.href = "#settlements-table";
  };

  if (!driverSettlement) {
    return (
      <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-700 p-6">
        <div className="text-center">
          <div className="bg-slate-800 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <User className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Select a Driver</h3>
          <p className="text-slate-400 text-sm mb-6">
            Choose a driver from the table to view detailed settlement information and take action.
          </p>
          
          {/* Example Review Checklist */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
            <h4 className="text-sm font-medium text-slate-300 mb-3">What you&apos;ll see:</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                <span>Settlement header with ID, date, driver info, and status</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                <span>Summary section with gross pay, deductions, reimbursements, net pay</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                <span>Detailed line item breakdown with categories and charge types</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                <span>Footer actions for PDF download, packet view, and driver profile</span>
              </li>
            </ul>
          </div>
          
          {/* Quick Actions */}
          <div className="space-y-2">
            <button
              disabled
              className="w-full cursor-not-allowed rounded bg-slate-700 px-4 py-2 text-sm font-medium text-slate-500"
            >
              Review First Exception
            </button>
            <a
              href="/generated/company-operations-vault/05-accounting-finance-close-ap-ar-sop.html"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded bg-slate-700 px-4 py-2 text-center text-sm font-medium text-slate-300 transition-colors hover:bg-slate-600"
            >
              View Settlement Guidelines
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="settlements-table">
      {/* Header Section */}
      <SettlementHeader driverSettlement={driverSettlement} period={period} />
      
      {/* Summary Section */}
      <SettlementSummary driverSettlement={driverSettlement} period={period} />
      
      {/* Line Item Breakdown */}
      <SettlementLineItems driverSettlement={driverSettlement} />
      
      {/* Footer Actions */}
      <SettlementFooter 
        driverSettlement={driverSettlement} 
        onBackToSettlements={handleBackToSettlements}
      />
    </div>
  );
}
