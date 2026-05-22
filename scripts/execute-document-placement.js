/**
 * Execute Document Placement Script
 * 
 * This script runs the document inventory and placement service
 * to organize existing driver documents into BOF Vault structure.
 */

const { DocumentPlacementService } = require('../lib/compliance-flow-pro/document-placement-service');

async function main() {
  console.log("🚀 Starting BOF Vault Document Placement Process");
  console.log("================================================");
  
  const placementService = new DocumentPlacementService();
  
  try {
    const results = await placementService.executePlacement();
    
    console.log("\n" + results.summary);
    
    if (results.errors.length > 0) {
      console.log(`\n⚠️  Process completed with ${results.errors.length} errors`);
      process.exit(1);
    } else {
      console.log("\n✅ Document placement completed successfully!");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ Document placement failed:", error);
    process.exit(1);
  }
}

main();
