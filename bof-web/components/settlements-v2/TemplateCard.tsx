"use client";

import { useState } from "react";
import { FileText, Truck, FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

import { DriverSettlementRow } from "./SettlementsV2Page";

interface TemplateCardProps {
  template: {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    primary: boolean;
  };
  selectedDriver?: DriverSettlementRow | null;
  onPreview?: (templateId: string) => void;
}

export function TemplateCard({ template, selectedDriver, onPreview }: TemplateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = template.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (onPreview && !isExpanded) {
      onPreview(template.id);
    }
  };

  return (
    <div className={`
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
          <button
            onClick={toggleExpanded}
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
        </div>
      </div>
      
      {/* Preview Section */}
      {isExpanded && (
        <div className="border-t border-slate-600 p-4 bg-slate-800/50">
          {template.id === "driver-settlement-statement" && (
            <DriverSettlementPreview selectedDriver={selectedDriver || null} formatCurrency={formatCurrency} />
          )}
          
          {template.id === "fuel-card-reconciliation-worksheet" && (
            <FuelCardReconciliationPreview />
          )}
          
          {template.id === "ifta-quarterly-mileage-fuel-log" && (
            <IFTAPreview />
          )}
          
          {template.id === "fleet-asset-register" && (
            <FleetAssetRegisterPreview />
          )}
        </div>
      )}
    </div>
  );
}

function DriverSettlementPreview({ selectedDriver, formatCurrency }: { selectedDriver: DriverSettlementRow | null; formatCurrency: (amount: number) => string }) {
  if (!selectedDriver) {
    return (
      <div className="text-center py-4">
        <p className="text-slate-400 text-sm">Select a driver to preview settlement data</p>
      </div>
    );
  }

  return (
    <>
      <h4 className="text-sm font-medium text-white mb-3">Driver Settlement Statement Preview</h4>
      <div className="space-y-3">
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
            <StatusBadge status={selectedDriver.status} />
          </div>
          <div>
            <p className="text-slate-400">Settlement ID</p>
            <p className="text-white font-medium">{selectedDriver.settlementId}</p>
          </div>
        </div>
        
        {/* Exception Logic */}
        <div className="mt-3 space-y-2">
          {selectedDriver.netPay < 0 && (
            <div className="bg-red-900/30 border border-red-700/50 rounded p-2 text-xs">
              <p className="text-red-300 font-medium">⚠️ Negative Net Pay Detected</p>
              <p className="text-red-400">Review deductions and reimbursements</p>
            </div>
          )}
          {selectedDriver.netPay < 500 && selectedDriver.netPay > 0 && (
            <div className="bg-amber-900/30 border border-amber-700/50 rounded p-2 text-xs">
              <p className="text-amber-300 font-medium">⚠️ Low Net Pay</p>
              <p className="text-amber-400">Under $500 - verify calculations</p>
            </div>
          )}
          {selectedDriver.familySupport && selectedDriver.familySupport > 0 && (
            <div className="bg-orange-900/30 border border-orange-700/50 rounded p-2 text-xs">
              <p className="text-orange-300 font-medium">📋 Family Support Active</p>
              <p className="text-orange-400">{formatCurrency(selectedDriver.familySupport)} withheld</p>
            </div>
          )}
          {selectedDriver.deductions > selectedDriver.grossPay * 0.3 && (
            <div className="bg-amber-900/30 border border-amber-700/50 rounded p-2 text-xs">
              <p className="text-amber-300 font-medium">⚠️ Large Deductions</p>
              <p className="text-amber-400">Over 30% of gross pay</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-3">
          <button className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded transition-colors">
            Preview Selected Driver →
          </button>
          <span className="text-xs text-slate-400 flex items-center px-3 py-1">
            PDF export — planned
          </span>
        </div>
      </div>
    </>
  );
}

function FuelCardReconciliationPreview() {
  return (
    <>
      <h4 className="text-sm font-medium text-white mb-3">Fuel Card Reconciliation Preview</h4>
      <div className="text-center py-4">
        <div className="bg-slate-700/50 rounded p-4 mb-3">
          <Truck className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-300 text-sm mb-1">Fuel Transaction Reconciliation</p>
          <p className="text-slate-400 text-xs">Weekly reconciliation with 14-column table</p>
        </div>
        <p className="text-slate-400 text-sm mb-3">Template ready / not generated yet</p>
        <div className="flex gap-2 justify-center">
          <span className="text-xs text-slate-400 flex items-center px-3 py-1">
            Needs data mapping →
          </span>
        </div>
      </div>
    </>
  );
}

function IFTAPreview() {
  return (
    <>
      <h4 className="text-sm font-medium text-white mb-3">IFTA Quarterly Mileage & Fuel Log Preview</h4>
      <div className="text-center py-4">
        <div className="bg-slate-700/50 rounded p-4 mb-3">
          <FileSpreadsheet className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-300 text-sm mb-1">Quarterly IFTA Reporting</p>
          <p className="text-slate-400 text-xs">All 58 jurisdictions with deadline reminders</p>
        </div>
        <p className="text-slate-400 text-sm mb-3">Template ready / not generated yet</p>
        <div className="flex gap-2 justify-center">
          <span className="text-xs text-slate-400 flex items-center px-3 py-1">
            Coming later →
          </span>
        </div>
      </div>
    </>
  );
}

function FleetAssetRegisterPreview() {
  return (
    <>
      <h4 className="text-sm font-medium text-white mb-3">Fleet Asset Register Preview</h4>
      <div className="text-center py-4">
        <div className="bg-slate-700/50 rounded p-4 mb-3">
          <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-300 text-sm mb-1">Asset Register Workpaper</p>
          <p className="text-slate-400 text-xs">23-column register with fleet summary</p>
        </div>
        <p className="text-slate-400 text-sm mb-3">Template ready / not generated yet</p>
        <div className="flex gap-2 justify-center">
          <span className="text-xs text-slate-400 flex items-center px-3 py-1">
            Coming later →
          </span>
        </div>
      </div>
    </>
  );
}
