"use client";

import { useState, useEffect } from "react";
import { DollarSign, Users, Calendar, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";
import { formatDisplayDate } from "@/lib/date-utils";
import { SettlementsAssetCards } from "@/components/settlements-v3/SettlementsAssetCards";
import type { WeeklySettlement, SettlementHold } from "@/lib/v3-operational-types";

export function SettlementsV3Simple() {
  const [settlements, setSettlements] = useState<WeeklySettlement[]>([]);
  const [holds, setHolds] = useState<SettlementHold[]>([]);
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
        setHolds(v3Data.settlementHolds);
        
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
    setHolds(fallbackHolds);
  };

  // Calculate summary statistics and get latest week
  const summary = {
    totalGrossPay: settlements.reduce((sum, s) => sum + s.grossPay, 0),
    totalNetPay: settlements.reduce((sum, s) => sum + s.netPay, 0),
    totalDeductions: settlements.reduce((sum, s) => sum + s.totalDeductions, 0),
    totalFleetOwnerProfit: settlements.reduce((sum, s) => sum + s.fleetOwnerProfit, 0),
    averageProfitabilityScore: settlements.length > 0
      ? settlements.reduce((sum, s) => sum + s.driverProfitabilityScore, 0) / settlements.length
      : 0,
    completedPackets: settlements.filter(s => s.settlementPacketComplete).length,
    approvedSettlements: settlements.filter(s => s.settlementStatus === "Approved").length,
    totalHolds: holds.filter(h => h.status === "Open").length,
    totalHoldAmount: holds.filter(h => h.status === "Open").reduce((sum, h) => sum + h.holdAmount, 0),
    settlementCount: settlements.length,
  };

  // Get latest week ending from actual data
  const latestWeek = settlements.length > 0
    ? Array.from(new Set(settlements.map(s => s.weekEnding))).sort().pop()
    : "N/A";

  // Format latest week for display
  const latestWeekDisplay = latestWeek !== "N/A" ? formatDisplayDate(latestWeek) : "N/A";

  // Get distinct drivers count
  const distinctDrivers = settlements.length > 0 
    ? new Set(settlements.map(s => s.driverId)).size
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
              Latest Week
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {latestWeekDisplay}
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

      {/* Settlements Table */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
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
                </tr>
              </thead>
              <tbody>
                {settlements.map((settlement) => {
                  const settlementHolds = holds.filter(h => 
                    h.driverId === settlement.driverId && h.weekEnding === settlement.weekEnding
                  );
                  const holdCount = settlementHolds.length;
                  const totalHoldAmount = settlementHolds.reduce((sum, h) => sum + h.holdAmount, 0);

                  return (
                    <tr key={`${settlement.driverId}-${settlement.weekEnding}`} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">{settlement.driverName}</div>
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
                          settlement.settlementStatus === "Approved" 
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : settlement.settlementStatus === "Pending"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}>
                          {settlement.settlementStatus}
                        </span>
                      </td>
                      <td className="text-center px-6 py-4">
                        {holdCount > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-red-400 font-medium">{holdCount}</span>
                            <span className="text-slate-400 text-xs">({formatCurrency(totalHoldAmount)})</span>
                          </div>
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Settlement Holds Panel */}
      {holds.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Settlement Holds
            </h3>
            <div className="space-y-3">
              {holds.map((hold) => (
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
                            Driver: {hold.driverId}
                          </div>
                          {hold.loadId && (
                            <div className="text-slate-400 text-sm">
                              Load: {hold.loadId}
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
        settlementWeek={latestWeek}
      />
    </div>
  );
}
