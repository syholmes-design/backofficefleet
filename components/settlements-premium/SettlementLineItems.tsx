"use client";

import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import type { DriverSettlementRow } from "./SettlementsCommandCenter";

interface SettlementLineItemsProps {
  driverSettlement: DriverSettlementRow;
}

interface LineItem {
  description: string;
  category: string;
  amount: number;
  chargeType: "Add" | "Deduct";
}

export function SettlementLineItems({ driverSettlement }: SettlementLineItemsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const lineItems: LineItem[] = [];

  // Add earnings (Add items)
  if (driverSettlement.baseEarnings && driverSettlement.baseEarnings > 0) {
    lineItems.push({
      description: "Base Earnings",
      category: "Earnings",
      amount: driverSettlement.baseEarnings,
      chargeType: "Add"
    });
  }

  if (driverSettlement.backhaulPay && driverSettlement.backhaulPay > 0) {
    lineItems.push({
      description: "Backhaul Pay",
      category: "Earnings",
      amount: driverSettlement.backhaulPay,
      chargeType: "Add"
    });
  }

  if (driverSettlement.safetyBonus && driverSettlement.safetyBonus > 0) {
    lineItems.push({
      description: "Safety Bonus",
      category: "Bonus",
      amount: driverSettlement.safetyBonus,
      chargeType: "Add"
    });
  }

  if (driverSettlement.fuelReimbursement && driverSettlement.fuelReimbursement > 0) {
    lineItems.push({
      description: "Fuel Reimbursement",
      category: "Reimbursement",
      amount: driverSettlement.fuelReimbursement,
      chargeType: "Add"
    });
  }

  // Add reimbursements if any
  if (driverSettlement.reimbursements && driverSettlement.reimbursements > 0) {
    lineItems.push({
      description: "Reimbursements",
      category: "Reimbursement",
      amount: driverSettlement.reimbursements,
      chargeType: "Add"
    });
  }

  // Add deductions (Deduct items)
  if (driverSettlement.fica && driverSettlement.fica > 0) {
    lineItems.push({
      description: "FICA",
      category: "Tax",
      amount: driverSettlement.fica,
      chargeType: "Deduct"
    });
  }

  if (driverSettlement.oasdi && driverSettlement.oasdi > 0) {
    lineItems.push({
      description: "OASDI",
      category: "Tax",
      amount: driverSettlement.oasdi,
      chargeType: "Deduct"
    });
  }

  if (driverSettlement.federalWithholding && driverSettlement.federalWithholding > 0) {
    lineItems.push({
      description: "Federal Withholding",
      category: "Tax",
      amount: driverSettlement.federalWithholding,
      chargeType: "Deduct"
    });
  }

  if (driverSettlement.stateWithholding && driverSettlement.stateWithholding > 0) {
    lineItems.push({
      description: "State Withholding",
      category: "Tax",
      amount: driverSettlement.stateWithholding,
      chargeType: "Deduct"
    });
  }

  if (driverSettlement.sdi && driverSettlement.sdi > 0) {
    lineItems.push({
      description: "SDI",
      category: "Tax",
      amount: driverSettlement.sdi,
      chargeType: "Deduct"
    });
  }

  if (driverSettlement.fmLeave && driverSettlement.fmLeave > 0) {
    lineItems.push({
      description: "FM Leave",
      category: "Deduction",
      amount: driverSettlement.fmLeave,
      chargeType: "Deduct"
    });
  }

  if (driverSettlement.familySupport && driverSettlement.familySupport > 0) {
    lineItems.push({
      description: "Family Support / Court-Ordered Withholding",
      category: "Court-Ordered Withholding",
      amount: driverSettlement.familySupport,
      chargeType: "Deduct"
    });
  }

  if (driverSettlement.insurancePremiums && driverSettlement.insurancePremiums > 0) {
    lineItems.push({
      description: "Insurance Premiums",
      category: "Insurance",
      amount: driverSettlement.insurancePremiums,
      chargeType: "Deduct"
    });
  }

  if (driverSettlement.creditUnionSavingsClub && driverSettlement.creditUnionSavingsClub > 0) {
    lineItems.push({
      description: "Credit Union Savings Club",
      category: "Savings",
      amount: driverSettlement.creditUnionSavingsClub,
      chargeType: "Deduct"
    });
  }

  if (driverSettlement.contribution401k && driverSettlement.contribution401k > 0) {
    lineItems.push({
      description: "401(k) Contribution",
      category: "Retirement",
      amount: driverSettlement.contribution401k,
      chargeType: "Deduct"
    });
  }

  if (driverSettlement.hsaFsaHealthDeduction && driverSettlement.hsaFsaHealthDeduction > 0) {
    lineItems.push({
      description: "HSA/FSA Health Deduction",
      category: "Health",
      amount: driverSettlement.hsaFsaHealthDeduction,
      chargeType: "Deduct"
    });
  }

  if (driverSettlement.healthInsurancePremiums && driverSettlement.healthInsurancePremiums > 0) {
    lineItems.push({
      description: "Health Insurance Premiums",
      category: "Insurance",
      amount: driverSettlement.healthInsurancePremiums,
      chargeType: "Deduct"
    });
  }

  if (driverSettlement.lifeInsuranceAbove50k && driverSettlement.lifeInsuranceAbove50k > 0) {
    lineItems.push({
      description: "Life Insurance Above 50k",
      category: "Insurance",
      amount: driverSettlement.lifeInsuranceAbove50k,
      chargeType: "Deduct"
    });
  }

  // Calculate other deductions that aren't broken down into individual fields
  const calculatedDeductions = 
    (driverSettlement.fica || 0) +
    (driverSettlement.oasdi || 0) +
    (driverSettlement.federalWithholding || 0) +
    (driverSettlement.stateWithholding || 0) +
    (driverSettlement.sdi || 0) +
    (driverSettlement.fmLeave || 0) +
    (driverSettlement.familySupport || 0) +
    (driverSettlement.insurancePremiums || 0) +
    (driverSettlement.creditUnionSavingsClub || 0) +
    (driverSettlement.contribution401k || 0) +
    (driverSettlement.hsaFsaHealthDeduction || 0) +
    (driverSettlement.healthInsurancePremiums || 0) +
    (driverSettlement.lifeInsuranceAbove50k || 0);

  const otherDeductions = driverSettlement.deductions - calculatedDeductions;
  if (otherDeductions > 0.01) { // Only show if there's a meaningful difference
    lineItems.push({
      description: "Other Deductions",
      category: "Deduction",
      amount: otherDeductions,
      chargeType: "Deduct"
    });
  }

  // Add net pay summary
  lineItems.push({
    description: "Net Pay",
    category: "Summary",
    amount: driverSettlement.netPay,
    chargeType: "Add"
  });

  const getChargeTypeIcon = (chargeType: "Add" | "Deduct") => {
    return chargeType === "Add" ? (
      <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
    ) : (
      <ArrowDownCircle className="h-4 w-4 text-amber-400" />
    );
  };

  const getChargeTypeColor = (chargeType: "Add" | "Deduct") => {
    return chargeType === "Add" ? "text-emerald-400" : "text-amber-400";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Earnings":
        return "bg-emerald-900/30 text-emerald-300";
      case "Bonus":
        return "bg-teal-900/30 text-teal-300";
      case "Reimbursement":
        return "bg-purple-900/30 text-purple-300";
      case "Tax":
        return "bg-red-900/30 text-red-300";
      case "Withholding":
        return "bg-orange-900/30 text-orange-300";
      case "Court-Ordered Withholding":
        return "bg-orange-900/30 text-orange-300";
      case "Insurance":
        return "bg-blue-900/30 text-blue-300";
      case "Health":
        return "bg-cyan-900/30 text-cyan-300";
      case "Retirement":
        return "bg-indigo-900/30 text-indigo-300";
      case "Savings":
        return "bg-violet-900/30 text-violet-300";
      case "Summary":
        return "bg-slate-900/30 text-slate-300";
      default:
        return "bg-slate-800/50 text-slate-400";
    }
  };

  return (
    <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-700">
      <div className="px-6 py-4 border-b border-slate-700">
        <h4 className="font-medium text-slate-100">Line Item Breakdown</h4>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <div className="px-6 py-4 space-y-3">
          {lineItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1">
                    {getChargeTypeIcon(item.chargeType)}
                    <span className={`text-sm font-medium ${getChargeTypeColor(item.chargeType)}`}>
                      {item.description}
                    </span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className={`text-sm font-bold ${getChargeTypeColor(item.chargeType)}`}>
                  {formatCurrency(item.amount)}
                </span>
                <span className="text-xs text-slate-400">
                  {item.chargeType}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
