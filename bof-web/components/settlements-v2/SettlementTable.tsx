"use client";

import { SettlementRow } from "./SettlementRow";
import type { DriverSettlementRow } from "./SettlementsV2Page";

interface SettlementTableProps {
  rows: DriverSettlementRow[];
  selectedDriverId: string;
  onDriverSelect: (driverId: string) => void;
}

export function SettlementTable({ rows, selectedDriverId, onDriverSelect }: SettlementTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Driver Settlements
          </h2>
          <p className="text-slate-300">
            Review driver pay, deductions, and settlement status for the selected period.
          </p>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Driver ID
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Gross Pay
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Net Pay
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {rows.map((row) => (
                <SettlementRow
                  key={row.driverId}
                  row={row}
                  isSelected={selectedDriverId === row.driverId}
                  onSelect={() => onDriverSelect(row.driverId)}
                  formatCurrency={formatCurrency}
                />
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary Cards */}
        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Summary Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-sm text-slate-400 mb-1">Total Gross Pay</p>
              <p className="text-xl font-bold text-green-400">
                {formatCurrency(rows.reduce((sum, row) => sum + row.grossPay, 0))}
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-sm text-slate-400 mb-1">Total Deductions</p>
              <p className="text-xl font-bold text-red-400">
                {formatCurrency(rows.reduce((sum, row) => sum + row.deductions, 0))}
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-sm text-slate-400 mb-1">Total Net Pay</p>
              <p className="text-xl font-bold text-blue-400">
                {formatCurrency(rows.reduce((sum, row) => sum + row.netPay, 0))}
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-sm text-slate-400 mb-1">Ready to Pay</p>
              <p className="text-xl font-bold text-teal-400">
                {rows.filter(row => row.status === "Ready").length} / {rows.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
