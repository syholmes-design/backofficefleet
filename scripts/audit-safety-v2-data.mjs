#!/usr/bin/env node

/**
 * Audit script to examine safety data in the v2 Excel file
 */

import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function auditSafetyData() {
  const excelPath = path.join(ROOT, "public", "data", "main-source-v2_enhanced_bof_aligned.xlsx");
  console.log(`\n📊 AUDITING SAFETY DATA FROM V2 EXCEL`);
  console.log(`File: ${excelPath}`);
  
  if (!fs.existsSync(excelPath)) {
    console.log(`❌ Excel file not found: ${excelPath}`);
    return;
  }

  try {
    const workbook = XLSX.readFile(excelPath);
    
    // Check for safety-related sheets
    const safetySheets = ["Main Safety", "Safety_Events", "Driver Data"];
    
    for (const sheetName of safetySheets) {
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
          
          // Look for safety-specific columns
          const safetyColumns = headers.filter(header => 
            header.toLowerCase().includes('safety') ||
            header.toLowerCase().includes('bonus') ||
            header.toLowerCase().includes('incident') ||
            header.toLowerCase().includes('violation') ||
            header.toLowerCase().includes('hos') ||
            header.toLowerCase().includes('oos') ||
            header.toLowerCase().includes('cargo') ||
            header.toLowerCase().includes('damage') ||
            header.toLowerCase().includes('inspection') ||
            header.toLowerCase().includes('tire') ||
            header.toLowerCase().includes('brake')
          );
          
          if (safetyColumns.length > 0) {
            console.log(`\n  🎯 Safety Related Columns:`);
            safetyColumns.forEach(col => {
              console.log(`    - ${col}`);
            });
          }
          
          // Show sample data for safety columns
          console.log(`\n  Sample Safety Data:`);
          const sampleRow = rows[0];
          safetyColumns.forEach(col => {
            if (sampleRow[col] !== null && sampleRow[col] !== undefined) {
              console.log(`    ${col}: ${sampleRow[col]}`);
            }
          });
        }
      }
    }
    
    // Also check Payroll sheet for Safety Bonus
    if (workbook.Sheets["Payroll"]) {
      console.log(`\n🔍 Examining Safety Bonus in "Payroll" Sheet:`);
      const worksheet = workbook.Sheets["Payroll"];
      const rows = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: null });
      
      console.log(`  Safety Bonus Data:`);
      rows.slice(0, 3).forEach((row, index) => {
        console.log(`    Driver ${row.Driver} (${row.Name}): Safety Bonus = $${row["Safety Bonus"] || 0}`);
      });
      
      const totalSafetyBonus = rows.reduce((sum, row) => sum + (row["Safety Bonus"] || 0), 0);
      console.log(`    Total Safety Bonus: $${totalSafetyBonus}`);
    }
    
  } catch (error) {
    console.log(`❌ Error reading Excel file: ${error.message}`);
  }
}

auditSafetyData();
