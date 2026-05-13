"use client";

import { useMemo } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  CheckCircle,
  Clock,
  FileText
} from "lucide-react";
import type { DriverSettlementRow } from "./SettlementsCommandCenter";

interface EnhancedSettlementKPICardsProps {
  settlementRows: DriverSettlementRow[];
}

export function EnhancedSettlementKPICards({ settlementRows }: EnhancedSettlementKPICardsProps) {
  const kpis = useMemo(() => {
    const totalGross = settlementRows.reduce((sum, row) => sum + row.grossPay, 0);
    const totalDeductions = settlementRows.reduce((sum, row) => sum + row.deductions, 0);
    const totalNet = settlementRows.reduce((sum, row) => sum + row.netPay, 0);
    const totalReimbursements = settlementRows.reduce((sum, row) => sum + (row.fuelReimbursement || 0), 0);
    
    // Exception counts
    const needsReviewCount = settlementRows.filter(row => row.status === "Needs Review" || row.status === "Hold").length;
    const familySupportCount = settlementRows.filter(row => row.familySupport && row.familySupport > 0).length;
    const largeDeductionCount = settlementRows.filter(row => 
      row.grossPay > 0 && (row.deductions / row.grossPay) > 0.3
    ).length;
    const readyCount = settlementRows.filter(row => row.status === "Ready").length;
    
    // Family support total
    const totalFamilySupport = settlementRows.reduce((sum, row) => sum + (row.familySupport || 0), 0);

    return {
      totalGross,
      totalDeductions,
      totalNet,
      totalReimbursements,
      driverCount: settlementRows.length,
      needsReviewCount,
      familySupportCount,
      largeDeductionCount,
      readyCount,
      totalFamilySupport,
    };
  }, [settlementRows]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const cards = [
    {
      title: "Total Gross Pay",
      value: formatCurrency(kpis.totalGross),
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-900/20",
      borderColor: "border-green-700/50",
      description: `${kpis.driverCount} drivers`,
      trend: kpis.totalGross > 0 ? "positive" : "neutral"
    },
    {
      title: "Total Deductions",
      value: formatCurrency(kpis.totalDeductions),
      icon: TrendingDown,
      color: "text-red-400",
      bgColor: "bg-red-900/20",
      borderColor: "border-red-700/50",
      description: "All deductions combined",
      trend: "neutral"
    },
    {
      title: "Net Pay Ready",
      value: formatCurrency(kpis.totalNet),
      icon: DollarSign,
      color: "text-blue-400",
      bgColor: "bg-blue-900/20",
      borderColor: "border-blue-700/50",
      description: kpis.totalNet > 0 ? "Available for payout" : "No payout ready",
      trend: kpis.totalNet > 0 ? "positive" : "neutral"
    },
    {
      title: "Total Reimbursements",
      value: formatCurrency(kpis.totalReimbursements),
      icon: FileText,
      color: "text-purple-400",
      bgColor: "bg-purple-900/20",
      borderColor: "border-purple-700/50",
      description: "Fuel and expense reimbursements",
      trend: kpis.totalReimbursements > 0 ? "positive" : "neutral"
    },
    {
      title: "Drivers With Exceptions",
      value: kpis.needsReviewCount.toString(),
      icon: AlertTriangle,
      color: "text-amber-400",
      bgColor: "bg-amber-900/20",
      borderColor: "border-amber-700/50",
      description: "Require review before payment",
      trend: kpis.needsReviewCount > 0 ? "negative" : "positive"
    },
    {
      title: "Family Support Active",
      value: kpis.familySupportCount.toString(),
      icon: Users,
      color: "text-orange-400",
      bgColor: "bg-orange-900/20",
      borderColor: "border-orange-700/50",
      description: kpis.totalFamilySupport > 0 ? `${formatCurrency(kpis.totalFamilySupport)} total` : "No withholding",
      trend: "neutral"
    },
    {
      title: "Ready to Pay",
      value: kpis.readyCount.toString(),
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-900/20",
      borderColor: "border-emerald-700/50",
      description: "Cleared for payment processing",
      trend: kpis.readyCount > 0 ? "positive" : "neutral"
    },
    {
      title: "Large Deductions",
      value: kpis.largeDeductionCount.toString(),
      icon: Clock,
      color: "text-indigo-400",
      bgColor: "bg-indigo-900/20",
      borderColor: "border-indigo-700/50",
      description: "Deductions > 30% of gross pay",
      trend: kpis.largeDeductionCount > 0 ? "negative" : "positive"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`
            ${card.bgColor} ${card.borderColor} 
            rounded-lg border p-4 hover:shadow-lg transition-all duration-200
            hover:scale-[1.02] cursor-pointer
          `}
        >
          <div className="flex items-center justify-between mb-3">
            <card.icon className={`h-5 w-5 ${card.color}`} />
            <div className={`h-2 w-2 rounded-full ${
              card.trend === 'positive' ? 'bg-green-400' : 
              card.trend === 'negative' ? 'bg-red-400' : 'bg-gray-400'
            }`} />
          </div>
          
          <div className="mb-2">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
              {card.title}
            </p>
            <p className="text-slate-100 text-2xl font-bold">
              {card.value}
            </p>
          </div>
          
          <p className="text-slate-400 text-xs">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
}
