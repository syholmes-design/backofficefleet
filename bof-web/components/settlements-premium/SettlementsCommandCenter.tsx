"use client";

import { useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { Users, Calendar, Filter } from "lucide-react";
import { SettlementsDataTable } from "./SettlementsDataTable";
import { SettlementDetailPanel } from "./SettlementDetailPanel";
import { SettlementsKPICards } from "./SettlementsKPICards";
import { getSettlementPeriods, type SettlementPeriodOption } from "@/lib/settlement-periods";

export type SettlementStatus = "Ready" | "Needs Review" | "Hold" | "Paid" | "Missing Source Data";

interface DemoSettlement {
  driverId: string;
  driverName?: string;
  grossPay?: number;
  fuelReimbursement?: number;
  totalDeductions?: number;
  netPay?: number;
  status?: string;
  pendingReason?: string;
  settlementId?: string;
  baseEarnings?: number;
  backhaulPay?: number;
  safetyBonus?: number;
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
};


function normalizeSettlementStatus(status: string): SettlementStatus {
  const normalized = status.toLowerCase().trim();
  if (normalized === "paid") return "Paid";
  if (normalized === "pending" || normalized === "on hold") return "Needs Review";
  if (normalized === "draft") return "Ready";
  return "Missing Source Data";
}

function mapDemoSettlementsToDriverRows(settlements: DemoSettlement[]): DriverSettlementRow[] {
  return settlements.map(settlement => ({
    driverId: settlement.driverId || "",
    driverName: settlement.driverId, // Will be resolved from drivers data
    grossPay: settlement.grossPay || 0,
    reimbursements: settlement.fuelReimbursement || 0,
    deductions: settlement.totalDeductions || 0,
    netPay: settlement.netPay || 0,
    status: normalizeSettlementStatus(settlement.status || ""),
    holds: settlement.pendingReason ? [settlement.pendingReason] : [],
    settlementId: settlement.settlementId || "",
    baseEarnings: settlement.baseEarnings,
    backhaulPay: settlement.backhaulPay,
    safetyBonus: settlement.safetyBonus,
    fuelReimbursement: settlement.fuelReimbursement,
  }));
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
    const rows = mapDemoSettlementsToDriverRows(data.settlements || []);
    
    // Enrich with driver names
    return rows.map(row => ({
      ...row,
      driverName: driverMap.get(row.driverId) || row.driverId,
    }));
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

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalGross = filteredRows.reduce((sum, row) => sum + row.grossPay, 0);
    const totalDeductions = filteredRows.reduce((sum, row) => sum + row.deductions, 0);
    const totalNet = filteredRows.reduce((sum, row) => sum + row.netPay, 0);
    const holdsCount = filteredRows.filter(row => row.holds.length > 0).length;

    return {
      totalGross,
      totalDeductions,
      totalNet,
      holdsCount,
      driverCount: filteredRows.length,
    };
  }, [filteredRows]);

  const selectedDriverData = useMemo(() => {
    if (!selectedDriver) return null;
    return filteredRows.find(row => row.driverId === selectedDriver) || null;
  }, [selectedDriver, filteredRows]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Premium Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Settlements Command Center
            </h1>
            <p className="text-slate-300 text-lg">
              Review driver pay, deductions, reimbursements, settlement holds, and period-level payout readiness from the source-of-truth payroll file.
            </p>
            <div className="mt-4 text-sm text-slate-400">
              Source: consolidated BOF main-source Excel
            </div>
          </div>

          {/* KPI Cards */}
          <SettlementsKPICards kpis={kpis} />
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={selectedPeriod.id}
                onChange={(e) => {
                  const period = canonicalPeriods.find(p => p.id === e.target.value);
                  if (period) setSelectedPeriod(period);
                }}
                className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
              <Users className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Driver:</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
              <Filter className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SettlementStatus | "")}
                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
