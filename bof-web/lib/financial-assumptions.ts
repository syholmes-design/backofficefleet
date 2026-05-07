// Financial assumptions for Fleet Financials module
// These are default values that can be overridden by user input

export interface FinancialAssumptions {
  // Fuel assumptions
  fuelPricePerGallon: number;
  mpg: number;
  
  // Factoring assumptions
  factoringFeePercent: number;
  advanceRatePercent: number;
  reserveHoldbackPercent: number;
  collectionDays: number;
  
  // Cost allocations
  maintenanceReservePerMile: number;
  insuranceAllocationPerLoad: number;
  tractorDebtAllocationPerLoad: number;
  trailerDebtAllocationPerLoad: number;
  adminOverheadPercent: number;
  depreciationPerLoad: number;
  
  // Revenue assumptions
  defaultDetentionRate: number;
  defaultLayoverRate: number;
  defaultTonuRate: number;
}

export const DEFAULT_FINANCIAL_ASSUMPTIONS: FinancialAssumptions = {
  // Fuel assumptions
  fuelPricePerGallon: 4.25,
  mpg: 6.5,
  
  // Factoring assumptions
  factoringFeePercent: 0.03, // 3%
  advanceRatePercent: 0.90, // 90%
  reserveHoldbackPercent: 0.10, // 10%
  collectionDays: 30,
  
  // Cost allocations
  maintenanceReservePerMile: 0.15,
  insuranceAllocationPerLoad: 150,
  tractorDebtAllocationPerLoad: 200,
  trailerDebtAllocationPerLoad: 100,
  adminOverheadPercent: 0.05, // 5%
  depreciationPerLoad: 75,
  
  // Revenue assumptions
  defaultDetentionRate: 50,
  defaultLayoverRate: 100,
  defaultTonuRate: 250,
};

export interface LoadSpecificAssumptions {
  // Revenue overrides
  linehaulRevenue?: number;
  fuelSurcharge?: number;
  accessorialRevenue?: number;
  detention?: number;
  layover?: number;
  tonu?: number;
  lumperReimbursement?: number;
  otherRevenue?: number;
  
  // Driver/settlement overrides
  driverPayAmount?: number;
  ownerOperatorSettlementPercent?: number;
  reimbursements?: number;
  deductions?: number;
  
  // Fuel overrides
  loadedMiles?: number;
  emptyMiles?: number;
  actualFuelCost?: number;
  
  // Factoring overrides
  factoringFeePercent?: number;
  advanceRatePercent?: number;
  reserveHoldbackPercent?: number;
  daysOutstanding?: number;
  invoiceCollected?: boolean;
  cashReceived?: number;
  
  // Asset/debt overrides
  tractorAssigned?: string;
  trailerAssigned?: string;
  monthlyTractorPayment?: number;
  monthlyTrailerPayment?: number;
  insurancePerMonth?: number;
  
  // Other cost overrides
  tolls?: number;
  lumperPaid?: number;
  repairs?: number;
  claims?: number;
  adminOverheadAmount?: number;
}

export function mergeAssumptions(
  baseAssumptions: FinancialAssumptions,
  loadSpecific: LoadSpecificAssumptions
): FinancialAssumptions & LoadSpecificAssumptions {
  return {
    ...baseAssumptions,
    ...loadSpecific,
  };
}

export function validateAssumptions(assumptions: FinancialAssumptions): string[] {
  const errors: string[] = [];
  
  if (assumptions.fuelPricePerGallon <= 0) {
    errors.push('Fuel price per gallon must be greater than 0');
  }
  
  if (assumptions.mpg <= 0) {
    errors.push('MPG must be greater than 0');
  }
  
  if (assumptions.factoringFeePercent < 0 || assumptions.factoringFeePercent > 1) {
    errors.push('Factoring fee percent must be between 0 and 100%');
  }
  
  if (assumptions.advanceRatePercent < 0 || assumptions.advanceRatePercent > 1) {
    errors.push('Advance rate percent must be between 0 and 100%');
  }
  
  if (assumptions.reserveHoldbackPercent < 0 || assumptions.reserveHoldbackPercent > 1) {
    errors.push('Reserve holdback percent must be between 0 and 100%');
  }
  
  if (assumptions.adminOverheadPercent < 0 || assumptions.adminOverheadPercent > 1) {
    errors.push('Admin overhead percent must be between 0 and 100%');
  }
  
  return errors;
}
