#!/usr/bin/env node

/**
 * BOF DEMO INTEGRITY AUDIT
 * Purpose: Central verification of demo data integrity and runtime state
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function auditDemoIntegrity() {
  console.log("=== BOF DEMO INTEGRITY AUDIT ===\n");
  
  // Check data source
  const v2SourcePath = path.join(ROOT, "public", "data", "main-source-v2_enhanced_bof_aligned.xlsx");
  const demoDataPath = path.join(ROOT, "lib", "demo-data.json");
  
  console.log("=== DATA SOURCE INTEGRITY ===");
  console.log(`V2 Excel Source: ${fs.existsSync(v2SourcePath) ? "✅ EXISTS" : "❌ MISSING"}`);
  console.log(`V2 Excel Path: ${v2SourcePath}`);
  
  if (fs.existsSync(demoDataPath)) {
    try {
      const rawData = fs.readFileSync(demoDataPath, "utf8");
      const data = JSON.parse(rawData);
      
      console.log(`Demo Data JSON: ✅ EXISTS`);
      console.log(`Drivers: ${data.drivers?.length || 0}`);
      console.log(`Settlements: ${data.settlements?.length || 0}`);
      console.log(`Documents: ${data.documents?.length || 0}`);
      console.log(`Assets: ${data.assets?.length || 0}`);
      console.log(`Loads: ${data.loads?.length || 0}`);
      
      // Check settlements data integrity
      if (data.settlements && data.settlements.length > 0) {
        const sampleSettlement = data.settlements[0];
        console.log(`\nSample Settlement Fields:`);
        console.log(`- driverId: ${sampleSettlement.driverId}`);
        console.log(`- grossPay: ${sampleSettlement.grossPay}`);
        console.log(`- totalDeductions: ${sampleSettlement.totalDeductions}`);
        console.log(`- netPay: ${sampleSettlement.netPay}`);
        
        // Check if deductions are properly populated
        const withDeductions = data.settlements.filter(s => s.totalDeductions && s.totalDeductions > 0);
        console.log(`Settlements with deductions > 0: ${withDeductions.length}/${data.settlements.length}`);
      }
      
    } catch (error) {
      console.log(`Demo Data JSON: ❌ PARSE ERROR: ${error.message}`);
    }
  } else {
    console.log(`Demo Data JSON: ❌ MISSING`);
  }
  
  // Check localStorage keys
  console.log(`\n=== LOCAL STORAGE KEYS ===`);
  console.log(`BOF_DEMO_DATA_STORAGE_KEY: bof-demo-data-v1`);
  console.log(`BOF_DEMO_DATA_LEGACY_STORAGE_KEY: bof-demo-data-legacy`);
  console.log(`BOF_DEMO_RISK_OVERRIDES_STORAGE_KEY: bof-demo-risk-overrides-v1`);
  
  // Check build script configuration
  console.log(`\n=== BUILD CONFIGURATION ===`);
  const buildScriptPath = path.join(ROOT, "scripts", "build-demo-data.mjs");
  console.log(`Build Script: ${fs.existsSync(buildScriptPath) ? "✅ EXISTS" : "❌ MISSING"}`);
  
  // Check context provider
  const contextPath = path.join(ROOT, "lib", "bof-demo-data-context.tsx");
  console.log(`Context Provider: ${fs.existsSync(contextPath) ? "✅ EXISTS" : "❌ MISSING"}`);
  
  console.log(`\n=== HEADER COMPONENTS ===`);
  const headerPath = path.join(ROOT, "components", "BofHeader.tsx");
  console.log(`BofHeader: ${fs.existsSync(headerPath) ? "✅ EXISTS" : "❌ MISSING"}`);
  
  console.log(`\n=== PORTALS ROUTES ===`);
  const routes = [
    "app/portals/page.tsx",
    "app/portals/manager/page.tsx", 
    "app/portals/customer/page.tsx",
    "app/portals/driver/page.tsx"
  ];
  
  routes.forEach(route => {
    const routePath = path.join(ROOT, route);
    console.log(`${route}: ${fs.existsSync(routePath) ? "✅ EXISTS" : "❌ MISSING"}`);
  });
}

auditDemoIntegrity();
