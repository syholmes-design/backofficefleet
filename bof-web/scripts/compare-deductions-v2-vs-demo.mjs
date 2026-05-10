#!/usr/bin/env node

/**
 * Compare v2 Excel deductions to current demo-data.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { resolveMainSourceXlsxPath } from "./lib/main-source-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function compareDeductionsV2VsDemo() {
  const excelPath = resolveMainSourceXlsxPath(ROOT);
  const demoDataPath = path.join(ROOT, "lib", "demo-data.json");
  
  console.log(`\n📊 DEDUCTION COMPARISON: V2 EXCEL vs DEMO-DATA.JSON`);
  console.log(`Excel file: ${excelPath}`);
  console.log(`Demo data: ${demoDataPath}`);
  
  if (!fs.existsSync(excelPath)) {
    console.log(`❌ Excel file not found: ${excelPath}`);
    return;
  }
  
  if (!fs.existsSync(demoDataPath)) {
    console.log(`❌ Demo data file not found: ${demoDataPath}`);
    return;
  }
  
  try {
    // Read Excel data
    const workbook = XLSX.readFile(excelPath, { cellDates: true, type: "file" });
    const payrollSheet = workbook.Sheets["Payroll"];
    const excelData = XLSX.utils.sheet_to_json(payrollSheet, { header: 1, defval: null });
    
    // Get headers
    const headers = excelData[0].filter(cell => cell !== null && cell !== undefined && cell !== "");
    
    // Get data rows
    const dataRows = excelData.slice(1).filter(row => 
      row && row.some(cell => cell !== null && cell !== undefined && cell !== "")
    );
    
    // Create Excel data map
    const excelMap = new Map();
    dataRows.forEach((row, index) => {
      const driverId = row[0]; // Driver column
      const rowData = {};
      headers.forEach((header, colIndex) => {
        rowData[header] = row[colIndex];
      });
      excelMap.set(driverId, rowData);
    });
    
    // Read demo data
    const demoData = JSON.parse(fs.readFileSync(demoDataPath, "utf8"));
    const demoSettlements = demoData.settlements || [];
    
    // Create demo data map
    const demoMap = new Map();
    demoSettlements.forEach(settlement => {
      demoMap.set(settlement.driverId, settlement);
    });
    
    console.log(`\n📋 DEDUCTION COLUMN MAPPING:`);
    console.log(`Excel columns found: ${headers.length}`);
    headers.forEach((header, index) => {
      console.log(`${index + 1}. "${header}"`);
    });
    
    console.log(`\n📈 DRIVER-BY-DRIVER DEDUCTION COMPARISON:`);
    console.log(`┌─────────────┬─────────────────┬─────────────────┬─────────────────┬──────────┬─────────────────┐`);
    console.log(`│ Driver ID   │ Excel Total     │ Demo Total      │ Match?          │ Difference│ Excel Components  │`);
    console.log(`├─────────────┼─────────────────┼─────────────────┼─────────────────┼──────────┼─────────────────┤`);
    
    let totalMatches = 0;
    let totalMismatches = 0;
    
    // Get all unique driver IDs from both sources
    const allDriverIds = new Set([...excelMap.keys(), ...demoMap.keys()]);
    
    allDriverIds.forEach(driverId => {
      const excelRow = excelMap.get(driverId);
      const demoRow = demoMap.get(driverId);
      
      const excelTotal = excelRow ? (excelRow["Total Deductions"] || 0) : 0;
      const demoTotal = demoRow ? (demoRow.totalDeductions || 0) : 0;
      
      const match = Math.abs(excelTotal - demoTotal) < 0.01;
      const difference = excelTotal - demoTotal;
      
      // Get Excel deduction components
      const components = [];
      if (excelRow) {
        if (excelRow["FICA"]) components.push(`FICA: $${excelRow["FICA"]}`);
        if (excelRow["OASDI"]) components.push(`OASDI: $${excelRow["OASDI"]}`);
        if (excelRow["Federal Withholding"]) components.push(`Fed WH: $${excelRow["Federal Withholding"]}`);
        if (excelRow["State Withholding"]) components.push(`State WH: $${excelRow["State Withholding"]}`);
        if (excelRow["SDI"]) components.push(`SDI: $${excelRow["SDI"]}`);
        if (excelRow["FM Leave"]) components.push(`FM Leave: $${excelRow["FM Leave"]}`);
        if (excelRow["Family Support"]) components.push(`Family: $${excelRow["Family Support"]}`);
        if (excelRow["Insurance Premiums"]) components.push(`Ins Prem: $${excelRow["Insurance Premiums"]}`);
        if (excelRow["401(k) Contribution"]) components.push(`401k: $${excelRow["401(k) Contribution"]}`);
        if (excelRow["HSA/FSA Health Deduction"]) components.push(`HSA/FSA: $${excelRow["HSA/FSA Health Deduction"]}`);
      }
      
      console.log(`│ ${driverId.padEnd(11)} │ $${excelTotal.toFixed(2).padEnd(15)} │ $${demoTotal.toFixed(2).padEnd(15)} │ ${match ? 'YES' : 'NO'.padEnd(15)} │ $${difference.toFixed(2).padEnd(8)} │ ${components.slice(0, 3).join(', ').padEnd(15)} │`);
      
      if (match) totalMatches++;
      else totalMismatches++;
    });
    
    console.log(`└─────────────┴─────────────────┴─────────────────┴─────────────────┴──────────┴─────────────────┘`);
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total drivers compared: ${allDriverIds.size}`);
    console.log(`Matches: ${totalMatches}`);
    console.log(`Mismatches: ${totalMismatches}`);
    console.log(`Match rate: ${((totalMatches / allDriverIds.size) * 100).toFixed(1)}%`);
    
    if (totalMismatches > 0) {
      console.log(`\n❌ DEDUCTION MISMATCHES DETECTED!`);
      console.log(`The demo data is NOT using the v2 Excel deduction values.`);
    } else {
      console.log(`\n✅ All deductions match v2 Excel values.`);
    }
    
    // Detailed component analysis
    console.log(`\n🔍 DETAILED COMPONENT ANALYSIS:`);
    console.log(`┌─────────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐`);
    console.log(`│ Driver ID   │ FICA     │ OASDI    │ Fed WH   │ State WH │ 401k     │ Family   │ Other    │ Total    │`);
    console.log(`├─────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤`);
    
    allDriverIds.forEach(driverId => {
      const excelRow = excelMap.get(driverId);
      if (!excelRow) return;
      
      const fica = excelRow["FICA"] || 0;
      const oasdi = excelRow["OASDI"] || 0;
      const fedWh = excelRow["Federal Withholding"] || 0;
      const stateWh = excelRow["State Withholding"] || 0;
      const k401 = excelRow["401(k) Contribution"] || 0;
      const family = excelRow["Family Support"] || 0;
      const other = (excelRow["SDI"] || 0) + (excelRow["FM Leave"] || 0) + (excelRow["Insurance Premiums"] || 0) + (excelRow["HSA/FSA Health Deduction"] || 0);
      const total = excelRow["Total Deductions"] || 0;
      
      console.log(`│ ${driverId.padEnd(11)} │ $${fica.toFixed(2).padEnd(7)} │ $${oasdi.toFixed(2).padEnd(7)} │ $${fedWh.toFixed(2).padEnd(7)} │ $${stateWh.toFixed(2).padEnd(7)} │ $${k401.toFixed(2).padEnd(7)} │ $${family.toFixed(2).padEnd(7)} │ $${other.toFixed(2).padEnd(7)} │ $${total.toFixed(2).padEnd(7)} │`);
    });
    
    console.log(`└─────────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘`);
    
  } catch (error) {
    console.log(`❌ Error during comparison: ${error.message}`);
  }
}

compareDeductionsV2VsDemo();
