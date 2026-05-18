/**
 * V3 Operational Elite Workbook Loader
 * Source: public/data/main-source-v3_operational_elite_enhanced.xlsx
 * 
 * This loader provides access to all operational data from the v3 workbook
 * with fallback to v2 data when v3 is not available.
 */

import * as XLSX from 'xlsx';
import { parseToDate } from './date-utils';
import type {
  V3OperationalData,
  WeeklySettlement,
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
      settlementPacketComplete: Boolean(obj['SettlementPacketComplete']),
      settlementApprovedBy: String(obj['SettlementApprovedBy'] || ''),
      settlementApprovalTimestamp: parseToDate(String(obj['SettlementApprovalTimestamp'])),
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
      loadId: String(obj['Load ID'] || ''),
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
      driverId: driverId,
      safetyScore: Number(obj['SafetyScore']) || 0,
      openSafetyEvents: Number(obj['OpenSafetyEvents']) || 0,
      criticalEvents: Number(obj['CriticalEvents']) || 0,
      lastSafetyEventDate: parseToDate(String(obj['LastSafetyEventDate'])),
      lastSafetyEventType: String(obj['LastSafetyEventType'] || ''),
      coachingStatus: String(obj['CoachingStatus'] || ''),
      lastCoachingDate: parseToDate(String(obj['LastCoachingDate'])),
      correctiveActionDue: parseToDate(String(obj['CorrectiveActionDue'])),
      dispatchEligibilityImpact: String(obj['DispatchEligibilityImpact'] || ''),
      settlementImpact: String(obj['SettlementImpact'] || ''),
      insuranceRiskBand: String(obj['InsuranceRiskBand'] || ''),
      evidencePacketStatus: String(obj['EvidencePacketStatus'] || ''),
      managerActionRequired: Boolean(obj['ManagerActionRequired']),
      safetyActionStatus: String(obj['SafetyActionStatus'] || ''),
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
      rfidRelated: Boolean(obj['RFID Related?']),
      linkedLoadId: String(obj['Linked Load ID'] || ''),
      linkedDriverDocument: String(obj['Linked Driver Document'] || ''),
      claimExposureBand: String(obj['Claim Exposure Band'] || ''),
      insuranceClaimNeeded: Boolean(obj['Insurance Claim Needed?']),
      preventable: Boolean(obj['Preventable?']),
      rootCause: String(obj['Root Cause'] || ''),
      csaBasicCategory: String(obj['CSA BASIC Category'] || ''),
      dotRecordable: Boolean(obj['DOT Recordable?']),
      policeReportRequired: Boolean(obj['Police Report Required?']),
      driverStatementRequired: Boolean(obj['Driver Statement Required?']),
      coachingRequired: Boolean(obj['Coaching Required?']),
      coachingAssignedTo: String(obj['Coaching Assigned To'] || ''),
      correctiveAction: String(obj['Corrective Action'] || ''),
      correctiveActionStatus: String(obj['Corrective Action Status'] || ''),
      correctiveActionDueDate: parseToDate(String(obj['Corrective Action Due Date'])),
      closedDate: parseToDate(String(obj['Closed Date'])),
      reviewedBy: String(obj['Reviewed By'] || ''),
      reviewTimestamp: parseToDate(String(obj['Review Timestamp'])),
      driverAcknowledged: Boolean(obj['Driver Acknowledged?']),
      driverAcknowledgmentTimestamp: parseToDate(String(obj['Driver Acknowledgment Timestamp'])),
      settlementHold: Boolean(obj['Settlement Hold?']),
      settlementHoldAmount: Number(obj['Settlement Hold Amount']) || 0,
      dispatchBlock: Boolean(obj['Dispatch Block?']),
      evidencePacketComplete: Boolean(obj['Evidence Packet Complete?']),
      dashcamClipUrl: String(obj['Dashcam Clip URL'] || ''),
      telematicsSource: String(obj['Telematics Source'] || ''),
      safetyActionStatus: String(obj['Safety Action Status'] || ''),
    };
  });
}

function parseSafetyKpiSource(data: string[][]): SafetyKpiSource[] {
  const [headers, ...rows] = data;
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
    return {
      actionId: String(obj['Action ID'] || ''),
      driverId: String(obj['Driver ID'] || ''),
      driverName: String(obj['Driver Name'] || ''),
      complianceArea: String(obj['Compliance Area'] || ''),
      documentType: String(obj['Document Type'] || ''),
      issueType: String(obj['Issue Type'] || ''),
      severity: String(obj['Severity'] || ''),
      status: String(obj['Status'] || ''),
      dueDate: String(obj['Due Date'] || ''),
      daysUntilDue: Number(obj['Days Until Due']) || 0,
      dispatchEligibilityImpact: String(obj['Dispatch Eligibility Impact'] || ''),
      settlementImpact: String(obj['Settlement Impact'] || ''),
      assignedTo: String(obj['Assigned To'] || ''),
      lastReviewedBy: String(obj['Last Reviewed By'] || ''),
      lastReviewedDate: String(obj['Last Reviewed Date'] || ''),
      requiredFix: String(obj['Required Fix'] || ''),
      fixLink: String(obj['Fix Link'] || ''),
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

function parseRouteIntelligence(data: string[][]): RouteIntelligence[] {
  const [headers, ...rows] = data;
  return rows.map(row => {
    const routeData: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      routeData[header] = row[index];
    });
    return {
      routeId: String(routeData['Route ID'] || ''),
      loadId: String(routeData['Load ID'] || ''),
      driverId: String(routeData['Driver ID'] || ''),
      origin: String(routeData['Origin'] || ''),
      destination: String(routeData['Destination'] || ''),
      originCoordinates: [Number(routeData['Origin Latitude']) || 0, Number(routeData['Origin Longitude']) || 0],
      destinationCoordinates: [Number(routeData['Destination Latitude']) || 0, Number(routeData['Destination Longitude']) || 0],
      mileage: Number(routeData['Mileage']) || 0,
      estimatedDriveTime: Number(routeData['Estimated Drive Time']) || 0,
      routeRisk: String(routeData['Route Risk'] || ''),
      hosPlanningNotes: String(routeData['HOS Planning Notes'] || ''),
      weatherRisk: String(routeData['Weather Risk'] || ''),
      trafficRisk: String(routeData['Traffic Risk'] || ''),
      recommendedRestStops: String(routeData['Recommended Rest Stops'] || '').split(',').map(s => s.trim()).filter(s => s),
      fuelStops: String(routeData['Fuel Stops'] || '').split(',').map(s => s.trim()).filter(s => s),
      routeSummary: String(routeData['Route Summary'] || ''),
      managerActionRequired: Boolean(routeData['Manager Action Required']),
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
    return {
      pricingId: String(obj['Pricing ID'] || ''),
      location: String(obj['Location'] || ''),
      coordinates: [Number(obj['Latitude']) || 0, Number(obj['Longitude']) || 0],
      dieselPrice: Number(obj['Diesel Price']) || 0,
      priceTimestamp: String(obj['Price Timestamp'] || ''),
      source: String(obj['Source'] || ''),
      routePosition: Number(obj['Route Position']) || 0,
      preferredStop: Boolean(obj['Preferred Stop']),
      estimatedGallons: Number(obj['Estimated Gallons']) || 0,
      estimatedFuelCost: Number(obj['Estimated Fuel Cost']) || 0,
      savingsOpportunity: Number(obj['Savings Opportunity']) || 0,
      amenities: String(obj['Amenities'] || '').split(',').map(s => s.trim()).filter(s => s),
      managerActionRequired: Boolean(obj['Manager Action Required']),
      currency: String(obj['Currency'] || 'USD'),
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
    return {
      stopId: String(obj['Stop ID'] || ''),
      location: String(obj['Location'] || ''),
      coordinates: [Number(obj['Latitude']) || 0, Number(obj['Longitude']) || 0],
      distanceFromRoute: Number(obj['Distance from Route']) || 0,
      parkingAvailable: Boolean(obj['Parking Available']),
      parkingSpaces: Number(obj['Parking Spaces']) || 0,
      showerAvailable: Boolean(obj['Shower Available']),
      foodAvailable: Boolean(obj['Food Available']),
      amenities: String(obj['Amenities'] || '').split(',').map(a => a.trim()).filter(a => a),
      safetyRating: Number(obj['Safety Rating']) || 0,
      recommendedForHos: Boolean(obj['Recommended for HOS']),
      hosBreakRecommendation: String(obj['HOS Break Recommendation'] || ''),
      managerActionRequired: Boolean(obj['Manager Action Required']),
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
function parseCoordinates(coordString: string): [number, number] {
  if (!coordString) return [0, 0];
  const parts = coordString.split(',').map(s => parseFloat(s.trim()));
  return [parts[0] || 0, parts[1] || 0];
}

function parseStringArray(arrayString: string): string[] {
  if (!arrayString) return [];
  return arrayString.split(',').map(s => s.trim()).filter(s => s.length > 0);
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
  } catch (error) {
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
