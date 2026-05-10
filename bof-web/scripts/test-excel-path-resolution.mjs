#!/usr/bin/env node

/**
 * Test the actual Excel path resolution used by the build system
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { resolveMainSourceXlsxPath } from "./lib/main-source-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function testExcelPathResolution() {
  console.log(`\n🔍 EXCEL PATH RESOLUTION TEST`);
  console.log(`Root directory: ${ROOT}`);
  
  // Test environment variable
  const env = String(process.env.BOF_MAIN_SOURCE_XLSX ?? "").trim();
  console.log(`BOF_MAIN_SOURCE_XLSX environment variable: "${env}"`);
  
  // Get the resolved path
  const resolvedPath = resolveMainSourceXlsxPath(ROOT);
  console.log(`Resolved Excel path: ${resolvedPath}`);
  
  // Check if file exists
  const exists = fs.existsSync(resolvedPath);
  console.log(`File exists: ${exists ? 'YES' : 'NO'}`);
  
  if (exists) {
    const stats = fs.statSync(resolvedPath);
    console.log(`File size: ${stats.size} bytes`);
    console.log(`Last modified: ${stats.mtime.toISOString()}`);
  }
  
  // Check all possible paths
  console.log(`\n📁 ALL POSSIBLE EXCEL PATHS:`);
  
  const possiblePaths = [
    path.join(ROOT, "public", "data", "main-source-v2_enhanced_bof_aligned.xlsx"),
    path.join(ROOT, "public", "data", "main-source_enhanced_bof_aligned.xlsx"),
    path.join(ROOT, "data", "main-source.xlsx"),
    path.join(ROOT, "data", "source-workbooks", "main-source-v2_enhanced_bof_aligned.xlsx")
  ];
  
  possiblePaths.forEach((testPath, index) => {
    const exists = fs.existsSync(testPath);
    console.log(`${index + 1}. ${testPath}`);
    console.log(`   Exists: ${exists ? 'YES' : 'NO'}`);
    if (exists) {
      const stats = fs.statSync(testPath);
      console.log(`   Size: ${stats.size} bytes`);
    }
  });
  
  return resolvedPath;
}

testExcelPathResolution();
