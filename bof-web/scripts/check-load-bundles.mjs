import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEMO_DATA_PATH = path.join(ROOT, "lib", "demo-data.json");

try {
  const demoData = JSON.parse(fs.readFileSync(DEMO_DATA_PATH, "utf8"));
  
  console.log(`CHECKING LOAD PROOF BUNDLES:`);
  console.log(`loadProofBundles exists: ${!!demoData.loadProofBundles}`);
  console.log(`loadProofBundles type: ${typeof demoData.loadProofBundles}`);
  console.log(`loadProofBundles isArray: ${Array.isArray(demoData.loadProofBundles)}`);
  
  if (demoData.loadProofBundles) {
    if (Array.isArray(demoData.loadProofBundles)) {
      console.log(`loadProofBundles is array with ${demoData.loadProofBundles.length} items`);
      if (demoData.loadProofBundles.length > 0) {
        console.log(`First item keys:`, Object.keys(demoData.loadProofBundles[0]));
      }
    } else {
      console.log(`loadProofBundles is object with keys:`, Object.keys(demoData.loadProofBundles));
    }
  }
  
} catch (error) {
  console.error("Error:", error.message);
}
