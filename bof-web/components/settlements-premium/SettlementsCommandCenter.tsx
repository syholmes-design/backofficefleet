"use client";

import { useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { Users, Calendar, Filter, ExternalLink } from "lucide-react";
import { SettlementsDataTable } from "./SettlementsDataTable";
import { SettlementDetailPanel } from "./SettlementDetailPanel";
import { EnhancedSettlementKPICards } from "./EnhancedSettlementKPICards";
import { SettlementExceptionReview } from "./SettlementExceptionReview";
import { AccountingTemplates } from "./AccountingTemplates";
import { PolicyQuickLinks } from "./PolicyQuickLinks";
import { getSettlementPeriods, type SettlementPeriodOption } from "@/lib/settlement-periods";

export type SettlementStatus = "Ready" | "Needs Review" | "Hold" | "Paid" | "Missing Source Data";

interface DemoSettlement {
  driverId: string;
  driverName?: string;
  grossPay?: number;
  fuelReimbursement?: number;
  totalDeductions?: number;
  deductions?: number;
  netPay?: number;
  status?: string;
  pendingReason?: string;
  settlementId?: string;
  baseEarnings?: number;
  backhaulPay?: number;
  safetyBonus?: number;
  // Deduction components from v2 Excel Payroll
  fica?: number;
  oasdi?: number;
  federalWithholding?: number;
  stateWithholding?: number;
  sdi?: number;
  fmLeave?: number;
  familySupport?: number;
  insurancePremiums?: number;
  creditUnionSavingsClub?: number;
  contribution401k?: number;
  hsaFsaHealthDeduction?: number;
  healthInsurancePremiums?: number;
  lifeInsuranceAbove50k?: number;
}

export type DriverSettlementRow = {
  driverId: string;
  driverName: string;
  grossPay: number;
  reimbursements: number;
  deductions: number;
  netPay: number;
  status: SettlementStatus;
  holds: string[];
  settlementId: string;
  baseEarnings?: number;
  backhaulPay?: number;
  safetyBonus?: number;
  fuelReimbursement?: number;
  // Deduction components from v2 Excel Payroll
  fica?: number;
  oasdi?: number;
  federalWithholding?: number;
  stateWithholding?: number;
  sdi?: number;
  fmLeave?: number;
  familySupport?: number;
  insurancePremiums?: number;
  creditUnionSavingsClub?: number;
  contribution401k?: number;
  hsaFsaHealthDeduction?: number;
  healthInsurancePremiums?: number;
  lifeInsuranceAbove50k?: number;
};


function normalizeSettlementStatus(status: string, pendingReason?: string): SettlementStatus {
  const normalized = status.toLowerCase().trim();
  if (normalized === "paid") return "Paid";
  if (normalized === "pending") {
    // Only mark as Needs Review for actual blocking issues
    // Normal operational statuses should be Ready
    if (pendingReason) {
      const reason = pendingReason.toLowerCase();
      // These are normal operational statuses, not holds/review issues
      const normalStatuses = [
        "awaiting receipts", "load verification", "awaiting load", 
        "in progress", "processing", "scheduled", "n/a", "none", ""
      ];
      
      // These are actual blocking issues that need review
      const blockingIssues = [
        "hold", "review", "block", "dispute", "error", "missing", 
        "rejected", "failed", "overdue", "exception", "investigation"
      ];
      
      if (blockingIssues.some(issue => reason.includes(issue))) {
        return "Needs Review";
      }
      
      if (normalStatuses.some(status => reason.includes(status) || reason === status)) {
        return "Ready";
      }
    }
    return "Ready"; // Default to Ready for pending without specific blocking issues
  }
  if (normalized === "on hold") return "Needs Review";
  if (normalized === "draft") return "Ready";
  return "Missing Source Data";
}

function mapDemoSettlementsToDriverRows(settlements: DemoSettlement[]): DriverSettlementRow[] {
  return settlements.map(settlement => {
    // Use totalDeductions from the v2 Excel Payroll data
    const prioritizedDeductions = settlement.totalDeductions || settlement.deductions || 0;
    
    return {
      driverId: settlement.driverId || "",
      driverName: settlement.driverId, // Will be resolved from drivers data
      grossPay: settlement.grossPay || 0,
      reimbursements: settlement.fuelReimbursement || 0,
      deductions: prioritizedDeductions,
      netPay: settlement.netPay || 0,
      status: normalizeSettlementStatus(settlement.status || "", settlement.pendingReason),
      holds: settlement.pendingReason ? [settlement.pendingReason] : [],
      settlementId: settlement.settlementId || "",
      baseEarnings: settlement.baseEarnings,
      backhaulPay: settlement.backhaulPay,
      safetyBonus: settlement.safetyBonus,
      fuelReimbursement: settlement.fuelReimbursement,
      // Pass through deduction components for detail panel
      fica: settlement.fica,
      oasdi: settlement.oasdi,
      federalWithholding: settlement.federalWithholding,
      stateWithholding: settlement.stateWithholding,
      sdi: settlement.sdi,
      fmLeave: settlement.fmLeave,
      familySupport: settlement.familySupport,
      insurancePremiums: settlement.insurancePremiums,
      creditUnionSavingsClub: settlement.creditUnionSavingsClub,
      contribution401k: settlement.contribution401k,
      hsaFsaHealthDeduction: settlement.hsaFsaHealthDeduction,
      healthInsurancePremiums: settlement.healthInsurancePremiums,
      lifeInsuranceAbove50k: settlement.lifeInsuranceAbove50k,
    };
  });
}

export function SettlementsCommandCenter() {
  const { data } = useBofDemoData();
  const canonicalPeriods = getSettlementPeriods();
  const [selectedPeriod, setSelectedPeriod] = useState<SettlementPeriodOption>(canonicalPeriods[0]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<SettlementStatus | "">("");

  // Map driver IDs to names
  const driverMap = useMemo(() => {
    const map = new Map<string, string>();
    data.drivers.forEach(driver => {
      map.set(driver.id, driver.name);
    });
    return map;
  }, [data.drivers]);

  // Process settlement data
  const settlementRows = useMemo(() => {
    const rawSettlements = data.settlements || [];
    const rows = mapDemoSettlementsToDriverRows(rawSettlements);
    
    // Enrich with driver names
    const enrichedRows = rows.map(row => ({
      ...row,
      driverName: driverMap.get(row.driverId) || row.driverId,
    }));
    
    return enrichedRows;
  }, [data.settlements, driverMap]);

  // Filter by selected driver
  const filteredByDriver = useMemo(() => {
    if (!selectedDriver) return settlementRows;
    return settlementRows.filter(row => row.driverId === selectedDriver);
  }, [settlementRows, selectedDriver]);

  // Filter by status
  const filteredRows = useMemo(() => {
    if (!statusFilter) return filteredByDriver;
    return filteredByDriver.filter(row => row.status === statusFilter);
  }, [filteredByDriver, statusFilter]);

  
  const selectedDriverData = useMemo(() => {
    if (!selectedDriver) return null;
    return filteredRows.find(row => row.driverId === selectedDriver) || null;
  }, [selectedDriver, filteredRows]);

  return (
    <div className="min-h-screen bg-slate-950 pb-32">
      {/* Hero Section */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-900/30 border border-teal-700/50 rounded-full text-xs font-medium text-teal-300 mb-4">
              Payroll review
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Settlement Review Center
            </h1>
            <p className="text-slate-300 text-lg max-w-3xl">
              Review driver pay, reimbursements, deductions, holds, family support, proof issues, and payment exceptions before settlement approval.
            </p>
          </div>
          
          {/* Status Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900/30 border border-blue-700/50 rounded-full text-xs font-medium text-blue-300">
              Deductions
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-900/30 border border-purple-700/50 rounded-full text-xs font-medium text-purple-300">
              Reimbursements
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-900/30 border border-orange-700/50 rounded-full text-xs font-medium text-orange-300">
              Family support
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-900/30 border border-amber-700/50 rounded-full text-xs font-medium text-amber-300">
              Proof holds
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-900/30 border border-green-700/50 rounded-full text-xs font-medium text-green-300">
              Ready to pay
            </span>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Source: main-source-v2_enhanced_bof_aligned.xlsx / Payroll sheet
            </div>
            <a
              href="/settlements-v2"
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Preview Settlements v2
            </a>
          </div>
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <EnhancedSettlementKPICards settlementRows={filteredRows} />
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900 border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <label className="text-sm font-medium text-slate-300">Period:</label>
              <select
                value={selectedPeriod.id}
                onChange={(e) => {
                  const period = canonicalPeriods.find(p => p.id === e.target.value);
                  if (period) setSelectedPeriod(period);
                }}
                className="block w-64 rounded-md border-slate-600 bg-slate-800 text-slate-100 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              >
                {canonicalPeriods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Selector */}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <label className="text-sm font-medium text-slate-300">Driver:</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="block w-48 rounded-md border-slate-600 bg-slate-800 text-slate-100 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              >
                <option value="">All Drivers</option>
                {data.drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <label className="text-sm font-medium text-slate-300">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SettlementStatus | "")}
                className="block w-40 rounded-md border-slate-600 bg-slate-800 text-slate-100 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              >
                <option value="">All Status</option>
                <option value="Ready">Ready</option>
                <option value="Needs Review">Needs Review</option>
                <option value="Hold">Hold</option>
                <option value="Paid">Paid</option>
                <option value="Missing Source Data">Missing Source Data</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Exception Review Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SettlementExceptionReview settlementRows={filteredRows} />
      </div>

      {/* Policy Quick Links Section */}
      <PolicyQuickLinks />

      {/* Accounting Templates Section */}
      <AccountingTemplates 
        selectedDriver={selectedDriverData} 
        settlementDate={selectedPeriod.label}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settlements Table */}
          <div className="lg:col-span-2">
            <SettlementsDataTable 
              rows={filteredRows}
              selectedDriverId={selectedDriver}
              onDriverSelect={setSelectedDriver}
            />
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            <SettlementDetailPanel 
              driverSettlement={selectedDriverData}
              period={selectedPeriod}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
