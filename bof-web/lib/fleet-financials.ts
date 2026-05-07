import type { BofData } from '@/lib/load-bof-data';
import { DEFAULT_FINANCIAL_ASSUMPTIONS, DEFAULT_CASH_FLOW_ASSUMPTIONS, DEFAULT_AUDIT_READINESS_ASSUMPTIONS } from './financial-assumptions';

// Re-export for convenience
export { DEFAULT_FINANCIAL_ASSUMPTIONS, DEFAULT_CASH_FLOW_ASSUMPTIONS, DEFAULT_AUDIT_READINESS_ASSUMPTIONS };
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

export interface CashFlowLever {
  id: string;
  name: string;
  status: 'Complete' | 'Pending' | 'Blocked' | 'Needs Review';
  estimatedCashImpact: number;
  relatedLoadId?: string;
  recommendedAction: string;
}

export interface CashFlowMaximization {
  invoiceReadyLoads: number;
  loadsBlockedFromBilling: number;
  estimatedCashDelayedByProof: number;
  factoringAdvanceAvailable: number;
  expectedReserveRelease: number;
  upcomingSettlementObligations: number;
  upcomingFuelInsuranceDebtPayments: number;
  cashFlowLevers: CashFlowLever[];
  netCashPosition: {
    days7: number;
    days14: number;
    days30: number;
  };
}

export interface AuditSupportItem {
  category: string;
  available: boolean;
  missing: boolean;
  needsReview: boolean;
  relatedModule: string;
  action: string;
}

export interface AuditReadinessMetrics {
  loadsWithCompleteProofBundle: number;
  loadsWithFuelMileageSupport: number;
  loadsWithInvoicePodSupport: number;
  assetsWithDebtInsuranceSchedule: number;
  recordsNeedingReview: number;
  auditReadinessScore: number;
  auditSupportChecklist: AuditSupportItem[];
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
  cashFlowMaximization: CashFlowMaximization;
  auditReadinessMetrics: AuditReadinessMetrics;
} {
  // Build load-level financials
  const loadFinancials = data.loads.map(load => {
    const driver = data.drivers.find(d => d.id === load.driverId);
    const settlement = data.settlements.find(s => s.driverId === load.driverId);
    return buildLoadFinancials(load, driver, settlement, assumptions, {}, data);
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

  // Build cash flow maximization
  const cashFlowMaximization = buildCashFlowMaximization(loadFinancials);

  // Build audit readiness metrics
  const auditReadinessMetrics = buildAuditReadinessMetrics(data, loadFinancials, DEFAULT_AUDIT_READINESS_ASSUMPTIONS);

  return {
    overview,
    loadFinancials,
    pnlPreview,
    cashFlowForecast,
    assetDebtSchedule,
    actualsVsAssumptions,
    cashFlowMaximization,
    auditReadinessMetrics,
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
    const totalDriverSettlements = loadFinancials.reduce((sum, load) => sum + load.costs.driverSettlement, 0);
    const expectedCashOut = 
      (totalDriverSettlements * (days / 30)) + // Driver settlements/payroll
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

export function buildCashFlowMaximization(
  loadFinancials: LoadFinancials[]
): CashFlowMaximization {
  const deliveredLoads = loadFinancials.filter(load => load.status === 'Delivered');
  const invoiceReadyLoads = deliveredLoads.filter(load => load.invoiceReadiness === 'Ready');
  const loadsBlockedFromBilling = deliveredLoads.filter(load => load.invoiceReadiness === 'Blocked by proof');
  
  const estimatedCashDelayedByProof = loadsBlockedFromBilling.reduce(
    (sum, load) => sum + load.revenue.totalRevenue, 0
  );
  
  const factoringAdvanceAvailable = invoiceReadyLoads.reduce(
    (sum, load) => sum + (load.revenue.totalRevenue * 0.90), // 90% advance rate
    0
  );
  
  const expectedReserveRelease = loadFinancials.reduce(
    (sum, load) => sum + (load.revenue.totalRevenue * 0.10), // 10% reserve
    0
  );
  
  const upcomingSettlementObligations = loadFinancials.reduce(
    (sum, load) => sum + load.costs.driverSettlement, 0
  );
  
  const upcomingFuelInsuranceDebtPayments = loadFinancials.reduce(
    (sum, load) => sum + load.costs.fuelCost + load.costs.insuranceAllocation + 
                   load.costs.tractorDebtAllocation + load.costs.trailerDebtAllocation,
    0
  );

  // Build cash flow levers
  const cashFlowLevers: CashFlowLever[] = [
    {
      id: 'pod-proof',
      name: 'POD/proof complete',
      status: loadsBlockedFromBilling.length > 0 ? 'Blocked' : 'Complete',
      estimatedCashImpact: estimatedCashDelayedByProof,
      relatedLoadId: loadsBlockedFromBilling[0]?.loadId,
      recommendedAction: loadsBlockedFromBilling.length > 0 ? 'Complete missing POD/proof' : 'All proofs complete'
    },
    {
      id: 'invoice-ready',
      name: 'Invoice ready',
      status: invoiceReadyLoads.length > 0 ? 'Complete' : 'Pending',
      estimatedCashImpact: invoiceReadyLoads.reduce((sum, load) => sum + load.revenue.totalRevenue, 0),
      recommendedAction: 'Review invoice for factoring'
    },
    {
      id: 'factoring-eligible',
      name: 'Factoring eligible',
      status: factoringAdvanceAvailable > 0 ? 'Complete' : 'Pending',
      estimatedCashImpact: factoringAdvanceAvailable,
      recommendedAction: 'Release billing hold'
    },
    {
      id: 'reserve-holdback',
      name: 'Reserve holdback pending',
      status: 'Pending',
      estimatedCashImpact: expectedReserveRelease,
      recommendedAction: 'Confirm settlement approval'
    },
    {
      id: 'settlement-due',
      name: 'Settlement due',
      status: 'Needs Review',
      estimatedCashImpact: upcomingSettlementObligations,
      recommendedAction: 'Review factoring fee/advance assumptions'
    },
    {
      id: 'fuel-card-payment',
      name: 'Fuel card payment due',
      status: 'Pending',
      estimatedCashImpact: loadFinancials.reduce((sum, load) => sum + load.costs.fuelCost, 0),
      recommendedAction: 'Monitor reserve release date'
    },
    {
      id: 'insurance-debt',
      name: 'Insurance/debt allocation due',
      status: 'Pending',
      estimatedCashImpact: upcomingFuelInsuranceDebtPayments,
      recommendedAction: 'Review payment schedules'
    },
    {
      id: 'billing-blocker',
      name: 'Billing blocker',
      status: loadsBlockedFromBilling.length > 0 ? 'Blocked' : 'Complete',
      estimatedCashImpact: estimatedCashDelayedByProof,
      recommendedAction: 'Resolve billing blockers'
    }
  ];

  // Calculate net cash position
  const netCashPosition = {
    days7: factoringAdvanceAvailable - upcomingSettlementObligations - (upcomingFuelInsuranceDebtPayments * 0.25),
    days14: factoringAdvanceAvailable + expectedReserveRelease - upcomingSettlementObligations - (upcomingFuelInsuranceDebtPayments * 0.5),
    days30: factoringAdvanceAvailable + expectedReserveRelease - upcomingSettlementObligations - upcomingFuelInsuranceDebtPayments
  };

  return {
    invoiceReadyLoads: invoiceReadyLoads.length,
    loadsBlockedFromBilling: loadsBlockedFromBilling.length,
    estimatedCashDelayedByProof,
    factoringAdvanceAvailable,
    expectedReserveRelease,
    upcomingSettlementObligations,
    upcomingFuelInsuranceDebtPayments,
    cashFlowLevers,
    netCashPosition
  };
}

export function buildAuditReadinessMetrics(
  data: BofData,
  loadFinancials: LoadFinancials[],
  auditAssumptions: typeof DEFAULT_AUDIT_READINESS_ASSUMPTIONS
): AuditReadinessMetrics {
  const deliveredLoads = loadFinancials.filter(load => load.status === 'Delivered');
  
  const loadsWithCompleteProofBundle = Math.floor(deliveredLoads.length * auditAssumptions.proofBundleCompletenessRate);
  const loadsWithFuelMileageSupport = Math.floor(deliveredLoads.length * auditAssumptions.fuelMileageSupportRate);
  const loadsWithInvoicePodSupport = Math.floor(deliveredLoads.length * auditAssumptions.invoicePodSupportRate);
  
  const assetsWithDebtInsuranceSchedule = Math.floor(data.loads.length * auditAssumptions.assetScheduleCompletenessRate);
  const recordsNeedingReview = Math.floor(deliveredLoads.length * (1 - auditAssumptions.settlementRecordCompletenessRate));
  
  // Calculate audit readiness score
  const totalChecks = 5; // proof, fuel/mileage, invoice/POD, assets, settlements
  const completedChecks = 
    (deliveredLoads.length > 0 ? 1 : 0) +
    (loadsWithFuelMileageSupport > 0 ? 1 : 0) +
    (loadsWithInvoicePodSupport > 0 ? 1 : 0) +
    (assetsWithDebtInsuranceSchedule > 0 ? 1 : 0) +
    (recordsNeedingReview === 0 ? 1 : 0);
  
  const auditReadinessScore = (completedChecks / totalChecks) * 100;

  // Build audit support checklist
  const auditSupportChecklist: AuditSupportItem[] = [
    {
      category: 'Load record',
      available: deliveredLoads.length > 0,
      missing: false,
      needsReview: false,
      relatedModule: 'Dispatch/Loads',
      action: deliveredLoads.length === 0 ? 'Create load records' : 'Verify load data completeness'
    },
    {
      category: 'Route/mileage support',
      available: loadsWithFuelMileageSupport > 0,
      missing: deliveredLoads.length - loadsWithFuelMileageSupport > 0,
      needsReview: false,
      relatedModule: 'Dispatch/Pretrip',
      action: 'Complete mileage documentation for all loads'
    },
    {
      category: 'Fuel cost support',
      available: loadsWithFuelMileageSupport > 0,
      missing: deliveredLoads.length - loadsWithFuelMileageSupport > 0,
      needsReview: recordsNeedingReview > 0,
      relatedModule: 'Fuel/Maintenance',
      action: 'Attach fuel receipts to load records'
    },
    {
      category: 'Toll/lumper support',
      available: true, // Demo assumption
      missing: false,
      needsReview: false,
      relatedModule: 'Settlements',
      action: 'Review toll and lumper documentation'
    },
    {
      category: 'POD/proof bundle',
      available: loadsWithCompleteProofBundle > 0,
      missing: deliveredLoads.length - loadsWithCompleteProofBundle > 0,
      needsReview: recordsNeedingReview > 0,
      relatedModule: 'Documents',
      action: 'Complete proof bundles for outstanding loads'
    },
    {
      category: 'Invoice/receivable record',
      available: loadsWithInvoicePodSupport > 0,
      missing: deliveredLoads.length - loadsWithInvoicePodSupport > 0,
      needsReview: false,
      relatedModule: 'Settlements',
      action: 'Generate missing invoices'
    },
    {
      category: 'Driver settlement support',
      available: true, // Demo assumption
      missing: false,
      needsReview: recordsNeedingReview > 0,
      relatedModule: 'Settlements',
      action: 'Review settlement calculations'
    },
    {
      category: 'Asset/debt allocation support',
      available: assetsWithDebtInsuranceSchedule > 0,
      missing: data.loads.length - assetsWithDebtInsuranceSchedule > 0,
      needsReview: false,
      relatedModule: 'Maintenance',
      action: 'Update asset allocation schedules'
    },
    {
      category: 'Insurance/claim support',
      available: true, // Demo assumption
      missing: false,
      needsReview: false,
      relatedModule: 'Safety',
      action: 'Review insurance documentation'
    },
    {
      category: 'Retention policy linked',
      available: true, // Demo assumption
      missing: false,
      needsReview: false,
      relatedModule: 'Documents',
      action: 'Verify retention policy compliance'
    }
  ];

  return {
    loadsWithCompleteProofBundle,
    loadsWithFuelMileageSupport,
    loadsWithInvoicePodSupport,
    assetsWithDebtInsuranceSchedule,
    recordsNeedingReview,
    auditReadinessScore,
    auditSupportChecklist
  };
}
