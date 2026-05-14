"use client";

import { Truck, CheckCircle, RotateCw, Clock, DollarSign, MapPin } from "lucide-react";

interface KpiData {
  totalLoads: number;
  delivered: number;
  inTransit: number;
  pending: number;
  totalRevenue: number;
  totalMiles: number;
}

interface DispatchKpiRowProps {
  kpiData: KpiData;
}

export function DispatchKpiRow({ kpiData }: DispatchKpiRowProps) {
  const kpiCards = [
    {
      icon: Truck,
      label: "TOTAL LOADS",
      value: kpiData.totalLoads,
      color: "blue",
      borderColor: "border-blue-500",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-400"
    },
    {
      icon: CheckCircle,
      label: "DELIVERED",
      value: kpiData.delivered,
      color: "emerald",
      borderColor: "border-emerald-500",
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-400"
    },
    {
      icon: RotateCw,
      label: "IN TRANSIT",
      value: kpiData.inTransit,
      color: "sky",
      borderColor: "border-sky-500",
      bgColor: "bg-sky-500/10",
      textColor: "text-sky-400"
    },
    {
      icon: Clock,
      label: "PENDING",
      value: kpiData.pending,
      color: "amber",
      borderColor: "border-amber-500",
      bgColor: "bg-amber-500/10",
      textColor: "text-amber-400"
    },
    {
      icon: DollarSign,
      label: "TOTAL REVENUE",
      value: `$${kpiData.totalRevenue.toLocaleString()}`,
      color: "amber",
      borderColor: "border-amber-500",
      bgColor: "bg-amber-500/10",
      textColor: "text-amber-400"
    },
    {
      icon: MapPin,
      label: "TOTAL MILES",
      value: kpiData.totalMiles.toLocaleString(),
      color: "purple",
      borderColor: "border-purple-500",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-400"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-6">
      {kpiCards.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4 border-l-4 opacity-0 animate-fade-in"
            style={{
              borderLeftColor: kpi.borderColor.replace('border-', ''),
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'forwards'
            }}
          >
            <div className={`absolute inset-0 ${kpi.bgColor} rounded-xl opacity-50`} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${kpi.textColor}`} />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {kpi.label}
                </span>
              </div>
              <div className={`text-2xl font-bold ${kpi.textColor} tabular-nums`}>
                {kpi.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
