#!/usr/bin/env node

/**
 * PERMANENT AUDIT TOOL - Inspect v2 Excel Payroll Structure
 * 
 * Purpose: Audits the v2 Excel workbook structure to identify all payroll-related sheets and columns.
 * Use when adding new deduction types, updating Excel structure, or troubleshooting data mapping.
 * 
 * Usage: node scripts/inspect-v2-excel-deductions.mjs
 * 
 * Provides:
 * - Complete sheet inventory and structure analysis
 * - Column mapping for payroll and settlement data
 * - Sample data rows for verification
 * - Identification of available deduction components
 * - Data type and format validation
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { resolveMainSourceXlsxPath } from "./lib/main-source-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function inspectV2ExcelDeductions() {
  const excelPath = resolveMainSourceXlsxPath(ROOT);
  
  console.log(`\n📊 V2 EXCEL DEDUCTION AUDIT`);
  console.log(`Excel file: ${excelPath}`);
  
  if (!fs.existsSync(excelPath)) {
    console.log(`❌ Excel file not found: ${excelPath}`);
    return;
  }
  
  try {
    const workbook = XLSX.readFile(excelPath, { cellDates: true, type: "file" });
    const sheetNames = workbook.SheetNames;
    
    console.log(`\n📋 ALL SHEETS IN WORKBOOK:`);
    sheetNames.forEach((name, index) => {
      console.log(`${index + 1}. "${name}"`);
    });
    
    // Identify potential payroll/settlement sheets
    const payrollSheetNames = sheetNames.filter(name => 
      name.toLowerCase().includes('payroll') ||
      name.toLowerCase().includes('settlement') ||
      name.toLowerCase().includes('payment') ||
      name.toLowerCase().includes('deduction')
    );
    
    console.log(`\n🎯 POTENTIAL PAYROLL/SETTLEMENT SHEETS:`);
    payrollSheetNames.forEach((name, index) => {
      console.log(`${index + 1}. "${name}"`);
    });
    
    // Inspect each payroll sheet
    for (const sheetName of payrollSheetNames) {
      console.log(`\n📈 SHEET: "${sheetName}"`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
      
      if (jsonData.length === 0) {
        console.log(`   Empty sheet`);
        continue;
      }
      
      // Get headers (first non-empty row)
      let headers = [];
      let headerRowIndex = -1;
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row.some(cell => cell !== null && cell !== undefined && cell !== "")) {
          headers = row.filter(cell => cell !== null && cell !== undefined && cell !== "");
          headerRowIndex = i;
          break;
        }
      }
      
      if (headers.length === 0) {
        console.log(`   No headers found`);
        continue;
      }
      
      console.log(`   Headers (row ${headerRowIndex + 1}):`);
      headers.forEach((header, index) => {
        console.log(`     ${index + 1}. "${header}"`);
      });
      
      // Look for deduction-related columns
      const deductionColumns = headers.filter(header => {
        const lower = header.toLowerCase();
        return lower.includes('deduction') ||
               lower.includes('fica') ||
               lower.includes('oasdi') ||
               lower.includes('medicare') ||
               lower.includes('withholding') ||
               lower.includes('federal') ||
               lower.includes('state') ||
               lower.includes('401') ||
               lower.includes('support') ||
               lower.includes('garnishment') ||
               lower.includes('levy') ||
               lower.includes('attachment') ||
               lower.includes('total');
      });
      
      console.log(`   📉 DEDUCTION-RELATED COLUMNS:`);
      if (deductionColumns.length === 0) {
        console.log(`     No deduction columns found`);
      } else {
        deductionColumns.forEach((col, index) => {
          console.log(`     ${index + 1}. "${col}"`);
        });
      }
      
      // Look for key payroll columns
      const keyColumns = ['Driver', 'Name', 'Base Earnings', 'Gross Pay', 'Net Pay', 'Total Deductions'];
      const foundKeyColumns = headers.filter(header => 
        keyColumns.some(key => header.toLowerCase().includes(key.toLowerCase()))
      );
      
      console.log(`   🎯 KEY PAYROLL COLUMNS:`);
      foundKeyColumns.forEach((col, index) => {
        console.log(`     ${index + 1}. "${col}"`);
      });
      
      // Sample data rows (first few data rows)
      console.log(`   📊 SAMPLE DATA ROWS:`);
      const dataRows = jsonData.slice(headerRowIndex + 1).filter(row => 
        row && row.some(cell => cell !== null && cell !== undefined && cell !== "")
      );
      
      const sampleCount = Math.min(3, dataRows.length);
      for (let i = 0; i < sampleCount; i++) {
        const row = dataRows[i];
        console.log(`     Row ${i + 1}:`);
        headers.forEach((header, colIndex) => {
          const value = row[colIndex];
          if (value !== null && value !== undefined && value !== "") {
            console.log(`       ${header}: ${value}`);
          }
        });
        if (i < sampleCount - 1) console.log(``);
      }
      
      console.log(`   📈 Total data rows: ${dataRows.length}`);
    }
    
  } catch (error) {
    console.log(`❌ Error reading Excel file: ${error.message}`);
  }
}

inspectV2ExcelDeductions();
