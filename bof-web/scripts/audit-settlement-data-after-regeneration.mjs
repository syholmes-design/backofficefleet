#!/usr/bin/env node

/**
 * Audit script to verify settlement data after regeneration from v2 Excel
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function auditSettlementData() {
  const demoDataPath = path.join(ROOT, "lib", "demo-data.json");
  
  if (!fs.existsSync(demoDataPath)) {
    console.log(`❌ Demo data file not found: ${demoDataPath}`);
    return;
  }

  try {
    const demoData = JSON.parse(fs.readFileSync(demoDataPath, "utf8"));
    const settlements = demoData.settlements || [];
    
    console.log(`\n📊 SETTLEMENT DATA AUDIT AFTER REGENERATION`);
    console.log(`Total settlement rows: ${settlements.length}`);
    
    if (settlements.length === 0) {
      console.log(`❌ No settlement data found`);
      return;
    }

    console.log(`\n📋 Settlement Data by Driver:`);
    
    let totalGrossPay = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;
    let totalReimbursements = 0;
    
    settlements.forEach((settlement, index) => {
      const {
        driverId,
        driverName,
        grossPay,
        deductions,
        netPay,
        fuelReimbursement,
        status,
        pendingReason,
        baseEarnings,
        backhaulPay,
        safetyBonus,
        federalWithholding,
        stateWithholding,
        fica,
        oasdi,
        contribution401k
      } = settlement;
      
      console.log(`\n${index + 1}. Driver: ${driverId} - ${driverName}`);
      console.log(`   Status: ${status}`);
      console.log(`   Pending Reason: ${pendingReason || 'N/A'}`);
      console.log(`   Base Earnings: $${baseEarnings?.toFixed(2) || '0.00'}`);
      console.log(`   Backhaul Pay: $${backhaulPay?.toFixed(2) || '0.00'}`);
      console.log(`   Safety Bonus: $${safetyBonus?.toFixed(2) || '0.00'}`);
      console.log(`   Gross Pay: $${grossPay?.toFixed(2) || '0.00'} ${grossPay ? '(Source)' : '(Calculated)'}`);
      console.log(`   Federal WH: $${federalWithholding?.toFixed(2) || '0.00'}`);
      console.log(`   State WH: $${stateWithholding?.toFixed(2) || '0.00'}`);
      console.log(`   FICA: $${fica?.toFixed(2) || '0.00'}`);
      console.log(`   OASDI: $${oasdi?.toFixed(2) || '0.00'}`);
      console.log(`   401(k): $${contribution401k?.toFixed(2) || '0.00'}`);
      console.log(`   Total Deductions: $${deductions?.toFixed(2) || '0.00'} ${deductions ? '(Source)' : '(Calculated)'}`);
      console.log(`   Fuel Reimbursement: $${fuelReimbursement?.toFixed(2) || '0.00'}`);
      console.log(`   Net Pay: $${netPay?.toFixed(2) || '0.00'} ${netPay ? '(Source)' : '(Calculated)'}`);
      
      // Accumulate totals
      totalGrossPay += grossPay || 0;
      totalDeductions += deductions || 0;
      totalNetPay += netPay || 0;
      totalReimbursements += fuelReimbursement || 0;
    });
    
    console.log(`\n💰 TOTALS:`);
    console.log(`   Gross Settlements: $${totalGrossPay.toFixed(2)}`);
    console.log(`   Total Deductions: $${totalDeductions.toFixed(2)}`);
    console.log(`   Total Reimbursements: $${totalReimbursements.toFixed(2)}`);
    console.log(`   Net Payout: $${totalNetPay.toFixed(2)}`);
    
    // Check for data consistency
    console.log(`\n🔍 DATA CONSISTENCY CHECK:`);
    let consistencyIssues = 0;
    
    settlements.forEach((settlement, index) => {
      const { driverId, grossPay, deductions, netPay, fuelReimbursement } = settlement;
      
      // Check if calculated net pay matches source net pay
      const calculatedNet = (grossPay || 0) - (deductions || 0) + (fuelReimbursement || 0);
      const netPayDiff = Math.abs((netPay || 0) - calculatedNet);
      
      if (netPayDiff > 0.01) {
        console.log(`   ⚠️  Driver ${driverId}: Net pay mismatch (Source: $${(netPay || 0).toFixed(2)}, Calculated: $${calculatedNet.toFixed(2)})`);
        consistencyIssues++;
      }
    });
    
    if (consistencyIssues === 0) {
      console.log(`   ✅ All settlement calculations are consistent`);
    } else {
      console.log(`   ❌ Found ${consistencyIssues} consistency issues`);
    }
    
    // Check status distribution
    const statusCounts = {};
    settlements.forEach(settlement => {
      const status = settlement.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log(`\n📊 STATUS DISTRIBUTION:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} drivers`);
    });
    
  } catch (error) {
    console.log(`❌ Error reading demo data: ${error.message}`);
  }
}

auditSettlementData();
