#!/usr/bin/env node

/**
 * Driver HR/Payroll Document Generator
 * 
 * Phase 1: Employee Handbook Acknowledgment Only
 * 
 * Reads BOF source data and regenerates HR/payroll documents consistently.
 * Safeguards: SSN masking, date range validation, BOF branding.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

// Configuration
const BOF_CONFIG = {
  company: "Delta Advanced Trucking, Inc.",
  address: "2475 Laver Rd., Mansfield, OH 44905",
  disclaimer: "BOF Demo Document — Not for legal filing, payroll processing, benefits enrollment, or employee use.",
  tealColor: "#0BA5A4",
  payPeriodsPerYear: 26
};

const DATE_RANGE = {
  start: "2025-10-10",
  end: "2025-12-28"
};

const CANONICAL_DRIVERS = [
  { id: "DRV-001", name: "John Carter" },
  { id: "DRV-002", name: "Maria Lopez" },
  { id: "DRV-003", name: "Alex Kim" },
  { id: "DRV-004", name: "Priya Patel" },
  { id: "DRV-005", name: "Kenji Tanaka" },
  { id: "DRV-006", name: "Marcus Chen" },
  { id: "DRV-007", name: "Sofia Gomez" },
  { id: "DRV-008", name: "Liam Smith" },
  { id: "DRV-009", name: "Emma Brown" },
  { id: "DRV-010", name: "Noah Wilson" },
  { id: "DRV-011", name: "Olivia Lee" },
  { id: "DRV-012", name: "Robert Johnson" }
];

// Load BOF data
function loadBofData() {
  try {
    const demoDataPath = join(PROJECT_ROOT, "lib", "demo-data.json");
    const rawData = readFileSync(demoDataPath, "utf8");
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Error loading BOF data:", error.message);
    process.exit(1);
  }
}

// Get driver information from BOF data
function getDriverInfo(bofData, driverId) {
  const driver = bofData.drivers?.find(d => d.id === driverId);
  if (!driver) {
    console.warn(`Driver ${driverId} not found in BOF data, using canonical data`);
    return CANONICAL_DRIVERS.find(d => d.id === driverId) || { id: driverId, name: "Unknown" };
  }
  return driver;
}

// Validate date is within allowed range
function validateDate(dateString) {
  const date = new Date(dateString);
  const start = new Date(DATE_RANGE.start);
  const end = new Date(DATE_RANGE.end);
  
  if (date < start || date > end) {
    console.warn(`Date ${dateString} is outside allowed range ${DATE_RANGE.start} to ${DATE_RANGE.end}`);
    return DATE_RANGE.end; // Use latest allowed date
  }
  return dateString;
}

// Generate random date within range for demo purposes
function generateRandomDate() {
  const start = new Date(DATE_RANGE.start);
  const end = new Date(DATE_RANGE.end);
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime).toISOString().split('T')[0];
}

// Generate Employee Handbook Acknowledgment HTML
function generateEmployeeHandbookAcknowledgment(driverInfo) {
  const acknowledgmentDate = generateRandomDate();
  const reviewDate = generateRandomDate();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Handbook Acknowledgment - ${driverInfo.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #1a202c;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
            background: #ffffff;
        }
        .paper {
            background: #ffffff;
            width: 8.5in;
            height: 11in;
            padding: 0.75in;
            border: 1px solid #e5e7eb;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 0.75in;
            border-bottom: 2px solid ${BOF_CONFIG.tealColor};
            padding-bottom: 0.5in;
        }
        .company-name {
            font-size: 16pt;
            font-weight: bold;
            color: ${BOF_CONFIG.tealColor};
            margin-bottom: 0.125in;
        }
        .company-address {
            font-size: 10pt;
            color: #4a5568;
            margin-bottom: 0.25in;
        }
        .document-title {
            font-size: 14pt;
            font-weight: bold;
            color: #1a202c;
            margin-bottom: 0.25in;
        }
        .section {
            margin-bottom: 0.5in;
        }
        .section-title {
            font-size: 12pt;
            font-weight: bold;
            color: #1a202c;
            margin-bottom: 0.25in;
            border-bottom: 1px solid ${BOF_CONFIG.tealColor};
            padding-bottom: 0.125in;
        }
        .employee-info {
            border: 1px solid #cbd5e0;
            padding: 0.25in;
            margin-bottom: 0.5in;
            background: #f7fafc;
        }
        .info-row {
            display: flex;
            margin-bottom: 0.125in;
            font-size: 10pt;
        }
        .info-label {
            width: 2in;
            font-weight: 600;
            color: #2d3748;
        }
        .info-value {
            flex: 1;
            padding: 2px 4px;
            border-bottom: 1px solid #cbd5e0;
        }
        .policy-list {
            margin: 0.25in 0;
            padding-left: 0.25in;
        }
        .policy-item {
            margin-bottom: 0.125in;
            font-size: 10pt;
        }
        .acknowledgment-box {
            border: 1px solid #e2e8f0;
            padding: 0.25in;
            margin: 0.5in 0;
            background: #fafafa;
        }
        .acknowledgment-text {
            font-size: 10pt;
            margin-bottom: 0.25in;
            line-height: 1.5;
        }
        .signature-area {
            margin-top: 0.75in;
        }
        .signature-block {
            margin-bottom: 0.5in;
        }
        .signature-line {
            border-bottom: 1px solid #1a202c;
            width: 3in;
            margin-bottom: 0.125in;
        }
        .signature-label {
            font-size: 9pt;
            color: #4a5568;
        }
        .footer {
            margin-top: 1in;
            font-size: 8pt;
            color: #718096;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 0.25in;
        }
        .note {
            font-size: 8pt;
            color: #718096;
            font-style: italic;
            margin-top: 0.25in;
        }
    </style>
</head>
<body>
    <div class="paper">
        <div class="header">
            <div class="company-name">${BOF_CONFIG.company}</div>
            <div class="company-address">${BOF_CONFIG.address}</div>
            <div class="document-title">Employee Handbook Acknowledgment</div>
        </div>

        <div class="section">
            <div class="section-title">Employee Information</div>
            <div class="employee-info">
                <div class="info-row">
                    <div class="info-label">Employee Name:</div>
                    <div class="info-value">${driverInfo.name}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Employee ID:</div>
                    <div class="info-value">${driverInfo.id}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Address:</div>
                    <div class="info-value">${driverInfo.address || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">${driverInfo.phone || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${driverInfo.email || 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Policy Areas Reviewed</div>
            <div class="policy-list">
                <div class="policy-item">✓ Safety Policies and Procedures</div>
                <div class="policy-item">✓ Attendance and Leave Policies</div>
                <div class="policy-item">✓ Payroll and Deduction Procedures</div>
                <div class="policy-item">✓ Benefits Administration</div>
                <div class="policy-item">✓ Vehicle and Equipment Expectations</div>
                <div class="policy-item">✓ Anti-Harassment and Workplace Conduct</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Employee Acknowledgment</div>
            <div class="acknowledgment-box">
                <div class="acknowledgment-text">
                    I acknowledge that I have received, read, and understood the Delta Advanced Trucking Employee Handbook. 
                    I agree to comply with all policies, procedures, and guidelines outlined therein. 
                    I understand that this acknowledgment does not create an employment contract and that my employment is "at-will."
                </div>
                <div class="acknowledgment-text">
                    I acknowledge that I have had the opportunity to ask questions about any policies contained in the handbook 
                    and that all my questions have been answered to my satisfaction.
                </div>
            </div>
        </div>

        <div class="signature-area">
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Employee Signature</div>
            </div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Date: ${acknowledgmentDate}</div>
            </div>
        </div>

        <div class="signature-area">
            <div class="section-title">HR Review</div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">HR Representative Signature</div>
            </div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Date: ${reviewDate}</div>
            </div>
        </div>

        <div class="note">
            <strong>Relationship to Operations:</strong> Administrative document — does not block dispatch.
        </div>

        <div class="footer">
            ${BOF_CONFIG.disclaimer}
        </div>
    </div>
</body>
</html>`;
}

// Ensure directory exists
function ensureDirectoryExists(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// Main generation function
function generateDocuments() {
  console.log("🚀 Starting Driver HR/Payroll Document Generator (Phase 1: Employee Handbook Acknowledgment)");
  
  const bofData = loadBofData();
  const generatedFiles = [];
  const errors = [];
  
  for (const driver of CANONICAL_DRIVERS) {
    try {
      const driverInfo = getDriverInfo(bofData, driver.id);
      const outputPath = join(PROJECT_ROOT, "public", "generated", "drivers", driver.id, "hr-payroll", "employee-handbook-acknowledgment.html");
      
      ensureDirectoryExists(outputPath);
      
      const htmlContent = generateEmployeeHandbookAcknowledgment(driverInfo);
      writeFileSync(outputPath, htmlContent, "utf8");
      
      generatedFiles.push({
        driverId: driver.id,
        driverName: driverInfo.name,
        path: outputPath,
        type: "employee-handbook-acknowledgment"
      });
      
      console.log(`✅ Generated: ${driver.id} - ${driverInfo.name}`);
    } catch (error) {
      errors.push({
        driverId: driver.id,
        error: error.message
      });
      console.error(`❌ Error generating ${driver.id}:`, error.message);
    }
  }
  
  console.log(`\n📊 Generation Summary:`);
  console.log(`✅ Successfully generated: ${generatedFiles.length} files`);
  console.log(`❌ Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    errors.forEach(err => console.log(`  ${err.driverId}: ${err.error}`));
  }
  
  return { generatedFiles, errors };
}

// Run generator if called directly
generateDocuments();

export { generateDocuments, generateEmployeeHandbookAcknowledgment, getDriverInfo, loadBofData };
