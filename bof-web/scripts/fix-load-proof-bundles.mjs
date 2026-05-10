import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEMO_DATA_PATH = path.join(ROOT, "lib", "demo-data.json");

try {
  const demoData = JSON.parse(fs.readFileSync(DEMO_DATA_PATH, "utf8"));
  
  // Add items field to load proof bundles
  demoData.loadProofBundles = (demoData.loadProofBundles || []).map(bundle => ({
    ...bundle,
    items: bundle.items || {
      "rate_con": { url: "", uploadedAt: "2026-01-01" },
      "bol": { url: "", uploadedAt: "2026-01-01" },
      "pod": { url: "", uploadedAt: "2026-01-01" },
      "seal_pickup_photo": { url: "", uploadedAt: "2026-01-01" },
      "seal_delivery_photo": { url: "", uploadedAt: "2026-01-01" }
    }
  }));
  
  // Write back to file
  fs.writeFileSync(DEMO_DATA_PATH, JSON.stringify(demoData), "utf8");
  
  console.log(`✅ Added items field to load proof bundles`);
  
} catch (error) {
  console.error("Error:", error.message);
}
