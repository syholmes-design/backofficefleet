#!/usr/bin/env node

/**
 * FILE CABINET FEATURED DOCUMENTS VERIFICATION
 * Verifies that Featured document cards open actual documents, not module routes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, ".");

function verifyFeaturedDocuments() {
  console.log(`\n🗂️ FILE CABINET FEATURED DOCUMENTS VERIFICATION`);
  console.log(`Project root: ${ROOT}`);
  
  // Read the operations file cabinet data
  const cabinetPath = path.join(ROOT, 'lib', 'operations-file-cabinet.ts');
  if (!fs.existsSync(cabinetPath)) {
    console.log(`❌ Operations file cabinet not found: ${cabinetPath}`);
    return;
  }
  
  // Extract the registry from the file (simplified parsing)
  const cabinetContent = fs.readFileSync(cabinetPath, 'utf8');
  
  // Find featured items based on the filter criteria in the component
  const featuredItemIds = [
    // Driver Qualification Files (real documents only)
    "driver-cdl", "driver-medical", "driver-mvr", "driver-clearinghouse", 
    "driver-i9", "driver-w9", "driver-emergency-contacts", "driver-bank-info",
    "driver-policy-acknowledgment", "driver-road-test", "driver-employment-verification",
    "driver-incident-history",
    
    // Company Policies & SOPs (real generated policies only)
    "hr-employee-handbook", "policy-code-of-conduct", "hr-onboarding-checklist",
    "driver-withholding", "policy-accounting-finance", "policy-factoring-receivables",
    "claims-escalation-sop", "policy-vendor-maintenance", "policy-safety-compliance",
    "policy-information-security", "policy-privacy-data", "policy-ai-governance",
    "policy-tax-audit-readiness", "policy-cash-flow-management",
    
    // Dispatch & Load Documents (real generated files only)
    "contract-master-agreement", "dispatch-work-order", "dispatch-rate-confirmation",
    "dispatch-bol", "dispatch-pod",
    "claims-cargo-intake", "claims-insurance-notice",
    
    // HR Documents (real files only)
    "hr-termination-checklist"
  ];
  
  console.log(`\n📋 FEATURED DOCUMENT VERIFICATION:`);
  console.log(`Checking ${featuredItemIds.length} featured items...`);
  
  let passCount = 0;
  let failCount = 0;
  const results = [];
  
  // Parse the registry to get item data
  const registryMatch = cabinetContent.match(/export const OPERATIONS_FILE_CABINET_REGISTRY = \[([\s\S]*?)\];/);
  if (!registryMatch) {
    console.log(`❌ Could not parse OPERATIONS_FILE_CABINET_REGISTRY`);
    return;
  }
  
  // Simple regex-based parsing (not perfect but sufficient// Parse the registry to get item data - simpler approach
  const registryText = registryMatch[1];
  const items = [];
  
  // Split by individual entries and extract key info
  const entries = registryText.split(/\{[\s\S]*?id:/).slice(1); // Remove first empty entry
  
  for (const entry of entries) {
    const idMatch = entry.match(/^["']([^"']+)["']/);
    const titleMatch = entry.match(/title: ["']([^"']+)["']/);
    const hrefMatch = entry.match(/href: ["']([^"']*)["']/);
    const sourceMatch = entry.match(/source: ["']([^"']+)["']/);
    
    if (idMatch && titleMatch && hrefMatch && sourceMatch) {
      items.push({
        id: idMatch[1],
        title: titleMatch[1],
        href: hrefMatch[1],
        source: sourceMatch[1]
      });
    }
  }
  
  console.log(`\n📊 VERIFICATION RESULTS:`);
  console.log(`| Title | Href | Source | Pass/Fail | Note |`);
  console.log(`|---|---|---|---|---|`);
  
  for (const featuredId of featuredItemIds) {
    const item = items.find(i => i.id === featuredId);
    
    if (!item) {
      console.log(`| ${featuredId} | NOT FOUND | - | ❌ FAIL | Item not in registry |`);
      failCount++;
      continue;
    }
    
    let pass = true;
    let notes = [];
    
    // Check 1: Has href
    if (!item.href) {
      pass = false;
      notes.push("Missing href");
    }
    
    // Check 2: Does not link to module routes
    const moduleRoutes = ["/drivers", "/safety", "/settlements", "/dispatch", "/loads", "/documents"];
    if (moduleRoutes.some(route => item.href === route)) {
      pass = false;
      notes.push("Links to module route");
    }
    
    // Check 3: Does not link to public/ (should use generated/ or documents/)
    if (item.href.startsWith("/public/")) {
      pass = false;
      notes.push("Links to public/");
    }
    
    // Check 4: Does not link to scripts/ or templates/ or source-assets/
    const forbiddenPaths = ["/scripts/", "/templates/", "/source-assets/"];
    if (forbiddenPaths.some(path => item.href.includes(path))) {
      pass = false;
      notes.push("Links to forbidden path");
    }
    
    // Check 5: Does not link to absolute file paths
    if (item.href.includes(":\\")) {
      pass = false;
      notes.push("Absolute file path");
    }
    
    // Check 6: File exists (for generated/ and documents/ paths)
    if (item.href.startsWith("/generated/") || item.href.startsWith("/documents/")) {
      const filePath = path.join(ROOT, item.href);
      if (!fs.existsSync(filePath)) {
        pass = false;
        notes.push("File does not exist");
      }
    }
    
    const status = pass ? "✅ PASS" : "❌ FAIL";
    const sourceAuthenticity = getSourceAuthenticity(item.source);
    const noteText = notes.join(", ") || "OK";
    
    console.log(`| ${item.title} | ${item.href} | ${sourceAuthenticity} | ${status} | ${noteText} |`);
    
    if (pass) {
      passCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\n📝 SUMMARY:`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${featuredItemIds.length}`);
  
  if (failCount === 0) {
    console.log(`\n🎉 ALL FEATURED DOCUMENTS PASS VERIFICATION!`);
  } else {
    console.log(`\n⚠️ ${failCount} featured documents need attention.`);
  }
  
  console.log(`\n💡 RECOMMENDATIONS:`);
  console.log(`- Ensure all featured items have valid href properties`);
  console.log(`- Use /generated/ for driver documents and company policies`);
  console.log(`- Use /documents/template-packs/ for authentic templates`);
  console.log(`- Avoid linking to module routes (/drivers, /safety, etc.)`);
  console.log(`- Avoid linking to /public/, /scripts/, /templates/, /source-assets/`);
  console.log(`- Verify all linked files exist in the project`);
}

function getSourceAuthenticity(source) {
  switch (source) {
    case "generated":
      return "Generated document";
    case "template":
      return "BOF template";
    case "external":
      return "External resource";
    case "demo":
      return "Demo content";
    default:
      return "Unknown";
  }
}

verifyFeaturedDocuments();
