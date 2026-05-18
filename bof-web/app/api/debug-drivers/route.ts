/**
 * API endpoint to debug driver count issue in V4 workbook
 * GET /api/debug-drivers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getV3OperationalData } from '@/lib/v3-operational-loader';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging V4 workbook driver IDs...');
    
    // Load the data
    const v3Data = await getV3OperationalData();
    
    // Collect all driver IDs from each sheet
    const weeklySettlementDrivers = v3Data.weeklySettlements.map(s => ({ driverId: s.driverId, sheet: 'Weekly_Settlements' }));
    const mainSafetyDrivers = v3Data.mainSafety.map(s => ({ driverId: s.driverId, sheet: 'Main_Safety' }));
    const safetyEventsDrivers = v3Data.safetyEvents.map(e => ({ driverId: e.driverId, sheet: 'Safety_Events' }));
    const complianceActionDrivers = v3Data.complianceActionQueue.map(a => ({ driverId: a.driverId, sheet: 'Compliance_Action_Queue' }));
    const rfidEventsDrivers = v3Data.rfidEvents.map(r => ({ driverId: r.driverId, sheet: 'RFID_Events' }));
    
    // Combine all driver entries
    const allDriverEntries = [
      ...weeklySettlementDrivers,
      ...mainSafetyDrivers,
      ...safetyEventsDrivers,
      ...complianceActionDrivers,
      ...rfidEventsDrivers,
    ];
    
    // Get distinct driver IDs
    const distinctDriverIds = [...new Set(allDriverEntries.map(e => e.driverId))];
    
    // Expected drivers
    const expectedDrivers = ['DRV-001', 'DRV-002', 'DRV-003', 'DRV-004', 'DRV-005', 'DRV-006', 'DRV-007', 'DRV-008', 'DRV-009', 'DRV-010', 'DRV-011', 'DRV-012'];
    
    // Find extra/invalid drivers
    const extraDrivers = distinctDriverIds.filter(id => !expectedDrivers.includes(id));
    const missingDrivers = expectedDrivers.filter(id => !distinctDriverIds.includes(id));
    
    // Group drivers by sheet for detailed analysis
    const driversBySheet = {
      'Weekly_Settlements': weeklySettlementDrivers.map(e => e.driverId),
      'Main_Safety': mainSafetyDrivers.map(e => e.driverId),
      'Safety_Events': safetyEventsDrivers.map(e => e.driverId),
      'Compliance_Action_Queue': complianceActionDrivers.map(e => e.driverId),
      'RFID_Events': rfidEventsDrivers.map(e => e.driverId),
    };
    
    // Find which sheet contains the invalid driver
    const invalidDriverSources: Record<string, string[]> = {};
    extraDrivers.forEach(invalidId => {
      invalidDriverSources[invalidId] = [];
      Object.entries(driversBySheet).forEach(([sheet, drivers]) => {
        if (drivers.includes(invalidId)) {
          invalidDriverSources[invalidId].push(sheet);
        }
      });
    });
    
    const debugReport = {
      success: true,
      summary: {
        totalDistinctDrivers: distinctDriverIds.length,
        expectedCount: expectedDrivers.length,
        extraDriversCount: extraDrivers.length,
        missingDriversCount: missingDrivers.length,
      },
      expectedDrivers,
      actualDistinctDrivers: distinctDriverIds,
      extraDrivers,
      missingDrivers,
      invalidDriverSources,
      driversBySheet,
      sheetCounts: {
        weeklySettlements: weeklySettlementDrivers.length,
        mainSafety: mainSafetyDrivers.length,
        safetyEvents: safetyEventsDrivers.length,
        complianceActionQueue: complianceActionDrivers.length,
        rfidEvents: rfidEventsDrivers.length,
      },
      allDriverEntries: allDriverEntries,
    };
    
    console.log('🔍 Driver Debug Report:');
    console.log(`  Total distinct drivers: ${debugReport.summary.totalDistinctDrivers}`);
    console.log(`  Expected drivers: ${debugReport.summary.expectedCount}`);
    console.log(`  Extra drivers: ${extraDrivers.join(', ')}`);
    console.log(`  Missing drivers: ${missingDrivers.join(', ')}`);
    
    if (extraDrivers.length > 0) {
      console.log('🚨 Invalid driver sources:');
      Object.entries(invalidDriverSources).forEach(([driverId, sheets]) => {
        console.log(`  ${driverId}: found in ${sheets.join(', ')}`);
      });
    }
    
    return NextResponse.json(debugReport);
    
  } catch (error) {
    console.error('❌ Driver debug failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to debug driver IDs'
    }, { status: 500 });
  }
}
