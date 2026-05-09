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
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">No Driver Selected</p>
          <p className="text-sm">Select a driver from the table to view settlement details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Settlement Details</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {driverSettlement.settlementId}
          </span>
        </div>
      </div>

      {/* Driver Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-blue-100 rounded-full p-2">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{driverSettlement.driverName}</h4>
            <p className="text-sm text-gray-500">{driverSettlement.driverId}</p>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          {period.label}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Gross Pay</span>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-lg font-bold text-green-900 mt-1">
              {formatCurrency(driverSettlement.grossPay)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Net Pay</span>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-blue-900 mt-1">
              {formatCurrency(driverSettlement.netPay)}
            </p>
          </div>
        </div>
      </div>

      {/* Pay Breakdown */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Pay Breakdown</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Earnings</span>
            <span className="font-medium">{formatCurrency(payBreakdown?.baseEarnings || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Backhaul Pay</span>
            <span className="font-medium">{formatCurrency(payBreakdown?.backhaulPay || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Safety Bonus</span>
            <span className="font-medium">{formatCurrency(payBreakdown?.safetyBonus || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Fuel Reimbursement</span>
            <span className="font-medium">{formatCurrency(payBreakdown?.fuelReimbursement || 0)}</span>
          </div>
          {payBreakdown?.otherReimbursements && payBreakdown.otherReimbursements > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Other Reimbursements</span>
              <span className="font-medium">{formatCurrency(payBreakdown.otherReimbursements)}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-900">Total Gross</span>
              <span className="text-green-600">{formatCurrency(driverSettlement.grossPay)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Deductions</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Deductions</span>
            <span className="font-medium text-red-600">{formatCurrency(driverSettlement.deductions)}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-900">Net Pay</span>
              <span className="text-green-600">{formatCurrency(driverSettlement.netPay)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status and Holds */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Status</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Settlement Status</span>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              driverSettlement.status === 'Paid' ? 'bg-blue-100 text-blue-800' :
              driverSettlement.status === 'Ready' ? 'bg-green-100 text-green-800' :
              driverSettlement.status === 'Needs Review' ? 'bg-yellow-100 text-yellow-800' :
              driverSettlement.status === 'Hold' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {driverSettlement.status}
            </span>
          </div>
          
          {driverSettlement.holds.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Hold Issues</p>
                  <ul className="mt-1 text-xs text-amber-700 list-disc list-inside">
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
      <div className="px-6 py-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Load Summary</h4>
        <div className="text-sm text-gray-600">
          <p>Load-level detail available in dispatch system</p>
          <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center">
            <ExternalLink className="h-3 w-3 mr-1" />
            View dispatch proof bundle
          </button>
        </div>
      </div>

      {/* Data Provenance */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-start space-x-2">
          <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-700">Data Source</p>
            <p className="text-xs text-gray-500 mt-1">
              Values provided by consolidated BOF main-source Excel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
