"use client";

import { DollarSign, Shield, AlertTriangle } from "lucide-react";
import type { DriverSettlementRow } from "./SettlementsCommandCenter";
import type { SettlementPeriodOption } from "@/lib/settlement-periods";

interface SettlementSummaryProps {
  driverSettlement: DriverSettlementRow;
  period: SettlementPeriodOption;
}

export function SettlementSummary({ driverSettlement, period }: SettlementSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-700">
      {/* Summary Cards */}
      <div className="px-6 py-4 border-b border-slate-700">
        <h4 className="font-medium text-slate-100 mb-3">Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-900/30 rounded-lg p-3 border border-emerald-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-300">Gross Pay</span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-emerald-100 mt-1">
              {formatCurrency(driverSettlement.grossPay)}
            </p>
          </div>
          <div className="bg-teal-900/30 rounded-lg p-3 border border-teal-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-teal-300">Net Pay</span>
              <DollarSign className="h-4 w-4 text-teal-400" />
            </div>
            <p className="text-lg font-bold text-teal-100 mt-1">
              {formatCurrency(driverSettlement.netPay)}
            </p>
          </div>
          <div className="bg-amber-900/30 rounded-lg p-3 border border-amber-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-amber-300">Deductions</span>
              <DollarSign className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-lg font-bold text-amber-100 mt-1">
              {formatCurrency(driverSettlement.deductions)}
            </p>
          </div>
          <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-300">Reimbursements</span>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-lg font-bold text-purple-100 mt-1">
              {formatCurrency(driverSettlement.reimbursements)}
            </p>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="px-6 py-4 border-b border-slate-700">
        <h4 className="font-medium text-slate-100 mb-3">Additional Details</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Settlement Period</span>
            <span className="font-medium text-slate-200">{period.label || "[Not Provided]"}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Equipment ID</span>
            <span className="font-medium text-slate-200">[Not Provided]</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Advances</span>
            <span className="font-medium text-slate-200">[Not Provided]</span>
          </div>
          
          {driverSettlement.safetyBonus && driverSettlement.safetyBonus > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Safety Bonus
              </span>
              <span className="font-medium text-emerald-200">{formatCurrency(driverSettlement.safetyBonus)}</span>
            </div>
          )}
          
          {driverSettlement.familySupport && driverSettlement.familySupport > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Family Support / Withholding
              </span>
              <span className="font-medium text-amber-200">{formatCurrency(driverSettlement.familySupport)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
