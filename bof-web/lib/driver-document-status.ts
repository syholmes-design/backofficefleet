import { getBofData } from './load-bof-data';
import { getDriverDocumentByType } from './driver-doc-registry';

export interface DriverDocumentStatus {
  type: string;
  status: 'valid' | 'expiring_soon' | 'expired' | 'available' | 'pending' | 'missing' | 'not_required';
  fileUrl?: string;
  expirationDate?: string;
  reason: string;
  canOpen: boolean;
  actionNeeded?: string;
}

export interface DriverDocumentGroup {
  title: string;
  documents: DriverDocumentStatus[];
}

export function getDriverDocumentStatus(driverId: string): DriverDocumentGroup[] {
  const data = getBofData();
  const driver = data.drivers.find(d => d.id === driverId);
  const driverDocuments = data.documents.filter(doc => doc.driverId === driverId);
  
  if (!driver) return [];

  const isOwnerOperator = ['DRV-006', 'DRV-010', 'DRV-012'].includes(driverId);
  const workerType = isOwnerOperator ? 'owner-operator' : 'employee';

  const groups: DriverDocumentGroup[] = [];

  // Driver Qualification Documents
  const qualificationDocs = [
    { type: 'CDL', required: true },
    { type: 'Medical Card / Medical Certification', required: true },
    { type: 'MCSA-5875 Medical Examination Report', required: true },
    { type: 'MCSA-5876 Medical Examiner\'s Certificate', required: false },
    { type: 'MVR', required: true },
    { type: 'FMCSA Compliance', required: true }
  ];

  groups.push({
    title: 'Driver Qualification',
    documents: qualificationDocs.map(doc => {
      const status = getDocumentStatus(driverId, doc.type, driverDocuments, doc.required);
      return status;
    })
  });

  // Contact/Profile Documents
  const contactDocs = [
    { type: 'Emergency Contact', required: true },
    { type: 'Driver Profile', required: true }
  ];

  groups.push({
    title: 'Contact / Profile',
    documents: contactDocs.map(doc => {
      const status = getDocumentStatus(driverId, doc.type, driverDocuments, doc.required);
      return status;
    })
  });

  // Employment/Payroll Documents
  const employmentDocs = [];
  
  if (workerType === 'employee') {
    employmentDocs.push(
      { type: 'I-9 / onboarding', required: true },
      { type: 'Bank / Direct Deposit', required: true },
      { type: 'Employee Handbook / Code of Conduct', required: true },
      { type: 'Benefits Enrollment', required: false }
    );
  } else {
    employmentDocs.push(
      { type: 'W-9', required: true },
      { type: 'Independent Contractor Agreement', required: true },
      { type: 'Owner-Operator Lease Agreement', required: true },
      { type: 'Certificate of Insurance Verification', required: true },
      { type: 'Occupational Accident Coverage Acknowledgment', required: true },
      { type: 'Equipment Schedule', required: true },
      { type: 'Maintenance Responsibility Acknowledgment', required: true },
      { type: 'Fuel/Toll/Advance/Chargeback Policy Acknowledgment', required: true },
      { type: 'Settlement/Payment Authorization', required: true },
      { type: 'Safety and Compliance Acknowledgment', required: true },
      { type: 'Worker Classification Review Summary', required: true }
    );
  }

  // Add Family Support Withholding Summary only if applicable
  const driverSettlements = data.settlements.filter(s => s.driverId === driverId);
  const hasFamilySupport = driverSettlements.some(s => 
    s.familySupport && s.familySupport > 0
  );

  if (hasFamilySupport) {
    employmentDocs.push({ type: 'Family Support Withholding Summary', required: true });
  }

  groups.push({
    title: workerType === 'employee' ? 'Employment / Payroll' : 'Owner-Operator Documents',
    documents: employmentDocs.map(doc => {
      const status = getDocumentStatus(driverId, doc.type, driverDocuments, doc.required);
      return status;
    })
  });

  return groups;
}

function getDocumentStatus(
  driverId: string, 
  docType: string, 
  driverDocuments: Array<{type: string, status: string, expirationDate?: string, fileUrl?: string}>, 
  required: boolean
): DriverDocumentStatus {
  // Check for MCSA-5875 special case
  if (docType === 'MCSA-5875 Medical Examination Report') {
    return getMCSA5875Status(driverId);
  }

  // Check for MCSA-5876 special case
  if (docType === 'MCSA-5876 Medical Examiner\'s Certificate') {
    return getMCSA5876Status(driverId);
  }

  // Get document record
  const docRecord = driverDocuments.find(d => d.type === docType);
  const fileUrl = getDriverDocumentByType(driverId, docType);
  const fileExists = fileUrl && checkFileExists(fileUrl);

  // If no record and no file
  if (!docRecord && !fileUrl) {
    return {
      type: docType,
      status: required ? 'missing' : 'not_required',
      reason: required ? 'Document record and file missing' : 'Not applicable for this worker type',
      canOpen: false,
      actionNeeded: required ? 'Upload document' : undefined
    };
  }

  // If file exists but no record
  if (!docRecord && fileUrl && fileExists) {
    return {
      type: docType,
      status: 'available',
      fileUrl,
      reason: 'Document available - needs record verification',
      canOpen: true,
      actionNeeded: 'Verify document record'
    };
  }

  // If record exists but no file
  if (docRecord && (!fileUrl || !fileExists)) {
    return {
      type: docType,
      status: 'missing',
      reason: `Document recorded but file missing`,
      canOpen: false,
      actionNeeded: 'Upload document file',
      expirationDate: docRecord.expirationDate
    };
  }

  // Both record and file exist
  if (docRecord && fileUrl && fileExists) {
    const expirationDate = docRecord.expirationDate;
    const status = deriveStatusFromExpiration(expirationDate);
    
    return {
      type: docType,
      status,
      fileUrl,
      expirationDate,
      reason: getStatusReason(status, expirationDate),
      canOpen: true,
      actionNeeded: status === 'expired' ? 'Update document' : undefined
    };
  }

  // Special handling for Emergency Contact (exists in audit)
  if (docType === 'Emergency Contact' && fileUrl && fileExists) {
    return {
      type: docType,
      status: 'available',
      fileUrl,
      reason: 'Document file exists and accessible',
      canOpen: true
    };
  }

  // Fallback - most documents are missing based on audit
  return {
    type: docType,
    status: 'missing',
    reason: 'Document file not found',
    canOpen: false,
    actionNeeded: required ? 'Upload document' : undefined
  };
}

function getMCSA5875Status(driverId: string): DriverDocumentStatus {
  // Use expected naming pattern for client-side check
  const fileName = `mcsa-5875-${driverId}.pdf`;
  const fileUrl = `/generated/drivers/${driverId}/medical/${fileName}`;
  
  // For client-side, we'll assume the file exists if it's in the document registry
  // This prevents fs/path usage in client code
  const data = getBofData();
  const hasMedicalDoc = data.documents.some(doc => 
    doc.driverId === driverId && 
    doc.type.includes('Medical') && 
    doc.fileUrl && doc.fileUrl.includes('mcsa-5875')
  );

  if (hasMedicalDoc) {
    return {
      type: 'MCSA-5875 Medical Examination Report',
      status: 'available',
      fileUrl,
      reason: 'Medical examination report available',
      canOpen: true
    };
  }

  return {
    type: 'MCSA-5875 Medical Examination Report',
    status: 'missing',
    reason: 'Medical examination report not found',
    canOpen: false,
    actionNeeded: 'Upload MCSA-5875 Medical Examination Report'
  };
}

function getMCSA5876Status(driverId: string): DriverDocumentStatus {
  // Check for DRV-001 special case (PDF in documents/drivers/)
  if (driverId === 'DRV-001') {
    const pdfPath = '/documents/drivers/DRV-001/john-carter-mcsa-5876-signed.pdf';
    // For client-side, assume DRV-001 has this special file
    return {
      type: 'MCSA-5876 Medical Examiner\'s Certificate',
      status: 'available',
      fileUrl: pdfPath,
      reason: 'Medical examiner certificate available',
      canOpen: true
    };
  }

  // Check for standard medical directory file using document registry
  const data = getBofData();
  const hasMCSA5876Doc = data.documents.some(doc => 
    doc.driverId === driverId && 
    doc.type.includes('Medical') && 
    doc.fileUrl && doc.fileUrl.includes('mcsa-5876')
  );

  const fileName = `mcsa-5876-${driverId}.pdf`;
  const fileUrl = `/generated/drivers/${driverId}/medical/${fileName}`;
  
  if (hasMCSA5876Doc) {
    return {
      type: 'MCSA-5876 Medical Examiner\'s Certificate',
      status: 'available',
      fileUrl,
      reason: 'Medical examiner certificate available',
      canOpen: true
    };
  }

  return {
    type: 'MCSA-5876 Medical Examiner\'s Certificate',
    status: 'missing',
    reason: 'Medical examiner certificate not found',
    canOpen: false,
    actionNeeded: 'Upload MCSA-5876 Medical Examiner\'s Certificate'
  };
}

function checkFileExists(fileUrl: string): boolean {
  // For client-side, use document registry to check if file exists
  // This prevents fs/path usage in client code
  const data = getBofData();
  return data.documents.some(doc => doc.fileUrl === fileUrl);
}

function deriveStatusFromExpiration(expirationDate?: string): DriverDocumentStatus['status'] {
  if (!expirationDate) return 'available';
  
  const exp = new Date(expirationDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (exp < today) return 'expired';
  
  const sixtyDays = new Date(today);
  sixtyDays.setDate(today.getDate() + 60);
  
  if (exp <= sixtyDays) return 'expiring_soon';
  
  return 'valid';
}

function getStatusReason(status: DriverDocumentStatus['status'], expirationDate?: string): string {
  switch (status) {
    case 'valid':
      return 'Document current and valid';
    case 'expiring_soon':
      return `Document expires on ${expirationDate}`;
    case 'expired':
      return `Document expired on ${expirationDate}`;
    case 'available':
      return 'Document available for viewing';
    case 'pending':
      return 'Document pending review';
    case 'missing':
      return 'Document missing - upload required';
    case 'not_required':
      return 'Not required for this worker type';
    default:
      return 'Status unknown';
  }
}
