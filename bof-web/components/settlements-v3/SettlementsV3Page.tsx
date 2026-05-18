"use client";

import { useState, useEffect, useMemo } from "react";
import { DollarSign, Users, Calendar, Filter, TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { 
  getWeeklySettlementsData,
  getSettlementWeeks,
  getLatestSettlementWeek,
  getSettlementsForWeek,
  getSettlementsForDriver,
  getSettlementSummaryForPeriod,
  getDriverSettlementSummary,
  getDriverSettlementComparison,
  getWeeklyTrendData,
  getSettlementsNeedingReview,
  type WeeklySettlement,
} from "@/lib/v3-settlements-helpers";
import { getSettlementHolds } from "@/lib/v3-operational-loader";
import type { SettlementHold } from "@/lib/v3-operational-types";

type PeriodOption = "latest" | "last4" | "last8" | "custom";
type SortField = "driverName" | "grossPay" | "netPay" | "profitabilityScore" | "holds";
type SortDirection = "asc" | "desc";

interface SettlementWithHold extends WeeklySettlement {
  holds: SettlementHold[];
  holdCount: number;
  totalHoldAmount: number;
}

export function SettlementsV3Page() {
  const [settlements, setSettlements] = useState<WeeklySettlement[]>([]);
  const [holds, setHolds] = useState<SettlementHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [period, setPeriod] = useState<PeriodOption>("latest");
  const [sortField, setSortField] = useState<SortField>("driverName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showHolds, setShowHolds] = useState(false);
  const [showTrends, setShowTrends] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settlementsData, holdsData] = await Promise.all([
        getWeeklySettlementsData(),
        getSettlementHolds(),
      ]);
      setSettlements(settlementsData);
      setHolds(holdsData);
      
      // Set default week to latest
      const latestWeek = await getLatestSettlementWeek();
      if (latestWeek) {
        setSelectedWeek(latestWeek);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settlements data");
    } finally {
      setLoading(false);
    }
  };

  // Get available weeks and drivers
  const availableWeeks = useMemo(() => {
    if (!settlements.length) return [];
    const weeks = [...new Set(settlements.map(s => s.weekEnding))].sort().reverse();
    return weeks;
  }, [settlements]);

  const availableDrivers = useMemo(() => {
    if (!settlements.length) return [];
    const drivers = [...new Set(settlements.map(s => s.driverId))];
    return drivers.sort();
  }, [settlements]);

  // Filter settlements based on selected criteria
  const filteredSettlements = useMemo(() => {
    let filtered = [...settlements];

    // Filter by week
    if (selectedWeek !== "latest") {
      filtered = filtered.filter(s => s.weekEnding === selectedWeek);
    } else if (period === "latest") {
      const latestWeek = availableWeeks[0];
      if (latestWeek) {
        filtered = filtered.filter(s => s.weekEnding === latestWeek);
      }
    } else if (period === "last4") {
      const recentWeeks = availableWeeks.slice(0, 4);
      filtered = filtered.filter(s => recentWeeks.includes(s.weekEnding));
    } else if (period === "last8") {
      const recentWeeks = availableWeeks.slice(0, 8);
      filtered = filtered.filter(s => recentWeeks.includes(s.weekEnding));
    }

    // Filter by driver
    if (selectedDriver !== "all") {
      filtered = filtered.filter(s => s.driverId === selectedDriver);
    }

    // Add holds data
    const settlementsWithHolds: SettlementWithHold[] = filtered.map(settlement => {
      const settlementHolds = holds.filter(h => 
        h.driverId === settlement.driverId && h.weekEnding === settlement.weekEnding
      );
      return {
        ...settlement,
        holds: settlementHolds,
        holdCount: settlementHolds.length,
        totalHoldAmount: settlementHolds.reduce((sum, h) => sum + h.holdAmount, 0),
      };
    });

    // Sort
    return settlementsWithHolds.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "driverName":
          aValue = a.driverName;
          bValue = b.driverName;
          break;
        case "grossPay":
          aValue = a.grossPay;
          bValue = b.grossPay;
          break;
        case "netPay":
          aValue = a.netPay;
          bValue = b.netPay;
          break;
        case "profitabilityScore":
          aValue = a.driverProfitabilityScore;
          bValue = b.driverProfitabilityScore;
          break;
        case "holds":
          aValue = a.holdCount;
          bValue = b.holdCount;
          break;
        default:
          aValue = a.driverName;
          bValue = b.driverName;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
  }, [settlements, holds, selectedWeek, selectedDriver, period, sortField, sortDirection, availableWeeks]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalGrossPay = filteredSettlements.reduce((sum, s) => sum + s.grossPay, 0);
    const totalNetPay = filteredSettlements.reduce((sum, s) => sum + s.netPay, 0);
    const totalDeductions = filteredSettlements.reduce((sum, s) => sum + s.totalDeductions, 0);
    const totalFleetOwnerProfit = filteredSettlements.reduce((sum, s) => sum + s.fleetOwnerProfit, 0);
    const averageProfitabilityScore = filteredSettlements.length > 0
      ? filteredSettlements.reduce((sum, s) => sum + s.driverProfitabilityScore, 0) / filteredSettlements.length
      : 0;
    const completedPackets = filteredSettlements.filter(s => s.settlementPacketComplete).length;
    const approvedSettlements = filteredSettlements.filter(s => s.settlementStatus === "Approved").length;
    const totalHolds = filteredSettlements.reduce((sum, s) => sum + s.holdCount, 0);
    const totalHoldAmount = filteredSettlements.reduce((sum, s) => sum + s.totalHoldAmount, 0);

    return {
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      totalFleetOwnerProfit,
      averageProfitabilityScore,
      completedPackets,
      approvedSettlements,
      totalHolds,
      totalHoldAmount,
      settlementCount: filteredSettlements.length,
    };
  }, [filteredSettlements]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get trend icon
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous * 1.05) return <ArrowUpRight className="w-4 h-4 text-green-400" />;
    if (current < previous * 0.95) return <ArrowDownRight className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-yellow-400" />;
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
              <button
                onClick={() => setShowHolds(!showHolds)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showHolds 
                    ? 'bg-red-500/20 border-red-500 text-red-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Holds ({summary.totalHolds})
              </button>
              <button
                onClick={() => setShowTrends(!showTrends)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showTrends 
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Trends
              </button>
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
            <div className="text-lg font-bold text-white capitalize">
              {period}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {selectedWeek === "latest" ? "Latest week" : selectedWeek}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Drivers</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {availableDrivers.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Active</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <label className="text-sm text-slate-400">Period:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodOption)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="latest">Latest Week</option>
                <option value="last4">Last 4 Weeks</option>
                <option value="last8">Last 8 Weeks</option>
                <option value="custom">Custom Week</option>
              </select>
            </div>

            {period === "custom" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Week:</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select week</option>
                  {availableWeeks.map(week => (
                    <option key={week} value={week}>{week}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <label className="text-sm text-slate-400">Driver:</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Drivers</option>
                {availableDrivers.map(driverId => {
                  const driver = settlements.find(s => s.driverId === driverId);
                  return (
                    <option key={driverId} value={driverId}>
                      {driver?.driverName || driverId}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <label className="text-sm text-slate-400">Sort by:</label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="driverName">Driver Name</option>
                <option value="grossPay">Gross Pay</option>
                <option value="netPay">Net Pay</option>
                <option value="profitabilityScore">Profitability Score</option>
                <option value="holds">Hold Count</option>
              </select>
            </div>

            <button
              onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white hover:bg-slate-700 transition-colors"
            >
              {sortDirection === "asc" ? "↑" : "↓"}
            </button>
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
                {filteredSettlements.map((settlement) => (
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
                      {settlement.holdCount > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400 font-medium">{settlement.holdCount}</span>
                          <span className="text-slate-400 text-xs">({formatCurrency(settlement.totalHoldAmount)})</span>
                        </div>
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Settlements Needing Review */}
      {showHolds && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Settlements Needing Review
            </h3>
            <div className="space-y-3">
              {filteredSettlements
                .filter(s => s.holdCount > 0 || !s.settlementPacketComplete || s.settlementStatus !== "Approved")
                .map(settlement => (
                  <div key={`${settlement.driverId}-${settlement.weekEnding}`} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{settlement.driverName}</div>
                        <div className="text-slate-400 text-sm">{settlement.weekEnding}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-400 font-medium">{formatCurrency(settlement.totalHoldAmount)}</div>
                        <div className="text-slate-400 text-xs">{settlement.holdCount} holds</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {settlement.holds.map(hold => (
                        <div key={hold.holdId} className="text-sm text-slate-300">
                          <span className="text-red-400">{hold.holdType}:</span> {hold.holdReason}
                          <span className="text-slate-500 ml-2">({hold.relatedModule})</span>
                        </div>
                      ))}
                      {!settlement.settlementPacketComplete && (
                        <div className="text-sm text-yellow-400">
                          ⚠️ Settlement packet incomplete
                        </div>
                      )}
                      {settlement.settlementStatus !== "Approved" && (
                        <div className="text-sm text-yellow-400">
                          ⚠️ Settlement not approved: {settlement.settlementStatus}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
