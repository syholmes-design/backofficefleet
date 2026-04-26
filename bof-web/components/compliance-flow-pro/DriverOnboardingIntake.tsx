"use client";

import { useState } from "react";
import { DriverAvatar } from "@/components/DriverAvatar";
import type { DqfDocumentType, DqfDocumentRecord } from "@/lib/compliance-flow-pro/dqf-types";

interface DriverOnboardingIntakeProps {
  driverId: string;
  driverName: string;
  onComplete?: (documents: DqfDocumentRecord[]) => void;
}

const REQUIRED_DQF_DOCUMENTS: DqfDocumentType[] = [
  "CDL",
  "Medical Certification",
  "MVR",
  "Driver Application",
  "I-9",
  "W-9",
  "Road Test Certificate",
  "Drug Test Result",
];

function documentTypeDescription(type: DqfDocumentType): string {
  const descriptions: Record<DqfDocumentType, string> = {
    "CDL": "Commercial Driver's License - front and back",
    "Medical Certification": "DOT Medical Certificate or Medical Card",
    "Medical Card": "DOT Medical Card - current and valid",
    "MVR": "Motor Vehicle Record (3-year driving record)",
    "Secondary Contact": "Secondary contact information for emergencies",
    "Driver Application": "§391.21 Driver Qualification Application",
    "Employment Verification": "Prior employment verification",
    "I-9": "Employment Eligibility Verification",
    "W-9": "Taxpayer Identification Number",
    "Road Test Certificate": "Road test evaluation certificate",
    "Drug Test Result": "DOT drug test result",
    "Alcohol Test Result": "DOT alcohol test result",
    "Prior Employer Inquiry": "Prior employer safety performance inquiry",
    "Emergency Contact": "Emergency contact information",
    "FMCSA Clearinghouse": "FMCSA Drug & Alcohol Clearinghouse query",
    "Safety Performance History": "3-year safety performance history",
    "Annual Review": "Annual driver qualification file review",
    "Training Records": "Driver training certificates",
    "Vehicle Inspection Reports": "Daily vehicle inspection reports",
    "Incident Reports": "Accident and incident reports",
    "TWIC Card": "Transportation Worker Identification Credential",
    "HAZMAT Endorsement": "Hazardous materials endorsement",
    "Tanker Endorsement": "Tanker vehicle endorsement",
    "Passport": "Passport or passport card",
    "Defensive Driving Certificate": "Defensive driving course completion",
    "Physical Examination Form": "DOT physical examination form",
    "Direct Deposit Form": "Direct deposit authorization",
    "Bank Information": "Bank account information",
    "Payroll Setup": "Payroll enrollment form",
    "Uniform Agreement": "Uniform sizing and agreement",
    "Equipment Assignment": "Assigned equipment acknowledgment",
    "Other / Supporting Docs": "Additional supporting documentation",
  };

  return descriptions[type] || type;
}

export function DriverOnboardingIntake({ driverId, driverName, onComplete }: DriverOnboardingIntakeProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<DqfDocumentType, File | null>>({} as Record<DqfDocumentType, File | null>);
  const [extractedData, setExtractedData] = useState<Record<DqfDocumentType, any>>({} as Record<DqfDocumentType, any>);
  const [isProcessing, setIsProcessing] = useState<Record<DqfDocumentType, boolean>>({} as Record<DqfDocumentType, boolean>);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handleFileUpload = async (documentType: DqfDocumentType, file: File) => {
    setIsProcessing({ ...isProcessing, [documentType]: true });
    
    // Simulate file upload and OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extracted data based on document type
    const mockExtractedData = mockExtractDataForDocument(documentType, file);
    
    setUploadedDocuments({ ...uploadedDocuments, [documentType]: file });
    setExtractedData({ ...extractedData, [documentType]: mockExtractedData });
    setIsProcessing({ ...isProcessing, [documentType]: false });
  };

  const mockExtractDataForDocument = (documentType: DqfDocumentType, file: File): any => {
    switch (documentType) {
      case "CDL":
        return {
          licenseNumber: "CDL123456",
          licenseClass: "A",
          endorsements: "T, H",
          restrictions: "None",
          issueDate: "2022-01-15",
          expirationDate: "2026-01-15",
          state: "CA",
        };
      case "Medical Certification":
        return {
          certificationType: "Medical Examiner's Certificate",
          issueDate: "2023-06-01",
          expirationDate: "2025-06-01",
          examinerName: "Dr. John Smith",
          examinerLicense: "ME123456",
        };
      case "MVR":
        return {
          reportDate: "2024-01-10",
          licenseClass: "A",
          endorsements: "T, H",
          violations: 0,
          accidents: 0,
          points: 0,
        };
      default:
        return {
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        };
    }
  };

  const getCompletionPercentage = (): number => {
    const completed = Object.keys(uploadedDocuments).length;
    return Math.round((completed / REQUIRED_DQF_DOCUMENTS.length) * 100);
  };

  const canProceedToNext = (): boolean => {
    if (currentStep === 0) return true; // Welcome step
    if (currentStep === 1) return uploadedDocuments["CDL"] !== null;
    if (currentStep === 2) return uploadedDocuments["Medical Certification"] !== null;
    if (currentStep === 3) return uploadedDocuments["MVR"] !== null;
    if (currentStep === 4) return uploadedDocuments["Driver Application"] !== null;
    if (currentStep === 5) return uploadedDocuments["I-9"] !== null && uploadedDocuments["W-9"] !== null;
    return true;
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Convert uploaded files to DQF document records
    const documents: DqfDocumentRecord[] = Object.entries(uploadedDocuments).map(([documentType, file]) => {
      if (!file) return null;
      
      return {
        id: `${driverId}-${documentType}-${Date.now()}`,
        driverId,
        documentType: documentType as DqfDocumentType,
        category: "core_dqf",
        requirement: "required",
        status: "review_pending",
        verificationStatus: "pending_review",
        reviewState: "not_started",
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        extractedFields: extractedData[documentType as DqfDocumentType] || {},
        extractionConfidence: "high",
        blocksDispatch: false,
        blocksPayment: false,
        complianceAlerts: [],
        auditLog: [
          {
            id: "1",
            timestamp: new Date().toISOString(),
            action: "created",
            userType: "driver",
            details: `Document uploaded via driver onboarding portal`,
          },
        ],
        source: "driver_upload",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }).filter(Boolean) as DqfDocumentRecord[];

    setIsComplete(true);
    onComplete?.(documents);
  };

  if (isComplete) {
    return (
      <div className="bof-page">
        <div className="bof-card bof-card-center">
          <div className="bof-card-body">
            <div className="bof-success-message">
              <h2 className="bof-title">Onboarding Complete!</h2>
              <p className="bof-lead">
                Thank you, {driverName}. Your documents have been submitted for review.
              </p>
              <div className="bof-success-details">
                <div className="bof-success-stat">
                  <span className="bof-success-number">{Object.keys(uploadedDocuments).length}</span>
                  <span className="bof-success-label">Documents Uploaded</span>
                </div>
                <div className="bof-success-stat">
                  <span className="bof-success-number">Review Pending</span>
                  <span className="bof-success-label">Next Step</span>
                </div>
              </div>
              <p className="bof-muted">
                You will receive an email once your documents have been reviewed and verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bof-page">
      <div className="bof-page-header">
        <h1 className="bof-title">Driver Onboarding</h1>
        <p className="bof-lead">
          Complete your qualification file upload and verification
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bof-progress-section">
        <div className="bof-progress-header">
          <h3>Onboarding Progress</h3>
          <span className="bof-progress-percentage">{getCompletionPercentage()}%</span>
        </div>
        <div className="bof-progress-bar">
          <div 
            className="bof-progress-fill" 
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
        <div className="bof-progress-steps">
          {["Welcome", "CDL", "Medical", "MVR", "Application", "Tax Forms", "Review"].map((step, index) => (
            <div
              key={step}
              className={`bof-progress-step ${
                index <= currentStep ? "bof-progress-step-active" : ""
              }`}
            >
              <div className="bof-progress-step-number">{index + 1}</div>
              <div className="bof-progress-step-label">{step}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Driver Info */}
      <div className="bof-card">
        <div className="bof-card-header">
          <h3 className="bof-card-title">Driver Information</h3>
        </div>
        <div className="bof-card-body">
          <div className="bof-driver-info">
            <DriverAvatar name={driverName} size={48} />
            <div className="bof-driver-details">
              <h4>{driverName}</h4>
              <p className="bof-muted">Driver ID: {driverId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="bof-card">
        <div className="bof-card-header">
          <h3 className="bof-card-title">
            {currentStep === 0 && "Welcome to ComplianceFlow Pro"}
            {currentStep === 1 && "Commercial Driver's License"}
            {currentStep === 2 && "Medical Certification"}
            {currentStep === 3 && "Motor Vehicle Record"}
            {currentStep === 4 && "Driver Application"}
            {currentStep === 5 && "Tax Forms (I-9 & W-9)"}
            {currentStep === 6 && "Review & Submit"}
          </h3>
        </div>
        <div className="bof-card-body">
          {currentStep === 0 && (
            <div className="bof-welcome-content">
              <p>
                Welcome to the BOF Vault driver qualification system. This process will guide you through uploading your required DQF documents.
              </p>
              <div className="bof-required-docs">
                <h4>Required Documents:</h4>
                <ul className="bof-doc-list">
                  {REQUIRED_DQF_DOCUMENTS.map(doc => (
                    <li key={doc} className="bof-doc-item">
                      <span className={`bof-doc-status ${uploadedDocuments[doc] ? "bof-doc-uploaded" : "bof-doc-pending"}`}>
                        {uploadedDocuments[doc] ? "✓" : "○"}
                      </span>
                      <span className="bof-doc-name">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {currentStep >= 1 && currentStep <= 5 && (
            <div className="bof-upload-section">
              {currentStep === 1 && (
                <DocumentUploadStep
                  documentType="CDL"
                  description={documentTypeDescription("CDL")}
                  file={uploadedDocuments["CDL"]}
                  extractedData={extractedData["CDL"]}
                  isProcessing={isProcessing["CDL"]}
                  onUpload={(file) => handleFileUpload("CDL", file)}
                />
              )}
              
              {currentStep === 2 && (
                <DocumentUploadStep
                  documentType="Medical Certification"
                  description={documentTypeDescription("Medical Certification")}
                  file={uploadedDocuments["Medical Certification"]}
                  extractedData={extractedData["Medical Certification"]}
                  isProcessing={isProcessing["Medical Certification"]}
                  onUpload={(file) => handleFileUpload("Medical Certification", file)}
                />
              )}
              
              {currentStep === 3 && (
                <DocumentUploadStep
                  documentType="MVR"
                  description={documentTypeDescription("MVR")}
                  file={uploadedDocuments["MVR"]}
                  extractedData={extractedData["MVR"]}
                  isProcessing={isProcessing["MVR"]}
                  onUpload={(file) => handleFileUpload("MVR", file)}
                />
              )}
              
              {currentStep === 4 && (
                <DocumentUploadStep
                  documentType="Driver Application"
                  description={documentTypeDescription("Driver Application")}
                  file={uploadedDocuments["Driver Application"]}
                  extractedData={extractedData["Driver Application"]}
                  isProcessing={isProcessing["Driver Application"]}
                  onUpload={(file) => handleFileUpload("Driver Application", file)}
                />
              )}
              
              {currentStep === 5 && (
                <div className="bof-dual-upload">
                  <DocumentUploadStep
                    documentType="I-9"
                    description={documentTypeDescription("I-9")}
                    file={uploadedDocuments["I-9"]}
                    extractedData={extractedData["I-9"]}
                    isProcessing={isProcessing["I-9"]}
                    onUpload={(file) => handleFileUpload("I-9", file)}
                  />
                  <DocumentUploadStep
                    documentType="W-9"
                    description={documentTypeDescription("W-9")}
                    file={uploadedDocuments["W-9"]}
                    extractedData={extractedData["W-9"]}
                    isProcessing={isProcessing["W-9"]}
                    onUpload={(file) => handleFileUpload("W-9", file)}
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === 6 && (
            <div className="bof-review-section">
              <h4>Review Your Documents</h4>
              <div className="bof-review-grid">
                {REQUIRED_DQF_DOCUMENTS.map(docType => (
                  <div key={docType} className="bof-review-item">
                    <div className="bof-review-header">
                      <span className="bof-review-title">{docType}</span>
                      <span className={`bof-review-status ${uploadedDocuments[docType] ? "bof-review-uploaded" : "bof-review-missing"}`}>
                        {uploadedDocuments[docType] ? "Uploaded" : "Missing"}
                      </span>
                    </div>
                    {uploadedDocuments[docType] && (
                      <div className="bof-review-details">
                        <p className="bof-muted">File: {uploadedDocuments[docType]!.name}</p>
                        {extractedData[docType] && Object.keys(extractedData[docType]).length > 0 && (
                          <div className="bof-extracted-data">
                            <p className="bof-muted">Extracted Information:</p>
                            <ul className="bof-extracted-list">
                              {Object.entries(extractedData[docType]).map(([key, value]) => (
                                <li key={key}>
                                  <strong>{key}:</strong> {String(value)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="bof-navigation">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          className="bof-btn bof-btn-secondary"
          disabled={currentStep === 0}
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="bof-btn bof-btn-primary"
          disabled={!canProceedToNext()}
        >
          {currentStep === 6 ? "Complete Onboarding" : "Next"}
        </button>
      </div>
    </div>
  );
}

interface DocumentUploadStepProps {
  documentType: DqfDocumentType;
  description: string;
  file: File | null;
  extractedData?: any;
  isProcessing: boolean;
  onUpload: (file: File) => void;
}

function DocumentUploadStep({
  documentType,
  description,
  file,
  extractedData,
  isProcessing,
  onUpload,
}: DocumentUploadStepProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bof-upload-step">
      <div className="bof-upload-description">
        <h4>{documentType}</h4>
        <p>{description}</p>
      </div>
      
      {!file ? (
        <div
          className={`bof-upload-zone ${dragActive ? "bof-upload-zone-active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id={`file-${documentType}`}
            onChange={handleChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="bof-file-input"
          />
          <label htmlFor={`file-${documentType}`} className="bof-upload-label">
            <div className="bof-upload-icon">📁</div>
            <p>Drag and drop your document here, or click to browse</p>
            <p className="bof-muted">PDF, JPG, or PNG files accepted</p>
          </label>
        </div>
      ) : (
        <div className="bof-upload-preview">
          <div className="bof-upload-info">
            <div className="bof-upload-icon">✅</div>
            <div className="bof-upload-details">
              <p className="bof-upload-name">{file.name}</p>
              <p className="bof-upload-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => onUpload(file)}
              className="bof-btn bof-btn-sm bof-btn-secondary"
            >
              Reupload
            </button>
          </div>
          
          {isProcessing && (
            <div className="bof-processing">
              <p>Processing document and extracting information...</p>
              <div className="bof-spinner" />
            </div>
          )}
          
          {extractedData && Object.keys(extractedData).length > 0 && (
            <div className="bof-extracted-preview">
              <h5>Extracted Information</h5>
              <div className="bof-extracted-grid">
                {Object.entries(extractedData).map(([key, value]) => (
                  <div key={key} className="bof-extracted-field">
                    <label>{key}:</label>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
