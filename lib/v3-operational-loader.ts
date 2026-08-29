/**
 * V3 Operational Elite Workbook Loader
 * Source: public/data/main-source-v3_operational_elite_enhanced.xlsx
 * 
 * This loader provides access to all operational data from the v3 workbook
 * with fallback to v2 data when v3 is not available.
 */

import * as XLSX from 'xlsx';
import { parseToDate } from './date-utils';
import { L008_CANONICAL_STORY, L009_CANONICAL_STORY, normalizeCanonicalLoadId } from './canonical-load-stories';
import type {
  V3OperationalData,
  WeeklySettlement,
  PayrollSettlementDetail,
  SettlementHold,
  MainSafety,
  SafetyEvent,
  SafetyKpiSource,
  Asset,
  MaintenanceWorkOrder,
  ComplianceActionQueue,
  RfidEvent,
  RouteIntelligence,
  DieselPricing,
  RestStopLocation,
  OperationalRiskQueue,
} from './v3-operational-types';

// Environment override support
const WORKBOOK_OVERRIDE = process.env.BOF_MAIN_SOURCE_XLSX;

// V4/V3 Operational Excel workbook paths
const V4_WORKBOOK_PATH = '/data/main-source-v4_operational_elite_enhanced.xlsx';
const V3_WORKBOOK_PATH = '/data/main-source-v3_operational_enhanced.xlsx';
const V2_WORKBOOK_PATH = '/data/main-source-v2_enhanced_bof_aligned.xlsx';

// Cache for loaded data
let v3DataCache: V3OperationalData | null = null;
let isLoading = false;
let lastLoadAttempt = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function applyCanonicalOperationalStoryCorrections(data: V3OperationalData): void {
  data.mainSafety = data.mainSafety.map((row) => {
    if (row.driverId !== L008_CANONICAL_STORY.driverId) return row;
    return {
      ...row,
      driverName: L008_CANONICAL_STORY.driverName,
      openSafetyEvents: Math.max(row.openSafetyEvents, 1),
      criticalEvents: Math.max(row.criticalEvents, 1),
      lastSafetyEventType: "HOS Violation / Cargo Damage Claim",
      coachingStatus: "Required",
      dispatchEligibilityImpact: "Manager review required",
      settlementImpact: "Claim review; no settlement hold",
      insuranceRiskBand: L008_CANONICAL_STORY.claimExposureBand ?? "Medium",
      evidencePacketStatus: L008_CANONICAL_STORY.evidenceStatus ?? "Partial",
      managerActionRequired: true,
      requiredFix: "Complete claim evidence packet, driver statement, and HOS coaching acknowledgment.",
      fixLink: "/safety#recent-safety-events",
      safetyActionStatus: "Claim review open / evidence partial",
    };
  });

  data.safetyEvents = data.safetyEvents.map((event) => {
    const isL008SafetyEvent =
      event.eventId === L008_CANONICAL_STORY.safetyEventId ||
      (event.driverId === L008_CANONICAL_STORY.driverId &&
        normalizeCanonicalLoadId(event.linkedLoadId) === L008_CANONICAL_STORY.loadId);

    return isL008SafetyEvent
      ? {
          ...event,
          driverId: L008_CANONICAL_STORY.driverId,
          driverName: L008_CANONICAL_STORY.driverName,
          unit: L008_CANONICAL_STORY.assetId,
          status: "UNDER_REVIEW",
          severity: "CRITICAL",
          eventType: "HOS Violation / Cargo Damage Claim",
          details:
            "HOS break violation surfaced during delivery review; cargo shifted and claim evidence packet is partial.",
          insuranceClaimId: L008_CANONICAL_STORY.claimId ?? event.insuranceClaimId,
          claimStatus: "OPEN",
          claimType: "Cargo Damage",
          claimAmount: L008_CANONICAL_STORY.claimAmount ?? event.claimAmount,
          claimNotes: "Cargo shift noted; reserve pending manager review and complete photo evidence.",
          linkedLoadId: L008_CANONICAL_STORY.loadId,
          claimExposureBand: L008_CANONICAL_STORY.claimExposureBand ?? event.claimExposureBand,
          insuranceClaimNeeded: true,
          preventable: true,
          rootCause: "HOS planning / break management; cargo condition review",
          driverStatementRequired: true,
          coachingRequired: true,
          settlementHold: false,
          settlementHoldAmount: 0,
          dispatchBlock: false,
          evidencePacketComplete: false,
          safetyActionStatus: "Claim review open / evidence partial",
        }
      : event;
  });

  data.maintenanceWorkOrders = data.maintenanceWorkOrders.map((wo) => {
    const isL009TireDefect =
      wo.driverId === L009_CANONICAL_STORY.driverId &&
      (wo.workOrderId === L009_CANONICAL_STORY.maintenanceWorkOrderId ||
        /tire|asset/i.test(`${wo.issueType} ${wo.defectDescription}`));
    return isL009TireDefect
      ? { ...wo, assetId: L009_CANONICAL_STORY.assetId }
      : wo;
  });

  data.rfidEvents = data.rfidEvents.map((event) => {
    const isL009Pretrip =
      normalizeCanonicalLoadId(event.loadId) === L009_CANONICAL_STORY.loadId &&
      event.driverId === L009_CANONICAL_STORY.driverId;
    return isL009Pretrip
      ? {
          ...event,
          assetId: L009_CANONICAL_STORY.assetId,
          trailerId: L009_CANONICAL_STORY.trailerId,
          scanLocation: "Cleveland Yard Gate 2",
          expectedLocation: "Cleveland Yard Gate 2",
          proofImpact: "Pre-trip proof blocked until tire repair closeout is uploaded",
          dispatchImpact: "Blocked",
          settlementImpact: "None",
        }
      : event;
  });

  data.routeIntelligence = data.routeIntelligence.map((route) => {
    const isL008 = normalizeCanonicalLoadId(route.loadId) === L008_CANONICAL_STORY.loadId;
    if (isL008) {
      return {
        ...route,
        driverId: L008_CANONICAL_STORY.driverId,
        origin: L008_CANONICAL_STORY.origin,
        destination: L008_CANONICAL_STORY.destination,
        routeSummary:
          "Route, fuel, and rest planning remain available, but BOF keeps the load in safety / claim review until cargo-damage evidence is complete.",
        managerActionRequired: true,
      };
    }

    const isL009 = normalizeCanonicalLoadId(route.loadId) === L009_CANONICAL_STORY.loadId;
    return isL009
      ? {
          ...route,
          origin: L009_CANONICAL_STORY.origin,
          destination: L009_CANONICAL_STORY.destination,
          routeSummary: "Route, fuel, and rest planning are available, but BOF holds dispatch until the tire / asset defect is cleared.",
          managerActionRequired: true,
        }
      : route;
  });

  if (!data.routeIntelligence.some((route) => normalizeCanonicalLoadId(route.loadId) === L008_CANONICAL_STORY.loadId)) {
    data.routeIntelligence.push({
      routeId: "RT-L008-CLAIM-REVIEW",
      loadId: L008_CANONICAL_STORY.loadId,
      driverId: L008_CANONICAL_STORY.driverId,
      origin: L008_CANONICAL_STORY.origin,
      destination: L008_CANONICAL_STORY.destination,
      originCoordinates: [-86.7816, 36.1627],
      destinationCoordinates: [-86.1581, 39.7684],
      mileage: 289,
      estimatedDriveTime: 5.2,
      routeRisk: "Moderate",
      hosPlanningNotes: "HOS break timing is under review after the safety event; route plan remains available for claim context.",
      weatherRisk: "Low",
      trafficRisk: "Moderate around Louisville / Indianapolis approach",
      recommendedRestStops: ["Kentucky Welcome Center I-65 Northbound"],
      fuelStops: ["Pilot Travel Center - Bowling Green, KY"],
      routeSummary:
        "Route, fuel, and rest planning are available, but BOF keeps L008 in safety / claim review until cargo-damage evidence and HOS coaching are complete.",
      managerActionRequired: true,
    });
  }

  if (!data.dieselPricing.some((fuel) => normalizeCanonicalLoadId(fuel.loadId ?? "") === L008_CANONICAL_STORY.loadId)) {
    data.dieselPricing.push({
      pricingId: "FUEL-L008-BGKY",
      routeId: "RT-L008-CLAIM-REVIEW",
      loadId: L008_CANONICAL_STORY.loadId,
      location: "Pilot Travel Center - Bowling Green, KY",
      brand: "Pilot",
      coordinates: [-86.4436, 37.016],
      dieselPrice: 3.49,
      currency: "USD",
      priceTimestamp: "2026-05-19",
      source: "BOF route planning baseline",
      routePosition: 92,
      preferredStop: true,
      estimatedGallons: 43,
      estimatedFuelCost: 150.07,
      savingsOpportunity: 18,
      amenities: ["Diesel", "parking", "food", "showers"],
      managerActionRequired: false,
    });
  }

  if (!data.restStopLocations.some((stop) => normalizeCanonicalLoadId(stop.loadId ?? "") === L008_CANONICAL_STORY.loadId)) {
    data.restStopLocations.push({
      stopId: "REST-L008-KY-WELCOME",
      routeId: "RT-L008-CLAIM-REVIEW",
      loadId: L008_CANONICAL_STORY.loadId,
      location: "Kentucky Welcome Center I-65 Northbound",
      coordinates: [-86.577, 36.789],
      distanceFromRoute: 1.2,
      parkingAvailable: true,
      parkingSpaces: 38,
      showerAvailable: false,
      foodAvailable: true,
      amenities: ["parking", "restrooms", "food nearby"],
      safetyRating: 4,
      recommendedForHos: true,
      hosBreakRecommendation: "Use as documented HOS recovery stop if route resumes after claim review.",
      managerActionRequired: false,
    });
  }
}

/**
 * Get the workbook path to use (v4 preferred, v3 fallback, v2 last resort)
 */
function getWorkbookPath(): string {
  if (WORKBOOK_OVERRIDE) {
    console.log(`📚 Using workbook override: ${WORKBOOK_OVERRIDE}`);
    return WORKBOOK_OVERRIDE;
  }
  
  // Return v4 by default - the fetch will fail if it doesn't exist and we'll try v3
  console.log(`📚 Trying V4 workbook: ${V4_WORKBOOK_PATH}`);
  return V4_WORKBOOK_PATH;
}

/**
 * Parse Excel workbook and extract all operational data
 */
async function parseV3Workbook(workbookPath: string): Promise<V3OperationalData> {
  const workbookVersion = workbookPath.includes('v4') ? 'V4' : workbookPath.includes('v3') ? 'V3' : 'V2';
  console.log(`📊 Loading ${workbookVersion} operational workbook: ${workbookPath}`);
  
  try {
    // Construct proper URL for fetch
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const fullUrl = `${baseUrl}${workbookPath}`;
    console.log(`📡 Fetching workbook from: ${fullUrl}`);
    
    // Fetch the workbook
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch workbook: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log(`📊 Workbook sheets found: ${workbook.SheetNames.join(', ')}`);
    
    const data: V3OperationalData = {
      weeklySettlements: [],
      payrollSettlements: [],
      settlementHolds: [],
      mainSafety: [],
      safetyEvents: [],
      safetyKpiSource: [],
      assets: [],
      maintenanceWorkOrders: [],
      complianceActionQueue: [],
      rfidEvents: [],
      routeIntelligence: [],
      dieselPricing: [],
      restStopLocations: [],
      operationalRiskQueue: [],
      metadata: {
        workbookVersion: 'v3',
        lastUpdated: new Date().toISOString(),
        sourceFile: workbookPath,
        totalRecords: 0,
        activeDrivers: 0,
        activeLoads: 0,
        activeAssets: 0,
      },
    };
    
    // Parse each sheet
    const sheetParsers = {
      'Payroll': parsePayrollSettlements,
      'Weekly_Settlements': parseWeeklySettlements,
      'Settlement_Holds': parseSettlementHolds,
      'Main Safety': parseMainSafety,
      'Safety_Events': parseSafetyEvents,
      'Safety_KPI_Source': parseSafetyKpiSource,
      'Assets': parseAssets,
      'Maintenance_Work_Orders': parseMaintenanceWorkOrders,
      'Compliance_Action_Queue': parseComplianceActionQueue,
      'RFID_Events': parseRfidEvents,
      'Route_Intelligence': parseRouteIntelligence,
      'Diesel_Pricing': parseDieselPricing,
      'Rest_Stop_Locations': parseRestStopLocations,
      'Operational_Risk_Queue': parseOperationalRiskQueue,
    };
    
    for (const [sheetName, parser] of Object.entries(sheetParsers)) {
      if (workbook.SheetNames.includes(sheetName)) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        if (jsonData.length > 1) { // Skip if only header row
          const stringData = jsonData.map(row => row.map(cell => String(cell || '')));
          const parsedData = parser(stringData);
          const propertyName = getPropertyName(sheetName);
    if (propertyName === 'weeklySettlements') data.weeklySettlements = parsedData as WeeklySettlement[];
    else if (propertyName === 'payrollSettlements') data.payrollSettlements = parsedData as PayrollSettlementDetail[];
    else if (propertyName === 'settlementHolds') data.settlementHolds = parsedData as SettlementHold[];
    else if (propertyName === 'mainSafety') data.mainSafety = parsedData as MainSafety[];
    else if (propertyName === 'safetyEvents') data.safetyEvents = parsedData as SafetyEvent[];
    else if (propertyName === 'safetyKpiSource') data.safetyKpiSource = parsedData as SafetyKpiSource[];
    else if (propertyName === 'assets') data.assets = parsedData as Asset[];
    else if (propertyName === 'maintenanceWorkOrders') data.maintenanceWorkOrders = parsedData as MaintenanceWorkOrder[];
    else if (propertyName === 'complianceActionQueue') data.complianceActionQueue = parsedData as ComplianceActionQueue[];
    else if (propertyName === 'rfidEvents') data.rfidEvents = parsedData as RfidEvent[];
    else if (propertyName === 'routeIntelligence') data.routeIntelligence = parsedData as RouteIntelligence[];
    else if (propertyName === 'dieselPricing') data.dieselPricing = parsedData as DieselPricing[];
    else if (propertyName === 'restStopLocations') data.restStopLocations = parsedData as RestStopLocation[];
    else if (propertyName === 'operationalRiskQueue') data.operationalRiskQueue = parsedData as OperationalRiskQueue[];
          console.log(`📊 Parsed ${sheetName}: ${parsedData.length} records`);
        }
      } else {
        console.warn(`⚠️ Sheet not found: ${sheetName}`);
      }
    }

    applyCanonicalOperationalStoryCorrections(data);
    
    // Calculate metadata
    data.metadata.totalRecords = Object.values(data).reduce((sum, arr) => {
      if (Array.isArray(arr)) return sum + arr.length;
      return sum;
    }, 0) - 1; // Subtract metadata object
    
    data.metadata.activeDrivers = new Set([
      ...data.weeklySettlements.map(s => s.driverId),
      ...data.mainSafety.map(s => s.driverId),
      ...data.safetyEvents.map(e => e.driverId),
      ...data.complianceActionQueue.map(a => a.driverId),
      ...data.rfidEvents.map(r => r.driverId),
    ]).size;
    
    // Debug/validation logs
    console.log(`📊 ${workbookVersion} Operational Data Validation Report:`);
    console.log(`  Weekly_Settlements: ${data.weeklySettlements.length} rows`);
    console.log(`  Payroll: ${data.payrollSettlements.length} rows`);
    console.log(`  Settlement_Holds: ${data.settlementHolds.length} rows`);
    console.log(`  Operational_Risk_Queue: ${data.operationalRiskQueue.length} rows`);
    console.log(`  Compliance_Action_Queue: ${data.complianceActionQueue.length} rows`);
    console.log(`  Maintenance_Work_Orders: ${data.maintenanceWorkOrders.length} rows`);
    console.log(`  RFID_Events: ${data.rfidEvents.length} rows`);
    console.log(`  Route_Intelligence: ${data.routeIntelligence.length} rows`);
    console.log(`  Diesel_Pricing: ${data.dieselPricing.length} rows`);
    console.log(`  Rest_Stop_Locations: ${data.restStopLocations.length} rows`);
    console.log(`  Main Safety: ${data.mainSafety.length} rows`);
    console.log(`  Safety_Events: ${data.safetyEvents.length} rows`);
    console.log(`  Safety_KPI_Source: ${data.safetyKpiSource.length} rows`);
    
    // Calculate distinct drivers and loads
    const distinctDrivers = new Set([
      ...data.weeklySettlements.map(s => s.driverId),
      ...data.mainSafety.map(s => s.driverId),
      ...data.safetyEvents.map(e => e.driverId),
      ...data.complianceActionQueue.map(a => a.driverId),
      ...data.rfidEvents.map(r => r.driverId),
    ]);
    
    const distinctLoads = new Set([
      ...data.settlementHolds.map(h => h.loadId),
      ...data.safetyEvents.map(e => e.linkedLoadId),
      ...data.rfidEvents.map(r => r.loadId),
      ...data.routeIntelligence.map(r => r.loadId),
    ]);
    
    console.log(`  Distinct drivers: ${distinctDrivers.size}`);
    console.log(`  Distinct loads: ${distinctLoads.size}`);
    
    if (data.weeklySettlements.length > 0) {
      const distinctWeeks = new Set(data.weeklySettlements.map(s => s.weekEnding));
      const latestWeek = Array.from(distinctWeeks).sort().pop();
      
      console.log(`  Distinct settlement weeks: ${distinctWeeks.size}`);
      console.log(`  Latest settlement week: ${latestWeek}`);
      
      // Sample data validation
      console.log('  Sample Weekly_Settlements:');
      data.weeklySettlements.slice(0, 3).forEach((settlement, i) => {
        console.log(`    ${i+1}. Driver: ${settlement.driverName} (${settlement.driverId}), Week: ${settlement.weekEnding}, Net Pay: $${settlement.netPay.toLocaleString()}`);
      });
    }
    
    if (data.settlementHolds.length > 0) {
      console.log('  Sample Settlement_Holds:');
      data.settlementHolds.slice(0, 3).forEach((hold, i) => {
        console.log(`    ${i+1}. ${hold.holdType}: ${hold.holdReason} - ${hold.status} (${hold.holdAmount > 0 ? '$' + hold.holdAmount.toLocaleString() : 'No amount'})`);
      });
    }
    
    // V4 Success/Fallback Report
    const isV4Loaded = workbookVersion === 'V4';
    const hasEliteTabs = data.operationalRiskQueue.length > 0 || 
                        data.complianceActionQueue.length > 0 || 
                        data.maintenanceWorkOrders.length > 0 ||
                        data.rfidEvents.length > 0 ||
                        data.routeIntelligence.length > 0 ||
                        data.dieselPricing.length > 0 ||
                        data.restStopLocations.length > 0;
    
    console.log(`🎯 ${workbookVersion} Load Status:`);
    console.log(`  V4 loaded successfully: ${isV4Loaded}`);
    console.log(`  Elite tabs have data: ${hasEliteTabs}`);
    console.log(`  Using fallback: ${!isV4Loaded}`);
    
    if (isV4Loaded && hasEliteTabs) {
      console.log(`✅ V4 workbook loaded with elite operational data - Ready for Safety page upgrade`);
    } else if (!isV4Loaded) {
      console.log(`⚠️ Using fallback workbook (${workbookVersion}) - Safety page upgrade postponed`);
    } else {
      console.log(`⚠️ V4 workbook loaded but elite tabs are empty - Verify workbook data`);
    }
    
    data.metadata.activeAssets = data.assets.length;
    data.metadata.activeLoads = new Set([
      ...data.settlementHolds.map(h => h.loadId),
      ...data.safetyEvents.map(e => e.linkedLoadId),
      ...data.rfidEvents.map(r => r.loadId),
      ...data.routeIntelligence.map(r => r.loadId),
    ]).size;
    
    console.log(`📊 ${workbookVersion} Workbook loaded successfully:`);
    console.log(`  - Total records: ${data.metadata.totalRecords}`);
    console.log(`  - Active drivers: ${data.metadata.activeDrivers}`);
    console.log(`  - Active loads: ${data.metadata.activeLoads}`);
    console.log(`  - Active assets: ${data.metadata.activeAssets}`);
    
    return data;
    
  } catch (error) {
    console.error(`❌ Failed to load ${workbookVersion} workbook: ${error}`);
    
    // Try fallback workbooks
    if (workbookPath === V4_WORKBOOK_PATH) {
      console.log(`🔄 Trying V3 workbook as fallback...`);
      return await parseV3Workbook(V3_WORKBOOK_PATH);
    } else if (workbookPath === V3_WORKBOOK_PATH) {
      console.log(`🔄 Trying V2 workbook as last resort...`);
      return await parseV3Workbook(V2_WORKBOOK_PATH);
    } else {
      throw error;
    }
  }
}

/**
 * Helper to convert sheet name to property name
 */
function getPropertyName(sheetName: string): string {
  const nameMap: Record<string, string> = {
    'Weekly_Settlements': 'weeklySettlements',
    'Payroll': 'payrollSettlements',
    'Settlement_Holds': 'settlementHolds',
    'Main Safety': 'mainSafety',
    'Safety_Events': 'safetyEvents',
    'Safety_KPI_Source': 'safetyKpiSource',
    'Assets': 'assets',
    'Maintenance_Work_Orders': 'maintenanceWorkOrders',
    'Compliance_Action_Queue': 'complianceActionQueue',
    'RFID_Events': 'rfidEvents',
    'Route_Intelligence': 'routeIntelligence',
    'Diesel_Pricing': 'dieselPricing',
    'Rest_Stop_Locations': 'restStopLocations',
    'Operational_Risk_Queue': 'operationalRiskQueue',
  };
  return nameMap[sheetName] || sheetName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Sheet parsers - each converts raw Excel data to typed objects
 */
function parseWeeklySettlements(data: string[][]): WeeklySettlement[] {
  const [headers, ...rows] = data;
  
  const validDrivers = ['DRV-001', 'DRV-002', 'DRV-003', 'DRV-004', 'DRV-005', 'DRV-006', 'DRV-007', 'DRV-008', 'DRV-009', 'DRV-010', 'DRV-011', 'DRV-012'];
  
  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    
    const driverId = String(obj['DriverID'] || '').trim();
    
    return {
      weekEnding: parseToDate(String(obj['WeekEnding'])),
      driverId: driverId,
      driverName: String(obj['DriverName'] || ''),
      grossPay: Number(obj['GrossPay']) || 0,
      totalDeductions: Number(obj['TotalDeductions']) || 0,
      netPay: Number(obj['NetPay']) || 0,
      fleetOwnerProfit: Number(obj['FleetOwnerProfit']) || 0,
      driverProfitabilityScore: Number(obj['DriverProfitabilityScore']) || 0,
      settlementStatus: String(obj['SettlementStatus'] || ''),
      settlementPacketComplete: parseWorkbookBoolean(obj['SettlementPacketComplete']),
      settlementApprovedBy: String(obj['SettlementApprovedBy'] || ''),
      settlementApprovalTimestamp: parseToDate(String(obj['SettlementApprovalTimestamp'])),
    };
  }).filter(settlement => settlement.driverId && validDrivers.includes(settlement.driverId));
}

function parsePayrollSettlements(data: string[][]): PayrollSettlementDetail[] {
  const [headers, ...rows] = data;
  const validDrivers = ['DRV-001', 'DRV-002', 'DRV-003', 'DRV-004', 'DRV-005', 'DRV-006', 'DRV-007', 'DRV-008', 'DRV-009', 'DRV-010', 'DRV-011', 'DRV-012'];

  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[String(header || '').trim()] = row[index];
    });

    const driverId = normalizePayrollDriverId(firstValue(obj, ['Driver', 'Driver ID', 'Legacy Driver ID']));

    return {
      driverId,
      driverName: firstValue(obj, ['Name', 'Full Name', 'Driver Name']),
      baseEarnings: firstNumber(obj, ['Base Earnings', 'Base Pay', 'Base']),
      backhaulPay: firstNumber(obj, ['Backhaul Pay', 'Backhaul']),
      safetyBonus: firstNumber(obj, ['Safety Bonus', 'Safety Bonus Pay']),
      grossPay: firstNumber(obj, ['Gross Pay', 'Gross']),
      fica: firstNumber(obj, ['FICA', 'Medicare/FICA', 'Medicare']),
      oasdi: firstNumber(obj, ['OASDI', 'Social Security']),
      federalWithholding: firstNumber(obj, ['Federal Withholding', 'Federal WH', 'Federal Tax']),
      stateWithholding: firstNumber(obj, ['State Withholding', 'State WH', 'State Tax']),
      sdi: firstNumber(obj, ['SDI', 'State Disability Insurance']),
      fmLeave: firstNumber(obj, ['FM Leave', 'Paid Family Leave', 'Family Medical Leave']),
      familySupport: firstNumber(obj, ['Family Support', 'Child Support']),
      insurancePremiums: firstNumber(obj, ['Insurance Premiums', 'Insurance']),
      creditUnionSavingsClub: firstNumber(obj, ['Credit Union Savings Club', 'Credit Union']),
      contribution401k: firstNumber(obj, ['401(k) Contribution', '401(k) Contrib.', '401k Contribution']),
      hsaFsaHealthDeduction: firstNumber(obj, ['HSA/FSA Health Deduction', 'HSA/FSA Health', 'HSA/FSA']),
      healthInsurancePremiums: firstNumber(obj, ['Health Insurance Premiums', 'Health Ins. Prem.', 'Health Insurance Premium']),
      lifeInsuranceAbove50k: firstNumber(obj, ['Life Insurance Above 50k', 'Life Ins. >50k', 'Life Insurance Over 50k']),
      totalDeductions: firstNumber(obj, ['Total Deductions', 'Deductions']),
      fuelReimbursement: firstNumber(obj, ['Fuel Reimb.', 'Fuel Reimbursement', 'Fuel Reimb']),
      netPay: firstNumber(obj, ['Net Pay', 'Net']),
      status: firstValue(obj, ['Status']),
      pendingReason: firstValue(obj, ['Pending Reason', 'Hold Reason']),
      rate401k: firstNumber(obj, ['401(k) Rate', '401k Rate']),
      payModelType: firstValue(obj, ['Pay Model Type']),
      percentageRate: firstNumber(obj, ['Percentage Rate', ' Percentage Rate']),
      cpmRateLoaded: firstNumber(obj, ['CPM Rate (Loaded)', ' CPM Rate (Loaded)']),
      cpmRateEmpty: firstNumber(obj, ['CPM Rate (Empty)', ' CPM Rate (Empty)']),
      hourlyRate: firstNumber(obj, ['Hourly Rate', ' Hourly Rate']),
      minimumWeeklyGuarantee: firstNumber(obj, ['Minimum Weekly Guarantee', ' Minimum Weekly Guarantee']),
      detentionRate: firstNumber(obj, ['Detention Rate (per hour)', ' Detention Rate (per hour)']),
      layoverRate: firstNumber(obj, ['Layover Rate (per day)', ' Layover Rate (per day)']),
      breakdownPayRate: firstNumber(obj, ['Breakdown Pay Rate', ' Breakdown Pay Rate']),
      stopPay: firstNumber(obj, ['Stop Pay (per stop)', ' Stop Pay (per stop)']),
      tarpPay: firstNumber(obj, ['Tarp Pay', ' Tarp Pay']),
      hazmatPremium: firstNumber(obj, ['Hazmat Premium', ' Hazmat Premium']),
      tankerPremium: firstNumber(obj, ['Tanker Premium', ' Tanker Premium']),
      twicPremium: firstNumber(obj, ['TWIC Premium', ' TWIC Premium']),
      safetyBonusEligible: firstValue(obj, ['Safety Bonus Eligible (Y/N)', ' Safety Bonus Eligible (Y/N)']),
      safetyBonusTier: firstValue(obj, ['Safety Bonus Tier', ' Safety Bonus Tier']),
      safetyBonusAmount: firstNumber(obj, ['Safety Bonus Amount', ' Safety Bonus Amount']),
      fuelBonusEligible: firstValue(obj, ['Fuel Bonus Eligible (Y/N)', ' Fuel Bonus Eligible (Y/N)']),
      fuelBonusRate: firstNumber(obj, ['Fuel Bonus Rate', ' Fuel Bonus Rate']),
      inspectionBonus: firstNumber(obj, ['Inspection Bonus', ' Inspection Bonus']),
      adminExcellenceBonus: firstNumber(obj, ['Admin Excellence Bonus', ' Admin Excellence Bonus']),
      assetCareBonus: firstNumber(obj, ['Asset Care Bonus', ' Asset Care Bonus']),
      advanceTaken: firstNumber(obj, ['Advance Taken', ' Advance Taken']),
      advanceRepayment: firstNumber(obj, ['Advance Repayment', ' Advance Repayment']),
      chargebacksItemized: firstValue(obj, ['Chargebacks (Itemized)', ' Chargebacks (Itemized)']),
      chargebackTotal: firstNumber(obj, ['Chargeback Total', ' Chargeback Total']),
      garnishmentAmount: firstNumber(obj, ['Garnishment Amount', ' Garnishment Amount']),
      escrowContribution: firstNumber(obj, ['Escrow Contribution', ' Escrow Contribution']),
      escrowBalance: firstNumber(obj, ['Escrow Balance', ' Escrow Balance']),
    };
  }).filter(settlement => settlement.driverId && validDrivers.includes(settlement.driverId));
}

function parseSettlementHolds(data: string[][]): SettlementHold[] {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return {
      holdId: String(obj['Hold ID'] || ''),
      weekEnding: parseToDate(String(obj['Week Ending'])),
      driverId: String(obj['Driver ID'] || ''),
      loadId: normalizeDemoLoadId(String(obj['Load ID'] || '')),
      holdType: String(obj['Hold Type'] || ''),
      holdReason: String(obj['Hold Reason'] || ''),
      relatedModule: String(obj['Related Module'] || ''),
      relatedEventId: String(obj['Related Event ID'] || ''),
      holdAmount: Number(obj['Hold Amount']) || 0,
      status: String(obj['Status'] || ''),
      openedDate: parseToDate(String(obj['Opened Date'])),
      resolvedDate: parseToDate(String(obj['Resolved Date'])),
      approvedBy: String(obj['Approved By'] || ''),
      releaseAuthorizedBy: String(obj['Release Authorized By'] || ''),
      managerActionRequired: Boolean(obj['Manager Action Required']),
    };
  });
}

function parseMainSafety(data: string[][]): MainSafety[] {
  const [headers, ...rows] = data;
  
  const validDrivers = ['DRV-001', 'DRV-002', 'DRV-003', 'DRV-004', 'DRV-005', 'DRV-006', 'DRV-007', 'DRV-008', 'DRV-009', 'DRV-010', 'DRV-011', 'DRV-012'];
  
  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, headerIndex) => {
      obj[header] = row[headerIndex];
    });
    
    const driverId = String(obj['Driver ID'] || '').trim();
    
    return {
      driverId,
      driverName: String(obj['Driver'] || ''),
      safetyScore: Number(obj['Safety Score']) || 0,
      openSafetyEvents: Number(obj['Open Safety Events']) || 0,
      criticalEvents: Number(obj['Critical Events']) || 0,
      lastSafetyEventDate: parseToDate(String(obj['Last Safety Event Date'])),
      lastSafetyEventType: String(obj['Last Safety Event Type'] || ''),
      coachingStatus: String(obj['Coaching Status'] || ''),
      lastCoachingDate: parseToDate(String(obj['Last Coaching Date'])),
      correctiveActionDue: parseToDate(String(obj['Corrective Action Due'])),
      dispatchEligibilityImpact: String(obj['Dispatch Eligibility Impact'] || ''),
      settlementImpact: String(obj['Settlement Impact'] || ''),
      insuranceRiskBand: String(obj['Insurance Risk Band'] || ''),
      evidencePacketStatus: String(obj['Evidence Packet Status'] || ''),
      managerActionRequired: parseBoolean(obj['Manager Action Required']),
      safetyActionStatus: String(obj['Safety Action Status'] || ''),
    };
  }).filter(record => record.driverId && validDrivers.includes(record.driverId));
}

function parseSafetyEvents(data: string[][]): SafetyEvent[] {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return {
      eventId: String(obj['Event ID'] || ''),
      driverId: String(obj['Driver ID'] || ''),
      driverName: String(obj['Driver Name'] || ''),
      eventType: String(obj['Event Type'] || ''),
      severity: String(obj['Severity'] || ''),
      status: String(obj['Status'] || ''),
      timestamp: parseToDate(String(obj['Timestamp'])),
      unit: String(obj['Unit'] || ''),
      location: String(obj['Location'] || ''),
      details: String(obj['Details'] || ''),
      driverPhotoUrl: String(obj['Driver Photo URL'] || ''),
      exportStatus: String(obj['Export Status'] || ''),
      eventPhotoUrl: String(obj['Event Photo URL'] || ''),
      insuranceClaimId: String(obj['Insurance Claim ID'] || ''),
      claimStatus: String(obj['Claim Status'] || ''),
      claimType: String(obj['Claim Type'] || ''),
      dateOfLoss: parseToDate(String(obj['Date of Loss'])),
      claimAmount: Number(obj['Claim Amount']) || 0,
      deductibleAmount: Number(obj['Deductible Amount']) || 0,
      adjusterName: String(obj['Adjuster Name'] || ''),
      insurerName: String(obj['Insurer Name'] || ''),
      policyNumber: String(obj['Policy Number'] || ''),
      claimNotes: String(obj['Claim Notes'] || ''),
      rfidRelated: parseBoolean(obj['RFID Related?']),
      linkedLoadId: normalizeDemoLoadId(String(obj['Linked Load ID'] || '')),
      linkedDriverDocument: String(obj['Linked Driver Document'] || ''),
      claimExposureBand: String(obj['Claim Exposure Band'] || ''),
      insuranceClaimNeeded: parseBoolean(obj['Insurance Claim Needed?']),
      preventable: parseBoolean(obj['Preventable?']),
      rootCause: String(obj['Root Cause'] || ''),
      csaBasicCategory: String(obj['CSA BASIC Category'] || ''),
      dotRecordable: parseBoolean(obj['DOT Recordable?']),
      policeReportRequired: parseBoolean(obj['Police Report Required?']),
      driverStatementRequired: parseBoolean(obj['Driver Statement Required?']),
      coachingRequired: parseBoolean(obj['Coaching Required?']),
      coachingAssignedTo: String(obj['Coaching Assigned To'] || ''),
      correctiveAction: String(obj['Corrective Action'] || ''),
      correctiveActionStatus: String(obj['Corrective Action Status'] || ''),
      correctiveActionDueDate: parseToDate(String(obj['Corrective Action Due Date'])),
      closedDate: parseToDate(String(obj['Closed Date'])),
      reviewedBy: String(obj['Reviewed By'] || ''),
      reviewTimestamp: parseToDate(String(obj['Review Timestamp'])),
      driverAcknowledged: parseBoolean(obj['Driver Acknowledged?']),
      driverAcknowledgmentTimestamp: parseToDate(String(obj['Driver Acknowledgment Timestamp'])),
      settlementHold: parseBoolean(obj['Settlement Hold?']),
      settlementHoldAmount: Number(obj['Settlement Hold Amount']) || 0,
      dispatchBlock: parseBoolean(obj['Dispatch Block?']),
      evidencePacketComplete: parseBoolean(obj['Evidence Packet Complete?']),
      dashcamClipUrl: String(obj['Dashcam Clip URL'] || ''),
      telematicsSource: String(obj['Telematics Source'] || ''),
      safetyActionStatus: String(obj['Safety Action Status'] || ''),
    };
  });
}

function parseSafetyKpiSource(data: string[][]): SafetyKpiSource[] {
  const [headers, ...rows] = data;
  const metricHeaderIndex = data.findIndex(row => String(row[0] || '').trim() === 'Metric' && String(row[1] || '').trim() === 'Value');
  if (metricHeaderIndex >= 0) {
    return data.slice(metricHeaderIndex + 1)
      .filter(row => String(row[0] || '').trim())
      .map(row => ({
        kpiCategory: 'Safety Operations',
        kpiName: String(row[0] || ''),
        kpiValue: Number(row[1]) || 0,
        kpiTarget: Number(row[1]) || 1,
        kpiTrend: '',
        kpiUnit: '',
        kpiDescription: String(row[3] || ''),
        driverId: undefined,
        loadId: undefined,
        period: 'Current demo period',
      }));
  }

  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return {
      kpiCategory: String(obj['KPI Category'] || ''),
      kpiName: String(obj['KPI Name'] || ''),
      kpiValue: Number(obj['KPI Value']) || 0,
      kpiTarget: Number(obj['KPI Target']) || 0,
      kpiTrend: String(obj['KPI Trend'] || ''),
      kpiUnit: String(obj['KPI Unit'] || ''),
      kpiDescription: String(obj['KPI Description'] || ''),
      driverId: String(obj['Driver ID'] || undefined),
      loadId: String(obj['Load ID'] || undefined),
      period: String(obj['Period'] || ''),
    };
  });
}

function parseAssets(data: string[][]): Asset[] {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return {
      assetId: String(obj['Asset ID'] || ''),
      assetType: String(obj['Asset Type'] || ''),
      make: String(obj['Make'] || ''),
      model: String(obj['Model'] || ''),
      year: Number(obj['Year']) || 0,
      vin: String(obj['VIN'] || ''),
      licensePlate: String(obj['License Plate'] || ''),
      status: String(obj['Status'] || ''),
      currentDriverId: String(obj['Current Driver ID'] || ''),
      currentLocation: String(obj['Current Location'] || ''),
      mileage: Number(obj['Mileage']) || 0,
      lastMaintenanceDate: String(obj['Last Maintenance Date'] || ''),
      nextPmDue: String(obj['Next PM Due'] || ''),
      dotInspectionDue: String(obj['DOT Inspection Due'] || ''),
      insuranceExpiry: String(obj['Insurance Expiry'] || ''),
      registrationExpiry: String(obj['Registration Expiry'] || ''),
      readinessStatus: String(obj['Readiness Status'] || ''),
      managerActionRequired: Boolean(obj['Manager Action Required']),
    };
  });
}

function parseMaintenanceWorkOrders(data: string[][]): MaintenanceWorkOrder[] {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return {
      workOrderId: String(obj['Work Order ID'] || ''),
      assetId: String(obj['Asset ID'] || ''),
      driverId: String(obj['Driver ID'] || ''),
      issueType: String(obj['Issue Type'] || ''),
      severity: String(obj['Severity'] || ''),
      reportedDate: parseToDate(String(obj['Reported Date'])),
      reportedBy: String(obj['Reported By'] || ''),
      source: String(obj['Source'] || ''),
      mileage: Number(obj['Mileage']) || 0,
      defectDescription: String(obj['Defect Description'] || ''),
      photoEvidenceUrl: String(obj['Photo Evidence URL'] || ''),
      dotImpact: Boolean(obj['DOT Impact']),
      dispatchBlock: Boolean(obj['Dispatch Block?']),
      repairStatus: String(obj['Repair Status'] || ''),
      vendorName: String(obj['Vendor Name'] || ''),
      estimatedCost: Number(obj['Estimated Cost']) || 0,
      actualCost: Number(obj['Actual Cost']) || 0,
      scheduledRepairDate: parseToDate(String(obj['Scheduled Repair Date'])),
      completedDate: parseToDate(String(obj['Completed Date'])),
      nextPmDue: parseToDate(String(obj['Next PM Due'])),
      managerActionRequired: Boolean(obj['Manager Action Required']),
    };
  });
}

function parseComplianceActionQueue(data: string[][]): ComplianceActionQueue[] {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    const driverId = String(obj['Driver ID'] || '');
    let documentType = String(obj['Document Type'] || '');
    let issueType = String(obj['Issue Type'] || '');
    let requiredFix = String(obj['Required Fix'] || '');
    let fixLink = String(obj['Fix Link'] || '');
    let complianceArea = String(obj['Compliance Area'] || '');

    if (driverId === 'DRV-001') {
      fixLink = '/loads/L001';
      complianceArea = 'Dispatch Proof';
      documentType = 'Seal Exception Packet';
      issueType = 'Seal mismatch review required';
      requiredFix = 'Review pickup seal, delivery seal, BOL, POD, and RFID proof before releasing the hold';
    } else if (driverId === 'DRV-007') {
      fixLink = '/loads/L007#lumper-workflow';
      complianceArea = 'Settlement Proof';
      documentType = 'QR Lumper Closeout';
      issueType = 'QR lumper authorization and Zelle payment closeout pending';
      requiredFix = 'Match QR dock authorization, empty-trailer proof, and Zelle payment confirmation before releasing accessorial closeout';
    } else if (driverId === 'DRV-010') {
      fixLink = '/portals/driver/DRV-010';
      complianceArea = 'Safety/HOS';
      documentType = 'HOS Coaching Acknowledgment';
      issueType = 'HOS coaching acknowledgment missing';
      requiredFix = 'Complete HOS coaching, collect driver acknowledgment, and confirm the reroute/fatigue follow-up is documented';
    } else {
      fixLink = normalizeLegacyLoadPath(fixLink);
    }

    return {
      actionId: String(obj['Action ID'] || ''),
      driverId,
      driverName: String(obj['Driver Name'] || ''),
      complianceArea,
      documentType,
      issueType,
      severity: String(obj['Severity'] || ''),
      status: String(obj['Status'] || ''),
      dueDate: String(obj['Due Date'] || ''),
      daysUntilDue: Number(obj['Days Until Due']) || 0,
      dispatchEligibilityImpact: String(obj['Dispatch Eligibility Impact'] || ''),
      settlementImpact: String(obj['Settlement Impact'] || ''),
      assignedTo: String(obj['Assigned To'] || ''),
      lastReviewedBy: String(obj['Last Reviewed By'] || ''),
      lastReviewedDate: String(obj['Last Reviewed Date'] || ''),
      requiredFix,
      fixLink,
      managerActionRequired: Boolean(obj['Manager Action Required']),
    };
  });
}

function parseRfidEvents(data: string[][]): RfidEvent[] {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return {
      rfidEventId: String(obj['RFID Event ID'] || ''),
      loadId: String(obj['Load ID'] || ''),
      assetId: String(obj['Asset ID'] || ''),
      trailerId: String(obj['Trailer ID'] || ''),
      cargoTagId: String(obj['Cargo Tag ID'] || ''),
      driverId: String(obj['Driver ID'] || ''),
      eventType: String(obj['Event Type'] || ''),
      scanTimestamp: parseToDate(String(obj['Scan Timestamp'])),
      scanLocation: String(obj['Scan Location'] || ''),
      expectedLocation: String(obj['Expected Location'] || ''),
      scanStatus: String(obj['Scan Status'] || ''),
      exceptionType: String(obj['Exception Type'] || ''),
      temperatureReading: Number(obj['Temperature Reading']) || 0,
      sealMatchStatus: String(obj['Seal Match Status'] || ''),
      geoFenceStatus: String(obj['GeoFence Status'] || ''),
      readerSource: String(obj['Reader Source'] || ''),
      proofImpact: String(obj['Proof Impact'] || ''),
      dispatchImpact: String(obj['Dispatch Impact'] || ''),
      settlementImpact: String(obj['Settlement Impact'] || ''),
      managerActionRequired: Boolean(obj['Manager Action Required']),
    };
  });
}

function firstValue(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function firstNumber(obj: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseWorkbookBoolean(value: unknown): boolean {
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['true', 'yes', 'y', '1', 'complete', 'ready', 'recommended', 'required'].includes(normalized);
}

function normalizePayrollDriverId(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.startsWith('DVR-')) return trimmed.replace('DVR-', 'DRV-');
  return trimmed;
}

function normalizeDemoLoadId(value: string): string {
  const trimmed = value.trim();
  const legacyMatch = trimmed.match(/^L-(\d{3})$/i);
  if (!legacyMatch) return trimmed;

  const sequence = Number(legacyMatch[1]) - 500;
  if (!Number.isFinite(sequence) || sequence < 1 || sequence > 999) return trimmed;
  return `L${String(sequence).padStart(3, '0')}`;
}

function normalizeLegacyLoadPath(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/L-(\d{3})/i);
  if (!match) return trimmed;
  const canonicalLoadId = normalizeDemoLoadId(`L-${match[1]}`);
  if (/^\/dispatch\//i.test(trimmed) || /\/proof\b/i.test(trimmed)) return `/loads/${canonicalLoadId}`;
  return trimmed.replace(match[0], canonicalLoadId);
}

function riskLabelFromScore(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 50) return 'Medium';
  if (score > 0) return 'Low';
  return '';
}

function safetyRatingFromText(value: string): number {
  switch (value.trim().toLowerCase()) {
    case 'high':
      return 5;
    case 'medium':
      return 4;
    case 'low':
      return 3;
    default:
      return 0;
  }
}

function parseRouteIntelligence(data: string[][]): RouteIntelligence[] {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const routeData: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      routeData[header] = row[index];
    });
    const routeRiskScore = firstNumber(routeData, ['Route Risk Score']);
    const restStopsPlanned = firstNumber(routeData, ['Rest Stops Planned']);
    const fuelStopsPlanned = firstNumber(routeData, ['Fuel Stops Planned']);
    const routeNotes = firstValue(routeData, ['Route Notes', 'Route Summary']);
    return {
      routeId: firstValue(routeData, ['Route ID']),
      loadId: normalizeDemoLoadId(firstValue(routeData, ['Load ID'])),
      driverId: firstValue(routeData, ['Driver ID']),
      origin: firstValue(routeData, ['Origin']),
      destination: firstValue(routeData, ['Destination']),
      originCoordinates: [firstNumber(routeData, ['Origin Latitude']), firstNumber(routeData, ['Origin Longitude'])],
      destinationCoordinates: [firstNumber(routeData, ['Destination Latitude']), firstNumber(routeData, ['Destination Longitude'])],
      mileage: firstNumber(routeData, ['Mileage', 'Planned Miles']),
      estimatedDriveTime:
        firstNumber(routeData, ['Estimated Drive Time']) ||
        Math.round(firstNumber(routeData, ['Estimated Drive Hours']) * 60),
      routeRisk: firstValue(routeData, ['Route Risk']) || riskLabelFromScore(routeRiskScore),
      hosPlanningNotes:
        firstValue(routeData, ['HOS Planning Notes']) ||
        `${restStopsPlanned} planned rest stop${restStopsPlanned === 1 ? '' : 's'} and ${fuelStopsPlanned} fuel stop${fuelStopsPlanned === 1 ? '' : 's'} on this route.`,
      weatherRisk: firstValue(routeData, ['Weather Risk']),
      trafficRisk: firstValue(routeData, ['Traffic Risk']),
      recommendedRestStops: splitList(firstValue(routeData, ['Recommended Rest Stops'])),
      fuelStops: splitList(firstValue(routeData, ['Fuel Stops'])),
      routeSummary: routeNotes,
      managerActionRequired: parseWorkbookBoolean(routeData['Manager Action Required']),
    };
  });
}

function parseDieselPricing(data: string[][]): DieselPricing[] {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    const stationName = firstValue(obj, ['Location', 'Station Name']);
    const city = firstValue(obj, ['City']);
    const state = firstValue(obj, ['State']);
    const brand = firstValue(obj, ['Brand']);
    const location = stationName && city && state ? `${stationName} - ${city}, ${state}` : stationName;
    const recommended = firstValue(obj, ['Preferred Stop', 'Fuel Stop Recommended?']);
    return {
      pricingId: firstValue(obj, ['Pricing ID', 'Price ID']),
      routeId: firstValue(obj, ['Route ID']),
      loadId: normalizeDemoLoadId(firstValue(obj, ['Load ID'])),
      location,
      brand,
      coordinates: [firstNumber(obj, ['Latitude']), firstNumber(obj, ['Longitude'])],
      dieselPrice: firstNumber(obj, ['Diesel Price', 'Demo Diesel Price']),
      priceTimestamp: firstValue(obj, ['Price Timestamp']),
      source: firstValue(obj, ['Source', 'Source Type']),
      routePosition: firstNumber(obj, ['Route Position', 'Stop Sequence']),
      preferredStop: ['yes', 'preferred'].includes(recommended.trim().toLowerCase()),
      estimatedGallons: firstNumber(obj, ['Estimated Gallons', 'Gallons Planned']),
      estimatedFuelCost: firstNumber(obj, ['Estimated Fuel Cost']),
      savingsOpportunity: firstNumber(obj, ['Savings Opportunity']),
      amenities: splitList(firstValue(obj, ['Amenities'])),
      managerActionRequired: parseWorkbookBoolean(obj['Manager Action Required']),
      currency: firstValue(obj, ['Currency']) || 'USD',
    };
  });
}

function parseRestStopLocations(data: string[][]): RestStopLocation[] {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    const stopName = firstValue(obj, ['Location', 'Rest Stop Name']);
    const city = firstValue(obj, ['City']);
    const state = firstValue(obj, ['State']);
    const location = stopName && city && state ? `${stopName} - ${city}, ${state}` : stopName;
    const amenities = splitList(firstValue(obj, ['Amenities']));
    const parkingConfidence = firstValue(obj, ['Parking Confidence']);
    const safetyRating = firstNumber(obj, ['Safety Rating']) || safetyRatingFromText(firstValue(obj, ['Security Level', 'Parking Confidence']));
    const parkingAvailable =
      parseWorkbookBoolean(obj['Parking Available']) ||
      ['high', 'medium'].includes(parkingConfidence.trim().toLowerCase());
    return {
      stopId: firstValue(obj, ['Stop ID', 'Rest Stop ID']),
      routeId: firstValue(obj, ['Route ID']),
      loadId: normalizeDemoLoadId(firstValue(obj, ['Load ID'])),
      location,
      coordinates: [firstNumber(obj, ['Latitude']), firstNumber(obj, ['Longitude'])],
      distanceFromRoute: firstNumber(obj, ['Distance from Route', 'Distance From Route', 'Distance From Origin']),
      parkingAvailable,
      parkingSpaces: firstNumber(obj, ['Parking Spaces']) || (parkingAvailable ? 25 : 0),
      showerAvailable: parseWorkbookBoolean(obj['Shower Available']) || amenities.some((a) => /shower/i.test(a)),
      foodAvailable: parseWorkbookBoolean(obj['Food Available']) || amenities.some((a) => /food/i.test(a)),
      amenities,
      safetyRating,
      recommendedForHos:
        parseWorkbookBoolean(obj['Recommended for HOS']) ||
        firstValue(obj, ['HOS Break Fit', 'Stop Type']).trim().length > 0,
      hosBreakRecommendation: firstValue(obj, ['HOS Break Recommendation', 'HOS Break Fit', 'Manager Note']),
      managerActionRequired: parseWorkbookBoolean(obj['Manager Action Required']),
    };
  });
}

function parseOperationalRiskQueue(data: string[][]): OperationalRiskQueue[] {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return {
      riskId: String(obj['Risk ID'] || ''),
      module: String(obj['Module'] || ''),
      driverId: String(obj['Driver ID'] || ''),
      loadId: String(obj['Load ID'] || ''),
      assetId: String(obj['Asset ID'] || ''),
      relatedEventId: String(obj['Related Event ID'] || ''),
      riskType: String(obj['Risk Type'] || ''),
      severity: String(obj['Severity'] || ''),
      status: String(obj['Status'] || ''),
      businessImpact: String(obj['Business Impact'] || ''),
      dispatchImpact: String(obj['Dispatch Impact'] || ''),
      settlementImpact: String(obj['Settlement Impact'] || ''),
      complianceImpact: String(obj['Compliance Impact'] || ''),
      insuranceImpact: String(obj['Insurance Impact'] || ''),
      dueDate: String(obj['Due Date'] || ''),
      assignedTo: String(obj['Assigned To'] || ''),
      recommendedAction: String(obj['Recommended Action'] || ''),
      resolutionStatus: String(obj['Resolution Status'] || ''),
      resolvedDate: String(obj['Resolved Date'] || ''),
      managerActionRequired: Boolean(obj['Manager Action Required']),
    };
  });
}

/**
 * Helper functions for parsing complex fields
 */
function parseBoolean(value: unknown): boolean {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === '1' || normalized === 'complete';
}

/**
 * Main API functions
 */

/**
 * Load V3 operational data with caching
 */
export async function getV3OperationalData(forceRefresh = false): Promise<V3OperationalData> {
  const now = Date.now();
  
  // Return cached data if available and not expired
  if (!forceRefresh && v3DataCache && (now - lastLoadAttempt) < CACHE_DURATION) {
    return v3DataCache;
  }
  
  // Prevent concurrent loading
  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (v3DataCache) return v3DataCache;
  }
  
  isLoading = true;
  lastLoadAttempt = now;
  
  try {
    const workbookPath = getWorkbookPath();
    v3DataCache = await parseV3Workbook(workbookPath);
    return v3DataCache;
  } catch (err) {
    console.error('❌ Failed to load v3 operational workbook:', err);
    throw err;
  } finally {
    isLoading = false;
  }
}

/**
 * Check if V3 data is available
 */
export async function isV3DataAvailable(): Promise<boolean> {
  try {
    await getV3OperationalData();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get specific data helpers
 */
export async function getWeeklySettlements(): Promise<WeeklySettlement[]> {
  const data = await getV3OperationalData();
  return data.weeklySettlements;
}

export async function getSettlementHolds(): Promise<SettlementHold[]> {
  const data = await getV3OperationalData();
  return data.settlementHolds;
}

export async function getMainSafetyData(): Promise<MainSafety[]> {
  const data = await getV3OperationalData();
  return data.mainSafety;
}

export async function getSafetyEvents(): Promise<SafetyEvent[]> {
  const data = await getV3OperationalData();
  return data.safetyEvents;
}

export async function getAssets(): Promise<Asset[]> {
  const data = await getV3OperationalData();
  return data.assets;
}

export async function getMaintenanceWorkOrders(): Promise<MaintenanceWorkOrder[]> {
  const data = await getV3OperationalData();
  return data.maintenanceWorkOrders;
}

export async function getComplianceActionQueue(): Promise<ComplianceActionQueue[]> {
  const data = await getV3OperationalData();
  return data.complianceActionQueue;
}

export async function getRfidEvents(): Promise<RfidEvent[]> {
  const data = await getV3OperationalData();
  return data.rfidEvents;
}

export async function getRouteIntelligence(): Promise<RouteIntelligence[]> {
  const data = await getV3OperationalData();
  return data.routeIntelligence;
}

export async function getDieselPricing(): Promise<DieselPricing[]> {
  const data = await getV3OperationalData();
  return data.dieselPricing;
}

export async function getRestStopLocations(): Promise<RestStopLocation[]> {
  const data = await getV3OperationalData();
  return data.restStopLocations;
}

export async function getOperationalRiskQueue(): Promise<OperationalRiskQueue[]> {
  const data = await getV3OperationalData();
  return data.operationalRiskQueue;
}

/**
 * Filter helpers
 */
export async function getSettlementsForDriver(driverId: string): Promise<WeeklySettlement[]> {
  const settlements = await getWeeklySettlements();
  return settlements.filter(s => s.driverId === driverId);
}

export async function getSettlementsForWeek(weekEnding: string): Promise<WeeklySettlement[]> {
  const settlements = await getWeeklySettlements();
  return settlements.filter(s => s.weekEnding === weekEnding);
}

export async function getSafetyEventsForDriver(driverId: string): Promise<SafetyEvent[]> {
  const events = await getSafetyEvents();
  return events.filter(e => e.driverId === driverId);
}

export async function getMaintenanceForAsset(assetId: string): Promise<MaintenanceWorkOrder[]> {
  const orders = await getMaintenanceWorkOrders();
  return orders.filter(o => o.assetId === assetId);
}

export async function getComplianceIssuesForDriver(driverId: string): Promise<ComplianceActionQueue[]> {
  const issues = await getComplianceActionQueue();
  return issues.filter(i => i.driverId === driverId);
}

export async function getRfidEventsForLoad(loadId: string): Promise<RfidEvent[]> {
  const events = await getRfidEvents();
  return events.filter(e => e.loadId === loadId);
}

export async function getRouteIntelligenceForLoad(loadId: string): Promise<RouteIntelligence | null> {
  const routes = await getRouteIntelligence();
  return routes.find(r => r.loadId === loadId) || null;
}

export async function getOperationalRisksForDriver(driverId: string): Promise<OperationalRiskQueue[]> {
  const risks = await getOperationalRiskQueue();
  return risks.filter(r => r.driverId === driverId);
}
