import type { BofData } from '@/lib/load-bof-data';

// Define interfaces for fuel/excise tax support
export interface FuelExciseAssumptions {
  mpg: number;
  taxableMileagePercentage: number;
  jurisdictionalAllocationMethod: 'proportional' | 'primary' | 'manual';
  fuelPricePerGallon: number;
  jurisdictionTaxRates: Record<string, number>; // Tax rates by state/jurisdiction
  receiptSupportAvailable: boolean;
  excludeNonTaxableMiles: boolean;
}

export interface LoadFuelExciseData {
  loadId: string;
  tractorAsset: string;
  driver: string;
  workerType: string;
  pickupState: string;
  deliveryState: string;
  routeJurisdictions: string[];
  loadedMiles: number;
  emptyMiles: number;
  totalMiles: number;
  mpg: number;
  estimatedGallonsConsumed: number;
  fuelGallonsPurchased: number;
  fuelPurchaseJurisdiction: string;
  fuelCost: number;
  taxPaidFuelSupport: boolean;
  missingReceiptFlag: boolean;
  auditSupportStatus: 'Complete' | 'Missing Receipt' | 'Missing Mileage' | 'Needs Review';
}

export interface JurisdictionFuelExciseData {
  jurisdiction: string;
  totalMiles: number;
  taxableMiles: number;
  estimatedGallonsConsumed: number;
  fuelGallonsPurchased: number;
  taxPaidFuelSupport: boolean;
  estimatedExposure: number;
  recordsComplete: boolean;
  recordsNeedingReview: number;
  varianceNotes: string[];
}

export interface StateAssessmentComparison {
  bofRunningEstimate: number;
  stateProposedAssessment: number;
  variance: number;
  variancePercentage: number;
  likelyVarianceReason: string;
  supportingRecordsAvailable: boolean;
  recommendedAction: string;
}

export interface AuditSupportPacket {
  loadRecord: boolean;
  bolPod: boolean;
  routeMileageSupport: boolean;
  fuelReceipts: boolean;
  fuelCardRecords: boolean;
  assetUnitAssignment: boolean;
  settlementLoadReport: boolean;
  invoiceRecord: boolean;
  auditReadinessChecklist: boolean;
}

export const DEFAULT_FUEL_EXCISE_ASSUMPTIONS: FuelExciseAssumptions = {
  mpg: 6.5,
  taxableMileagePercentage: 0.85, // 85%
  jurisdictionalAllocationMethod: 'proportional',
  fuelPricePerGallon: 4.25,
  jurisdictionTaxRates: {
    'CA': 0.51, // California
    'TX': 0.20, // Texas
    'FL': 0.04, // Florida
    'IL': 0.42, // Illinois
    'NY': 0.44, // New York
    'OH': 0.28, // Ohio
    'PA': 0.58, // Pennsylvania
    'GA': 0.29, // Georgia
    'NC': 0.37, // North Carolina
    'IN': 0.31, // Indiana
    // Add more states as needed
  },
  receiptSupportAvailable: false,
  excludeNonTaxableMiles: true,
};

export function buildFuelExciseSupportByLoad(
  data: BofData,
  assumptions: FuelExciseAssumptions = DEFAULT_FUEL_EXCISE_ASSUMPTIONS
): LoadFuelExciseData[] {
  return data.loads.map(load => {
    const driver = data.drivers.find(d => d.id === load.driverId);
    
    // Simulate mileage data since it's not in the current data structure
    // In real implementation, this would come from actual trip data
    const simulatedLoadedMiles = 450 + Math.floor(Math.random() * 200); // 450-650 miles
    const simulatedEmptyMiles = 50 + Math.floor(Math.random() * 100); // 50-150 miles
    const totalMiles = simulatedLoadedMiles + simulatedEmptyMiles;
    
    // Calculate estimated gallons consumed
    const estimatedGallonsConsumed = calculateEstimatedGallonsConsumed(
      totalMiles,
      assumptions.mpg
    );
    
    // Determine audit support status
    const missingReceiptFlag = !assumptions.receiptSupportAvailable;
    const auditSupportStatus = determineAuditSupportStatus(
      load,
      missingReceiptFlag,
      assumptions,
      totalMiles
    );
    
    // Simulate fuel purchase data (in real implementation, this would come from actual data)
    const fuelGallonsPurchased = Math.floor(estimatedGallonsConsumed * 0.9); // Assume 90% of fuel was purchased
    const fuelCost = fuelGallonsPurchased * assumptions.fuelPricePerGallon;
    
    return {
      loadId: load.id,
      tractorAsset: load.assetId || 'Unknown',
      driver: driver?.name || 'Unknown',
      workerType: 'Employee Driver', // Demo assumption since workerType not in data
      pickupState: extractStateFromLocation(load.origin),
      deliveryState: extractStateFromLocation(load.destination),
      routeJurisdictions: [extractStateFromLocation(load.origin), extractStateFromLocation(load.destination)],
      loadedMiles: simulatedLoadedMiles,
      emptyMiles: simulatedEmptyMiles,
      totalMiles,
      mpg: assumptions.mpg,
      estimatedGallonsConsumed,
      fuelGallonsPurchased,
      fuelPurchaseJurisdiction: extractStateFromLocation(load.origin),
      fuelCost,
      taxPaidFuelSupport: assumptions.receiptSupportAvailable,
      missingReceiptFlag,
      auditSupportStatus,
    };
  });
}

export function buildFuelExciseJurisdictionRollup(
  loadFuelData: LoadFuelExciseData[],
  assumptions: FuelExciseAssumptions = DEFAULT_FUEL_EXCISE_ASSUMPTIONS
): JurisdictionFuelExciseData[] {
  const jurisdictionMap = new Map<string, JurisdictionFuelExciseData>();
  
  loadFuelData.forEach(load => {
    load.routeJurisdictions.forEach(jurisdiction => {
      const existing = jurisdictionMap.get(jurisdiction);
      
      if (existing) {
        existing.totalMiles += load.totalMiles;
        existing.taxableMiles += load.totalMiles * assumptions.taxableMileagePercentage;
        existing.estimatedGallonsConsumed += load.estimatedGallonsConsumed;
        existing.fuelGallonsPurchased += load.fuelGallonsPurchased;
      } else {
        const jurisdictionData: JurisdictionFuelExciseData = {
          jurisdiction,
          totalMiles: load.totalMiles,
          taxableMiles: load.totalMiles * assumptions.taxableMileagePercentage,
          estimatedGallonsConsumed: load.estimatedGallonsConsumed,
          fuelGallonsPurchased: load.fuelGallonsPurchased,
          taxPaidFuelSupport: load.taxPaidFuelSupport,
          estimatedExposure: calculateEstimatedJurisdictionExposure(
            load.estimatedGallonsConsumed,
            assumptions.jurisdictionTaxRates[jurisdiction] || 0
          ),
          recordsComplete: load.auditSupportStatus === 'Complete',
          recordsNeedingReview: load.auditSupportStatus === 'Needs Review' ? 1 : 0,
          varianceNotes: [],
        };
        jurisdictionMap.set(jurisdiction, jurisdictionData);
      }
    });
  });
  
  // Calculate final exposure for each jurisdiction
  jurisdictionMap.forEach((data, jurisdiction) => {
    data.estimatedExposure = calculateEstimatedJurisdictionExposure(
      data.estimatedGallonsConsumed,
      assumptions.jurisdictionTaxRates[jurisdiction] || 0
    );
  });
  
  return Array.from(jurisdictionMap.values());
}

export function calculateEstimatedGallonsConsumed(
  totalMiles: number,
  mpg: number
): number {
  return totalMiles / mpg;
}

export function calculateEstimatedJurisdictionExposure(
  estimatedGallons: number,
  taxRate: number
): number {
  return estimatedGallons * taxRate;
}

export function compareBofEstimateToAssessment(
  bofEstimate: number,
  stateAssessment: number
): StateAssessmentComparison {
  const variance = stateAssessment - bofEstimate;
  const variancePercentage = bofEstimate !== 0 ? (variance / bofEstimate) * 100 : 0;
  
  let likelyVarianceReason = '';
  if (Math.abs(variancePercentage) > 10) {
    likelyVarianceReason = 'Significant variance - review mileage allocation or fuel records';
  } else if (Math.abs(variancePercentage) > 5) {
    likelyVarianceReason = 'Moderate variance - check jurisdiction assignments';
  } else {
    likelyVarianceReason = 'Minor variance - normal estimation difference';
  }
  
  let recommendedAction = '';
  if (variance > 0) {
    recommendedAction = 'State assessment higher - verify missing fuel receipts or mileage underreporting';
  } else {
    recommendedAction = 'BOF estimate higher - review jurisdiction allocation or fuel purchase records';
  }
  
  return {
    bofRunningEstimate: bofEstimate,
    stateProposedAssessment: stateAssessment,
    variance,
    variancePercentage,
    likelyVarianceReason,
    supportingRecordsAvailable: true, // Demo assumption
    recommendedAction,
  };
}

export function identifyFuelMileageRecordGaps(
  loadFuelData: LoadFuelExciseData[]
): {
  loadsMissingReceipts: LoadFuelExciseData[];
  loadsMissingMileage: LoadFuelExciseData[];
  jurisdictionsWithIncompleteRecords: string[];
  totalEstimatedExposure: number;
} {
  const loadsMissingReceipts = loadFuelData.filter(load => load.missingReceiptFlag);
  const loadsMissingMileage = loadFuelData.filter(load => load.auditSupportStatus === 'Missing Mileage');
  
  const jurisdictionSet = new Set<string>();
  loadFuelData.forEach(load => {
    if (load.auditSupportStatus !== 'Complete') {
      load.routeJurisdictions.forEach(jurisdiction => jurisdictionSet.add(jurisdiction));
    }
  });
  
  const totalEstimatedExposure = loadFuelData.reduce(
    (sum, load) => sum + (load.estimatedGallonsConsumed * 0.30), // Assume 30% average tax rate
    0
  );
  
  return {
    loadsMissingReceipts,
    loadsMissingMileage,
    jurisdictionsWithIncompleteRecords: Array.from(jurisdictionSet),
    totalEstimatedExposure,
  };
}

export function generateAuditSupportPacket(
  loadId: string,
  data: BofData
): AuditSupportPacket {
  // In a real implementation, this would check actual data availability
  const load = data.loads.find(l => l.id === loadId);
  
  return {
    loadRecord: !!load,
    bolPod: load?.podStatus === 'verified',
    routeMileageSupport: !!load, // Demo assumption - mileage support available if load exists
    fuelReceipts: true, // Demo assumption
    fuelCardRecords: true, // Demo assumption
    assetUnitAssignment: !!load?.assetId,
    settlementLoadReport: true, // Demo assumption
    invoiceRecord: true, // Demo assumption
    auditReadinessChecklist: true, // Demo assumption
  };
}

// Helper functions
function extractStateFromLocation(location: string): string {
  // Simple state extraction - in real implementation, this would be more sophisticated
  const stateMatch = location.match(/\b([A-Z]{2})\b/);
  return stateMatch ? stateMatch[1] : 'Unknown';
}

function determineAuditSupportStatus(
  load: unknown,
  missingReceiptFlag: boolean,
  assumptions: FuelExciseAssumptions,
  totalMiles: number
): 'Complete' | 'Missing Receipt' | 'Missing Mileage' | 'Needs Review' {
  if (missingReceiptFlag) {
    return 'Missing Receipt';
  }
  
  if (!totalMiles || totalMiles === 0) {
    return 'Missing Mileage';
  }
  
  if (assumptions.excludeNonTaxableMiles) {
    return 'Needs Review';
  }
  
  return 'Complete';
}

export function validateFuelExciseAssumptions(assumptions: FuelExciseAssumptions): string[] {
  const errors: string[] = [];
  
  if (assumptions.mpg <= 0) {
    errors.push('MPG must be greater than 0');
  }
  
  if (assumptions.taxableMileagePercentage < 0 || assumptions.taxableMileagePercentage > 1) {
    errors.push('Taxable mileage percentage must be between 0 and 100%');
  }
  
  if (assumptions.fuelPricePerGallon <= 0) {
    errors.push('Fuel price per gallon must be greater than 0');
  }
  
  return errors;
}
