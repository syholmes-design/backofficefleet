"use client";

import { useMemo } from "react";
import { User, Calendar, DollarSign, FileText, AlertCircle, ExternalLink } from "lucide-react";
import type { DriverSettlementRow } from "./SettlementsCommandCenter";
import type { SettlementPeriodOption } from "@/lib/settlement-periods";

interface SettlementDetailPanelProps {
  driverSettlement: DriverSettlementRow | null;
  period: SettlementPeriodOption;
}

export function SettlementDetailPanel({ driverSettlement, period }: SettlementDetailPanelProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const payBreakdown = useMemo(() => {
    if (!driverSettlement) return null;
    
    return {
      baseEarnings: driverSettlement.baseEarnings || 0,
      backhaulPay: driverSettlement.backhaulPay || 0,
      safetyBonus: driverSettlement.safetyBonus || 0,
      fuelReimbursement: driverSettlement.fuelReimbursement || 0,
      otherReimbursements: Math.max(0, driverSettlement.reimbursements - (driverSettlement.fuelReimbursement || 0)),
    };
  }, [driverSettlement]);

  if (!driverSettlement) {
    return (
      <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-700 p-6">
        <div className="text-center text-slate-400">
          <User className="h-12 w-12 mx-auto mb-4 text-slate-500" />
          <p className="text-lg font-medium mb-2">No Driver Selected</p>
          <p className="text-sm">Select a driver from the table to view settlement details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Settlement Details</h3>
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
            {driverSettlement.settlementId}
          </span>
        </div>
      </div>

      {/* Driver Info */}
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-teal-900/30 rounded-full p-2">
            <User className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h4 className="font-medium text-slate-100">{driverSettlement.driverName}</h4>
            <p className="text-sm text-slate-400">{driverSettlement.driverId}</p>
          </div>
        </div>
        <div className="flex items-center text-sm text-slate-400">
          <Calendar className="h-4 w-4 mr-1" />
          {period.label}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 border-b border-slate-700">
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
        </div>
      </div>

      {/* Pay Breakdown */}
      <div className="px-6 py-4 border-b border-slate-700">
        <h4 className="font-medium text-slate-100 mb-3">Pay Breakdown</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Base Earnings</span>
            <span className="font-medium text-slate-200">{formatCurrency(payBreakdown?.baseEarnings || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Backhaul Pay</span>
            <span className="font-medium text-slate-200">{formatCurrency(payBreakdown?.backhaulPay || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Safety Bonus</span>
            <span className="font-medium text-slate-200">{formatCurrency(payBreakdown?.safetyBonus || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Fuel Reimbursement</span>
            <span className="font-medium text-slate-200">{formatCurrency(payBreakdown?.fuelReimbursement || 0)}</span>
          </div>
          {payBreakdown?.otherReimbursements && payBreakdown.otherReimbursements > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Other Reimbursements</span>
              <span className="font-medium text-slate-200">{formatCurrency(payBreakdown.otherReimbursements)}</span>
            </div>
          )}
          <div className="border-t border-slate-600 pt-2 mt-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-100">Total Gross</span>
              <span className="text-emerald-400">{formatCurrency(driverSettlement.grossPay)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div className="px-6 py-4 border-b border-slate-700">
        <h4 className="font-medium text-slate-100 mb-3">Deductions</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total Deductions</span>
            <span className="font-medium text-slate-300">{formatCurrency(driverSettlement.deductions)}</span>
          </div>
          <div className="border-t border-slate-600 pt-2 mt-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-100">Net Pay</span>
              <span className="text-teal-400">{formatCurrency(driverSettlement.netPay)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status and Holds */}
      <div className="px-6 py-4 border-b border-slate-700">
        <h4 className="font-medium text-slate-100 mb-3">Status</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Settlement Status</span>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              driverSettlement.status === 'Paid' ? 'bg-teal-900/30 text-teal-300 border border-teal-700/50' :
              driverSettlement.status === 'Ready' ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50' :
              driverSettlement.status === 'Needs Review' ? 'bg-amber-900/30 text-amber-300 border border-amber-700/50' :
              driverSettlement.status === 'Hold' ? 'bg-red-900/30 text-red-300 border border-red-700/50' :
              'bg-slate-800/50 text-slate-400 border border-slate-700/50'
            }`}>
              {driverSettlement.status}
            </span>
          </div>
          
          {driverSettlement.holds.length > 0 && (
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300">Hold Issues</p>
                  <ul className="mt-1 text-xs text-amber-400 list-disc list-inside">
                    {driverSettlement.holds.map((hold, index) => (
                      <li key={index}>{hold}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Load Summary */}
      <div className="px-6 py-4 border-b border-slate-700">
        <h4 className="font-medium text-slate-100 mb-3">Load Summary</h4>
        <div className="text-sm text-slate-400">
          <p>Load-level detail available in dispatch system</p>
          <button className="mt-2 text-teal-400 hover:text-teal-300 text-sm flex items-center">
            <ExternalLink className="h-3 w-3 mr-1" />
            View dispatch proof bundle
          </button>
        </div>
      </div>

      {/* Data Provenance */}
      <div className="px-6 py-4 bg-slate-800">
        <div className="flex items-start space-x-2">
          <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-slate-300">Data Source</p>
            <p className="text-xs text-slate-500 mt-1">
              Values provided by main-source-v2_enhanced_bof_aligned.xlsx
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
