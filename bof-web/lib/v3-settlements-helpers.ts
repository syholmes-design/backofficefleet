/**
 * V3 Settlements Helper Functions
 * Provides business logic and utilities for Weekly_Settlements data
 */

import type { WeeklySettlement, SettlementHold } from './v3-operational-types';

// Re-export for convenience
export type { WeeklySettlement, SettlementHold };
import { getWeeklySettlements, getSettlementHolds } from './v3-operational-loader';

/**
 * Get all weekly settlements
 */
export async function getWeeklySettlementsData(): Promise<WeeklySettlement[]> {
  return await getWeeklySettlements();
}

/**
 * Get all available settlement weeks
 */
export async function getSettlementWeeks(): Promise<string[]> {
  const settlements = await getWeeklySettlements();
  const weeks = [...new Set(settlements.map(s => s.weekEnding))].sort().reverse();
  return weeks;
}

/**
 * Get the latest settlement week
 */
export async function getLatestSettlementWeek(): Promise<string | null> {
  const weeks = await getSettlementWeeks();
  return weeks.length > 0 ? weeks[0] : null;
}

/**
 * Get settlements for a specific week
 */
export async function getSettlementsForWeek(weekEnding: string): Promise<WeeklySettlement[]> {
  const settlements = await getWeeklySettlements();
  return settlements.filter(s => s.weekEnding === weekEnding);
}

/**
 * Get settlements for a specific driver
 */
export async function getSettlementsForDriver(driverId: string): Promise<WeeklySettlement[]> {
  const settlements = await getWeeklySettlements();
  return settlements.filter(s => s.driverId === driverId);
}

/**
 * Get settlement summary for a period
 */
export async function getSettlementSummaryForPeriod(options: {
  weekEnding?: string;
  driverId?: string;
  rollingWeeks?: number;
} = {}): Promise<{
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  totalFleetOwnerProfit: number;
  averageDriverProfitabilityScore: number;
  totalSettlements: number;
  completedPackets: number;
  approvedSettlements: number;
  totalHolds: number;
  totalHoldAmount: number;
}> {
  const settlements = await getWeeklySettlements();
  const holds = await getSettlementHolds();
  
  let filteredSettlements = settlements;
  
  // Filter by week
  if (options.weekEnding) {
    filteredSettlements = filteredSettlements.filter(s => s.weekEnding === options.weekEnding);
  }
  
  // Filter by driver
  if (options.driverId) {
    filteredSettlements = filteredSettlements.filter(s => s.driverId === options.driverId);
  }
  
  // Filter by rolling weeks
  if (options.rollingWeeks && options.rollingWeeks > 0) {
    const weeks = await getSettlementWeeks();
    const recentWeeks = weeks.slice(0, options.rollingWeeks);
    filteredSettlements = filteredSettlements.filter(s => recentWeeks.includes(s.weekEnding));
  }
  
  // Calculate summary
  const totalGrossPay = filteredSettlements.reduce((sum, s) => sum + s.grossPay, 0);
  const totalNetPay = filteredSettlements.reduce((sum, s) => sum + s.netPay, 0);
  const totalDeductions = filteredSettlements.reduce((sum, s) => sum + s.totalDeductions, 0);
  const totalFleetOwnerProfit = filteredSettlements.reduce((sum, s) => sum + s.fleetOwnerProfit, 0);
  
  const averageDriverProfitabilityScore = filteredSettlements.length > 0
    ? filteredSettlements.reduce((sum, s) => sum + s.driverProfitabilityScore, 0) / filteredSettlements.length
    : 0;
  
  const totalSettlements = filteredSettlements.length;
  const completedPackets = filteredSettlements.filter(s => s.settlementPacketComplete).length;
  const approvedSettlements = filteredSettlements.filter(s => s.settlementStatus === 'Approved').length;
  
  // Calculate holds for this period
  let relevantHolds = holds;
  if (options.weekEnding) {
    relevantHolds = relevantHolds.filter(h => h.weekEnding === options.weekEnding);
  }
  if (options.driverId) {
    relevantHolds = relevantHolds.filter(h => h.driverId === options.driverId);
  }
  
  const totalHolds = relevantHolds.length;
  const totalHoldAmount = relevantHolds.reduce((sum, h) => sum + h.holdAmount, 0);
  
  return {
    totalGrossPay,
    totalNetPay,
    totalDeductions,
    totalFleetOwnerProfit,
    averageDriverProfitabilityScore,
    totalSettlements,
    completedPackets,
    approvedSettlements,
    totalHolds,
    totalHoldAmount,
  };
}

/**
 * Get driver settlement summary
 */
export async function getDriverSettlementSummary(driverId: string): Promise<{
  driverId: string;
  driverName: string;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  totalFleetOwnerProfit: number;
  averageProfitabilityScore: number;
  recentWeeks: number;
  completedPackets: number;
  approvedSettlements: number;
  openHolds: number;
  totalHoldAmount: number;
  lastSettlementWeek: string | null;
  lastApprovalDate: string | null;
}> {
  const settlements = await getSettlementsForDriver(driverId);
  const holds = await getSettlementHolds();
  const driverHolds = holds.filter(h => h.driverId === driverId);
  
  const totalGrossPay = settlements.reduce((sum, s) => sum + s.grossPay, 0);
  const totalNetPay = settlements.reduce((sum, s) => sum + s.netPay, 0);
  const totalDeductions = settlements.reduce((sum, s) => sum + s.totalDeductions, 0);
  const totalFleetOwnerProfit = settlements.reduce((sum, s) => sum + s.fleetOwnerProfit, 0);
  
  const averageProfitabilityScore = settlements.length > 0
    ? settlements.reduce((sum, s) => sum + s.driverProfitabilityScore, 0) / settlements.length
    : 0;
  
  const completedPackets = settlements.filter(s => s.settlementPacketComplete).length;
  const approvedSettlements = settlements.filter(s => s.settlementStatus === 'Approved').length;
  const openHolds = driverHolds.filter(h => h.status === 'Open').length;
  const totalHoldAmount = driverHolds.reduce((sum, h) => sum + h.holdAmount, 0);
  
  // Sort settlements by week to get most recent
  const sortedSettlements = settlements.sort((a, b) => b.weekEnding.localeCompare(a.weekEnding));
  const lastSettlementWeek = sortedSettlements.length > 0 ? sortedSettlements[0].weekEnding : null;
  const lastApprovalDate = sortedSettlements.length > 0 ? sortedSettlements[0].settlementApprovalTimestamp : null;
  
  return {
    driverId,
    driverName: settlements.length > 0 ? settlements[0].driverName : '',
    totalGrossPay,
    totalNetPay,
    totalDeductions,
    totalFleetOwnerProfit,
    averageProfitabilityScore,
    recentWeeks: settlements.length,
    completedPackets,
    approvedSettlements,
    openHolds,
    totalHoldAmount,
    lastSettlementWeek,
    lastApprovalDate,
  };
}

/**
 * Get settlement comparison data for multiple drivers
 */
export async function getDriverSettlementComparison(driverIds?: string[]): Promise<{
  driverId: string;
  driverName: string;
  totalGrossPay: number;
  totalNetPay: number;
  profitabilityScore: number;
  completedPackets: number;
  openHolds: number;
  trend: 'up' | 'down' | 'stable';
}[]> {
  const settlements = await getWeeklySettlements();
  const holds = await getSettlementHolds();
  
  // If no driver IDs specified, get all unique drivers
  if (!driverIds) {
    driverIds = [...new Set(settlements.map(s => s.driverId))];
  }
  
  const comparison = await Promise.all(
    driverIds.map(async (driverId) => {
      const driverSettlements = settlements.filter(s => s.driverId === driverId);
      const driverHolds = holds.filter(h => h.driverId === driverId && h.status === 'Open');
      
      const totalGrossPay = driverSettlements.reduce((sum, s) => sum + s.grossPay, 0);
      const totalNetPay = driverSettlements.reduce((sum, s) => sum + s.netPay, 0);
      const profitabilityScore = driverSettlements.length > 0
        ? driverSettlements.reduce((sum, s) => sum + s.driverProfitabilityScore, 0) / driverSettlements.length
        : 0;
      
      const completedPackets = driverSettlements.filter(s => s.settlementPacketComplete).length;
      const openHolds = driverHolds.length;
      
      // Calculate trend based on last 4 weeks vs previous 4 weeks
      const weeks = await getSettlementWeeks();
      const recentWeeks = weeks.slice(0, 4);
      const previousWeeks = weeks.slice(4, 8);
      
      const recentSettlements = driverSettlements.filter(s => recentWeeks.includes(s.weekEnding));
      const previousSettlements = driverSettlements.filter(s => previousWeeks.includes(s.weekEnding));
      
      const recentAvg = recentSettlements.length > 0 
        ? recentSettlements.reduce((sum, s) => sum + s.netPay, 0) / recentSettlements.length 
        : 0;
      const previousAvg = previousSettlements.length > 0 
        ? previousSettlements.reduce((sum, s) => sum + s.netPay, 0) / previousSettlements.length 
        : 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentAvg > previousAvg * 1.05) trend = 'up';
      else if (recentAvg < previousAvg * 0.95) trend = 'down';
      
      return {
        driverId,
        driverName: driverSettlements.length > 0 ? driverSettlements[0].driverName : '',
        totalGrossPay,
        totalNetPay,
        profitabilityScore,
        completedPackets,
        openHolds,
        trend,
      };
    })
  );
  
  return comparison.sort((a, b) => b.totalNetPay - a.totalNetPay);
}

/**
 * Get weekly trend data
 */
export async function getWeeklyTrendData(weeks: number = 8): Promise<{
  weekEnding: string;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  fleetOwnerProfit: number;
  averageProfitabilityScore: number;
  settlementCount: number;
  holdCount: number;
}[]> {
  const settlementWeeks = await getSettlementWeeks();
  const selectedWeeks = settlementWeeks.slice(0, weeks);
  const holds = await getSettlementHolds();
  
  const trendData = await Promise.all(
    selectedWeeks.map(async (weekEnding) => {
      const weekSettlements = await getSettlementsForWeek(weekEnding);
      const weekHolds = holds.filter(h => h.weekEnding === weekEnding);
      
      const totalGrossPay = weekSettlements.reduce((sum, s) => sum + s.grossPay, 0);
      const totalNetPay = weekSettlements.reduce((sum, s) => sum + s.netPay, 0);
      const totalDeductions = weekSettlements.reduce((sum, s) => sum + s.totalDeductions, 0);
      const fleetOwnerProfit = weekSettlements.reduce((sum, s) => sum + s.fleetOwnerProfit, 0);
      
      const averageProfitabilityScore = weekSettlements.length > 0
        ? weekSettlements.reduce((sum, s) => sum + s.driverProfitabilityScore, 0) / weekSettlements.length
        : 0;
      
      return {
        weekEnding,
        totalGrossPay,
        totalNetPay,
        totalDeductions,
        fleetOwnerProfit,
        averageProfitabilityScore,
        settlementCount: weekSettlements.length,
        holdCount: weekHolds.length,
      };
    })
  );
  
  return trendData;
}

/**
 * Get settlements that need review
 */
export async function getSettlementsNeedingReview(): Promise<{
  weekEnding: string;
  driverId: string;
  driverName: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  actionRequired: string;
}[]> {
  const settlements = await getWeeklySettlements();
  const holds = await getSettlementHolds();
  
  const issues: {
    weekEnding: string;
    driverId: string;
    driverName: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    actionRequired: string;
  }[] = [];
  
  // Check for settlements with holds
  for (const hold of holds.filter(h => h.status === 'Open')) {
    const settlement = settlements.find(s => s.driverId === hold.driverId && s.weekEnding === hold.weekEnding);
    if (settlement) {
      issues.push({
        weekEnding: hold.weekEnding,
        driverId: hold.driverId,
        driverName: settlement.driverName,
        issue: `Settlement hold: ${hold.holdReason}`,
        severity: hold.holdAmount > 1000 ? 'high' : hold.holdAmount > 500 ? 'medium' : 'low',
        actionRequired: `Review ${hold.relatedModule} issue: ${hold.relatedEventId}`,
      });
    }
  }
  
  // Check for incomplete packets
  for (const settlement of settlements.filter(s => !s.settlementPacketComplete)) {
    issues.push({
      weekEnding: settlement.weekEnding,
      driverId: settlement.driverId,
      driverName: settlement.driverName,
      issue: 'Settlement packet incomplete',
      severity: 'medium',
      actionRequired: 'Complete required documents for settlement packet',
    });
  }
  
  // Check for unapproved settlements
  for (const settlement of settlements.filter(s => s.settlementStatus !== 'Approved')) {
    issues.push({
      weekEnding: settlement.weekEnding,
      driverId: settlement.driverId,
      driverName: settlement.driverName,
      issue: `Settlement status: ${settlement.settlementStatus}`,
      severity: 'high',
      actionRequired: 'Approve settlement for payment processing',
    });
  }
  
  return issues.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}
