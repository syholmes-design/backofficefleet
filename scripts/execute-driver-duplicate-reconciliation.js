/**
 * Execute Driver Duplicate Reconciliation Script
 * 
 * This script runs the driver-level duplicate reconciliation to identify
 * canonical files, duplicates, and stale variants for all drivers.
 */

const { DriverDuplicateReconciliationService } = require('../lib/compliance-flow-pro/driver-duplicate-reconciliation');

async function main() {
  console.log("🔍 Starting BOF Driver-Level Duplicate Reconciliation");
  console.log("=====================================================");
  
  const reconciliationService = new DriverDuplicateReconciliationService();
  
  try {
    // Reconcile all drivers
    const summary = await reconciliationService.reconcileAllDrivers();
    
    // Generate and display detailed report
    const report = reconciliationService.generateReconciliationReport(summary);
    console.log(report);
    
    // Generate vault mapping
    const vaultMapping = reconciliationService.generateVaultMapping(summary);
    
    // Save vault mapping to file
    const fs = require('fs');
    const path = require('path');
    
    const mappingPath = path.join(process.cwd(), 'public', 'generated', 'driver-vault-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(vaultMapping, null, 2));
    console.log(`\n📁 Vault mapping saved to: ${mappingPath}`);
    
    // Check for critical issues
    const totalErrors = summary.errors.length;
    const totalDuplicates = summary.totalDuplicateFiles;
    const totalStale = summary.totalStaleFiles;
    const totalMissing = summary.totalMissingDocuments;
    
    if (totalErrors > 0) {
      console.log(`\n❌ Process completed with ${totalErrors} errors`);
      process.exit(1);
    } else if (totalDuplicates > 0 || totalStale > 0) {
      console.log(`\n⚠️  Process completed with ${totalDuplicates} duplicates and ${totalStale} stale files identified`);
      console.log("Review recommendations in the report above");
      process.exit(0);
    } else if (totalMissing > 0) {
      console.log(`\n⚠️  Process completed but ${totalMissing} documents are missing and need generation`);
      process.exit(0);
    } else {
      console.log("\n✅ Driver duplicate reconciliation completed successfully!");
      console.log("All drivers have clean canonical file sets");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ Driver duplicate reconciliation failed:", error);
    process.exit(1);
  }
}

main();
