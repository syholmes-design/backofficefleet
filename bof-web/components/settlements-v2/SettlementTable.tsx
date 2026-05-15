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
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Driver Settlements
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Review driver pay, deductions, and settlement status for the selected period.
        </p>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Driver ID
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Gross Pay
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Net Pay
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
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
        
        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Total Gross Pay</p>
              <p className="text-green-400 font-medium">
                {formatCurrency(rows.reduce((sum, row) => sum + row.grossPay, 0))}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Total Deductions</p>
              <p className="text-red-400 font-medium">
                {formatCurrency(rows.reduce((sum, row) => sum + row.deductions, 0))}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Total Net Pay</p>
              <p className="text-blue-400 font-medium">
                {formatCurrency(rows.reduce((sum, row) => sum + row.netPay, 0))}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Ready to Pay</p>
              <p className="text-teal-400 font-medium">
                {rows.filter(row => row.status === "Ready").length} / {rows.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
