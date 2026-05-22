"use client";

import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface SettlementKPICardsProps {
  kpis: {
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    holdsCount: number;
    driverCount: number;
  };
}

export function SettlementsKPICards({ kpis }: SettlementKPICardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const cards = [
    {
      title: "Gross Settlements",
      value: formatCurrency(kpis.totalGross),
      icon: TrendingUp,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      description: `${kpis.driverCount} drivers`,
    },
    {
      title: "Total Deductions",
      value: formatCurrency(kpis.totalDeductions),
      icon: TrendingDown,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      description: "All deductions combined",
    },
    {
      title: "Net Payout",
      value: formatCurrency(kpis.totalNet),
      icon: DollarSign,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      description: kpis.totalNet > 0 ? "Ready for payout" : "No payout",
    },
    {
      title: "Holds / Needs Review",
      value: kpis.holdsCount.toString(),
      icon: AlertCircle,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      description: kpis.holdsCount > 0 ? "Requires attention" : "All clear",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${card.textColor} mb-1`}>
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {card.description}
                </p>
              </div>
              <div className={`${card.color} rounded-full p-3`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
