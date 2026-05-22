"use client";

import { useMemo } from "react";
import type { DriverSettlementRow, SettlementStatus } from "./SettlementsCommandCenter";

interface SettlementsDataTableProps {
  rows: DriverSettlementRow[];
  selectedDriverId: string;
  onDriverSelect: (driverId: string) => void;
}

const statusConfig: Record<SettlementStatus, { label: string; className: string }> = {
  Ready: { label: "Ready", className: "bg-emerald-900/30 text-emerald-300 border border-emerald-700/50" },
  "Needs Review": { label: "Needs Review", className: "bg-amber-900/30 text-amber-300 border border-amber-700/50" },
  Hold: { label: "Hold", className: "bg-red-900/30 text-red-300 border border-red-700/50" },
  Paid: { label: "Paid", className: "bg-teal-900/30 text-teal-300 border border-teal-700/50" },
  "Missing Source Data": { label: "Missing Source Data", className: "bg-slate-800/50 text-slate-400 border border-slate-700/50" },
};

export function SettlementsDataTable({ rows, selectedDriverId, onDriverSelect }: SettlementsDataTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => a.driverId.localeCompare(b.driverId));
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-700 p-8">
        <div className="text-center text-slate-400">
          <p className="text-lg font-medium">No settlement data found</p>
          <p className="text-sm mt-2">Try adjusting your filters or check the data source.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-700">
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-100">
          Driver Settlements ({rows.length} drivers)
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Click any row to view detailed settlement information
        </p>
      </div>
      
      {/* CSS Grid Layout for better control */}
      <div className="px-6 py-4">
        {/* Header */}
        <div className="grid grid-cols-6 gap-4 pb-3 border-b border-slate-700 text-xs font-medium text-slate-400 uppercase tracking-wider">
          <div className="col-span-2 text-left">Driver</div>
          <div className="text-right">Gross</div>
          <div className="text-right">Reimb.</div>
          <div className="text-right">Deductions</div>
          <div className="text-right">Net</div>
          <div className="text-center">Status</div>
        </div>
        
        {/* Table Body */}
        <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
          {sortedRows.map((row) => {
            const statusInfo = statusConfig[row.status];
            const isSelected = selectedDriverId === row.driverId;
            const hasIssues = row.holds.length > 0 || (row.familySupport && row.familySupport > 0) || (row.grossPay > 0 && (row.deductions / row.grossPay) > 0.3);
            
            return (
              <div
                key={row.driverId}
                className={`grid grid-cols-6 gap-4 py-3 hover:bg-slate-800 cursor-pointer transition-colors ${
                  isSelected ? 'bg-teal-900/30 border-l-4 border-l-teal-500 -ml-1 pl-5' : ''
                }`}
                onClick={() => onDriverSelect(row.driverId)}
              >
                {/* Driver Column (spans 2 cols) */}
                <div className="col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        isSelected ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {row.driverName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-100 truncate">
                        {row.driverName}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {row.driverId}
                      </div>
                    </div>
                    {hasIssues && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Gross */}
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-100">
                    {formatCurrency(row.grossPay)}
                  </div>
                </div>
                
                {/* Reimbursements */}
                <div className="text-right">
                  <div className="text-sm text-slate-300">
                    {formatCurrency(row.reimbursements)}
                  </div>
                </div>
                
                {/* Deductions */}
                <div className="text-right">
                  <div className="text-sm text-slate-300">
                    {formatCurrency(row.deductions)}
                  </div>
                </div>
                
                {/* Net */}
                <div className="text-right">
                  <div className="text-sm font-medium text-teal-400">
                    {formatCurrency(row.netPay)}
                  </div>
                </div>
                
                {/* Status */}
                <div className="text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDriverSelect(row.driverId);
                    }}
                    className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded transition-colors"
                  >
                    {isSelected ? '✓' : 'Review'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Footer with data provenance */}
      <div className="px-6 py-3 bg-slate-800 border-t border-slate-700">
        <div className="text-xs text-slate-400">
          Data source: main-source-v2_enhanced_bof_aligned.xlsx • Values are source-provided where available
        </div>
      </div>
    </div>
  );
}
