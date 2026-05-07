import type { BofData } from '@/lib/load-bof-data';
import { DEFAULT_FINANCIAL_ASSUMPTIONS } from './financial-assumptions';

// Re-export for convenience
export { DEFAULT_FINANCIAL_ASSUMPTIONS };
import { buildLoadFinancials, LoadFinancials } from './load-profitability';

export interface FleetFinancialOverview {
  totalLoadRevenue: number;
  totalAccessorialRevenue: number;
  totalDriverSettlements: number;
  totalFuelCost: number;
  totalFactoringFees: number;
  totalMaintenanceAllocation: number;
  totalInsuranceAllocation: number;
  totalDebtAllocation: number;
  netOperatingContribution: number;
  contributionMargin: number;
  cashCollected: number;
  cashOutstanding: number;
}

export interface FleetPnlPreview {
  revenue: {
    freightRevenue: number;
    accessorialRevenue: number;
    totalRevenue: number;
  };
  operatingCosts: {
    driverSettlements: number;
    fuel: number;
    factoringFees: number;
    tollsAndLumper: number;
    maintenanceAllocation: number;
    insuranceAllocation: number;
    debtServiceAllocation: number;
    overheadAllocation: number;
  };
  result: {
    netOperatingContribution: number;
    contributionMargin: number;
  };
}

export interface CashFlowForecast {
  period: '7-days' | '14-days' | '30-days';
  expectedCashIn: number;
  expectedCashOut: number;
  netCashPosition: number;
  breakdown: {
    invoiceAdvances: number;
    reserveReleases: number;
    newInvoices: number;
    payrollDue: number;
    fuelCardDue: number;
    insuranceDue: number;
    debtPaymentsDue: number;
  };
}

export interface AssetDebtScheduleItem {
  assetUnit: string;
  assignedDriver: string;
  loadCount: number;
  monthlyPayment: number;
  insuranceAllocation: number;
  maintenanceReserve: number;
  revenueGenerated: number;
  contributionAfterAllocation: number;
  reviewStatus: 'Good' | 'Review' | 'Concern';
}

export interface ActualsVsAssumptionsComparison {
  category: string;
  estimated: number;
  actual: number | null;
  variance: number | null;
  variancePercent: number | null;
}

export function buildFleetFinancials(
  data: BofData,
  assumptions = DEFAULT_FINANCIAL_ASSUMPTIONS
): {
  overview: FleetFinancialOverview;
  loadFinancials: LoadFinancials[];
  pnlPreview: FleetPnlPreview;
  cashFlowForecast: CashFlowForecast[];
  assetDebtSchedule: AssetDebtScheduleItem[];
  actualsVsAssumptions: ActualsVsAssumptionsComparison[];
} {
  // Build load-level financials
  const loadFinancials = data.loads.map(load => {
    const driver = data.drivers.find(d => d.id === load.driverId);
    const settlement = data.settlements.find(s => s.driverId === load.driverId);
    return buildLoadFinancials(load, driver, settlement, assumptions);
  });

  // Calculate fleet overview
  const overview = calculateFleetOverview(loadFinancials);

  // Build P&L preview
  const pnlPreview = buildFleetPnlPreview(loadFinancials);

  // Build cash flow forecast
  const cashFlowForecast = buildCashFlowForecast(loadFinancials, assumptions);

  // Build asset & debt schedule
  const assetDebtSchedule = buildAssetDebtSchedule(data, loadFinancials, assumptions);

  // Build actuals vs assumptions comparison
  const actualsVsAssumptions = buildActualsVsAssumptionsComparison(loadFinancials);

  return {
    overview,
    loadFinancials,
    pnlPreview,
    cashFlowForecast,
    assetDebtSchedule,
    actualsVsAssumptions,
  };
}

export function calculateFleetOverview(loadFinancials: LoadFinancials[]): FleetFinancialOverview {
  const totals = loadFinancials.reduce(
    (acc, load) => ({
      totalLoadRevenue: acc.totalLoadRevenue + load.revenue.linehaulRevenue,
      totalAccessorialRevenue: acc.totalAccessorialRevenue + (
        load.revenue.fuelSurcharge + load.revenue.accessorialRevenue + load.revenue.detention + 
        load.revenue.layover + load.revenue.tonu + load.revenue.lumperReimbursement + load.revenue.otherRevenue
      ),
      totalDriverSettlements: acc.totalDriverSettlements + load.costs.driverSettlement,
      totalFuelCost: acc.totalFuelCost + load.costs.fuelCost,
      totalFactoringFees: acc.totalFactoringFees + load.costs.factoringFee,
      totalMaintenanceAllocation: acc.totalMaintenanceAllocation + load.costs.maintenanceAllocation,
      totalInsuranceAllocation: acc.totalInsuranceAllocation + load.costs.insuranceAllocation,
      totalDebtAllocation: acc.totalDebtAllocation + load.costs.tractorDebtAllocation + load.costs.trailerDebtAllocation,
      cashCollected: acc.cashCollected + load.cashCollected,
      cashOutstanding: acc.cashOutstanding + load.cashOutstanding,
    }),
    {
      totalLoadRevenue: 0,
      totalAccessorialRevenue: 0,
      totalDriverSettlements: 0,
      totalFuelCost: 0,
      totalFactoringFees: 0,
      totalMaintenanceAllocation: 0,
      totalInsuranceAllocation: 0,
      totalDebtAllocation: 0,
      cashCollected: 0,
      cashOutstanding: 0,
    }
  );

  const totalRevenue = totals.totalLoadRevenue + totals.totalAccessorialRevenue;
  const totalCosts = totals.totalDriverSettlements + totals.totalFuelCost + totals.totalFactoringFees + 
                   totals.totalMaintenanceAllocation + totals.totalInsuranceAllocation + totals.totalDebtAllocation;
  const netOperatingContribution = totalRevenue - totalCosts;
  const contributionMargin = totalRevenue > 0 ? netOperatingContribution / totalRevenue : 0;

  return {
    ...totals,
    netOperatingContribution,
    contributionMargin,
  };
}

export function buildFleetPnlPreview(loadFinancials: LoadFinancials[]): FleetPnlPreview {
  const revenue = loadFinancials.reduce(
    (acc, load) => ({
      freightRevenue: acc.freightRevenue + load.revenue.linehaulRevenue,
      accessorialRevenue: acc.accessorialRevenue + (
        load.revenue.fuelSurcharge + load.revenue.accessorialRevenue + load.revenue.detention + 
        load.revenue.layover + load.revenue.tonu + load.revenue.lumperReimbursement + load.revenue.otherRevenue
      ),
    }),
    { freightRevenue: 0, accessorialRevenue: 0 }
  );

  const operatingCosts = loadFinancials.reduce(
    (acc, load) => ({
      driverSettlements: acc.driverSettlements + load.costs.driverSettlement,
      fuel: acc.fuel + load.costs.fuelCost,
      factoringFees: acc.factoringFees + load.costs.factoringFee,
      tollsAndLumper: acc.tollsAndLumper + load.costs.tolls + load.costs.lumperPaid,
      maintenanceAllocation: acc.maintenanceAllocation + load.costs.maintenanceAllocation,
      insuranceAllocation: acc.insuranceAllocation + load.costs.insuranceAllocation,
      debtServiceAllocation: acc.debtServiceAllocation + load.costs.tractorDebtAllocation + load.costs.trailerDebtAllocation,
      overheadAllocation: acc.overheadAllocation + load.costs.adminOverheadAllocation,
    }),
    {
      driverSettlements: 0,
      fuel: 0,
      factoringFees: 0,
      tollsAndLumper: 0,
      maintenanceAllocation: 0,
      insuranceAllocation: 0,
      debtServiceAllocation: 0,
      overheadAllocation: 0,
    }
  );

  const totalRevenue = revenue.freightRevenue + revenue.accessorialRevenue;
  const totalOperatingCosts = Object.values(operatingCosts).reduce((sum, cost) => sum + cost, 0);
  const netOperatingContribution = totalRevenue - totalOperatingCosts;
  const contributionMargin = totalRevenue > 0 ? netOperatingContribution / totalRevenue : 0;

  return {
    revenue: {
      ...revenue,
      totalRevenue,
    },
    operatingCosts,
    result: {
      netOperatingContribution,
      contributionMargin,
    },
  };
}

export function buildCashFlowForecast(
  loadFinancials: LoadFinancials[],
  assumptions: typeof DEFAULT_FINANCIAL_ASSUMPTIONS
): CashFlowForecast[] {
  const periods: Array<'7-days' | '14-days' | '30-days'> = ['7-days', '14-days', '30-days'];
  
  return periods.map(period => {
    const days = period === '7-days' ? 7 : period === '14-days' ? 14 : 30;
    
    // Calculate expected cash in
    const outstandingLoads = loadFinancials.filter(load => load.cashOutstanding > 0);
    const expectedAdvances = outstandingLoads.reduce(
      (sum, load) => sum + (load.revenue.totalRevenue * assumptions.advanceRatePercent * (days / assumptions.collectionDays)),
      0
    );
    
    const expectedReserveReleases = outstandingLoads.reduce(
      (sum, load) => sum + (load.revenue.totalRevenue * assumptions.reserveHoldbackPercent * (days / assumptions.collectionDays)),
      0
    );
    
    const expectedCashIn = expectedAdvances + expectedReserveReleases;
    
    // Calculate expected cash out
    const expectedCashOut = 
      (loadFinancials.length * 1000) + // Estimated payroll
      (loadFinancials.length * 500) +  // Estimated fuel card
      (loadFinancials.length * 200) +  // Estimated insurance
      (loadFinancials.length * 300);   // Estimated debt payments
    
    return {
      period,
      expectedCashIn,
      expectedCashOut,
      netCashPosition: expectedCashIn - expectedCashOut,
      breakdown: {
        invoiceAdvances: expectedAdvances,
        reserveReleases: expectedReserveReleases,
        newInvoices: 0, // Would be calculated based on new loads
        payrollDue: loadFinancials.length * 1000,
        fuelCardDue: loadFinancials.length * 500,
        insuranceDue: loadFinancials.length * 200,
        debtPaymentsDue: loadFinancials.length * 300,
      },
    };
  });
}

export function buildAssetDebtSchedule(
  data: BofData,
  loadFinancials: LoadFinancials[],
  assumptions: typeof DEFAULT_FINANCIAL_ASSUMPTIONS
): AssetDebtScheduleItem[] {
  // Group loads by asset
  const assetGroups = loadFinancials.reduce((acc, load) => {
    const assetId = load.tractorId;
    if (!acc[assetId]) {
      acc[assetId] = {
        assetId,
        loads: [],
        driverName: load.driverName,
      };
    }
    acc[assetId].loads.push(load);
    return acc;
  }, {} as Record<string, { assetId: string; loads: LoadFinancials[]; driverName: string }>);

  return Object.values(assetGroups).map(group => {
    const totalRevenue = group.loads.reduce((sum, load) => sum + load.revenue.totalRevenue, 0);
    const totalContribution = group.loads.reduce((sum, load) => sum + load.netContribution, 0);
    const loadCount = group.loads.length;
    
    const monthlyPayment = assumptions.tractorDebtAllocationPerLoad * loadCount;
    const insuranceAllocation = assumptions.insuranceAllocationPerLoad * loadCount;
    const maintenanceReserve = assumptions.maintenanceReservePerMile * 1000 * loadCount; // Assume 1000 miles per load
    
    const contributionAfterAllocation = totalContribution - monthlyPayment - insuranceAllocation - maintenanceReserve;
    
    const reviewStatus = contributionAfterAllocation > 0 ? 'Good' : contributionAfterAllocation > -500 ? 'Review' : 'Concern';

    return {
      assetUnit: group.assetId,
      assignedDriver: group.driverName,
      loadCount,
      monthlyPayment,
      insuranceAllocation,
      maintenanceReserve,
      revenueGenerated: totalRevenue,
      contributionAfterAllocation,
      reviewStatus,
    };
  });
}

export function buildActualsVsAssumptionsComparison(loadFinancials: LoadFinancials[]): ActualsVsAssumptionsComparison[] {
  // Aggregate totals across all loads
  const totals = loadFinancials.reduce(
    (acc, load) => ({
      revenue: acc.revenue + load.revenue.totalRevenue,
      driverSettlement: acc.driverSettlement + load.costs.driverSettlement,
      fuel: acc.fuel + load.costs.fuelCost,
      factoringFee: acc.factoringFee + load.costs.factoringFee,
      maintenance: acc.maintenance + load.costs.maintenanceAllocation,
      insurance: acc.insurance + load.costs.insuranceAllocation,
      debt: acc.debt + load.costs.tractorDebtAllocation + load.costs.trailerDebtAllocation,
      overhead: acc.overhead + load.costs.adminOverheadAllocation,
      netContribution: acc.netContribution + load.netContribution,
    }),
    {
      revenue: 0,
      driverSettlement: 0,
      fuel: 0,
      factoringFee: 0,
      maintenance: 0,
      insurance: 0,
      debt: 0,
      overhead: 0,
      netContribution: 0,
    }
  );

  // Build comparison table
  const categories = [
    { key: 'revenue', label: 'Revenue' },
    { key: 'driverSettlement', label: 'Driver Settlement' },
    { key: 'fuel', label: 'Fuel' },
    { key: 'factoringFee', label: 'Factoring Fee' },
    { key: 'maintenance', label: 'Maintenance Allocation' },
    { key: 'insurance', label: 'Insurance Allocation' },
    { key: 'debt', label: 'Debt Allocation' },
    { key: 'overhead', label: 'Overhead' },
    { key: 'netContribution', label: 'Net Contribution' },
  ];

  return categories.map(category => {
    const estimated = totals[category.key as keyof typeof totals];
    const actual = null; // Would come from actual data
    const variance = actual !== null ? actual - estimated : null;
    const variancePercent = variance !== null && estimated !== 0 ? variance / estimated : null;

    return {
      category: category.label,
      estimated,
      actual,
      variance,
      variancePercent,
    };
  });
}
