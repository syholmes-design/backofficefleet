
// Define types based on demo-data.json structure
export interface Load {
  id: string;
  number: string;
  driverId: string;
  assetId: string;
  origin: string;
  destination: string;
  revenue: number;
  backhaulPay: number;
  status: string;
  podStatus: string;
  pickupSeal: string;
  deliverySeal: string;
  sealStatus: string;
  dispatchExceptionFlag: boolean;
  masterAgreementId?: string;
  masterAgreementDate?: string;
  workOrderId?: string;
}

export interface Driver {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  workerType?: string;
}

export interface Settlement {
  driverId: string;
  photoUrl: string;
  settlementId: string;
  exportStatus: string;
  settlementUrl: string;
  settlementDocStatus: string;
  bofGeneratedStatus: string;
  loadProofStatus: string;
  claimRfidNotes: string;
  baseEarnings: number;
  backhaulPay: number;
  safetyBonus: number;
  grossPay: number;
  fica: number;
  oasdi: number;
  federalWithholding: number;
  stateWithholding: number;
  sdi: number;
  fmLeave: number;
  familySupport: number;
  insurancePremiums: number;
  creditUnionSavingsClub: number;
  contribution401k: number;
  hsaFsaHealthDeduction: number;
  advanceRepayment?: number;
  reimbursement?: number;
  totalDeductions: number;
  netPay: number;
  status: string;
  pendingReason: string;
  rate401k: string;
}

import type { BofData } from './load-bof-data';
import { 
  calculateDriverPayOrSettlement,
  DEFAULT_DRIVER_PAY_ASSUMPTIONS,
  type DriverPayAssumptions
} from './driver-pay-settlement-methods';

import { FinancialAssumptions, LoadSpecificAssumptions, mergeAssumptions } from './financial-assumptions';

export interface LoadRevenue {
  linehaulRevenue: number;
  fuelSurcharge: number;
  accessorialRevenue: number;
  detention: number;
  layover: number;
  tonu: number;
  lumperReimbursement: number;
  otherRevenue: number;
  totalRevenue: number;
}

export interface LoadCosts {
  driverSettlement: number;
  fuelCost: number;
  tolls: number;
  lumperPaid: number;
  repairs: number;
  factoringFee: number;
  maintenanceAllocation: number;
  insuranceAllocation: number;
  tractorDebtAllocation: number;
  trailerDebtAllocation: number;
  depreciationAllocation: number;
  adminOverheadAllocation: number;
  totalCosts: number;
}

export interface LoadFinancials {
  loadId: string;
  loadNumber: string;
  driverId: string;
  driverName: string;
  workerType: string;
  tractorId: string;
  trailerId: string;
  status: string;
  customer: string;
  
  // Revenue
  revenue: LoadRevenue;
  
  // Costs
  costs: LoadCosts;
  
  // Results
  netContribution: number;
  contributionMargin: number; // percentage
  cashCollected: number;
  cashOutstanding: number;
  invoiceReadiness: 'Ready' | 'Blocked by proof' | 'Factored' | 'Pending';
  factoringStatus: string;
  
  // Assumptions used
  assumptions: FinancialAssumptions & LoadSpecificAssumptions;
  
  // Actual vs Assumed tracking
  actualsVsAssumptions: {
    [key: string]: {
      actual: number | null;
      assumed: number;
      variance: number | null;
    };
  };
}

export function calculateLoadRevenue(
  load: Load,
  assumptions: FinancialAssumptions & LoadSpecificAssumptions
): LoadRevenue {
  const linehaulRevenue = assumptions.linehaulRevenue ?? load.revenue ?? 0;
  const fuelSurcharge = assumptions.fuelSurcharge ?? 0;
  const accessorialRevenue = assumptions.accessorialRevenue ?? 0;
  const detention = assumptions.detention ?? assumptions.defaultDetentionRate ?? 0;
  const layover = assumptions.layover ?? assumptions.defaultLayoverRate ?? 0;
  const tonu = assumptions.tonu ?? assumptions.defaultTonuRate ?? 0;
  const lumperReimbursement = assumptions.lumperReimbursement ?? 0;
  const otherRevenue = assumptions.otherRevenue ?? 0;

  return {
    linehaulRevenue,
    fuelSurcharge,
    accessorialRevenue,
    detention,
    layover,
    tonu,
    lumperReimbursement,
    otherRevenue,
    totalRevenue: linehaulRevenue + fuelSurcharge + accessorialRevenue + detention + layover + tonu + lumperReimbursement + otherRevenue,
  };
}

export function buildLoadCosts(
  driver: Driver | undefined,
  asset: { id: string; number: string; type: string; status: string } | undefined,
  settlement: Settlement | undefined,
  revenue: LoadRevenue,
  data: BofData,
  assumptions: FinancialAssumptions,
  driverPayAssumptions: DriverPayAssumptions = DEFAULT_DRIVER_PAY_ASSUMPTIONS
): LoadCosts {
  // Driver settlement using new pay/settlement methods
  let driverSettlement = 0;
  if (driver) {
    const loadMiles = {
      loadedMiles: 450, // Demo assumption - would come from actual data
      emptyMiles: 50,  // Demo assumption - would come from actual data
      totalMiles: 500, // Demo assumption - would come from actual data
    };
    
    const settlementCalculation = calculateDriverPayOrSettlement(
      driver.id,
      revenue,
      loadMiles,
      data,
      driverPayAssumptions
    );
    
    driverSettlement = settlementCalculation.finalDriverCost;
  }

  // Fuel cost
  let fuelCost = 0;
  const totalMiles = 500; // Demo assumption - would come from actual data
  fuelCost = totalMiles > 0 ? (totalMiles / assumptions.mpg) * assumptions.fuelPricePerGallon : 0;

  // Other costs (demo assumptions)
  const tolls = 50; // Demo assumption
  const lumperPaid = 25; // Demo assumption
  const repairs = 75; // Demo assumption

  // Factoring fee (calculated after revenue is determined)
  const factoringFee = assumptions.factoringFeePercent 
    ? revenue.totalRevenue * assumptions.factoringFeePercent
    : 0;

  // Allocated costs
  const maintenanceAllocation = assumptions.maintenanceReservePerMile * totalMiles;
  const insuranceAllocation = assumptions.insuranceAllocationPerLoad;
  const tractorDebtAllocation = assumptions.tractorDebtAllocationPerLoad;
  const trailerDebtAllocation = assumptions.trailerDebtAllocationPerLoad;
  const depreciationAllocation = assumptions.depreciationPerLoad;
  const adminOverheadAllocation = revenue.totalRevenue * assumptions.adminOverheadPercent;

  return {
    driverSettlement,
    fuelCost,
    tolls,
    lumperPaid,
    repairs,
    factoringFee,
    maintenanceAllocation,
    insuranceAllocation,
    tractorDebtAllocation,
    trailerDebtAllocation,
    depreciationAllocation,
    adminOverheadAllocation,
    totalCosts: driverSettlement + fuelCost + tolls + lumperPaid + repairs + factoringFee + 
                maintenanceAllocation + insuranceAllocation + tractorDebtAllocation + trailerDebtAllocation + 
                depreciationAllocation + adminOverheadAllocation,
  };
}

export function calculateLoadResults(
  revenue: LoadRevenue,
  costs: LoadCosts,
  assumptions: FinancialAssumptions & LoadSpecificAssumptions
): {
  netContribution: number;
  contributionMargin: number;
  cashCollected: number;
  cashOutstanding: number;
  invoiceReadiness: 'Ready' | 'Blocked by proof' | 'Factored' | 'Pending';
  factoringStatus: string;
} {
  const netContribution = revenue.totalRevenue - costs.totalCosts;
  const contributionMargin = revenue.totalRevenue > 0 ? (netContribution / revenue.totalRevenue) : 0;

  // Cash calculations
  let cashCollected = 0;
  let cashOutstanding = 0;
  let invoiceReadiness: 'Ready' | 'Blocked by proof' | 'Factored' | 'Pending' = 'Ready';
  let factoringStatus = 'Not factored';

  if (assumptions.invoiceCollected && assumptions.cashReceived) {
    cashCollected = assumptions.cashReceived;
    cashOutstanding = revenue.totalRevenue - assumptions.cashReceived;
    invoiceReadiness = 'Factored';
    factoringStatus = `Advanced ${assumptions.advanceRatePercent ? (assumptions.advanceRatePercent * 100).toFixed(0) : '90'}%, Reserve ${assumptions.reserveHoldbackPercent ? (assumptions.reserveHoldbackPercent * 100).toFixed(0) : '10'}%`;
  } else if (assumptions.daysOutstanding && assumptions.daysOutstanding > 0) {
    cashOutstanding = revenue.totalRevenue;
    factoringStatus = `Outstanding ${assumptions.daysOutstanding} days`;
  } else {
    invoiceReadiness = 'Ready';
    factoringStatus = 'Ready to invoice';
  }

  return {
    netContribution,
    contributionMargin,
    cashCollected,
    cashOutstanding,
    invoiceReadiness,
    factoringStatus,
  };
}

export function trackActualsVsAssumptions(
  revenue: LoadRevenue,
  costs: LoadCosts,
  assumptions: FinancialAssumptions & LoadSpecificAssumptions
): {
  [key: string]: {
    actual: number | null;
    assumed: number;
    variance: number | null;
  };
} {
  const tracking: {
    [key: string]: {
      actual: number | null;
      assumed: number;
      variance: number | null;
    };
  } = {};

  // Track revenue items
  if (assumptions.linehaulRevenue) {
    tracking.linehaulRevenue = {
      actual: null, // Would come from actual data
      assumed: assumptions.linehaulRevenue,
      variance: null,
    };
  }

  // Track costs
  if (assumptions.actualFuelCost) {
    tracking.fuelCost = {
      actual: assumptions.actualFuelCost,
      assumed: 0, // Calculated from assumptions
      variance: assumptions.actualFuelCost - (0),
    };
  }

  // Track factoring
  if (assumptions.factoringFeePercent) {
    tracking.factoringFee = {
      actual: null,
      assumed: costs.factoringFee,
      variance: null,
    };
  }

  return tracking;
}

export function buildLoadFinancials(
  load: Load,
  driver: Driver | undefined,
  settlement: Settlement | undefined,
  baseAssumptions: FinancialAssumptions,
  loadSpecificAssumptions: LoadSpecificAssumptions = {},
  data: BofData
): LoadFinancials {
  const assumptions = mergeAssumptions(baseAssumptions, loadSpecificAssumptions);
  
  const revenue = calculateLoadRevenue(load, assumptions);
  
  // Update assumptions with calculated revenue for factoring and overhead calculations
  const updatedAssumptions = {
    ...assumptions,
    calculatedRevenue: revenue.totalRevenue,
  };
  
  const asset = { id: load.assetId, number: load.assetId, type: 'Tractor', status: 'Active' };
  const costs = buildLoadCosts(driver, asset, settlement, revenue, data, updatedAssumptions);
  const results = calculateLoadResults(revenue, costs, updatedAssumptions);
  const actualsVsAssumptions = trackActualsVsAssumptions(revenue, costs, updatedAssumptions);

  return {
    loadId: load.id,
    loadNumber: load.number,
    driverId: load.driverId,
    driverName: driver?.name || 'Unknown',
    workerType: driver?.workerType || 'Unknown',
    tractorId: load.assetId || 'Unknown',
    trailerId: 'Unknown', // Would come from asset data
    status: load.status,
    customer: 'Unknown', // Would come from load data
    revenue,
    costs,
    netContribution: results.netContribution,
    contributionMargin: results.contributionMargin,
    cashCollected: results.cashCollected,
    cashOutstanding: results.cashOutstanding,
    invoiceReadiness: results.invoiceReadiness,
    factoringStatus: results.factoringStatus,
    assumptions,
    actualsVsAssumptions,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
