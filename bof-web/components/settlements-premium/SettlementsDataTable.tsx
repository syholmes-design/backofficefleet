"use client";

import { useMemo } from "react";
import { Eye, ExternalLink } from "lucide-react";
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
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Driver ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Gross
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Reimbursements
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Deductions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Net
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Holds/Issues
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-900 divide-y divide-slate-700">
            {sortedRows.map((row) => {
              const statusInfo = statusConfig[row.status];
              const isSelected = selectedDriverId === row.driverId;
              
              return (
                <tr
                  key={row.driverId}
                  className={`hover:bg-slate-800 cursor-pointer transition-colors ${
                    isSelected ? 'bg-teal-900/20' : ''
                  }`}
                  onClick={() => onDriverSelect(row.driverId)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-100">
                      {row.driverName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-400">
                      {row.driverId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-slate-100">
                      {formatCurrency(row.grossPay)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-slate-300">
                      {formatCurrency(row.reimbursements)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-slate-300">
                      {formatCurrency(row.deductions)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-teal-400">
                      {formatCurrency(row.netPay)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.holds.length > 0 ? (
                      <div className="text-sm text-amber-400">
                        {row.holds[0]}
                        {row.holds.length > 1 && (
                          <span className="text-xs text-slate-500">
                            {' '}+{row.holds.length - 1} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-emerald-400">
                        No holds
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDriverSelect(row.driverId);
                        }}
                        className="text-teal-400 hover:text-teal-300 transition-colors"
                        title="View settlement details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {row.settlementId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Navigate to settlement document
                          }}
                          className="text-slate-400 hover:text-slate-300 transition-colors"
                          title="View settlement document"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
