"use client";

import { useState } from "react";
import { FileText, Calculator, Truck, FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react";
import { SettlementSignaturePanel } from "./SettlementSignaturePanel";
import type { DriverSettlementRow } from "./SettlementsCommandCenter";

interface AccountingTemplatesProps {
  selectedDriver?: DriverSettlementRow | null;
  settlementDate?: string;
}

export function AccountingTemplates({ selectedDriver, settlementDate }: AccountingTemplatesProps) {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  
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

  const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const toggleTemplate = (templateId: string) => {
  setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
};

return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Accounting Templates & Workpapers
        </h2>
        <p className="text-slate-400 mb-6">
          Standardized templates for settlement processing, fuel reconciliation, and compliance reporting.
        </p>
        
        {/* Template Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {templates.map((template) => {
            const Icon = template.icon;
            const isExpanded = expandedTemplate === template.id;
            const isDriverSettlement = template.id === "driver-settlement-statement";
            
            return (
              <div key={template.id} className={`
                rounded-lg border transition-all duration-200
                ${template.primary 
                  ? 'bg-slate-700 border-teal-600 hover:bg-slate-600 hover:border-teal-500' 
                  : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                }
              `}>
                <div className="p-4">
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
                  
                  <div className="mt-3 flex items-center justify-between">
                    <a
                      href={template.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-400 font-medium hover:text-teal-300"
                    >
                      Open Template →
                    </a>
                    {isDriverSettlement && (
                      <button
                        onClick={() => toggleTemplate(template.id)}
                        className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Hide Preview
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            Show Preview
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Dynamic Preview for Driver Settlement Statement */}
                {isDriverSettlement && isExpanded && selectedDriver && (
                  <div className="border-t border-slate-600 p-4 bg-slate-800/50">
                    <h4 className="text-sm font-medium text-white mb-3">Current Settlement Preview</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-slate-400">Driver</p>
                        <p className="text-white font-medium">{selectedDriver.driverName}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Driver ID</p>
                        <p className="text-white font-medium">{selectedDriver.driverId}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Gross Pay</p>
                        <p className="text-green-400 font-medium">{formatCurrency(selectedDriver.grossPay)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Net Pay</p>
                        <p className="text-blue-400 font-medium">{formatCurrency(selectedDriver.netPay)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Reimbursements</p>
                        <p className="text-purple-400 font-medium">{formatCurrency(selectedDriver.fuelReimbursement || 0)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Deductions</p>
                        <p className="text-red-400 font-medium">{formatCurrency(selectedDriver.deductions)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Status</p>
                        <p className={`font-medium ${
                          selectedDriver.status === 'Ready' ? 'text-green-400' :
                          selectedDriver.status === 'Needs Review' ? 'text-amber-400' :
                          selectedDriver.status === 'Hold' ? 'text-red-400' :
                          'text-slate-400'
                        }`}>
                          {selectedDriver.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Settlement ID</p>
                        <p className="text-white font-medium">{selectedDriver.settlementId}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Signature Panel for Driver Settlement Statement */}
        {selectedDriver && expandedTemplate === "driver-settlement-statement" && (
          <SettlementSignaturePanel 
            selectedDriver={selectedDriver} 
            settlementDate={settlementDate}
          />
        )}
        
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
