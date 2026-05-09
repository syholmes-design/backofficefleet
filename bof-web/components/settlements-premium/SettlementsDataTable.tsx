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
  Ready: { label: "Ready", className: "bg-green-100 text-green-800" },
  "Needs Review": { label: "Needs Review", className: "bg-yellow-100 text-yellow-800" },
  Hold: { label: "Hold", className: "bg-red-100 text-red-800" },
  Paid: { label: "Paid", className: "bg-blue-100 text-blue-800" },
  "Missing Source Data": { label: "Missing Source Data", className: "bg-gray-100 text-gray-800" },
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
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No settlement data found</p>
          <p className="text-sm mt-2">Try adjusting your filters or check the data source.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Driver Settlements ({rows.length} drivers)
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver ID
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gross
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reimbursements
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deductions
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Holds/Issues
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedRows.map((row) => {
              const statusInfo = statusConfig[row.status];
              const isSelected = selectedDriverId === row.driverId;
              
              return (
                <tr
                  key={row.driverId}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onDriverSelect(row.driverId)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {row.driverName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {row.driverId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(row.grossPay)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(row.reimbursements)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-red-600">
                      {formatCurrency(row.deductions)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-green-600">
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
                      <div className="text-sm text-red-600">
                        {row.holds[0]}
                        {row.holds.length > 1 && (
                          <span className="text-xs text-gray-500">
                            {' '}+{row.holds.length - 1} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-green-600">
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
                        className="text-blue-600 hover:text-blue-800 transition-colors"
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
                          className="text-gray-400 hover:text-gray-600 transition-colors"
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
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Data source: consolidated BOF main-source Excel • Values are source-provided where available
        </div>
      </div>
    </div>
  );
}
