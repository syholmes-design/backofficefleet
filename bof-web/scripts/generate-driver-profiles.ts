#!/usr/bin/env tsx

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { getBofData } from "../lib/load-bof-data";
import { generateDriverProfileHTML } from "../lib/driver-profile-generator";

const data = getBofData();
const publicDir = join(process.cwd(), "public");

// Generate profile HTML files for all drivers
for (const driver of data.drivers) {
  const profileDir = join(publicDir, "documents", "drivers", driver.id);
  
  // Ensure directory exists
  mkdirSync(profileDir, { recursive: true });
  
  // Generate profile HTML
  const profileHTML = generateDriverProfileHTML(driver);
  const profileFileName = `${driver.id.toLowerCase()}-profile-dashboard.html`;
  const profilePath = join(profileDir, profileFileName);
  
  writeFileSync(profilePath, profileHTML);
  console.log(`Generated profile for ${driver.name}: ${profilePath}`);
}

console.log(`Generated ${data.drivers.length} driver profiles`);
