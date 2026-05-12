import { getBofData } from './load-bof-data';
import { buildDriverDocumentPacket, type DriverPacketDocument } from './driver-document-packet';
import { getDriverCredentialStatus } from './driver-credential-status';

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
  
  if (!driver) return [];

  // Use canonical document packet as the primary data source
  const documentPacket = buildDriverDocumentPacket(data, driverId);
  const credentialStatus = getDriverCredentialStatus(data, driverId);
  
  const groups: DriverDocumentGroup[] = [];

  // Driver Qualification Documents - use canonical credential data
  groups.push({
    title: 'Driver Qualification',
    documents: [
      mapCanonicalToPortalStatus('CDL', credentialStatus.cdl),
      mapCanonicalToPortalStatus('Medical Card / Medical Certification', credentialStatus.medicalCard),
      mapCanonicalToPortalStatus('MVR', credentialStatus.mvr),
      mapCanonicalToPortalStatus('FMCSA Compliance', credentialStatus.fmcsa),
      // Find MCSA documents in packet
      ...documentPacket.documents
        .filter(doc => doc.canonicalType.includes('mcsa') || doc.label.includes('MCSA'))
        .map(doc => mapPacketToPortalStatus(doc))
    ]
  });

  // Contact/Profile Documents - use canonical packet data
  groups.push({
    title: 'Contact / Profile',
    documents: documentPacket.documents
      .filter(doc => 
        doc.canonicalType === 'emergency_contact' || 
        doc.canonicalType === 'driver_profile_html' ||
        doc.label.includes('Emergency Contact') ||
        doc.label.includes('Driver Profile')
      )
      .map(doc => mapPacketToPortalStatus(doc))
  });

  // Employment/Payroll Documents - use canonical packet data
  const isOwnerOperator = ['DRV-006', 'DRV-010', 'DRV-012'].includes(driverId);
  const workerType = isOwnerOperator ? 'owner-operator' : 'employee';

  if (workerType === 'employee') {
    groups.push({
      title: 'Employment / Payroll',
      documents: documentPacket.documents
        .filter(doc => 
          doc.canonicalType === 'i9' ||
          doc.canonicalType === 'bank_information' ||
          doc.canonicalType === 'employee_handbook_acknowledgment' ||
          doc.canonicalType === 'benefits_enrollment' ||
          doc.label.includes('I-9') ||
          doc.label.includes('Bank') ||
          doc.label.includes('Employee Handbook') ||
          doc.label.includes('Benefits')
        )
        .map(doc => mapPacketToPortalStatus(doc))
    });
  } else {
    groups.push({
      title: 'Owner-Operator Documents',
      documents: documentPacket.documents
        .filter(doc => 
          doc.canonicalType === 'w9' ||
          doc.label.includes('W-9') ||
          doc.label.includes('Independent Contractor') ||
          doc.label.includes('Owner-Operator') ||
          doc.label.includes('Lease Agreement') ||
          doc.label.includes('Certificate of Insurance') ||
          doc.label.includes('Occupational Accident') ||
          doc.label.includes('Equipment') ||
          doc.label.includes('Fuel') ||
          doc.label.includes('Settlement') ||
          doc.label.includes('Safety and Compliance') ||
          doc.label.includes('Worker Classification')
        )
        .map(doc => mapPacketToPortalStatus(doc))
    });
  }

  // Add Family Support Withholding Summary if applicable
  const driverSettlements = data.settlements.filter(s => s.driverId === driverId);
  const hasFamilySupport = driverSettlements.some(s => 
    s.familySupport && s.familySupport > 0
  );

  if (hasFamilySupport) {
    const familySupportDoc: DriverDocumentStatus = {
      type: 'Family Support Withholding Summary',
      status: 'available',
      reason: 'Family support withholding active',
      canOpen: true,
      fileUrl: `/generated/drivers/${driverId}/family-support-withholding.html`
    };
    
    // Add to the appropriate group
    const targetGroup = groups.find(g => 
      g.title === 'Employment / Payroll' || g.title === 'Owner-Operator Documents'
    );
    if (targetGroup) {
      targetGroup.documents.push(familySupportDoc);
    }
  }

  return groups;
}



// Helper functions to map canonical data to portal format
function mapCanonicalToPortalStatus(label: string, credential: { status: string; fileUrl?: string; expirationDate?: string }): DriverDocumentStatus {
  const status = credential.status === 'valid' ? 'valid' : 
                credential.status === 'expiring_soon' ? 'expiring_soon' :
                credential.status === 'expired' ? 'expired' :
                credential.status === 'missing' ? 'missing' : 'available';
  
  return {
    type: label,
    status,
    fileUrl: credential.fileUrl,
    expirationDate: credential.expirationDate,
    reason: getStatusReason(status, credential.expirationDate),
    canOpen: !!credential.fileUrl,
    actionNeeded: status === 'missing' ? 'Upload document' : 
                   status === 'expired' ? 'Update document' : undefined
  };
}

function mapPacketToPortalStatus(doc: DriverPacketDocument): DriverDocumentStatus {
  const status = doc.status === 'VALID' ? 'valid' :
                doc.status === 'EXPIRING_SOON' ? 'expiring_soon' :
                doc.status === 'EXPIRED' ? 'expired' :
                doc.status === 'MISSING' ? 'missing' : 'available';
  
  return {
    type: doc.label,
    status,
    fileUrl: doc.fileUrl || doc.previewUrl,
    expirationDate: doc.expirationDate,
    reason: getStatusReason(status, doc.expirationDate),
    canOpen: !!(doc.fileUrl || doc.previewUrl),
    actionNeeded: status === 'missing' ? 'Upload document' : 
                   status === 'expired' ? 'Update document' : undefined
  };
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
