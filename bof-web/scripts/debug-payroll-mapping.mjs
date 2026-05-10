#!/usr/bin/env node

/**
 * Debug the payroll mapping to see why deductions are not being picked up
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { buildPayrollSettlementRowsFromWorkbook } from "./lib/payroll-settlements-from-sheet.mjs";
import { resolveMainSourceXlsxPath } from "./lib/main-source-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function debugPayrollMapping() {
  const excelPath = resolveMainSourceXlsxPath(ROOT);
  
  console.log(`\n🔍 PAYROLL MAPPING DEBUG`);
  console.log(`Excel file: ${excelPath}`);
  
  if (!fs.existsSync(excelPath)) {
    console.log(`❌ Excel file not found: ${excelPath}`);
    return;
  }
  
  try {
    // Read Excel file
    const workbook = XLSX.readFile(excelPath, { cellDates: true, type: "file" });
    const payrollSheet = workbook.Sheets["Payroll"];
    const rawData = XLSX.utils.sheet_to_json(payrollSheet, { raw: true, defval: null });
    
    console.log(`\n📊 RAW EXCEL DATA (First 3 rows):`);
    rawData.slice(0, 3).forEach((row, index) => {
      console.log(`Row ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value} (${typeof value})`);
      });
      console.log(``);
    });
    
    // Test the mapping function
    console.log(`\n🔄 TESTING MAPPING FUNCTION:`);
    process.env.BOF_SETTLEMENTS_DEBUG = "1";
    const settlements = buildPayrollSettlementRowsFromWorkbook(workbook, []);
    
    console.log(`\n📈 MAPPED SETTLEMENTS (First 3):`);
    settlements.slice(0, 3).forEach((settlement, index) => {
      console.log(`Settlement ${index + 1}:`);
      console.log(`  driverId: ${settlement.driverId}`);
      console.log(`  grossPay: ${settlement.grossPay} (${typeof settlement.grossPay})`);
      console.log(`  deductions: ${settlement.deductions} (${typeof settlement.deductions})`);
      console.log(`  totalDeductions: ${settlement.totalDeductions} (${typeof settlement.totalDeductions})`);
      console.log(`  netPay: ${settlement.netPay} (${typeof settlement.netPay})`);
      console.log(`  fica: ${settlement.fica} (${typeof settlement.fica})`);
      console.log(`  oasdi: ${settlement.oasdi} (${typeof settlement.oasdi})`);
      console.log(`  federalWithholding: ${settlement.federalWithholding} (${typeof settlement.federalWithholding})`);
      console.log(`  stateWithholding: ${settlement.stateWithholding} (${typeof settlement.stateWithholding})`);
      console.log(`  status: ${settlement.status}`);
      console.log(`  pendingReason: ${settlement.pendingReason}`);
      console.log(``);
    });
    
    // Compare with expected Excel values
    console.log(`\n🎯 COMPARISON WITH EXCEL VALUES:`);
    const firstExcelRow = rawData[0];
    const firstMappedRow = settlements[0];
    
    console.log(`Driver DVR-001 comparison:`);
    console.log(`  Excel Total Deductions: ${firstExcelRow["Total Deductions"]} (${typeof firstExcelRow["Total Deductions"]})`);
    console.log(`  Mapped deductions: ${firstMappedRow.deductions} (${typeof firstMappedRow.deductions})`);
    console.log(`  Excel Net Pay: ${firstExcelRow["Net Pay"]} (${typeof firstExcelRow["Net Pay"]})`);
    console.log(`  Mapped netPay: ${firstMappedRow.netPay} (${typeof firstMappedRow.netPay})`);
    
    // Test the hasNumericValue function logic
    console.log(`\n🧪 TESTING NUMERIC VALUE DETECTION:`);
    const excelDeductions = firstExcelRow["Total Deductions"];
    console.log(`Excel deductions value: "${excelDeductions}"`);
    console.log(`Type: ${typeof excelDeductions}`);
    console.log(`Is null?: ${excelDeductions == null}`);
    console.log(`Is empty?: ${excelDeductions === ""}`);
    console.log(`Is finite number?: ${Number.isFinite(Number(excelDeductions))}`);
    console.log(`Trimmed value: "${String(excelDeductions).trim()}"`);
    
  } catch (error) {
    console.log(`❌ Error during debug: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
}

debugPayrollMapping();
