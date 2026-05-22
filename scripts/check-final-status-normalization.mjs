#!/usr/bin/env node

/**
 * Check final status normalization after the fixes
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Copy the normalization function from the component
function normalizeSettlementStatus(status, pendingReason) {
  const normalized = status.toLowerCase().trim();
  if (normalized === "paid") return "Paid";
  if (normalized === "pending") {
    // Only mark as Needs Review if there's a specific hold/review reason
    // Otherwise keep as Pending which is a valid operational status
    if (pendingReason && (pendingReason.toLowerCase().includes("hold") || 
                         pendingReason.toLowerCase().includes("review") ||
                         pendingReason.toLowerCase().includes("block"))) {
      return "Needs Review";
    }
    return "Ready"; // Pending with valid reason is operationally ready
  }
  if (normalized === "on hold") return "Needs Review";
  if (normalized === "draft") return "Ready";
  return "Missing Source Data";
}

function checkFinalStatusNormalization() {
  const demoDataPath = path.join(ROOT, "lib", "demo-data.json");
  
  if (!fs.existsSync(demoDataPath)) {
    console.log(`❌ Demo data file not found: ${demoDataPath}`);
    return;
  }

  try {
    const demoData = JSON.parse(fs.readFileSync(demoDataPath, "utf8"));
    const settlements = demoData.settlements || [];
    
    console.log(`\n🔍 FINAL STATUS NORMALIZATION CHECK`);
    console.log(`Total settlement rows: ${settlements.length}`);
    
    console.log(`\n📋 STATUS NORMALIZATION RESULTS:`);
    console.log(`┌─────────────┬─────────────┬──────────────────┬─────────────────┬─────────────────┐`);
    console.log(`│ Driver ID   │ Raw Status  │ Pending Reason    │ Normalized      │ Final Status     │`);
    console.log(`├─────────────┼─────────────┼──────────────────┼─────────────────┼─────────────────┤`);
    
    settlements.forEach((settlement) => {
      const { driverId, status, pendingReason } = settlement;
      const rawStatus = status || 'Unknown';
      const pending = pendingReason || 'None';
      const normalized = normalizeSettlementStatus(status, pendingReason);
      
      console.log(`│ ${driverId.padEnd(11)} │ ${rawStatus.padEnd(11)} │ ${pending.padEnd(16)} │ ${normalized.padEnd(15)} │ ${normalized.padEnd(15)} │`);
    });
    
    console.log(`└─────────────┴─────────────┴──────────────────┴─────────────────┴─────────────────┘`);
    
    // Count final statuses
    const finalStatusCounts = {};
    settlements.forEach(settlement => {
      const normalized = normalizeSettlementStatus(settlement.status, settlement.pendingReason);
      finalStatusCounts[normalized] = (finalStatusCounts[normalized] || 0) + 1;
    });
    
    console.log(`\n📈 FINAL STATUS DISTRIBUTION (After Normalization):`);
    Object.entries(finalStatusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} drivers`);
    });
    
    // Check for any remaining review indicator issues
    console.log(`\n🚨 REVIEW INDICATOR VALIDATION (After Fix):`);
    let issues = 0;
    
    settlements.forEach(settlement => {
      const { driverId, status, pendingReason } = settlement;
      const normalized = normalizeSettlementStatus(status, pendingReason);
      
      if (normalized === "Needs Review") {
        if (!pendingReason || pendingReason === "N/A") {
          console.log(`   ❌ Driver ${driverId}: "Needs Review" without valid reason`);
          issues++;
        } else {
          console.log(`   ✅ Driver ${driverId}: "Needs Review" with reason: ${pendingReason}`);
        }
      }
    });
    
    if (issues === 0) {
      console.log(`   ✅ All review indicators are properly justified`);
    } else {
      console.log(`   ❌ Found ${issues} unjustified review indicators`);
    }
    
  } catch (error) {
    console.log(`❌ Error reading demo data: ${error.message}`);
  }
}

checkFinalStatusNormalization();
