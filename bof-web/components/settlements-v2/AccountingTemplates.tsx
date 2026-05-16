"use client";

import { Calculator, Truck, FileSpreadsheet, FileText } from "lucide-react";
import { TemplateCard } from "./TemplateCard";
import { DriverSettlementRow } from "./SettlementsV2Page";

interface AccountingTemplatesProps {
  selectedDriver?: DriverSettlementRow | null;
}

export function AccountingTemplates({ selectedDriver }: AccountingTemplatesProps) {
  const templates = [
    {
      id: "driver-settlement-statement",
      title: "Driver Settlement Statement",
      description: "Multi-section settlement statement with earnings, deductions, and YTD totals",
      icon: Calculator,
      href: "/documents/accounting-templates/driver-settlement-statement.html",
      primary: true
    },
    {
      id: "fuel-card-reconciliation-worksheet",
      title: "Fuel Card Reconciliation Worksheet",
      description: "Weekly fuel reconciliation with 14-column table and exception escalation matrix",
      icon: Truck,
      href: "/documents/accounting-templates/fuel-card-reconciliation-worksheet.html",
      primary: true
    },
    {
      id: "ifta-quarterly-mileage-fuel-log",
      title: "IFTA Quarterly Mileage & Fuel Log",
      description: "Quarterly IFTA reporting with all 58 jurisdictions and filing deadline reminders",
      icon: FileSpreadsheet,
      href: "/documents/accounting-templates/ifta-quarterly-mileage-fuel-log.html",
      primary: false
    },
    {
      id: "fleet-asset-register",
      title: "Fleet Asset Register",
      description: "23-column scrollable asset register with fleet summary and capitalization policy",
      icon: FileText,
      href: "/documents/accounting-templates/fleet-asset-register.html",
      primary: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-3">
          Accounting Templates & Workpapers
        </h2>
        <p className="text-slate-300 text-lg">
          Standardized templates for settlement processing, fuel reconciliation, and compliance reporting.
        </p>
      </div>
      
      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selectedDriver={selectedDriver}
          />
        ))}
      </div>
      
      {/* Footer Note */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
        <p className="text-sm text-slate-400">
          Templates are provided as blank workpapers. Complete with actual settlement data as needed.
          All templates include print functionality and are optimized for accounting workflows.
        </p>
      </div>
    </div>
  );
}
