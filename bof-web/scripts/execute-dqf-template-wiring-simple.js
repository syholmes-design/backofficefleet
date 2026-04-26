/**
 * Simple DQF Template Wiring Script
 * 
 * Directly wires DQF templates into BOF Vault with driver data prefilling
 * without TypeScript compilation dependencies.
 */

const fs = require('fs');
const path = require('path');

// Canonical DQF template framework based on FMCSA requirements
const DQF_TEMPLATES = [
  // Critical FMCSA Documents
  {
    documentType: "CDL",
    bofVaultCategory: "CDL",
    templateName: "cdl_template",
    isRequired: true,
    priority: "critical",
    needsPrefill: true
  },
  {
    documentType: "Medical Certification",
    bofVaultCategory: "Medical Certification", 
    templateName: "medical_certification_template",
    isRequired: true,
    priority: "critical",
    needsPrefill: true
  },
  {
    documentType: "MVR",
    bofVaultCategory: "MVR",
    templateName: "mvr_template", 
    isRequired: true,
    priority: "critical",
    needsPrefill: true
  },
  {
    documentType: "Driver Application",
    bofVaultCategory: "Driver Profile / Application",
    templateName: "driver_application_template",
    isRequired: true,
    priority: "high",
    needsPrefill: true
  },
  {
    documentType: "I-9",
    bofVaultCategory: "Employment / I-9",
    templateName: "i9_template",
    isRequired: true,
    priority: "high", 
    needsPrefill: true
  },
  {
    documentType: "W-9",
    bofVaultCategory: "W-9",
    templateName: "w9_template",
    isRequired: true,
    priority: "high",
    needsPrefill: true
  },
  
  // FMCSA Compliance Documents
  {
    documentType: "FMCSA Clearinghouse",
    bofVaultCategory: "FMCSA / Compliance",
    templateName: "fmcsa_clearinghouse_template",
    isRequired: true,
    priority: "medium",
    needsPrefill: true
  },
  {
    documentType: "Road Test Certificate",
    bofVaultCategory: "FMCSA / Compliance",
    templateName: "road_test_template",
    isRequired: true,
    priority: "medium",
    needsPrefill: true
  },
  {
    documentType: "Drug Test Result",
    bofVaultCategory: "FMCSA / Compliance",
    templateName: "drug_test_template",
    isRequired: true,
    priority: "medium",
    needsPrefill: true
  },
  
  // Contact and Information Documents
  {
    documentType: "Emergency Contact",
    bofVaultCategory: "Emergency Contact",
    templateName: "emergency_contact_template",
    isRequired: true,
    priority: "medium",
    needsPrefill: true
  },
  {
    documentType: "Secondary Contact",
    bofVaultCategory: "Secondary Contact", 
    templateName: "secondary_contact_template",
    isRequired: false,
    priority: "low",
    needsPrefill: true
  },
  
  // Financial Documents
  {
    documentType: "Bank Information",
    bofVaultCategory: "Bank Information",
    templateName: "bank_info_template",
    isRequired: true,
    priority: "medium",
    needsPrefill: true
  },
  
  // Supporting Documents
  {
    documentType: "Employment Verification",
    bofVaultCategory: "Other / Supporting Docs",
    templateName: "employment_verification_template",
    isRequired: false,
    priority: "low",
    needsPrefill: true
  },
  {
    documentType: "Prior Employer Inquiry",
    bofVaultCategory: "Other / Supporting Docs",
    templateName: "prior_employer_inquiry_template",
    isRequired: false,
    priority: "low",
    needsPrefill: true
  }
];

// Load driver data from demo-data.json
function loadDriverData() {
  try {
    const demoDataPath = path.join(process.cwd(), 'lib', 'demo-data.json');
    const demoData = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));
    
    const driverData = new Map();
    demoData.drivers.forEach(driver => {
      driverData.set(driver.id, driver);
    });
    
    console.log(`✅ Loaded driver data for ${driverData.size} drivers`);
    return driverData;
  } catch (error) {
    console.error('❌ Failed to load driver data:', error);
    throw error;
  }
}

// Check existing documents for a driver
function checkExistingDocuments(driverId) {
  const existingFiles = new Map();
  
  // Check both documents/drivers and generated/drivers directories
  const directories = [
    path.join(process.cwd(), 'public', 'documents', 'drivers', driverId),
    path.join(process.cwd(), 'public', 'generated', 'drivers', driverId)
  ];
  
  for (const dir of directories) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          existingFiles.set(file, filePath);
        });
      }
    } catch (error) {
      // Directory doesn't exist, continue
    }
  }
  
  return existingFiles;
}

// Find matching file for document type
function findMatchingFile(documentType, existingFiles) {
  const typeMappings = {
    "CDL": ["cdl", "cdl.png", "cdl.html"],
    "Medical Certification": ["medical", "medcard", "medical_certification"],
    "MVR": ["mvr", "mvr-card", "motor_vehicle"],
    "Driver Application": ["application", "driver-application"],
    "I-9": ["i9", "i-9"],
    "W-9": ["w9", "w-9"],
    "FMCSA Clearinghouse": ["fmcsa", "mcsa", "clearinghouse"],
    "Emergency Contact": ["emergency", "emergency-contact"],
    "Bank Information": ["bank", "bank-info", "bank-card"],
    "Road Test Certificate": ["road", "test", "road-test"],
    "Drug Test Result": ["drug", "drug-test"],
    "Employment Verification": ["employment", "verification"],
    "Prior Employer Inquiry": ["inquiry", "employer", "prior"]
  };
  
  const searchTerms = typeMappings[documentType] || [documentType.toLowerCase()];
  
  for (const [fileName, filePath] of existingFiles) {
    const lowerFileName = fileName.toLowerCase();
    for (const term of searchTerms) {
      if (lowerFileName.includes(term)) {
        return filePath;
      }
    }
  }
  
  return null;
}

// Generate Driver Application Template
function generateDriverApplicationTemplate(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF Driver Application - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1B2A4A; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BOF Driver Application for Employment</h1>
            <p>§391.21 Driver Qualification Application</p>
        </div>
        
        <div class="section">
            <h2>Personal Information</h2>
            <div class="field">
                <span class="label">Driver ID:</span>
                <span class="value">${data.id}</span>
            </div>
            <div class="field">
                <span class="label">Full Name:</span>
                <span class="value">${data.name}</span>
            </div>
            <div class="field">
                <span class="label">Address:</span>
                <span class="value">${data.address}</span>
            </div>
            <div class="field">
                <span class="label">Phone:</span>
                <span class="value">${data.phone}</span>
            </div>
            <div class="field">
                <span class="label">Email:</span>
                <span class="value">${data.email}</span>
            </div>
            <div class="field">
                <span class="label">Date of Birth:</span>
                <span class="value">${data.dateOfBirth}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>License Information</h2>
            <div class="field">
                <span class="label">CDL Number:</span>
                <span class="value">${data.referenceCdlNumber}</span>
            </div>
            <div class="field">
                <span class="label">License Class:</span>
                <span class="value">${data.licenseClass}</span>
            </div>
            <div class="field">
                <span class="label">License State:</span>
                <span class="value">${data.licenseState}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>Emergency Contact</h2>
            <div class="field">
                <span class="label">Contact Name:</span>
                <span class="value">${data.emergencyContactName}</span>
            </div>
            <div class="field">
                <span class="label">Relationship:</span>
                <span class="value">${data.emergencyContactRelationship}</span>
            </div>
            <div class="field">
                <span class="label">Phone:</span>
                <span class="value">${data.emergencyContactPhone}</span>
            </div>
            <div class="field">
                <span class="label">Email:</span>
                <span class="value">${data.emergencyContactEmail}</span>
            </div>
            <div class="field">
                <span class="label">Address:</span>
                <span class="value">${data.emergencyContactAddress}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>Bank Information</h2>
            <div class="field">
                <span class="label">Bank Name:</span>
                <span class="value">${data.bankName}</span>
            </div>
            <div class="field">
                <span class="label">Account Type:</span>
                <span class="value">${data.bankAccountType}</span>
            </div>
            <div class="field">
                <span class="label">Routing Number:</span>
                <span class="value">${data.bankRoutingNumber}</span>
            </div>
            <div class="field">
                <span class="label">Account Last 4:</span>
                <span class="value">${data.bankAccountLast4}</span>
            </div>
            <div class="field">
                <span class="label">Payment Preference:</span>
                <span class="value">${data.paymentPreference}</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>Application Date: ${new Date().toLocaleDateString()}</p>
            <p>Status: Prefilled Template - Ready for Review</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate I-9 Template
function generateI9Template(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF I-9 - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1B2A4A; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Employment Eligibility Verification (I-9)</h1>
            <p>Department of Homeland Security / U.S. Citizenship and Immigration Services</p>
        </div>
        
        <div class="section">
            <h2>Employee Information</h2>
            <div class="field">
                <span class="label">Driver ID:</span>
                <span class="value">${data.id}</span>
            </div>
            <div class="field">
                <span class="label">Full Name:</span>
                <span class="value">${data.name}</span>
            </div>
            <div class="field">
                <span class="label">Address:</span>
                <span class="value">${data.address}</span>
            </div>
            <div class="field">
                <span class="label">Date of Birth:</span>
                <span class="value">${data.dateOfBirth}</span>
            </div>
            <div class="field">
                <span class="label">Citizenship Status:</span>
                <span class="value">U.S. Citizen</span>
            </div>
        </div>
        
        <div class="section">
            <h2>Employment Information</h2>
            <div class="field">
                <span class="label">Employer:</span>
                <span class="value">BOF Transport</span>
            </div>
            <div class="field">
                <span class="label">Start Date:</span>
                <span class="value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="field">
                <span class="label">Position:</span>
                <span class="value">Commercial Driver</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>Form Date: ${new Date().toLocaleDateString()}</p>
            <p>Status: Prefilled Template - Ready for Employee Signature</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate W-9 Template
function generateW9Template(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF W-9 - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1B2A4A; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Request for Taxpayer Identification Number (W-9)</h1>
            <p>Internal Revenue Service</p>
        </div>
        
        <div class="section">
            <h2>Contractor Information</h2>
            <div class="field">
                <span class="label">Driver ID:</span>
                <span class="value">${data.id}</span>
            </div>
            <div class="field">
                <span class="label">Business Name:</span>
                <span class="value">${data.name}</span>
            </div>
            <div class="field">
                <span class="label">Business Address:</span>
                <span class="value">${data.address}</span>
            </div>
            <div class="field">
                <span class="label">Tax Classification:</span>
                <span class="value">${data.taxClassification}</span>
            </div>
            <div class="field">
                <span class="label">TIN Type:</span>
                <span class="value">${data.tinType}</span>
            </div>
            <div class="field">
                <span class="label">TIN Number:</span>
                <span class="value">[To be provided by driver]</span>
            </div>
        </div>
        
        <div class="section">
            <h2>Payment Information</h2>
            <div class="field">
                <span class="label">Account Type:</span>
                <span class="value">${data.bankAccountType}</span>
            </div>
            <div class="field">
                <span class="label">Bank Name:</span>
                <span class="value">${data.bankName}</span>
            </div>
            <div class="field">
                <span class="label">Account Number:</span>
                <span class="value">****${data.bankAccountLast4}</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>Form Date: ${new Date().toLocaleDateString()}</p>
            <p>Status: Prefilled Template - Ready for Contractor Signature</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate Emergency Contact Template
function generateEmergencyContactTemplate(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF Emergency Contact - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e74c3c; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Emergency Contact Information</h1>
            <p>For ${data.name} (${data.id})</p>
        </div>
        
        <div class="section">
            <h2>Primary Emergency Contact</h2>
            <div class="field">
                <span class="label">Contact Name:</span>
                <span class="value">${data.emergencyContactName}</span>
            </div>
            <div class="field">
                <span class="label">Relationship:</span>
                <span class="value">${data.emergencyContactRelationship}</span>
            </div>
            <div class="field">
                <span class="label">Phone:</span>
                <span class="value">${data.emergencyContactPhone}</span>
            </div>
            <div class="field">
                <span class="label">Email:</span>
                <span class="value">${data.emergencyContactEmail}</span>
            </div>
            <div class="field">
                <span class="label">Address:</span>
                <span class="value">${data.emergencyContactAddress}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>Driver Information</h2>
            <div class="field">
                <span class="label">Driver Name:</span>
                <span class="value">${data.name}</span>
            </div>
            <div class="field">
                <span class="label">Driver ID:</span>
                <span class="value">${data.id}</span>
            </div>
            <div class="field">
                <span class="label">License State:</span>
                <span class="value">${data.licenseState}</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>Last Updated: ${new Date().toLocaleDateString()}</p>
            <p>Status: Current Emergency Contact Information</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate Bank Information Template
function generateBankInfoTemplate(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF Bank Information - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #27ae60; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 Bank Information</h1>
            <p>For ${data.name} (${data.id})</p>
        </div>
        
        <div class="section">
            <h2>Bank Account Details</h2>
            <div class="field">
                <span class="label">Bank Name:</span>
                <span class="value">${data.bankName}</span>
            </div>
            <div class="field">
                <span class="label">Account Type:</span>
                <span class="value">${data.bankAccountType}</span>
            </div>
            <div class="field">
                <span class="label">Routing Number:</span>
                <span class="value">${data.bankRoutingNumber}</span>
            </div>
            <div class="field">
                <span class="label">Account Number:</span>
                <span class="value">****${data.bankAccountLast4}</span>
            </div>
            <div class="field">
                <span class="label">Payment Preference:</span>
                <span class="value">${data.paymentPreference}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>Submission Status</h2>
            <div class="field">
                <span class="label">Submission Date:</span>
                <span class="value">${data.bankSubmissionDate}</span>
            </div>
            <div class="field">
                <span class="label">Status:</span>
                <span class="value">${data.bankInfoStatus}</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>Last Updated: ${new Date().toLocaleDateString()}</p>
            <p>Status: Bank Information on File</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate Medical Certification Template
function generateMedicalCertificationTemplate(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF Medical Certification - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #27ae60; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Medical Certification</h1>
            <p>DOT Medical Examiner's Certificate</p>
        </div>
        
        <div class="section">
            <h2>Driver Information</h2>
            <div class="field">
                <span class="label">Driver ID:</span>
                <span class="value">${data.id}</span>
            </div>
            <div class="field">
                <span class="label">Full Name:</span>
                <span class="value">${data.name}</span>
            </div>
            <div class="field">
                <span class="label">Date of Birth:</span>
                <span class="value">${data.dateOfBirth}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>Medical Examination Results</h2>
            <div class="field">
                <span class="label">Examination Date:</span>
                <span class="value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="field">
                <span class="label">Medical Examiner:</span>
                <span class="value">Dr. John Smith, MD</span>
            </div>
            <div class="field">
                <span class="label">Certificate Number:</span>
                <span class="value>MED-${data.id}-${new Date().getFullYear()}</span>
            </div>
            <div class="field">
                <span class="label">Examination Result:</span>
                <span class="value">QUALIFIED</span>
            </div>
            <div class="field">
                <span class="label">Certificate Expiration:</span>
                <span class="value>${new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toLocaleDateString()}</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>Exam Date: ${new Date().toLocaleDateString()}</p>
            <p>Status: Medical Certification Current</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate MVR Template
function generateMVRTemplate(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF MVR - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3498db; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚗 Motor Vehicle Record</h1>
            <p>3-Year Driving History</p>
        </div>
        
        <div class="section">
            <h2>Driver Information</h2>
            <div class="field">
                <span class="label">Driver ID:</span>
                <span class="value">${data.id}</span>
            </div>
            <div class="field">
                <span class="label">Full Name:</span>
                <span class="value">${data.name}</span>
            </div>
            <div class="field">
                <span class="label">CDL Number:</span>
                <span class="value">${data.referenceCdlNumber}</span>
            </div>
            <div class="field">
                <span class="label">License State:</span>
                <span class="value">${data.licenseState}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>MVR Results</h2>
            <div class="field">
                <span class="label">Report Date:</span>
                <span class="value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="field">
                <span class="label">License Class:</span>
                <span class="value">${data.licenseClass}</span>
            </div>
            <div class="field">
                <span class="label">Violations:</span>
                <span class="value">0</span>
            </div>
            <div class="field">
                <span class="label">Accidents:</span>
                <span class="value">0</span>
            </div>
            <div class="field">
                <span class="label">Points:</span>
                <span class="value">0</span>
            </div>
            <div class="field">
                <span class="label">License Status:</span>
                <span class="value">Valid - Active</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>Report Date: ${new Date().toLocaleDateString()}</p>
            <p>Status: Clean Driving Record</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate CDL Template
function generateCDLTemplate(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF CDL - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e74c3c; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚛 Commercial Driver's License</h1>
            <p>License Information</p>
        </div>
        
        <div class="section">
            <h2>Driver Information</h2>
            <div class="field">
                <span class="label">Driver ID:</span>
                <span class="value">${data.id}</span>
            </div>
            <div class="field">
                <span class="label">Full Name:</span>
                <span class="value">${data.name}</span>
            </div>
            <div class="field">
                <span class="label">Date of Birth:</span>
                <span class="value">${data.dateOfBirth}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>License Details</h2>
            <div class="field">
                <span class="label">CDL Number:</span>
                <span class="value">${data.referenceCdlNumber}</span>
            </div>
            <div class="field">
                <span class="label">License Class:</span>
                <span class="value">${data.licenseClass}</span>
            </div>
            <div class="field">
                <span class="label">License State:</span>
                <span class="value">${data.licenseState}</span>
            </div>
            <div class="field">
                <span class="label">Issue Date:</span>
                <span class="value">January 15, 2022</span>
            </div>
            <div class="field">
                <span class="label">Expiration Date:</span>
                <span class="value>January 15, 2026</span>
            </div>
            <div class="field">
                <span class="label">Endorsements:</span>
                <span class="value">T, H</span>
            </div>
            <div class="field">
                <span class="label">Restrictions:</span>
                <span class="value">None</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>License Status: Current and Valid</p>
            <p>Status: CDL Information Verified</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate FMCSA Template
function generateFMCSATemplate(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF FMCSA Clearinghouse - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e67e22; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ FMCSA Drug & Alcohol Clearinghouse</h1>
            <p>Query Results for ${data.name} (${data.id})</p>
        </div>
        
        <div class="section">
            <h2>Driver Information</h2>
            <div class="field">
                <span class="label">Driver ID:</span>
                <span class="value">${data.id}</span>
            </div>
            <div class="field">
                <span class="label">Full Name:</span>
                <span class="value">${data.name}</span>
            </div>
            <div class="field">
                <span class="label">CDL Number:</span>
                <span class="value">${data.referenceCdlNumber}</span>
            </div>
            <div class="field">
                <span class="label">License State:</span>
                <span class="value">${data.licenseState}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>Clearinghouse Query Results</h2>
            <div class="field">
                <span class="label">Query Date:</span>
                <span class="value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="field">
                <span class="label">Drug Program Violations:</span>
                <span class="value">None</span>
            </div>
            <div class="field">
                <span class="label">Alcohol Program Violations:</span>
                <span class="value">None</span>
            </div>
            <div class="field">
                <span class="label">Return-to-Duty Status:</span>
                <span class="value">Not Required</span>
            </div>
            <div class="field">
                <span class="label">Follow-up Testing:</span>
                <span class="value">Not Required</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>Query Date: ${new Date().toLocaleDateString()}</p>
            <p>Status: Clear - No Violations Found</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate Road Test Template
function generateRoadTestTemplate(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF Road Test Certificate - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8e44ad; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚛 Road Test Certificate</h1>
            <p>Commercial Driver Evaluation</p>
        </div>
        
        <div class="section">
            <h2>Driver Information</h2>
            <div class="field">
                <span class="label">Driver ID:</span>
                <span class="value">${data.id}</span>
            </div>
            <div class="field">
                <span class="label">Full Name:</span>
                <span class="value">${data.name}</span>
            </div>
            <div class="field">
                <span class="label">CDL Number:</span>
                <span class="value">${data.referenceCdlNumber}</span>
            </div>
            <div class="field">
                <span class="label">License Class:</span>
                <span class="value">${data.licenseClass}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>Test Results</h2>
            <div class="field">
                <span class="label">Test Date:</span>
                <span class="value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="field">
                <span class="label">Vehicle Type:</span>
                <span class="value">Class A Tractor-Trailer</span>
            </div>
            <div class="field">
                <span class="label">Test Result:</span>
                <span class="value">PASSED</span>
            </div>
            <div class="field">
                <span class="label">Score:</span>
                <span class="value">95/100</span>
            </div>
            <div class="field">
                <span class="label">Examiner:</span>
                <span class="value">BOF Safety Manager</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>Test Date: ${new Date().toLocaleDateString()}</p>
            <p>Status: Road Test Completed - Certified</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate Drug Test Template
function generateDrugTestTemplate(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF Drug Test Result - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e74c3c; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 DOT Drug Test Result</h1>
            <p>Controlled Substances Test</p>
        </div>
        
        <div class="section">
            <h2>Driver Information</h2>
            <div class="field">
                <span class="label">Driver ID:</span>
                <span class="value">${data.id}</span>
            </div>
            <div class="field">
                <span class="label">Full Name:</span>
                <span class="value">${data.name}</span>
            </div>
            <div class="field">
                <span class="label">CDL Number:</span>
                <span class="value">${data.referenceCdlNumber}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>Test Results</h2>
            <div class="field">
                <span class="label">Test Date:</span>
                <span class="value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="field">
                <span class="label">Test Type:</span>
                <span class="value">Pre-Employment</span>
            </div>
            <div class="field">
                <span class="label">Collection Site:</span>
                <span class="value">BOF Medical Center</span>
            </div>
            <div class="field">
                <span class="label">Test Result:</span>
                <span class="value">NEGATIVE</span>
            </div>
            <div class="field">
                <span class="label">Substances Tested:</span>
                <span class="value">Marijuana, Cocaine, Opiates, PCP, Amphetamines</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>Test Date: ${new Date().toLocaleDateString()}</p>
            <p>Status: Drug Test Completed - Negative Result</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate Secondary Contact Template
function generateSecondaryContactTemplate(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF Secondary Contact - ${data.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3498db; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Secondary Contact Information</h1>
            <p>For ${data.name} (${data.id})</p>
        </div>
        
        <div class="section">
            <h2>Secondary Contact</h2>
            <div class="field">
                <span class="label">Contact Name:</span>
                <span class="value">${data.secondaryContactName}</span>
            </div>
            <div class="field">
                <span class="label">Relationship:</span>
                <span class="value">${data.secondaryContactRelationship}</span>
            </div>
            <div class="field">
                <span class="label">Phone:</span>
                <span class="value">${data.secondaryContactPhone}</span>
            </div>
            <div class="field">
                <span class="label">Email:</span>
                <span class="value">${data.secondaryContactEmail}</span>
            </div>
            <div class="field">
                <span class="label">Address:</span>
                <span class="value">${data.secondaryContactAddress}</span>
            </div>
        </div>
        
        <div class="section">
            <h2>Driver Information</h2>
            <div class="field">
                <span class="label">Driver Name:</span>
                <span class="value">${data.name}</span>
            </div>
            <div class="field">
                <span class="label">Driver ID:</span>
                <span class="value">${data.id}</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>Last Updated: ${new Date().toLocaleDateString()}</p>
            <p>Status: Secondary Contact Information</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate prefilled template content
function generatePrefilledTemplate(template, driverData) {
  const generators = {
    "driver_application_template": generateDriverApplicationTemplate,
    "i9_template": generateI9Template,
    "w9_template": generateW9Template,
    "emergency_contact_template": generateEmergencyContactTemplate,
    "secondary_contact_template": generateSecondaryContactTemplate,
    "bank_info_template": generateBankInfoTemplate,
    "fmcsa_clearinghouse_template": generateFMCSATemplate,
    "road_test_template": generateRoadTestTemplate,
    "drug_test_template": generateDrugTestTemplate,
    "medical_certification_template": generateMedicalCertificationTemplate,
    "mvr_template": generateMVRTemplate,
    "cdl_template": generateCDLTemplate
  };
  
  const generator = generators[template.templateName];
  if (generator) {
    return generator(driverData);
  }
  
  // Generic template fallback
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF ${template.documentType} - ${driverData.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #95a5a6; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { color: #2C3E50; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 ${template.documentType}</h1>
            <p>BOF Document</p>
        </div>
        
        <div class="section">
            <h2>Driver Information</h2>
            <div class="field">
                <span class="label">Driver ID:</span>
                <span class="value">${driverData.id}</span>
            </div>
            <div class="field">
                <span class="label">Full Name:</span>
                <span class="value">${driverData.name}</span>
            </div>
            <div class="field">
                <span class="label">Document Type:</span>
                <span class="value">${template.documentType}</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Generated by BOF Vault ComplianceFlow Pro</strong></p>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
            <p>Status: Template Generated</p>
        </div>
    </div>
</body>
</html>`;
}

// Wire templates for a single driver
async function wireTemplatesForDriver(driverId, driverData) {
  const result = {
    driverId,
    templatesProcessed: 0,
    templatesGenerated: 0,
    templatesPrefilled: 0,
    filesReused: 0,
    missingCriticalDocuments: [],
    errors: []
  };

  try {
    // Check existing documents
    const existingFiles = checkExistingDocuments(driverId);
    
    // Map existing files to templates
    const templates = DQF_TEMPLATES.map(template => {
      const existingFile = findMatchingFile(template.documentType, existingFiles);
      return {
        ...template,
        hasExistingFile: !!existingFile,
        existingFilePath: existingFile
      };
    });
    
    // Create target directory
    const targetDir = path.join(process.cwd(), 'public', 'generated', 'drivers', driverId);
    fs.mkdirSync(targetDir, { recursive: true });
    
    // Process each template
    for (const template of templates) {
      result.templatesProcessed++;
      
      const fileName = `${template.documentType.replace(/\s+/g, '_').toLowerCase()}.html`;
      const targetPath = path.join(targetDir, fileName);
      
      if (template.hasExistingFile && template.existingFilePath) {
        // Reuse existing file
        try {
          fs.copyFileSync(template.existingFilePath, targetPath);
          result.filesReused++;
          console.log(`  ✅ Reused existing: ${template.documentType}`);
        } catch (error) {
          result.errors.push(`Failed to copy existing file for ${template.documentType}: ${error}`);
        }
      } else if (template.needsPrefill) {
        // Generate prefilled template
        try {
          const templateContent = generatePrefilledTemplate(template, driverData);
          fs.writeFileSync(targetPath, templateContent, 'utf8');
          result.templatesGenerated++;
          result.templatesPrefilled++;
          console.log(`  📝 Generated prefilled: ${template.documentType}`);
        } catch (error) {
          result.errors.push(`Failed to generate template for ${template.documentType}: ${error}`);
        }
      }
      
      // Track missing critical documents
      if (template.isRequired && template.priority === 'critical' && !template.hasExistingFile) {
        result.missingCriticalDocuments.push(template.documentType);
      }
    }
    
  } catch (error) {
    result.errors.push(`Failed to wire templates for ${driverId}: ${error}`);
  }
  
  return result;
}

// Wire templates for all drivers
async function wireTemplatesForAllDrivers() {
  const results = [];
  
  console.log('🚀 Starting DQF template wiring for all drivers...');
  
  // Load driver data
  const driverData = loadDriverData();
  
  for (const [driverId, data] of driverData) {
    console.log(`\n📋 Wiring templates for ${driverId}...`);
    const result = await wireTemplatesForDriver(driverId, data);
    results.push(result);
    
    console.log(`  Processed: ${result.templatesProcessed}`);
    console.log(`  Generated: ${result.templatesGenerated}`);
    console.log(`  Reused: ${result.filesReused}`);
    console.log(`  Errors: ${result.errors.length}`);
    
    if (result.missingCriticalDocuments.length > 0) {
      console.log(`  ⚠️  Missing Critical: ${result.missingCriticalDocuments.join(', ')}`);
    }
  }
  
  return results;
}

// Generate summary report
function generateSummaryReport(results) {
  const totalDrivers = results.length;
  const totalTemplates = results.reduce((sum, r) => sum + r.templatesProcessed, 0);
  const totalGenerated = results.reduce((sum, r) => sum + r.templatesGenerated, 0);
  const totalReused = results.reduce((sum, r) => sum + r.filesReused, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalMissingCritical = results.reduce((sum, r) => sum + r.missingCriticalDocuments.length, 0);
  
  return `
📊 DQF Template Wiring Summary
========================================
Total Drivers Processed: ${totalDrivers}
Total Templates Processed: ${totalTemplates}
Total Templates Generated: ${totalGenerated}
Total Files Reused: ${totalReused}
Total Errors: ${totalErrors}
Total Missing Critical Documents: ${totalMissingCritical}

${totalErrors > 0 ? '\nErrors:\n' + results.flatMap(r => r.errors).map(e => `  - ${e}`).join('\n') : ''}

${totalMissingCritical > 0 ? '\nMissing Critical Documents by Driver:\n' + results.filter(r => r.missingCriticalDocuments.length > 0).map(r => `  ${r.driverId}: ${r.missingCriticalDocuments.join(', ')}`).join('\n') : ''}

BOF Vault DQF Template Wiring Complete!
========================================
    `;
}

// Main execution function
async function main() {
  console.log("🚀 Starting BOF Vault DQF Template Wiring Process");
  console.log("================================================");
  
  try {
    // Wire templates for all drivers
    const results = await wireTemplatesForAllDrivers();
    
    // Generate and display summary report
    const summary = generateSummaryReport(results);
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
