#!/usr/bin/env node

/**
 * Check the current demo data to see what's actually in it
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function checkCurrentDemoData() {
  const demoDataPath = path.join(ROOT, "lib", "demo-data.json");
  
  console.log(`\n📊 CURRENT DEMO DATA CHECK`);
  console.log(`Demo data file: ${demoDataPath}`);
  
  if (!fs.existsSync(demoDataPath)) {
    console.log(`❌ Demo data file not found: ${demoDataPath}`);
    return;
  }
  
  try {
    const demoData = JSON.parse(fs.readFileSync(demoDataPath, "utf8"));
    const settlements = demoData.settlements || [];
    
    console.log(`\n📈 SETTLEMENT DATA SUMMARY:`);
    console.log(`Total settlement rows: ${settlements.length}`);
    
    console.log(`\n📋 DRIVER IDs IN DEMO DATA:`);
    const driverIds = settlements.map(s => s.driverId);
    driverIds.forEach((id, index) => {
      console.log(`${index + 1}. ${id}`);
    });
    
    console.log(`\n💰 DEDUCTION VALUES IN DEMO DATA:`);
    console.log(`┌─────────────┬─────────────────┬─────────────────┐`);
    console.log(`│ Driver ID   │ Total Deductions│ Net Pay         │`);
    console.log(`├─────────────┼─────────────────┼─────────────────┤`);
    
    settlements.forEach((settlement) => {
      const driverId = settlement.driverId || 'N/A';
      const deductions = settlement.totalDeductions || settlement.deductions || 0;
      const netPay = settlement.netPay || 0;
      
      console.log(`│ ${driverId.padEnd(11)} │ $${deductions.toFixed(2).padEnd(15)} │ $${netPay.toFixed(2).padEnd(15)} │`);
    });
    
    console.log(`└─────────────┴─────────────────┴─────────────────┘`);
    
    // Check if any have non-zero deductions
    const withDeductions = settlements.filter(s => (s.totalDeductions || s.deductions || 0) > 0);
    console.log(`\n📊 DEDUCTION ANALYSIS:`);
    console.log(`Drivers with deductions > 0: ${withDeductions.length}`);
    console.log(`Drivers with deductions = 0: ${settlements.length - withDeductions.length}`);
    
    if (withDeductions.length > 0) {
      console.log(`\n✅ SOME DRIVERS HAVE DEDUCTIONS:`);
      withDeductions.forEach(settlement => {
        console.log(`  ${settlement.driverId}: $${(settlement.totalDeductions || settlement.deductions || 0).toFixed(2)}`);
      });
    } else {
      console.log(`\n❌ ALL DRIVERS HAVE $0 DEDUCTIONS`);
    }
    
    // Check for duplicate driver IDs
    const uniqueIds = new Set(driverIds);
    if (uniqueIds.size !== driverIds.length) {
      console.log(`\n⚠️ DUPLICATE DRIVER IDS DETECTED!`);
      console.log(`Unique IDs: ${uniqueIds.size}`);
      console.log(`Total rows: ${driverIds.length}`);
      
      // Show duplicates
      const idCounts = {};
      driverIds.forEach(id => {
        idCounts[id] = (idCounts[id] || 0) + 1;
      });
      
      Object.entries(idCounts).forEach(([id, count]) => {
        if (count > 1) {
          console.log(`  ${id}: ${count} occurrences`);
        }
      });
    } else {
      console.log(`\n✅ NO DUPLICATE DRIVER IDS`);
    }
    
  } catch (error) {
    console.log(`❌ Error reading demo data: ${error.message}`);
  }
}

checkCurrentDemoData();
