import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEMO_DATA_PATH = path.join(ROOT, "lib", "demo-data.json");

try {
  const demoData = JSON.parse(fs.readFileSync(DEMO_DATA_PATH, "utf8"));
  
  // Add missing fields to loads
  demoData.loads = demoData.loads.map(load => ({
    ...load,
    dispatchOpsNotes: "Load proceeding as scheduled. Driver confirmed pickup and on-time delivery expected.",
    brokerName: "Acme Logistics",
    brokerPhone: "800-555-0123",
    brokerEmail: "dispatch@acmelogistics.com",
    commodity: "General Freight",
    temperatureRequired: false,
    hazmat: false,
    oversized: false,
    tarpRequired: false,
    deliveryAppointments: true,
    pickupAppointment: "2026-01-15T09:00:00Z",
    deliveryAppointment: "2026-01-16T14:00:00Z",
    actualPickup: "2026-01-15T09:30:00Z",
    estimatedDelivery: "2026-01-16T13:30:00Z"
  }));
  
  // Write back to file
  fs.writeFileSync(DEMO_DATA_PATH, JSON.stringify(demoData), "utf8");
  
  console.log(`✅ Added missing fields to loads`);
  console.log(`  - Added dispatchOpsNotes, brokerName, brokerPhone, brokerEmail, commodity, temperatureRequired, hazmat, oversized, tarpRequired, deliveryAppointments, pickupAppointment, deliveryAppointment, actualPickup, estimatedDelivery`);
  
} catch (error) {
  console.error("Error:", error.message);
}
