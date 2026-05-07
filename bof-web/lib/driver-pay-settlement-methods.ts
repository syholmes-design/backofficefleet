import type { BofData } from '@/lib/load-bof-data';

// Define interfaces for driver pay and settlement methods
export type WorkerType = 'Employee Driver' | 'Independent Contractor / Owner-Operator';

export type SettlementMethod = 
  | 'Hourly / Salary'
  | 'Cents per Mile'
  | 'Rate per Mile'
  | 'Percentage of Load Revenue'
  | 'Flat Trip Rate'
  | 'Hybrid';

export interface DriverPaySettlementMethod {
  driverId: string;
  workerType: WorkerType;
  settlementMethod: SettlementMethod;
  
  // Employee driver fields
  hourlyRate?: number;
  centsPerMileRate?: number;
  fixedSettlementOverride?: number;
  employeeReimbursements?: number;
  employeeDeductions?: number;
  familySupportWithholding?: number;
  
  // Owner-operator fields
  loadedMileRate?: number;
  linehaulPercent?: number;
  flatTripRate?: number;
  flatMinimumPerTrip?: number;
  fuelSurchargePassThrough?: boolean;
  accessorialPassThrough?: boolean;
  ownerOperatorDeductions?: number;
  chargebacks?: number;
  ownerOperatorReimbursements?: number;
}

export interface SettlementCalculation {
  basePayOrSettlement: number;
  passThroughItems: {
    fuelSurcharge: number;
    accessorial: number;
    reimbursements: number;
  };
  deductions: {
    payrollDeductions?: number;
    settlementDeductions?: number;
    chargebacks?: number;
    familySupport?: number;
  };
  finalDriverCost: number;
  settlementTerms: string;
}

export interface DriverPayAssumptions {
  // Employee driver assumptions
  employeeCentsPerMileRate: number;
  employeeHourlyRate: number;
  employeeFixedSettlementOverride: number;
  employeeReimbursements: number;
  employeeDeductions: number;
  employeeFamilySupportWithholding: number;
  
  // Owner-operator assumptions
  ownerOperatorLoadedMileRate: number;
  ownerOperatorLinehaulPercent: number;
  ownerOperatorFlatTripRate: number;
  ownerOperatorFlatMinimumPerTrip: number;
  ownerOperatorFuelSurchargePassThrough: boolean;
  ownerOperatorAccessorialPassThrough: boolean;
  ownerOperatorDeductions: number;
  ownerOperatorChargebacks: number;
  ownerOperatorReimbursements: number;
}

export const DEFAULT_DRIVER_PAY_ASSUMPTIONS: DriverPayAssumptions = {
  // Employee driver assumptions
  employeeCentsPerMileRate: 0.65, // $0.65 per mile
  employeeHourlyRate: 25.00, // $25 per hour
  employeeFixedSettlementOverride: 0,
  employeeReimbursements: 50,
  employeeDeductions: 100,
  employeeFamilySupportWithholding: 0,
  
  // Owner-operator assumptions
  ownerOperatorLoadedMileRate: 1.85, // $1.85 per loaded mile
  ownerOperatorLinehaulPercent: 72, // 72% of linehaul revenue
  ownerOperatorFlatTripRate: 500,
  ownerOperatorFlatMinimumPerTrip: 450,
  ownerOperatorFuelSurchargePassThrough: true,
  ownerOperatorAccessorialPassThrough: true,
  ownerOperatorDeductions: 150,
  ownerOperatorChargebacks: 50,
  ownerOperatorReimbursements: 75,
};

// Demo owner-operator settlement methods
export const DEMO_OWNER_OPERATOR_SETTLEMENTS: Record<string, DriverPaySettlementMethod> = {
  'DRV-006': {
    driverId: 'DRV-006',
    workerType: 'Independent Contractor / Owner-Operator',
    settlementMethod: 'Rate per Mile',
    loadedMileRate: 1.85,
    fuelSurchargePassThrough: true,
    accessorialPassThrough: true,
    ownerOperatorDeductions: 150,
    chargebacks: 50,
    ownerOperatorReimbursements: 75,
  },
  'DRV-010': {
    driverId: 'DRV-010',
    workerType: 'Independent Contractor / Owner-Operator',
    settlementMethod: 'Percentage of Load Revenue',
    linehaulPercent: 72,
    fuelSurchargePassThrough: true,
    accessorialPassThrough: true,
    ownerOperatorDeductions: 200,
    chargebacks: 75,
    ownerOperatorReimbursements: 100,
  },
  'DRV-012': {
    driverId: 'DRV-012',
    workerType: 'Independent Contractor / Owner-Operator',
    settlementMethod: 'Hybrid',
    loadedMileRate: 1.65,
    flatMinimumPerTrip: 450,
    fuelSurchargePassThrough: true,
    accessorialPassThrough: true,
    ownerOperatorDeductions: 175,
    chargebacks: 60,
    ownerOperatorReimbursements: 80,
  },
};

export function getDriverPaySettlementMethod(
  driverId: string,
  data: BofData
): DriverPaySettlementMethod {
  // Check if driver has a demo settlement method
  if (DEMO_OWNER_OPERATOR_SETTLEMENTS[driverId]) {
    return DEMO_OWNER_OPERATOR_SETTLEMENTS[driverId];
  }
  
  // Get driver info
  const driver = data.drivers.find(d => d.id === driverId);
  if (!driver) {
    // Return default employee driver method
    return {
      driverId,
      workerType: 'Employee Driver',
      settlementMethod: 'Cents per Mile',
      centsPerMileRate: DEFAULT_DRIVER_PAY_ASSUMPTIONS.employeeCentsPerMileRate,
      employeeReimbursements: DEFAULT_DRIVER_PAY_ASSUMPTIONS.employeeReimbursements,
      employeeDeductions: DEFAULT_DRIVER_PAY_ASSUMPTIONS.employeeDeductions,
    };
  }
  
  // For demo purposes, assume all drivers not in demo settlements are employee drivers
  return {
    driverId,
    workerType: 'Employee Driver',
    settlementMethod: 'Cents per Mile',
    centsPerMileRate: DEFAULT_DRIVER_PAY_ASSUMPTIONS.employeeCentsPerMileRate,
    employeeReimbursements: DEFAULT_DRIVER_PAY_ASSUMPTIONS.employeeReimbursements,
    employeeDeductions: DEFAULT_DRIVER_PAY_ASSUMPTIONS.employeeDeductions,
  };
}

export function isOwnerOperator(driverId: string): boolean {
  const method = DEMO_OWNER_OPERATOR_SETTLEMENTS[driverId];
  return method?.workerType === 'Independent Contractor / Owner-Operator';
}

export function calculateDriverPayOrSettlement(
  driverId: string,
  loadRevenue: {
    linehaulRevenue: number;
    fuelSurcharge: number;
    accessorialRevenue: number;
    detention: number;
    layover: number;
    tonu: number;
    lumperReimbursement: number;
    otherRevenue: number;
  },
  loadMiles: {
    loadedMiles: number;
    emptyMiles: number;
    totalMiles: number;
  },
  data: BofData,
  assumptions: DriverPayAssumptions = DEFAULT_DRIVER_PAY_ASSUMPTIONS
): SettlementCalculation {
  const method = getDriverPaySettlementMethod(driverId, data);
  
  if (method.workerType === 'Independent Contractor / Owner-Operator') {
    return calculateOwnerOperatorSettlement(method, loadRevenue, loadMiles, assumptions);
  } else {
    return calculateEmployeeDriverPay(method, loadRevenue, loadMiles, assumptions);
  }
}

export function calculateOwnerOperatorSettlement(
  method: DriverPaySettlementMethod,
  loadRevenue: {
    linehaulRevenue: number;
    fuelSurcharge: number;
    accessorialRevenue: number;
    detention: number;
    layover: number;
    tonu: number;
    lumperReimbursement: number;
    otherRevenue: number;
  },
  loadMiles: {
    loadedMiles: number;
    emptyMiles: number;
    totalMiles: number;
  },
  assumptions: DriverPayAssumptions
): SettlementCalculation {
  let baseSettlement = 0;
  let settlementTerms = '';
  
  switch (method.settlementMethod) {
    case 'Rate per Mile':
      baseSettlement = loadMiles.loadedMiles * (method.loadedMileRate || assumptions.ownerOperatorLoadedMileRate);
      settlementTerms = `Rate per Mile — $${(method.loadedMileRate || assumptions.ownerOperatorLoadedMileRate).toFixed(2)} per loaded mile`;
      break;
      
    case 'Percentage of Load Revenue':
      baseSettlement = loadRevenue.linehaulRevenue * ((method.linehaulPercent || assumptions.ownerOperatorLinehaulPercent) / 100);
      settlementTerms = `Percentage of Load Revenue — ${(method.linehaulPercent || assumptions.ownerOperatorLinehaulPercent)}% of linehaul`;
      break;
      
    case 'Flat Trip Rate':
      baseSettlement = method.flatTripRate || assumptions.ownerOperatorFlatTripRate;
      settlementTerms = `Flat Trip Rate — $${(method.flatTripRate || assumptions.ownerOperatorFlatTripRate).toFixed(2)} per trip`;
      break;
      
    case 'Hybrid':
      const mileagePay = loadMiles.loadedMiles * (method.loadedMileRate || assumptions.ownerOperatorLoadedMileRate);
      const minimum = method.flatMinimumPerTrip || assumptions.ownerOperatorFlatMinimumPerTrip;
      baseSettlement = Math.max(mileagePay, minimum);
      settlementTerms = `Hybrid — $${(method.loadedMileRate || assumptions.ownerOperatorLoadedMileRate).toFixed(2)} per loaded mile, minimum $${minimum.toFixed(2)}`;
      break;
      
    default:
      baseSettlement = loadMiles.loadedMiles * assumptions.ownerOperatorLoadedMileRate;
      settlementTerms = `Default Rate per Mile — $${assumptions.ownerOperatorLoadedMileRate.toFixed(2)} per loaded mile`;
  }
  
  // Calculate pass-through items
  const fuelSurchargePassThrough = (method.fuelSurchargePassThrough ?? assumptions.ownerOperatorFuelSurchargePassThrough) 
    ? loadRevenue.fuelSurcharge 
    : 0;
    
  const accessorialPassThrough = (method.accessorialPassThrough ?? assumptions.ownerOperatorAccessorialPassThrough)
    ? loadRevenue.accessorialRevenue + loadRevenue.detention + loadRevenue.layover + loadRevenue.tonu
    : 0;
    
  const reimbursements = method.ownerOperatorReimbursements || assumptions.ownerOperatorReimbursements;
  
  // Calculate deductions
  const deductions = method.ownerOperatorDeductions || assumptions.ownerOperatorDeductions;
  const chargebacks = method.chargebacks || assumptions.ownerOperatorChargebacks;
  
  const totalPassThrough = fuelSurchargePassThrough + accessorialPassThrough + reimbursements;
  const totalDeductions = deductions + chargebacks;
  
  const finalSettlement = baseSettlement + totalPassThrough - totalDeductions;
  
  return {
    basePayOrSettlement: baseSettlement,
    passThroughItems: {
      fuelSurcharge: fuelSurchargePassThrough,
      accessorial: accessorialPassThrough,
      reimbursements,
    },
    deductions: {
      settlementDeductions: deductions,
      chargebacks,
    },
    finalDriverCost: finalSettlement,
    settlementTerms: `${settlementTerms}, plus fuel surcharge and approved accessorial pass-through, subject to settlement review and authorized deductions/chargebacks.`,
  };
}

export function calculateEmployeeDriverPay(
  method: DriverPaySettlementMethod,
  loadRevenue: {
    linehaulRevenue: number;
    fuelSurcharge: number;
    accessorialRevenue: number;
    detention: number;
    layover: number;
    tonu: number;
    lumperReimbursement: number;
    otherRevenue: number;
  },
  loadMiles: {
    loadedMiles: number;
    emptyMiles: number;
    totalMiles: number;
  },
  assumptions: DriverPayAssumptions
): SettlementCalculation {
  let basePay = 0;
  let payTerms = '';
  
  switch (method.settlementMethod) {
    case 'Cents per Mile':
      basePay = loadMiles.totalMiles * (method.centsPerMileRate || assumptions.employeeCentsPerMileRate);
      payTerms = `Cents per Mile — $${(method.centsPerMileRate || assumptions.employeeCentsPerMileRate).toFixed(2)} per mile`;
      break;
      
    case 'Hourly / Salary':
      // For demo purposes, assume 8 hours per trip
      const hours = 8;
      basePay = hours * (method.hourlyRate || assumptions.employeeHourlyRate);
      payTerms = `Hourly — $${(method.hourlyRate || assumptions.employeeHourlyRate).toFixed(2)} per hour`;
      break;
      
    default:
      basePay = loadMiles.totalMiles * assumptions.employeeCentsPerMileRate;
      payTerms = `Default Cents per Mile — $${assumptions.employeeCentsPerMileRate.toFixed(2)} per mile`;
  }
  
  // Calculate reimbursements
  const reimbursements = method.employeeReimbursements || assumptions.employeeReimbursements;
  
  // Calculate deductions
  const deductions = method.employeeDeductions || assumptions.employeeDeductions;
  const familySupport = method.familySupportWithholding || assumptions.employeeFamilySupportWithholding;
  
  const totalDeductions = deductions + familySupport;
  
  const finalPay = basePay + reimbursements - totalDeductions;
  
  return {
    basePayOrSettlement: basePay,
    passThroughItems: {
      fuelSurcharge: 0,
      accessorial: 0,
      reimbursements,
    },
    deductions: {
      payrollDeductions: deductions,
      familySupport,
    },
    finalDriverCost: finalPay,
    settlementTerms: `${payTerms}, plus approved reimbursements, subject to payroll deductions.`,
  };
}

export function getSettlementTermsLabel(driverId: string, data: BofData): string {
  const method = getDriverPaySettlementMethod(driverId, data);
  return method.settlementMethod;
}

export function getSettlementMethodBadge(driverId: string, data: BofData): {
  label: string;
  color: string;
} {
  const method = getDriverPaySettlementMethod(driverId, data);
  
  if (method.workerType === 'Independent Contractor / Owner-Operator') {
    return {
      label: method.settlementMethod,
      color: 'purple', // Purple for owner-operators
    };
  } else {
    return {
      label: method.settlementMethod,
      color: 'blue', // Blue for employee drivers
    };
  }
}

export function validateDriverPayAssumptions(assumptions: DriverPayAssumptions): string[] {
  const errors: string[] = [];
  
  // Employee driver validations
  if (assumptions.employeeCentsPerMileRate < 0) {
    errors.push('Employee cents per mile rate must be non-negative');
  }
  
  if (assumptions.employeeHourlyRate < 0) {
    errors.push('Employee hourly rate must be non-negative');
  }
  
  // Owner-operator validations
  if (assumptions.ownerOperatorLoadedMileRate < 0) {
    errors.push('Owner-operator loaded mile rate must be non-negative');
  }
  
  if (assumptions.ownerOperatorLinehaulPercent < 0 || assumptions.ownerOperatorLinehaulPercent > 100) {
    errors.push('Owner-operator linehaul percent must be between 0 and 100');
  }
  
  if (assumptions.ownerOperatorFlatTripRate < 0) {
    errors.push('Owner-operator flat trip rate must be non-negative');
  }
  
  if (assumptions.ownerOperatorFlatMinimumPerTrip < 0) {
    errors.push('Owner-operator flat minimum per trip must be non-negative');
  }
  
  return errors;
}
