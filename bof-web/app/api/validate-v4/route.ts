/**
 * API endpoint to validate V4 workbook loading and provide row count report
 * GET /api/validate-v4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getV3OperationalData, isV3DataAvailable } from '@/lib/v3-operational-loader';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting V4 workbook validation...');
    
    // Check if V3/V4 data is available
    const v3Available = await isV3DataAvailable();
    
    if (!v3Available) {
      return NextResponse.json({
        success: false,
        error: 'V3/V4 workbook data not available',
        message: 'No operational workbook found'
      }, { status: 404 });
    }
    
    // Load the data
    const v3Data = await getV3OperationalData();
    
    // Calculate distinct drivers and loads
    const distinctDrivers = new Set([
      ...v3Data.weeklySettlements.map(s => s.driverId),
      ...v3Data.mainSafety.map(s => s.driverId),
      ...v3Data.safetyEvents.map(e => e.driverId),
      ...v3Data.complianceActionQueue.map(a => a.driverId),
      ...v3Data.rfidEvents.map(r => r.driverId),
    ]);
    
    const distinctLoads = new Set([
      ...v3Data.settlementHolds.map(h => h.loadId),
      ...v3Data.safetyEvents.map(e => e.linkedLoadId),
      ...v3Data.rfidEvents.map(r => r.loadId),
      ...v3Data.routeIntelligence.map(r => r.loadId),
    ]);
    
    // Get latest week
    const latestWeek = v3Data.weeklySettlements.length > 0 
      ? Array.from(new Set(v3Data.weeklySettlements.map(s => s.weekEnding))).sort().pop()
      : "N/A";
    
    // Check if elite tabs have data
    const hasEliteTabs = v3Data.operationalRiskQueue.length > 0 || 
                        v3Data.complianceActionQueue.length > 0 || 
                        v3Data.maintenanceWorkOrders.length > 0 ||
                        v3Data.rfidEvents.length > 0 ||
                        v3Data.routeIntelligence.length > 0 ||
                        v3Data.dieselPricing.length > 0 ||
                        v3Data.restStopLocations.length > 0;
    
    const validationReport = {
      success: true,
      workbookLoaded: true,
      rowCounts: {
        weeklySettlements: v3Data.weeklySettlements.length,
        settlementHolds: v3Data.settlementHolds.length,
        operationalRiskQueue: v3Data.operationalRiskQueue.length,
        complianceActionQueue: v3Data.complianceActionQueue.length,
        maintenanceWorkOrders: v3Data.maintenanceWorkOrders.length,
        rfidEvents: v3Data.rfidEvents.length,
        routeIntelligence: v3Data.routeIntelligence.length,
        dieselPricing: v3Data.dieselPricing.length,
        restStopLocations: v3Data.restStopLocations.length,
        mainSafety: v3Data.mainSafety.length,
        safetyEvents: v3Data.safetyEvents.length,
        safetyKpiSource: v3Data.safetyKpiSource.length,
      },
      statistics: {
        distinctDrivers: distinctDrivers.size,
        distinctLoads: distinctLoads.size,
        latestSettlementWeek: latestWeek,
        distinctSettlementWeeks: new Set(v3Data.weeklySettlements.map(s => s.weekEnding)).size,
      },
      metadata: {
        totalRecords: v3Data.metadata.totalRecords,
        activeDrivers: v3Data.metadata.activeDrivers,
        activeLoads: v3Data.metadata.activeLoads,
        activeAssets: v3Data.metadata.activeAssets,
      },
      status: {
        hasEliteTabs,
        eliteTabsSummary: {
          operationalRiskQueue: v3Data.operationalRiskQueue.length > 0,
          complianceActionQueue: v3Data.complianceActionQueue.length > 0,
          maintenanceWorkOrders: v3Data.maintenanceWorkOrders.length > 0,
          rfidEvents: v3Data.rfidEvents.length > 0,
          routeIntelligence: v3Data.routeIntelligence.length > 0,
          dieselPricing: v3Data.dieselPricing.length > 0,
          restStopLocations: v3Data.restStopLocations.length > 0,
        }
      },
      readyForSafetyUpgrade: hasEliteTabs && v3Data.mainSafety.length > 0 && v3Data.safetyEvents.length > 0,
      message: hasEliteTabs 
        ? "V4 workbook loaded with elite operational data - Ready for Safety page upgrade"
        : "Workbook loaded but elite tabs are empty - Verify workbook data"
    };
    
    console.log('✅ V4 workbook validation completed');
    console.log(`📊 Row counts: ${JSON.stringify(validationReport.rowCounts, null, 2)}`);
    console.log(`🎯 Ready for Safety upgrade: ${validationReport.readyForSafetyUpgrade}`);
    
    return NextResponse.json(validationReport);
    
  } catch (error) {
    console.error('❌ V4 workbook validation failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to validate V4 workbook'
    }, { status: 500 });
  }
}
