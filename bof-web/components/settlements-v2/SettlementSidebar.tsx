"use client";

import { useState } from "react";
import { User, ChevronDown, ChevronUp } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { DriverSettlementRow } from "./SettlementsV2Page";
import type { SettlementPeriodOption } from "@/lib/settlement-periods";

interface SettlementSidebarProps {
  driverSettlement: DriverSettlementRow | null;
  period: SettlementPeriodOption;
}

export function SettlementSidebar({ driverSettlement, period }: SettlementSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['gross', 'deductions']));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const hasExceptions = driverSettlement && (
    driverSettlement.netPay < 0 ||
    driverSettlement.netPay < 500 ||
    (driverSettlement.familySupport && driverSettlement.familySupport > 0) ||
    driverSettlement.deductions > driverSettlement.grossPay * 0.3
  );

  const getFirstException = () => {
    if (!driverSettlement) return null;
    
    if (driverSettlement.netPay < 0) return "Negative Net Pay Detected";
    if (driverSettlement.netPay < 500 && driverSettlement.netPay > 0) return "Low Net Pay Warning";
    if (driverSettlement.familySupport && driverSettlement.familySupport > 0) return "Family Support Active";
    if (driverSettlement.deductions > driverSettlement.grossPay * 0.3) return "Large Deductions Warning";
    return null;
  };

  if (!driverSettlement) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl p-6">
        <div className="text-center">
          <div className="bg-slate-700/50 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <User className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Select a Driver</h3>
          <p className="text-slate-300 mb-8">
            Choose a driver from the table to view detailed settlement information.
          </p>
          
          <div className="space-y-3">
            <button 
              disabled
              className="w-full bg-slate-700/50 text-slate-500 px-4 py-3 rounded-lg text-sm font-medium cursor-not-allowed border border-slate-600/50"
            >
              Review First Exception
            </button>
            <button className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors border border-slate-600/50">
              View Settlement Guidelines
            </button>
          </div>
        </div>
      </div>
    );
  }

  const firstException = getFirstException();

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Settlement Preview</h3>
          <StatusBadge status={driverSettlement.status} />
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Driver:</span>
            <span className="text-white font-medium">{driverSettlement.driverName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Driver ID:</span>
            <span className="text-white font-medium">{driverSettlement.driverId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Period:</span>
            <span className="text-white font-medium">{period.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Settlement ID:</span>
            <span className="text-white font-medium">{driverSettlement.settlementId}</span>
          </div>
        </div>
      </div>

      {/* Gross Pay Breakdown */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('gross')}
          className="w-full flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
        >
          <span className="text-sm font-medium text-white">Gross Pay Breakdown</span>
          {expandedSections.has('gross') ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>
        
        {expandedSections.has('gross') && (
          <div className="mt-2 p-3 bg-slate-900 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Base Earnings:</span>
              <span className="text-green-400">{formatCurrency(driverSettlement.baseEarnings || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Backhaul Pay:</span>
              <span className="text-green-400">{formatCurrency(driverSettlement.backhaulPay || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Safety Bonus:</span>
              <span className="text-green-400">{formatCurrency(driverSettlement.safetyBonus || 0)}</span>
            </div>
            <div className="pt-2 border-t border-slate-700">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-white">Total Gross:</span>
                <span className="text-green-400">{formatCurrency(driverSettlement.grossPay)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deductions Breakdown */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('deductions')}
          className="w-full flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
        >
          <span className="text-sm font-medium text-white">Deductions Breakdown</span>
          {expandedSections.has('deductions') ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>
        
        {expandedSections.has('deductions') && (
          <div className="mt-2 p-3 bg-slate-900 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">FICA:</span>
              <span className="text-red-400">{formatCurrency(driverSettlement.fica || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Federal Withholding:</span>
              <span className="text-red-400">{formatCurrency(driverSettlement.federalWithholding || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">State Withholding:</span>
              <span className="text-red-400">{formatCurrency(driverSettlement.stateWithholding || 0)}</span>
            </div>
            {(driverSettlement.familySupport && driverSettlement.familySupport > 0) && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Family Support:</span>
                <span className="text-orange-400">{formatCurrency(driverSettlement.familySupport)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Insurance Premiums:</span>
              <span className="text-red-400">{formatCurrency(driverSettlement.insurancePremiums || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">401k Contribution:</span>
              <span className="text-red-400">{formatCurrency(driverSettlement.contribution401k || 0)}</span>
            </div>
            <div className="pt-2 border-t border-slate-700">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-white">Total Deductions:</span>
                <span className="text-red-400">{formatCurrency(driverSettlement.deductions)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reimbursements */}
      <div className="mb-4">
        <div className="p-3 bg-slate-700 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Fuel Reimbursement:</span>
            <span className="text-purple-400">{formatCurrency(driverSettlement.fuelReimbursement || 0)}</span>
          </div>
        </div>
      </div>

      {/* Net Pay */}
      <div className="mb-6">
        <div className="p-3 bg-slate-700 rounded-lg">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-white">Net Pay:</span>
            <span className="text-blue-400">{formatCurrency(driverSettlement.netPay)}</span>
          </div>
        </div>
      </div>

      {/* Exception Flags */}
      {hasExceptions && (
        <div className="mb-6">
          <div className="space-y-2">
            {driverSettlement.netPay < 0 && (
              <div className="bg-red-900/30 border border-red-700/50 rounded p-2 text-xs">
                <p className="text-red-300 font-medium">⚠️ Negative Net Pay Detected</p>
              </div>
            )}
            {driverSettlement.netPay < 500 && driverSettlement.netPay > 0 && (
              <div className="bg-amber-900/30 border border-amber-700/50 rounded p-2 text-xs">
                <p className="text-amber-300 font-medium">⚠️ Low Net Pay Warning</p>
              </div>
            )}
            {driverSettlement.familySupport && driverSettlement.familySupport > 0 && (
              <div className="bg-orange-900/30 border border-orange-700/50 rounded p-2 text-xs">
                <p className="text-orange-300 font-medium">📋 Family Support Active</p>
              </div>
            )}
            {driverSettlement.deductions > driverSettlement.grossPay * 0.3 && (
              <div className="bg-amber-900/30 border border-amber-700/50 rounded p-2 text-xs">
                <p className="text-amber-300 font-medium">⚠️ Large Deductions Warning</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button 
          className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
            firstException 
              ? 'bg-amber-600 hover:bg-amber-700 text-white' 
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
          disabled={!firstException}
        >
          {firstException ? `Review: ${firstException}` : 'No Exceptions to Review'}
        </button>
        <button className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded text-sm font-medium transition-colors">
          View Settlement Guidelines
        </button>
      </div>
    </div>
  );
}
