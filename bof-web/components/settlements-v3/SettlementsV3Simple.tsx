"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { DollarSign, Users, Calendar, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";
import { formatDisplayDate } from "@/lib/date-utils";
import { SettlementsAssetCards } from "@/components/settlements-v3/SettlementsAssetCards";
import type { PayrollSettlementDetail, WeeklySettlement, SettlementHold } from "@/lib/v3-operational-types";

function getLatestSettlementWeek(rows: WeeklySettlement[]) {
  return Array.from(new Set(rows.map((row) => row.weekEnding)))
    .filter(Boolean)
    .sort()
    .pop() ?? "";
}

function settlementStatusFromPayroll(status: string, fallback: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "paid") return "Paid";
  if (normalized === "pending") return "Pending";
  if (normalized === "on hold" || normalized === "hold") return "On Hold";
  return fallback;
}

function mergePayrollIntoSettlement(
  settlement: WeeklySettlement | undefined,
  payroll: PayrollSettlementDetail,
  weekEnding: string
): WeeklySettlement {
  return {
    weekEnding: settlement?.weekEnding || weekEnding,
    driverId: payroll.driverId,
    driverName: settlement?.driverName || payroll.driverName,
    grossPay: payroll.grossPay,
    totalDeductions: payroll.totalDeductions,
    netPay: payroll.netPay,
    fleetOwnerProfit: settlement?.fleetOwnerProfit ?? 0,
    driverProfitabilityScore: settlement?.driverProfitabilityScore ?? 0,
    settlementStatus: settlementStatusFromPayroll(payroll.status, settlement?.settlementStatus || "Pending"),
    settlementPacketComplete: settlement?.settlementPacketComplete ?? payroll.status.toLowerCase() === "paid",
    settlementApprovedBy: settlement?.settlementApprovedBy ?? "",
    settlementApprovalTimestamp: settlement?.settlementApprovalTimestamp ?? "",
  };
}

function statusClass(status: string) {
  const normalized = status.trim().toLowerCase();
  if (["approved", "complete", "paid", "ready"].includes(normalized)) {
    return "bg-green-500/20 text-green-400 border border-green-500/30";
  }
  if (["pending", "under review"].includes(normalized)) {
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  }
  return "bg-red-500/20 text-red-400 border border-red-500/30";
}

function payrollCategorySummary(rows: PayrollSettlementDetail[]) {
  const sum = (pick: (row: PayrollSettlementDetail) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);

  const taxWithholding = sum((row) =>
    row.fica + row.oasdi + row.federalWithholding + row.stateWithholding + row.sdi + row.fmLeave
  );
  const benefitsAndSavings = sum((row) =>
    row.insurancePremiums +
    row.creditUnionSavingsClub +
    row.contribution401k +
    row.hsaFsaHealthDeduction +
    row.healthInsurancePremiums +
    row.lifeInsuranceAbove50k
  );
  const supportAndGarnishment = sum((row) => row.familySupport + row.garnishmentAmount);
  const advancesChargebacksEscrow = sum((row) =>
    row.advanceRepayment + row.chargebackTotal + row.escrowContribution
  );
  const totalDeductions = sum((row) => row.totalDeductions);
  const itemizedDeductions =
    taxWithholding + benefitsAndSavings + supportAndGarnishment + advancesChargebacksEscrow;

  return [
    {
      label: "Base earnings",
      value: sum((row) => row.baseEarnings),
      hint: "Mileage, hourly, salary, or base settlement earnings.",
      tone: "text-green-300",
    },
    {
      label: "Backhaul and safety pay",
      value: sum((row) => row.backhaulPay + row.safetyBonus),
      hint: "Backhaul incentives and safety/performance bonuses.",
      tone: "text-teal-300",
    },
    {
      label: "Tax withholding",
      value: taxWithholding,
      hint: "FICA, OASDI, federal, state, SDI, and FM leave.",
      tone: "text-orange-300",
    },
    {
      label: "Benefits and savings",
      value: benefitsAndSavings,
      hint: "Insurance, 401(k), HSA/FSA, and credit union deductions.",
      tone: "text-blue-300",
    },
    {
      label: "Support / garnishment",
      value: supportAndGarnishment,
      hint: "Family support and garnishment withholding.",
      tone: "text-red-300",
    },
    {
      label: "Advances, chargebacks, escrow",
      value: advancesChargebacksEscrow,
      hint: "Repayments, chargebacks, and escrow contribution controls.",
      tone: "text-purple-300",
    },
    {
      label: "Fuel reimbursements tracked",
      value: sum((row) => row.fuelReimbursement),
      hint: "Approved fuel reimbursement amounts tracked outside gross pay.",
      tone: "text-cyan-300",
    },
    {
      label: "Other payroll deductions",
      value: Math.max(0, totalDeductions - itemizedDeductions),
      hint: "Workbook total-deduction balance not itemized by named columns.",
      tone: "text-slate-200",
    },
  ];
}

export function SettlementsV3Simple() {
  const [settlements, setSettlements] = useState<WeeklySettlement[]>([]);
  const [payrollSettlements, setPayrollSettlements] = useState<PayrollSettlementDetail[]>([]);
  const [holds, setHolds] = useState<SettlementHold[]>([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setUsingFallback] = useState(false);

  // Load real workbook data
  useEffect(() => {
    loadWorkbookData();
  }, []);

  const loadWorkbookData = async () => {
    try {
      setLoading(true);
      setUsingFallback(false);
      
      // Check if v3 data is available
      const v3Available = await isV3DataAvailable();
      
      if (v3Available) {
        console.log('📊 Loading V3 operational workbook data...');
        const v3Data = await getV3OperationalData();
        
        setSettlements(v3Data.weeklySettlements);
        setPayrollSettlements(v3Data.payrollSettlements);
        setHolds(v3Data.settlementHolds);
        setSelectedWeek((current) => current || getLatestSettlementWeek(v3Data.weeklySettlements));
        
        console.log(`✅ Loaded ${v3Data.weeklySettlements.length} settlements and ${v3Data.settlementHolds.length} holds from workbook`);
      } else {
        console.warn('⚠️ V3 workbook not available, using fallback data');
        await loadFallbackData();
      }
    } catch (err) {
      console.error('❌ Failed to load workbook data:', err);
      setError(err instanceof Error ? err.message : "Failed to load settlements data");
      await loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = async () => {
    console.warn('🔄 Using fallback mock data - workbook not available or failed to load');
    setUsingFallback(true);
    
    // Fallback mock settlements data
    const fallbackSettlements: WeeklySettlement[] = [
      {
        weekEnding: "2026-05-09",
        driverId: "DRV-001",
        driverName: "John Carter",
        grossPay: 3250.00,
        totalDeductions: 487.50,
        netPay: 2762.50,
        fleetOwnerProfit: 487.50,
        driverProfitabilityScore: 8.5,
        settlementStatus: "Approved",
        settlementPacketComplete: true,
        settlementApprovedBy: "DS-001",
        settlementApprovalTimestamp: "2026-05-10T14:30:00Z",
      },
      {
        weekEnding: "2026-05-09",
        driverId: "DRV-002",
        driverName: "Maria Lopez",
        grossPay: 3100.00,
        totalDeductions: 465.00,
        netPay: 2635.00,
        fleetOwnerProfit: 465.00,
        driverProfitabilityScore: 7.8,
        settlementStatus: "Approved",
        settlementPacketComplete: true,
        settlementApprovedBy: "DS-001",
        settlementApprovalTimestamp: "2026-05-10T14:30:00Z",
      },
      {
        weekEnding: "2026-05-09",
        driverId: "DRV-003",
        driverName: "Alex Kim",
        grossPay: 3400.00,
        totalDeductions: 510.00,
        netPay: 2890.00,
        fleetOwnerProfit: 510.00,
        driverProfitabilityScore: 9.2,
        settlementStatus: "Pending",
        settlementPacketComplete: false,
        settlementApprovedBy: "",
        settlementApprovalTimestamp: "",
      },
    ];

    // Fallback mock holds data
    const fallbackHolds: SettlementHold[] = [
      {
        holdId: "HOLD-001",
        weekEnding: "2026-05-09",
        driverId: "DRV-003",
        loadId: "L-503",
        holdType: "Document Missing",
        holdReason: "BOL not uploaded for load L-503",
        relatedModule: "Documents",
        relatedEventId: "DOC-001",
        holdAmount: 2890.00,
        status: "Open",
        openedDate: "2026-05-11T09:00:00Z",
        resolvedDate: "",
        approvedBy: "",
        releaseAuthorizedBy: "",
        managerActionRequired: true,
      },
    ];

    setSettlements(fallbackSettlements);
    setPayrollSettlements([]);
    setHolds(fallbackHolds);
    setSelectedWeek((current) => current || getLatestSettlementWeek(fallbackSettlements));
  };

  const availableWeeks = useMemo(() => {
    return Array.from(new Set(settlements.map((settlement) => settlement.weekEnding)))
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));
  }, [settlements]);

  const activeWeek = selectedWeek || availableWeeks[0] || "N/A";
  const latestSettlementWeek = availableWeeks[0] || "";

  const selectedWeekSettlements = useMemo(() => {
    const byDriver = new Map<string, WeeklySettlement>();

    settlements
      .filter((settlement) => settlement.weekEnding === activeWeek)
      .forEach((settlement) => {
        if (!byDriver.has(settlement.driverId)) {
          byDriver.set(settlement.driverId, settlement);
        }
      });

    if (activeWeek === latestSettlementWeek && payrollSettlements.length > 0) {
      payrollSettlements.forEach((payroll) => {
        byDriver.set(
          payroll.driverId,
          mergePayrollIntoSettlement(byDriver.get(payroll.driverId), payroll, activeWeek)
        );
      });
    }

    return Array.from(byDriver.values()).sort((a, b) => a.driverName.localeCompare(b.driverName));
  }, [activeWeek, latestSettlementWeek, payrollSettlements, settlements]);

  const selectedPayrollRows = useMemo(() => {
    if (activeWeek !== latestSettlementWeek) return [];
    const selectedDriverIds = new Set(selectedWeekSettlements.map((settlement) => settlement.driverId));
    return payrollSettlements.filter((row) => selectedDriverIds.has(row.driverId));
  }, [activeWeek, latestSettlementWeek, payrollSettlements, selectedWeekSettlements]);

  const payrollCategories = useMemo(() => payrollCategorySummary(selectedPayrollRows), [selectedPayrollRows]);

  const selectedWeekHolds = useMemo(() => {
    return holds.filter((hold) => hold.weekEnding === activeWeek);
  }, [activeWeek, holds]);

  // Calculate summary statistics for the selected settlement week
  const summary = {
    totalGrossPay: selectedWeekSettlements.reduce((sum, s) => sum + s.grossPay, 0),
    totalNetPay: selectedWeekSettlements.reduce((sum, s) => sum + s.netPay, 0),
    totalDeductions: selectedWeekSettlements.reduce((sum, s) => sum + s.totalDeductions, 0),
    totalFleetOwnerProfit: selectedWeekSettlements.reduce((sum, s) => sum + s.fleetOwnerProfit, 0),
    averageProfitabilityScore: selectedWeekSettlements.length > 0
      ? selectedWeekSettlements.reduce((sum, s) => sum + s.driverProfitabilityScore, 0) / selectedWeekSettlements.length
      : 0,
    completedPackets: selectedWeekSettlements.filter(s => s.settlementPacketComplete).length,
    approvedSettlements: selectedWeekSettlements.filter(s => s.settlementStatus === "Approved").length,
    totalHolds: selectedWeekHolds.filter(h => h.status === "Open").length,
    totalHoldAmount: selectedWeekHolds.filter(h => h.status === "Open").reduce((sum, h) => sum + h.holdAmount, 0),
    settlementCount: selectedWeekSettlements.length,
  };

  const activeWeekDisplay = activeWeek !== "N/A" ? formatDisplayDate(activeWeek) : "N/A";

  // Get distinct drivers count
  const distinctDrivers = selectedWeekSettlements.length > 0
    ? new Set(selectedWeekSettlements.map(s => s.driverId)).size
    : 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading settlements data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-medium mb-2">Failed to load settlements</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-400" />
                Settlements Command Center
              </h1>
              <p className="text-slate-400 mt-2">
                Driver pay, deductions, reimbursements, and settlement readiness from source-of-truth data
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-red-400 font-medium">{summary.totalHolds}</div>
                <div className="text-slate-400 text-xs">Open Holds</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Gross Pay</span>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(summary.totalGrossPay)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {summary.settlementCount} settlements
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Net Paid</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(summary.totalNetPay)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              After deductions
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Deductions</span>
              <TrendingUp className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(summary.totalDeductions)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {summary.totalDeductions > 0 ? `${((summary.totalDeductions / summary.totalGrossPay) * 100).toFixed(1)}% of gross` : '0%'}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Fleet Owner Profit</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(summary.totalFleetOwnerProfit)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {summary.totalFleetOwnerProfit > 0 ? `${((summary.totalFleetOwnerProfit / summary.totalGrossPay) * 100).toFixed(1)}% margin` : '0%'}
            </div>
          </div>
        </div>

        {/* Additional KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Avg Profitability</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {summary.averageProfitabilityScore.toFixed(1)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Score</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Packets Complete</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {summary.completedPackets}/{summary.settlementCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {summary.settlementCount > 0 ? `${((summary.completedPackets / summary.settlementCount) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Approved</span>
              <CheckCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {summary.approvedSettlements}/{summary.settlementCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {summary.settlementCount > 0 ? `${((summary.approvedSettlements / summary.settlementCount) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Open Holds</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {summary.totalHolds}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {formatCurrency(summary.totalHoldAmount)} held
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Period</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-white">
              Selected Week
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {activeWeekDisplay}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Drivers</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {distinctDrivers}
            </div>
            <div className="text-xs text-slate-500 mt-1">Active</div>
          </div>
        </div>
      </div>

      {/* Payroll category breakdown */}
      {selectedPayrollRows.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Payroll Expense Categories</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Latest week gross-to-net detail is sourced from the V4 Payroll sheet. Earlier weeks remain available from Weekly_Settlements history.
                </p>
              </div>
              <div className="text-sm text-slate-500">
                {selectedPayrollRows.length} payroll rows reconciled
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {payrollCategories.map((category) => (
                <div key={category.label} className="rounded-lg border border-slate-800 bg-slate-950/55 p-4">
                  <div className="text-sm text-slate-400">{category.label}</div>
                  <div className={`mt-2 text-2xl font-bold ${category.tone}`}>
                    {formatCurrency(category.value)}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{category.hint}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Settlements Table */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Driver Settlement Queue</h2>
              <p className="mt-1 text-sm text-slate-400">
                Showing one settlement row per driver for {activeWeekDisplay}. Use the week menu to review earlier settlement periods.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                Settlement week
                <select
                  value={activeWeek === "N/A" ? "" : activeWeek}
                  onChange={(event) => setSelectedWeek(event.target.value)}
                  className="min-w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30"
                >
                  {availableWeeks.map((week) => (
                    <option key={week} value={week}>
                      {formatDisplayDate(week)}
                    </option>
                  ))}
                </select>
              </label>
              <Link
                href="/documents"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-teal-400/40 bg-teal-400/10 px-4 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-300 hover:bg-teal-400/20 focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                Open settlement documents
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Driver</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Gross Pay</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Deductions</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Net Pay</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Profitability</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">Packet</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">Holds</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedWeekSettlements.map((settlement) => {
                  const settlementHolds = selectedWeekHolds.filter(h => 
                    h.driverId === settlement.driverId && h.weekEnding === settlement.weekEnding
                  );
                  const holdCount = settlementHolds.length;
                  const totalHoldAmount = settlementHolds.reduce((sum, h) => sum + h.holdAmount, 0);

                  return (
                    <tr key={`${settlement.driverId}-${settlement.weekEnding}`} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/drivers/${settlement.driverId}`}
                            className="font-medium text-white underline-offset-4 transition hover:text-teal-200 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-300"
                          >
                            {settlement.driverName}
                          </Link>
                          <div className="text-slate-400 text-sm">{settlement.driverId}</div>
                          <div className="text-slate-500 text-xs">{settlement.weekEnding}</div>
                        </div>
                      </td>
                      <td className="text-right px-6 py-4">
                        <div className="text-white font-medium">{formatCurrency(settlement.grossPay)}</div>
                      </td>
                      <td className="text-right px-6 py-4">
                        <div className="text-orange-400">{formatCurrency(settlement.totalDeductions)}</div>
                      </td>
                      <td className="text-right px-6 py-4">
                        <div className="text-green-400 font-medium">{formatCurrency(settlement.netPay)}</div>
                      </td>
                      <td className="text-right px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-white font-medium">{settlement.driverProfitabilityScore.toFixed(1)}</span>
                          {settlement.driverProfitabilityScore >= 8 ? (
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          ) : settlement.driverProfitabilityScore >= 6 ? (
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          ) : (
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          )}
                        </div>
                      </td>
                      <td className="text-center px-6 py-4">
                        {settlement.settlementPacketComplete ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-400 mx-auto" />
                        )}
                      </td>
                      <td className="text-center px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusClass(settlement.settlementStatus)
                        }`}>
                          {settlement.settlementStatus}
                        </span>
                      </td>
                      <td className="text-center px-6 py-4">
                        {holdCount > 0 ? (
                          <Link
                            href="/money-at-risk"
                            className="inline-flex items-center justify-center gap-1 rounded-full px-2 py-1 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-300"
                          >
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-red-400 font-medium">{holdCount}</span>
                            <span className="text-slate-400 text-xs">({formatCurrency(totalHoldAmount)})</span>
                          </Link>
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex min-w-48 flex-wrap gap-2">
                          <Link
                            href={`/drivers/${settlement.driverId}/settlements?week=${encodeURIComponent(settlement.weekEnding)}`}
                            className="rounded-md border border-teal-400/40 bg-teal-400/10 px-3 py-1.5 text-xs font-semibold text-teal-100 transition hover:border-teal-300 hover:bg-teal-400/20 focus:outline-none focus:ring-2 focus:ring-teal-300"
                          >
                            Review pay
                          </Link>
                          <Link
                            href={`/drivers/${settlement.driverId}/vault`}
                            className="rounded-md border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                          >
                            Open vault
                          </Link>
                          {holdCount > 0 && (
                            <Link
                              href="/money-at-risk"
                              className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:border-red-300 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-300"
                            >
                              Clear hold
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {selectedWeekSettlements.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-sm text-slate-400">
                      No driver settlements are available for this week.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Settlement Holds Panel */}
      {selectedWeekHolds.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Settlement Holds for {activeWeekDisplay}
            </h3>
            <div className="space-y-3">
              {selectedWeekHolds.map((hold) => (
                <div key={hold.holdId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                          {hold.status}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          {hold.relatedModule}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {hold.holdId}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-white font-medium mb-1">{hold.holdReason}</div>
                          <div className="text-slate-400 text-sm">
                            Driver:{" "}
                            <Link
                              href={`/drivers/${hold.driverId}`}
                              className="text-teal-200 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-300"
                            >
                              {hold.driverId}
                            </Link>
                          </div>
                          {hold.loadId && (
                            <div className="text-slate-400 text-sm">
                              Load:{" "}
                              <Link
                                href={`/loads/${hold.loadId}`}
                                className="text-teal-200 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-300"
                              >
                                {hold.loadId}
                              </Link>
                            </div>
                          )}
                          <div className="text-slate-400 text-sm">
                            Week: {hold.weekEnding}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-red-400 font-medium mb-1">
                            {formatCurrency(hold.holdAmount)}
                          </div>
                          <div className="text-slate-400 text-sm">
                            Opened: {hold.openedDate}
                          </div>
                          <div className="text-slate-400 text-sm">
                            Type: {hold.holdType}
                          </div>
                        </div>
                      </div>

                      {hold.managerActionRequired && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mt-3">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-medium text-sm">Manager Action Required</span>
                          </div>
                          <div className="text-slate-300 text-sm">
                            This hold requires manager review and approval before release.
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                              href={`/drivers/${hold.driverId}/settlements?week=${encodeURIComponent(hold.weekEnding)}`}
                              className="rounded-md border border-yellow-400/40 bg-yellow-400/10 px-3 py-1.5 text-xs font-semibold text-yellow-100 transition hover:border-yellow-300 hover:bg-yellow-400/20 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                            >
                              Review driver pay
                            </Link>
                            <Link
                              href="/money-at-risk"
                              className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:border-red-300 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-300"
                            >
                              Open risk queue
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settlement Asset Cards */}
      <SettlementsAssetCards 
        loadId="L003" // Default to a load that has settlement data
        settlementWeek={activeWeek}
      />
    </div>
  );
}
