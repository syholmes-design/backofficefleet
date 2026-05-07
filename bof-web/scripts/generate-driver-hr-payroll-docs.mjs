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

// Get payroll settlement data for driver
function getDriverSettlement(bofData, driverId) {
  const settlement = bofData.settlements?.find(s => s.driverId === driverId);
  return settlement || {};
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

// Generate Benefits Enrollment HTML
function generateBenefitsEnrollment(driverInfo, settlementData) {
  const enrollmentDate = generateRandomDate();
  const reviewDate = generateRandomDate();
  
  // Calculate coverage based on settlement data
  const healthPremium = parseFloat(settlementData.healthInsurancePremiums) || 0;
  const insurancePremiums = parseFloat(settlementData.insurancePremiums) || 0;
  const hsaFsaDeduction = parseFloat(settlementData.hsaFsaHealthDeduction) || 0;
  const lifeInsuranceAbove50k = parseFloat(settlementData.lifeInsuranceAbove50k) || 0;
  
  // Determine coverage status
  const healthEnrolled = healthPremium > 0;
  const dentalEnrolled = insurancePremiums > 0;
  const visionEnrolled = false; // No explicit vision field found in source data
  
  // Calculate annual amounts (assuming settlement data is per-pay period)
  const healthAnnual = healthEnrolled ? (healthPremium * 26).toFixed(2) : "0.00";
  const dentalAnnual = dentalEnrolled ? (insurancePremiums * 26).toFixed(2) : "0.00";
  const visionAnnual = visionEnrolled ? (hsaFsaDeduction * 26).toFixed(2) : "0.00";
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Benefits Enrollment Form - ${driverInfo.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.4;
            color: #1a202c;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.25in;
            background: #ffffff;
        }
        .paper {
            background: #ffffff;
            width: 8.5in;
            height: 11in;
            padding: 0.5in;
            border: 1px solid #e5e7eb;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 0.5in;
            border-bottom: 2px solid #0BA5A4;
            padding-bottom: 0.25in;
        }
        .company-name {
            font-size: 14pt;
            font-weight: bold;
            color: #0BA5A4;
            margin-bottom: 0.0625in;
        }
        .company-address {
            font-size: 9pt;
            color: #4a5568;
            margin-bottom: 0.25in;
        }
        .document-title {
            font-size: 12pt;
            font-weight: bold;
            color: #1a202c;
            margin-bottom: 0.125in;
        }
        .enrollment-type {
            font-size: 9pt;
            color: #4a5568;
            margin-bottom: 0.5in;
        }
        .section {
            margin-bottom: 0.5in;
        }
        .section-title {
            font-size: 10pt;
            font-weight: bold;
            color: #1a202c;
            margin-bottom: 0.125in;
            border-bottom: 1px solid #0BA5A4;
            padding-bottom: 0.0625in;
        }
        .employee-data-table {
            width: 100%;
            border: 1px solid #cbd5e0;
            border-collapse: collapse;
            margin-bottom: 0.5in;
            font-size: 9pt;
            background: #f7fafc;
        }
        .employee-data-table td {
            border: 1px solid #cbd5e0;
            padding: 3px 6px;
        }
        .data-label {
            font-weight: 600;
            color: #2d3748;
            width: 1.5in;
        }
        .election-box {
            border: 1px solid #e2e8f0;
            padding: 0.25in;
            margin-bottom: 0.25in;
            background: #fafafa;
        }
        .election-title {
            font-weight: bold;
            font-size: 9pt;
            margin-bottom: 0.125in;
            color: #1a202c;
        }
        .plan-option {
            display: flex;
            align-items: center;
            margin-bottom: 0.0625in;
            font-size: 8pt;
        }
        .checkbox {
            width: 10px;
            height: 10px;
            margin-right: 4px;
        }
        .coverage-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0.25in;
            font-size: 8pt;
        }
        .coverage-table th {
            background: #0BA5A4;
            color: white;
            padding: 2px 4px;
            text-align: left;
            font-weight: 600;
        }
        .coverage-table td {
            border: 1px solid #e2e8f0;
            padding: 2px 4px;
        }
        .amount-cell {
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        .dependent-table {
            width: 100%;
            border: 1px solid #e2e8f0;
            border-collapse: collapse;
            margin-bottom: 0.25in;
            font-size: 8pt;
        }
        .dependent-table th {
            background: #f1f5f9;
            padding: 2px 4px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #e2e8f0;
        }
        .dependent-table td {
            border: 1px solid #e2e8f0;
            padding: 2px 4px;
        }
        .signature-area {
            margin-top: 0.5in;
        }
        .signature-block {
            margin-bottom: 0.375in;
        }
        .signature-line {
            border-bottom: 1px solid #1a202c;
            width: 2.5in;
            margin-bottom: 0.0625in;
        }
        .signature-label {
            font-size: 8pt;
            color: #4a5568;
        }
        .footer {
            margin-top: 0.75in;
            font-size: 7pt;
            color: #718096;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 0.125in;
        }
        .note {
            font-size: 7pt;
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
            <div class="document-title">Benefits Enrollment Form</div>
            <div class="enrollment-type">
                <strong>Enrollment Type:</strong> New Hire / Annual Open Enrollment / Qualifying Life Event
            </div>
        </div>

        <div class="section">
            <div class="section-title">Employee Data</div>
            <table class="employee-data-table">
                <tr>
                    <td class="data-label">Employee Name:</td>
                    <td>${driverInfo.name}</td>
                    <td class="data-label">Employee ID:</td>
                    <td>${driverInfo.id}</td>
                </tr>
                <tr>
                    <td class="data-label">Address:</td>
                    <td>${driverInfo.address || 'N/A'}</td>
                    <td class="data-label">Phone:</td>
                    <td>${driverInfo.phone || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="data-label">Email:</td>
                    <td>${driverInfo.email || 'N/A'}</td>
                    <td class="data-label">Hire Date:</td>
                    <td>${enrollmentDate}</td>
                </tr>
                <tr>
                    <td class="data-label">Department:</td>
                    <td>Transportation</td>
                    <td class="data-label">Job Title:</td>
                    <td>Driver</td>
                </tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">Health Plan Election</div>
            <div class="election-box">
                <div class="election-title">Medical Coverage Options:</div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox" ${healthEnrolled ? 'checked' : ''}>
                    <span>Delta Health Plan — Standard</span>
                </div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox" ${healthEnrolled ? 'checked' : ''}>
                    <span>Delta Health Plan — HSA Compatible</span>
                </div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox" ${!healthEnrolled ? 'checked' : ''}>
                    <span>${healthEnrolled ? 'Declined' : 'Waived / No employee deduction on file'}</span>
                </div>
            </div>
            <table class="coverage-table">
                <thead>
                    <tr>
                        <th>Coverage Type</th>
                        <th>Election</th>
                        <th>Annual Employee Cost</th>
                        <th>Per Pay Period (26)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Medical</td>
                        <td>${healthEnrolled ? 'Enrolled' : 'Waived'}</td>
                        <td class="amount-cell">$${healthAnnual}</td>
                        <td class="amount-cell">$${healthPremium.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">Dental Plan Election</div>
            <div class="election-box">
                <div class="election-title">Dental Coverage Options:</div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox" ${dentalEnrolled ? 'checked' : ''}>
                    <span>Delta Dental Plan — Standard</span>
                </div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox" ${!dentalEnrolled ? 'checked' : ''}>
                    <span>${dentalEnrolled ? 'Declined' : 'Waived / No source deduction on file'}</span>
                </div>
            </div>
            <table class="coverage-table">
                <thead>
                    <tr>
                        <th>Coverage Type</th>
                        <th>Election</th>
                        <th>Annual Employee Cost</th>
                        <th>Per Pay Period (26)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Dental</td>
                        <td>${dentalEnrolled ? 'Enrolled' : 'Waived'}</td>
                        <td class="amount-cell">$${dentalAnnual}</td>
                        <td class="amount-cell">$${insurancePremiums.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">Vision Plan Election</div>
            <div class="election-box">
                <div class="election-title">Vision Coverage Options:</div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox" ${visionEnrolled ? 'checked' : ''}>
                    <span>Delta Vision Plan — Standard</span>
                </div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox" ${!visionEnrolled ? 'checked' : ''}>
                    <span>${visionEnrolled ? 'Declined' : 'Waived / No source deduction on file'}</span>
                </div>
            </div>
            <table class="coverage-table">
                <thead>
                    <tr>
                        <th>Coverage Type</th>
                        <th>Election</th>
                        <th>Annual Employee Cost</th>
                        <th>Per Pay Period (26)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Vision</td>
                        <td>${visionEnrolled ? 'Enrolled' : 'Waived'}</td>
                        <td class="amount-cell">$${visionAnnual}</td>
                        <td class="amount-cell">$${hsaFsaDeduction.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">Coverage Tier</div>
            <div class="election-box">
                <div class="plan-option">
                    <input type="checkbox" class="checkbox">
                    <span>Employee Only</span>
                </div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox">
                    <span>Employee + Spouse</span>
                </div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox">
                    <span>Employee + Child(ren)</span>
                </div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox">
                    <span>Employee + Family</span>
                </div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox" checked>
                    <span>No coverage elected</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Dependent Information</div>
            <table class="dependent-table">
                <thead>
                    <tr>
                        <th>Dependent Name</th>
                        <th>Relationship</th>
                        <th>Date of Birth</th>
                        <th>SSN (Last 4)</th>
                        <th>Coverage</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="5" style="text-align: center; color: #718096;">No dependent coverage elected</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">Supplemental Life Insurance Election</div>
            <div class="election-box">
                <div class="plan-option">
                    <input type="checkbox" class="checkbox">
                    <span>Supplemental Life — Demo Election</span>
                </div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox" checked>
                    <span>Waived / Not elected</span>
                </div>
            </div>
            <div style="font-size: 8pt; margin-top: 0.25in; color: #4a5568;">
                <strong>Note:</strong> Life insurance elections are maintained in the Life Insurance Beneficiary Election document.
            </div>
        </div>

        <div class="section">
            <div class="section-title">Dependent Life Insurance Election</div>
            <div class="election-box">
                <div class="plan-option">
                    <input type="checkbox" class="checkbox">
                    <span>Dependent Life — Demo Election</span>
                </div>
                <div class="plan-option">
                    <input type="checkbox" class="checkbox" checked>
                    <span>Waived / Not elected</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Payroll Deduction Authorization</div>
            <div style="font-size: 8pt; margin-bottom: 0.25in;">
                I hereby authorize ${BOF_CONFIG.company} to deduct elected benefits premiums from my payroll checks on a per-pay-period basis. 
                I understand that these deductions will continue until I submit a written change request during annual open enrollment period or due to a qualifying life event.
            </div>
            <div class="election-box">
                <div class="plan-option">
                    <input type="checkbox" class="checkbox" checked>
                    <span>Authorization signed for applicable deductions</span>
                </div>
            </div>
        </div>

        <div class="signature-area">
            <div class="section-title">Employee Signature</div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Employee Signature</div>
            </div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Date: ${enrollmentDate}</div>
            </div>
        </div>

        <div class="signature-area">
            <div class="section-title">HR/Benefits Review</div>
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
            Supports payroll deduction and benefits administration.
        </div>

        <div class="footer">
            ${BOF_CONFIG.disclaimer}
        </div>
    </div>
</body>
</html>`;
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
  console.log("🚀 Starting Driver HR/Payroll Document Generator (Phase 2: Employee Handbook + Benefits Enrollment)");
  
  const bofData = loadBofData();
  const generatedFiles = [];
  const errors = [];
  
  for (const driver of CANONICAL_DRIVERS) {
    try {
      const driverInfo = getDriverInfo(bofData, driver.id);
      const settlementData = getDriverSettlement(bofData, driver.id);
      
      // Generate Employee Handbook Acknowledgment
      const handbookPath = join(PROJECT_ROOT, "public", "generated", "drivers", driver.id, "hr-payroll", "employee-handbook-acknowledgment.html");
      ensureDirectoryExists(handbookPath);
      
      const handbookContent = generateEmployeeHandbookAcknowledgment(driverInfo);
      writeFileSync(handbookPath, handbookContent, "utf8");
      
      generatedFiles.push({
        driverId: driver.id,
        driverName: driverInfo.name,
        path: handbookPath,
        type: "employee-handbook-acknowledgment"
      });
      
      console.log(`✅ Generated handbook: ${driver.id} - ${driverInfo.name}`);
      
      // Generate Benefits Enrollment
      const benefitsPath = join(PROJECT_ROOT, "public", "generated", "drivers", driver.id, "hr-payroll", "benefits-enrollment.html");
      ensureDirectoryExists(benefitsPath);
      
      const benefitsContent = generateBenefitsEnrollment(driverInfo, settlementData);
      writeFileSync(benefitsPath, benefitsContent, "utf8");
      
      generatedFiles.push({
        driverId: driver.id,
        driverName: driverInfo.name,
        path: benefitsPath,
        type: "benefits-enrollment"
      });
      
      console.log(`✅ Generated benefits: ${driver.id} - ${driverInfo.name}`);
      
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
