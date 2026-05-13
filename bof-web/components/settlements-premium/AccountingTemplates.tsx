"use client";

import { FileText, Calculator, Truck, FileSpreadsheet } from "lucide-react";

export function AccountingTemplates() {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Accounting Templates & Workpapers
        </h2>
        <p className="text-slate-400 mb-6">
          Standardized templates for settlement processing, fuel reconciliation, and compliance reporting.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <a
                key={template.id}
                href={template.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  block p-4 rounded-lg border transition-all duration-200
                  ${template.primary 
                    ? 'bg-slate-700 border-teal-600 hover:bg-slate-600 hover:border-teal-500' 
                    : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg
                    ${template.primary ? 'bg-teal-600/20 text-teal-400' : 'bg-slate-600/50 text-slate-400'}
                  `}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">
                      {template.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {template.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-teal-400 font-medium">
                  Open Template →
                </div>
              </a>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            Templates are provided as blank workpapers. Complete with actual settlement data as needed.
            All templates include print functionality and are optimized for accounting workflows.
          </p>
        </div>
      </div>
    </div>
  );
}
