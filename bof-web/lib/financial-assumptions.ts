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

export interface CashFlowAssumptions {
  // Cash flow timing
  averageBillingDays: number;
  factoringAdvanceDays: number;
  reserveReleaseDays: number;
  settlementPaymentDays: number;
  fuelCardPaymentDays: number;
  insurancePaymentDays: number;
  debtPaymentDays: number;
  
  // Cash flow optimization
  proofCompletionRate: number;
  invoiceApprovalRate: number;
  factoringUtilizationRate: number;
  earlyPaymentDiscountRate: number;
}

export interface AuditReadinessAssumptions {
  // Document completeness
  proofBundleCompletenessRate: number;
  fuelMileageSupportRate: number;
  invoicePodSupportRate: number;
  assetScheduleCompletenessRate: number;
  settlementRecordCompletenessRate: number;
  
  // Audit timing
  recordRetentionDays: number;
  auditTriggerThreshold: number;
  periodCloseLeadTime: number;
  auditSampleRate: number;
}

export const DEFAULT_CASH_FLOW_ASSUMPTIONS: CashFlowAssumptions = {
  // Cash flow timing
  averageBillingDays: 7,
  factoringAdvanceDays: 2,
  reserveReleaseDays: 30,
  settlementPaymentDays: 7,
  fuelCardPaymentDays: 15,
  insurancePaymentDays: 30,
  debtPaymentDays: 30,
  
  // Cash flow optimization
  proofCompletionRate: 0.85, // 85%
  invoiceApprovalRate: 0.90, // 90%
  factoringUtilizationRate: 0.75, // 75%
  earlyPaymentDiscountRate: 0.02, // 2%
};

export const DEFAULT_AUDIT_READINESS_ASSUMPTIONS: AuditReadinessAssumptions = {
  // Document completeness
  proofBundleCompletenessRate: 0.80, // 80%
  fuelMileageSupportRate: 0.75, // 75%
  invoicePodSupportRate: 0.85, // 85%
  assetScheduleCompletenessRate: 0.90, // 90%
  settlementRecordCompletenessRate: 0.95, // 95%
  
  // Audit timing
  recordRetentionDays: 2555, // 7 years
  auditTriggerThreshold: 100000, // $100k
  periodCloseLeadTime: 5, // 5 days
  auditSampleRate: 0.10, // 10%
};

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
