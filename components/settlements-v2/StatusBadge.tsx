"use client";

import type { SettlementStatus } from "./SettlementsV2Page";

interface StatusBadgeProps {
  status: SettlementStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: SettlementStatus) => {
    switch (status) {
      case "Paid":
        return {
          color: "text-green-400",
          bgColor: "bg-green-900/30",
          borderColor: "border-green-700/50",
        };
      case "Ready":
        return {
          color: "text-blue-400",
          bgColor: "bg-blue-900/30",
          borderColor: "border-blue-700/50",
        };
      case "Pending":
        return {
          color: "text-gray-400",
          bgColor: "bg-gray-900/30",
          borderColor: "border-gray-700/50",
        };
      case "Exception":
        return {
          color: "text-red-400",
          bgColor: "bg-red-900/30",
          borderColor: "border-red-700/50",
        };
      default:
        return {
          color: "text-slate-400",
          bgColor: "bg-slate-900/30",
          borderColor: "border-slate-700/50",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
      ${config.color} ${config.bgColor} ${config.borderColor} border
    `}>
      {status}
    </span>
  );
}
