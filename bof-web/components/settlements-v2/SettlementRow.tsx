"use client";

import { StatusBadge } from "./StatusBadge";
import type { DriverSettlementRow } from "./SettlementsV2Page";

interface SettlementRowProps {
  row: DriverSettlementRow;
  isSelected: boolean;
  onSelect: () => void;
  formatCurrency: (amount: number) => string;
}

export function SettlementRow({ row, isSelected, onSelect, formatCurrency }: SettlementRowProps) {
  return (
    <tr 
      className={`
        cursor-pointer transition-colors
        ${isSelected 
          ? 'bg-slate-700 hover:bg-slate-700' 
          : 'hover:bg-slate-700/50'
        }
      `}
      onClick={onSelect}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-white">
          {row.driverName}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-300">
          {row.driverId}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm text-green-400 font-medium">
          {formatCurrency(row.grossPay)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm text-red-400 font-medium">
          {formatCurrency(row.deductions)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm text-blue-400 font-medium">
          {formatCurrency(row.netPay)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm text-purple-400 font-medium">
          {formatCurrency(row.balance)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={row.status} />
      </td>
    </tr>
  );
}
