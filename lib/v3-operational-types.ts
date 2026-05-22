/**
 * V3 Operational Elite Workbook Types
 * Source: public/data/main-source-v3_operational_elite_enhanced.xlsx
 */

// Weekly Settlements
export type WeeklySettlement = {
  weekEnding: string;
  driverId: string;
  driverName: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  fleetOwnerProfit: number;
  driverProfitabilityScore: number;
  settlementStatus: string;
  settlementPacketComplete: boolean;
  settlementApprovedBy: string;
  settlementApprovalTimestamp: string;
};

// Payroll sheet detail for the current settlement run
export type PayrollSettlementDetail = {
  driverId: string;
  driverName: string;
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
  healthInsurancePremiums: number;
  lifeInsuranceAbove50k: number;
  totalDeductions: number;
  fuelReimbursement: number;
  netPay: number;
  status: string;
  pendingReason: string;
  rate401k: number;
  payModelType: string;
  percentageRate: number;
  cpmRateLoaded: number;
  cpmRateEmpty: number;
  hourlyRate: number;
  minimumWeeklyGuarantee: number;
  detentionRate: number;
  layoverRate: number;
  breakdownPayRate: number;
  stopPay: number;
  tarpPay: number;
  hazmatPremium: number;
  tankerPremium: number;
  twicPremium: number;
  safetyBonusEligible: string;
  safetyBonusTier: string;
  safetyBonusAmount: number;
  fuelBonusEligible: string;
  fuelBonusRate: number;
  inspectionBonus: number;
  adminExcellenceBonus: number;
  assetCareBonus: number;
  advanceTaken: number;
  advanceRepayment: number;
  chargebacksItemized: string;
  chargebackTotal: number;
  garnishmentAmount: number;
  escrowContribution: number;
  escrowBalance: number;
};

// Settlement Holds
export type SettlementHold = {
  holdId: string;
  weekEnding: string;
  driverId: string;
  loadId: string;
  holdType: string;
  holdReason: string;
  relatedModule: string;
  relatedEventId: string;
  holdAmount: number;
  status: string;
  openedDate: string;
  resolvedDate: string;
  approvedBy: string;
  releaseAuthorizedBy: string;
  managerActionRequired: boolean;
};

// Main Safety (driver-level rollup)
export type MainSafety = {
  driverId: string;
  driverName: string;
  safetyScore: number;
  openSafetyEvents: number;
  criticalEvents: number;
  lastSafetyEventDate: string;
  lastSafetyEventType: string;
  coachingStatus: string;
  lastCoachingDate: string;
  correctiveActionDue: string;
  dispatchEligibilityImpact: string;
  settlementImpact: string;
  insuranceRiskBand: string;
  evidencePacketStatus: string;
  managerActionRequired: boolean;
  safetyActionStatus: string;
};

// Safety Events (event-level)
export type SafetyEvent = {
  eventId: string;
  driverId: string;
  driverName: string;
  eventType: string;
  severity: string;
  status: string;
  timestamp: string;
  unit: string;
  location: string;
  details: string;
  driverPhotoUrl: string;
  exportStatus: string;
  eventPhotoUrl: string;
  insuranceClaimId: string;
  claimStatus: string;
  claimType: string;
  dateOfLoss: string;
  claimAmount: number;
  deductibleAmount: number;
  adjusterName: string;
  insurerName: string;
  policyNumber: string;
  claimNotes: string;
  rfidRelated: boolean;
  linkedLoadId: string;
  linkedDriverDocument: string;
  claimExposureBand: string;
  insuranceClaimNeeded: boolean;
  preventable: boolean;
  rootCause: string;
  csaBasicCategory: string;
  dotRecordable: boolean;
  policeReportRequired: boolean;
  driverStatementRequired: boolean;
  coachingRequired: boolean;
  coachingAssignedTo: string;
  correctiveAction: string;
  correctiveActionStatus: string;
  correctiveActionDueDate: string;
  closedDate: string;
  reviewedBy: string;
  reviewTimestamp: string;
  driverAcknowledged: boolean;
  driverAcknowledgmentTimestamp: string;
  settlementHold: boolean;
  settlementHoldAmount: number;
  dispatchBlock: boolean;
  evidencePacketComplete: boolean;
  dashcamClipUrl: string;
  telematicsSource: string;
  safetyActionStatus: string;
};

// Safety KPI Source
export type SafetyKpiSource = {
  kpiCategory: string;
  kpiName: string;
  kpiValue: number;
  kpiTarget: number;
  kpiTrend: string;
  kpiUnit: string;
  kpiDescription: string;
  driverId?: string;
  loadId?: string;
  period: string;
};

// Assets
export type Asset = {
  assetId: string;
  assetType: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  status: string;
  currentDriverId: string;
  currentLocation: string;
  mileage: number;
  lastMaintenanceDate: string;
  nextPmDue: string;
  dotInspectionDue: string;
  insuranceExpiry: string;
  registrationExpiry: string;
  readinessStatus: string;
  managerActionRequired: boolean;
};

// Maintenance Work Orders
export type MaintenanceWorkOrder = {
  workOrderId: string;
  assetId: string;
  driverId: string;
  issueType: string;
  severity: string;
  reportedDate: string;
  reportedBy: string;
  source: string;
  mileage: number;
  defectDescription: string;
  photoEvidenceUrl: string;
  dotImpact: boolean;
  dispatchBlock: boolean;
  repairStatus: string;
  vendorName: string;
  estimatedCost: number;
  actualCost: number;
  scheduledRepairDate: string;
  completedDate: string;
  nextPmDue: string;
  managerActionRequired: boolean;
};

// Compliance Action Queue
export type ComplianceActionQueue = {
  actionId: string;
  driverId: string;
  driverName: string;
  complianceArea: string;
  documentType: string;
  issueType: string;
  severity: string;
  status: string;
  dueDate: string;
  daysUntilDue: number;
  dispatchEligibilityImpact: string;
  settlementImpact: string;
  assignedTo: string;
  lastReviewedBy: string;
  lastReviewedDate: string;
  requiredFix: string;
  fixLink: string;
  managerActionRequired: boolean;
};

// RFID Events
export type RfidEvent = {
  rfidEventId: string;
  loadId: string;
  assetId: string;
  trailerId: string;
  cargoTagId: string;
  driverId: string;
  eventType: string;
  scanTimestamp: string;
  scanLocation: string;
  expectedLocation: string;
  scanStatus: string;
  exceptionType: string;
  temperatureReading: number;
  sealMatchStatus: string;
  geoFenceStatus: string;
  readerSource: string;
  proofImpact: string;
  dispatchImpact: string;
  settlementImpact: string;
  managerActionRequired: boolean;
};

// Route Intelligence
export type RouteIntelligence = {
  routeId: string;
  loadId: string;
  driverId: string;
  origin: string;
  destination: string;
  originCoordinates: [number, number];
  destinationCoordinates: [number, number];
  mileage: number;
  estimatedDriveTime: number;
  routeRisk: string;
  hosPlanningNotes: string;
  weatherRisk: string;
  trafficRisk: string;
  recommendedRestStops: string[];
  fuelStops: string[];
  routeSummary: string;
  managerActionRequired: boolean;
};

// Diesel Pricing
export type DieselPricing = {
  pricingId: string;
  routeId?: string;
  loadId?: string;
  location: string;
  brand?: string;
  coordinates: [number, number];
  dieselPrice: number;
  currency: string;
  priceTimestamp: string;
  source: string;
  routePosition: number;
  preferredStop: boolean;
  estimatedGallons: number;
  estimatedFuelCost: number;
  savingsOpportunity: number;
  amenities: string[];
  managerActionRequired: boolean;
};

// Rest Stop Locations
export type RestStopLocation = {
  stopId: string;
  routeId?: string;
  loadId?: string;
  location: string;
  coordinates: [number, number];
  distanceFromRoute: number;
  parkingAvailable: boolean;
  parkingSpaces: number;
  showerAvailable: boolean;
  foodAvailable: boolean;
  amenities: string[];
  safetyRating: number;
  recommendedForHos: boolean;
  hosBreakRecommendation: string;
  managerActionRequired: boolean;
};

// Operational Risk Queue
export type OperationalRiskQueue = {
  riskId: string;
  module: string;
  driverId: string;
  loadId: string;
  assetId: string;
  relatedEventId: string;
  riskType: string;
  severity: string;
  status: string;
  businessImpact: string;
  dispatchImpact: string;
  settlementImpact: string;
  complianceImpact: string;
  insuranceImpact: string;
  dueDate: string;
  assignedTo: string;
  recommendedAction: string;
  resolutionStatus: string;
  resolvedDate: string;
  managerActionRequired: boolean;
};

// V3 Operational Data Container
export type V3OperationalData = {
  weeklySettlements: WeeklySettlement[];
  payrollSettlements: PayrollSettlementDetail[];
  settlementHolds: SettlementHold[];
  mainSafety: MainSafety[];
  safetyEvents: SafetyEvent[];
  safetyKpiSource: SafetyKpiSource[];
  assets: Asset[];
  maintenanceWorkOrders: MaintenanceWorkOrder[];
  complianceActionQueue: ComplianceActionQueue[];
  rfidEvents: RfidEvent[];
  routeIntelligence: RouteIntelligence[];
  dieselPricing: DieselPricing[];
  restStopLocations: RestStopLocation[];
  operationalRiskQueue: OperationalRiskQueue[];
  metadata: {
    workbookVersion: string;
    lastUpdated: string;
    sourceFile: string;
    totalRecords: number;
    activeDrivers: number;
    activeLoads: number;
    activeAssets: number;
  };
};
