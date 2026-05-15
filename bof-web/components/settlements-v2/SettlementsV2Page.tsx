"use client";

import { useMemo, useState, useEffect } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { Calendar } from "lucide-react";
import { AccountingTemplates } from "./AccountingTemplates";
import { SettlementTable } from "./SettlementTable";
import { SettlementSidebar } from "./SettlementSidebar";
import { getSettlementPeriods, type SettlementPeriodOption } from "@/lib/settlement-periods";

export type SettlementStatus = "Paid" | "Ready" | "Pending" | "Exception";

interface DemoSettlementData {
  driverId: string;
  settlementId: string;
  baseEarnings?: number;
  grossPay: number;
  totalDeductions?: number;
  deductions?: number;
  netPay: number;
  backhaulPay?: number;
  safetyBonus?: number;
  fuelReimbursement?: number;
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
  status?: string;
  pendingReason?: string;
}

export interface DriverSettlementRow {
  driverId: string;
  driverName: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  balance: number;
  status: SettlementStatus;
  settlementId: string;
  baseEarnings?: number;
  backhaulPay?: number;
  safetyBonus?: number;
  fuelReimbursement?: number;
  // Deduction components
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

function normalizeSettlementStatus(status: string, pendingReason?: string): SettlementStatus {
  const normalized = status.toLowerCase().trim();
  if (normalized === "paid") return "Paid";
  if (normalized === "pending") {
    if (pendingReason) {
      const reason = pendingReason.toLowerCase();
      const blockingIssues = [
        "hold", "review", "block", "dispute", "error", "missing", 
        "rejected", "failed", "overdue", "exception", "investigation"
      ];
      
      if (blockingIssues.some(issue => reason.includes(issue))) {
        return "Exception";
      }
    }
    return "Ready";
  }
  if (normalized === "on hold") return "Exception";
  return "Ready";
}

function mapDemoSettlementsToDriverRows(settlements: DemoSettlementData[]): DriverSettlementRow[] {
  return settlements.map(settlement => {
    const prioritizedDeductions = settlement.totalDeductions || settlement.deductions || 0;
    const balance = settlement.netPay || 0;
    
    return {
      driverId: settlement.driverId || "",
      driverName: settlement.driverId, // Will be resolved from drivers data
      grossPay: settlement.grossPay || 0,
      deductions: prioritizedDeductions,
      netPay: settlement.netPay || 0,
      balance,
      status: normalizeSettlementStatus(settlement.status || "", settlement.pendingReason),
      settlementId: settlement.settlementId || "",
      baseEarnings: settlement.baseEarnings,
      backhaulPay: settlement.backhaulPay,
      safetyBonus: settlement.safetyBonus,
      fuelReimbursement: settlement.fuelReimbursement,
      // Pass through deduction components for sidebar
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

export function SettlementsV2Page() {
  const { data } = useBofDemoData();
  const canonicalPeriods = getSettlementPeriods();
  const [selectedPeriod, setSelectedPeriod] = useState<SettlementPeriodOption>(canonicalPeriods[0]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");

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

  // Get selected driver data
  const selectedDriverData = useMemo(() => {
    if (!selectedDriver) return settlementRows[0] || null;
    return settlementRows.find(row => row.driverId === selectedDriver) || null;
  }, [selectedDriver, settlementRows]);

  // Set first driver as default selection
  useEffect(() => {
    if (settlementRows.length > 0 && !selectedDriver) {
      setSelectedDriver(settlementRows[0].driverId);
    }
  }, [settlementRows, selectedDriver]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-700/50 rounded-full text-xs font-medium text-blue-300 mb-3">
                Preview
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Settlements v2
              </h1>
              <p className="text-slate-400">
                Unified settlements page with accounting templates, driver table, and preview sidebar
              </p>
            </div>
            
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
                className="block w-64 rounded-md border-slate-600 bg-slate-800 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {canonicalPeriods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-slate-500">
            Source: main-source-v2_enhanced_bof_aligned.xlsx / Payroll sheet • {settlementRows.length} drivers
          </div>
        </div>
      </div>

      {/* Accounting Templates Section */}
      <AccountingTemplates selectedDriver={selectedDriverData} />

      {/* Main Content: Table + Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settlements Table */}
          <div className="lg:col-span-2">
            <SettlementTable 
              rows={settlementRows}
              selectedDriverId={selectedDriver}
              onDriverSelect={setSelectedDriver}
            />
          </div>

          {/* Settlement Preview Sidebar */}
          <div className="lg:col-span-1">
            <SettlementSidebar 
              driverSettlement={selectedDriverData}
              period={selectedPeriod}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
