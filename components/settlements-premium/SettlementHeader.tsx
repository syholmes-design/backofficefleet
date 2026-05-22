"use client";

import { User, Calendar, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import type { DriverSettlementRow } from "./SettlementsCommandCenter";
import type { SettlementPeriodOption } from "@/lib/settlement-periods";

interface SettlementHeaderProps {
  driverSettlement: DriverSettlementRow;
  period: SettlementPeriodOption;
}

export function SettlementHeader({ driverSettlement, period }: SettlementHeaderProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="h-4 w-4" />;
      case "Ready":
        return <Clock className="h-4 w-4" />;
      case "Needs Review":
        return <AlertCircle className="h-4 w-4" />;
      case "Hold":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-teal-900/30 text-teal-300 border border-teal-700/50";
      case "Ready":
        return "bg-emerald-900/30 text-emerald-300 border border-emerald-700/50";
      case "Needs Review":
        return "bg-amber-900/30 text-amber-300 border border-amber-700/50";
      case "Hold":
        return "bg-red-900/30 text-red-300 border border-red-700/50";
      default:
        return "bg-slate-800/50 text-slate-400 border border-slate-700/50";
    }
  };

  return (
    <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Settlement Details</h3>
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
            {driverSettlement.settlementId || "[Settlement ID]"}
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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-slate-400">
            <Calendar className="h-4 w-4 mr-1" />
            {period.label || "[Settlement Date]"}
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(driverSettlement.status)}`}>
              {getStatusIcon(driverSettlement.status)}
              {driverSettlement.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
