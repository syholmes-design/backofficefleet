#!/usr/bin/env node

/**
 * Audit script to examine the v2 Excel file structure for payroll/settlements data
 */

import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function auditExcelStructure() {
  const excelPath = path.join(ROOT, "public", "data", "main-source-v2_enhanced_bof_aligned.xlsx");
  console.log(`\n📊 AUDITING EXCEL STRUCTURE`);
  console.log(`File: ${excelPath}`);
  
  if (!fs.existsSync(excelPath)) {
    console.log(`❌ Excel file not found: ${excelPath}`);
    return;
  }

  try {
    const workbook = XLSX.readFile(excelPath);
    console.log(`\n📋 Available Sheets:`);
    Object.keys(workbook.Sheets).forEach(sheetName => {
      console.log(`  - ${sheetName}`);
    });

    // Check for settlement-related sheets in priority order
    const sheetCandidates = ["Payroll", "Payroll_Clean", "Vercel_Settlements", "Settlements", "Drivers", "Loads"];
    
    for (const sheetName of sheetCandidates) {
      if (workbook.Sheets[sheetName]) {
        console.log(`\n🔍 Examining Sheet: "${sheetName}"`);
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: null });
        
        console.log(`  Rows: ${rows.length}`);
        
        if (rows.length > 0) {
          console.log(`  Columns:`);
          const headers = Object.keys(rows[0]);
          headers.forEach(header => {
            console.log(`    - ${header}`);
          });
          
          // Show first row sample data
          console.log(`\n  Sample Row 1 Data:`);
          const sampleRow = rows[0];
          Object.entries(sampleRow).forEach(([key, value]) => {
            console.log(`    ${key}: ${value}`);
          });
          
          // Look for payroll/settlement specific columns
          const payrollColumns = headers.filter(header => 
            header.toLowerCase().includes('pay') ||
            header.toLowerCase().includes('settlement') ||
            header.toLowerCase().includes('gross') ||
            header.toLowerCase().includes('net') ||
            header.toLowerCase().includes('deduction') ||
            header.toLowerCase().includes('driver') ||
            header.toLowerCase().includes('bonus') ||
            header.toLowerCase().includes('reimburse')
          );
          
          if (payrollColumns.length > 0) {
            console.log(`\n  🎯 Payroll/Settlement Related Columns:`);
            payrollColumns.forEach(col => {
              console.log(`    - ${col}`);
            });
          }
        }
        break; // Only examine the first found sheet
      }
    }
    
  } catch (error) {
    console.log(`❌ Error reading Excel file: ${error.message}`);
  }
}

auditExcelStructure();
