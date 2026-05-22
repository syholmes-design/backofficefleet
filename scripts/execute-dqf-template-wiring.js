/**
 * Execute DQF Template Wiring Script
 * 
 * This script runs the DQF template wiring service to organize
 * and prefill driver documents in BOF Vault structure.
 */

const { DQFTemplateWiringService } = require('../lib/compliance-flow-pro/dqf-template-wiring-service');

async function main() {
  console.log("🚀 Starting BOF Vault DQF Template Wiring Process");
  console.log("================================================");
  
  const wiringService = new DQFTemplateWiringService();
  
  try {
    // Load driver data first
    await wiringService.loadDriverData();
    
    // Wire templates for all drivers
    const results = await wiringService.wireTemplatesForAllDrivers();
    
    // Generate and display summary report
    const summary = wiringService.generateSummaryReport(results);
    console.log(summary);
    
    // Check for critical errors
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalMissingCritical = results.reduce((sum, r) => sum + r.missingCriticalDocuments.length, 0);
    
    if (totalErrors > 0) {
      console.log(`\n⚠️  Process completed with ${totalErrors} errors`);
      process.exit(1);
    } else if (totalMissingCritical > 0) {
      console.log(`\n⚠️  Process completed but ${totalMissingCritical} critical documents are missing`);
      console.log("These will need to be uploaded through driver onboarding");
      process.exit(0);
    } else {
      console.log("\n✅ DQF template wiring completed successfully!");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ DQF template wiring failed:", error);
    process.exit(1);
  }
}

main();
