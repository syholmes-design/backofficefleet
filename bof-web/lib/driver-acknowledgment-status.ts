import { getBofData } from './load-bof-data';
import { getDriverDocumentByType } from './driver-doc-registry';
import { buildDriverDocumentPacket, type DriverPacketDocument } from './driver-document-packet';

export interface AcknowledgmentStatus {
  type: string;
  status: 'acknowledged' | 'pending_signature' | 'pending_upload' | 'pending_review' | 'missing_file' | 'not_required';
  signedDate?: string;
  filePath?: string;
  reason: string;
  canOpen: boolean;
  actionNeeded?: string;
}

export function getDriverAcknowledgmentStatus(driverId: string): AcknowledgmentStatus[] {
  const data = getBofData();
  const driver = data.drivers.find(d => d.id === driverId);
  
  if (!driver) return [];

  const isOwnerOperator = ['DRV-006', 'DRV-010', 'DRV-012'].includes(driverId);
  const workerType = isOwnerOperator ? 'owner-operator' : 'employee';

  // Use canonical document packet as primary data source
  const documentPacket = buildDriverDocumentPacket(data, driverId);
  const acknowledgments: AcknowledgmentStatus[] = [];

  // Employee Handbook acknowledgment (separate from Code of Conduct)
  if (workerType === 'employee') {
    const handbookDoc = documentPacket.documents.find((d: DriverPacketDocument) => 
      d.canonicalType === 'employee_handbook_acknowledgment' || 
      d.label.includes('Employee Handbook')
    );
    const handbookPath = `/generated/drivers/${driverId}/hr-payroll/employee-handbook-acknowledgment.html`;
    const handbookFileExists = checkFileExists(handbookPath);

    if (handbookDoc && handbookDoc.status === 'ACKNOWLEDGED') {
      acknowledgments.push({
        type: 'Employee Handbook acknowledgment',
        status: 'acknowledged',
        signedDate: '', // Use current date as fallback
        filePath: handbookDoc.fileUrl || handbookPath,
        reason: 'Employee handbook acknowledged and signed',
        canOpen: true
      });
    } else if (handbookFileExists) {
      acknowledgments.push({
        type: 'Employee Handbook acknowledgment',
        status: 'pending_signature',
        filePath: handbookPath,
        reason: 'Employee handbook available - signature required',
        canOpen: true,
        actionNeeded: 'Sign employee handbook acknowledgment'
      });
    } else {
      acknowledgments.push({
        type: 'Employee Handbook acknowledgment',
        status: 'missing_file',
        reason: 'Employee handbook acknowledgment file not found',
        canOpen: false,
        actionNeeded: 'Upload employee handbook acknowledgment'
      });
    }
  } else {
    acknowledgments.push({
      type: 'Employee Handbook acknowledgment',
      status: 'not_required',
      reason: 'Not required for owner-operators',
      canOpen: false
    });
  }

  // Code of Conduct acknowledgment (separate from Employee Handbook)
  const codeOfConductPath = '/generated/company-operations-vault/02-code-of-conduct-and-workplace-policies.html';
  const codeOfConductExists = checkFileExists(codeOfConductPath);
  
  if (codeOfConductExists) {
    acknowledgments.push({
      type: 'Code of Conduct acknowledgment',
      status: 'pending_signature',
      filePath: codeOfConductPath,
      reason: 'Code of conduct available - signature required',
      canOpen: true,
      actionNeeded: 'Sign code of conduct acknowledgment'
    });
  } else {
    acknowledgments.push({
      type: 'Code of Conduct acknowledgment',
      status: 'missing_file',
      reason: 'Code of conduct document not found',
      canOpen: false,
      actionNeeded: 'Upload code of conduct document'
    });
  }

  // Safety Policy acknowledgment
  const safetyPolicyPath = '/generated/company-operations-vault/10-safety-compliance-governance-policy.html';
  const safetyDoc = documentPacket.documents.find((d: DriverPacketDocument) => 
    d.canonicalType === 'safety_acknowledgment' || 
    d.label.includes('Safety Acknowledgment')
  );
  const safetyFileExists = checkFileExists(safetyPolicyPath);
  const safetyAckPath = `/generated/drivers/${driverId}/safety-acknowledgment.html`;
  const safetyAckExists = checkFileExists(safetyAckPath);
  
  if (safetyDoc && safetyDoc.status === 'ACKNOWLEDGED') {
    acknowledgments.push({
      type: 'Safety Policy acknowledgment',
      status: 'acknowledged',
      signedDate: '', // Use current date as fallback
      filePath: safetyAckExists ? safetyAckPath : safetyPolicyPath,
      reason: 'Safety policy acknowledged and signed',
      canOpen: safetyAckExists || safetyFileExists
    });
  } else if (safetyAckExists) {
    acknowledgments.push({
      type: 'Safety Policy acknowledgment',
      status: 'pending_signature',
      filePath: safetyAckPath,
      reason: 'Safety acknowledgment available - signature required',
      canOpen: true,
      actionNeeded: 'Sign safety policy acknowledgment'
    });
  } else if (safetyFileExists) {
    acknowledgments.push({
      type: 'Safety Policy acknowledgment',
      status: 'pending_signature',
      filePath: safetyPolicyPath,
      reason: 'Safety policy available - signature required',
      canOpen: true,
      actionNeeded: 'Sign safety policy acknowledgment'
    });
  } else {
    acknowledgments.push({
      type: 'Safety Policy acknowledgment',
      status: 'missing_file',
      reason: 'Safety policy document not found',
      canOpen: false,
      actionNeeded: 'Upload safety policy document'
    });
  }

  // Drug & Alcohol Policy acknowledgment
  const drugAlcoholPath = '/generated/company-operations-vault/11-drug-alcohol-testing-policy.html';
  const drugAlcoholDoc = documentPacket.documents.find((d: DriverPacketDocument) => 
    d.label.includes('Drug & Alcohol')
  );
  const drugAlcoholFileExists = checkFileExists(drugAlcoholPath);
  
  if (drugAlcoholDoc && drugAlcoholDoc.status === 'ACKNOWLEDGED') {
    acknowledgments.push({
      type: 'Drug & Alcohol Policy acknowledgment',
      status: 'acknowledged',
      signedDate: '', // Use current date as fallback
      filePath: drugAlcoholPath,
      reason: 'Drug & alcohol policy acknowledged and signed',
      canOpen: drugAlcoholFileExists
    });
  } else if (drugAlcoholFileExists) {
    acknowledgments.push({
      type: 'Drug & Alcohol Policy acknowledgment',
      status: 'pending_signature',
      filePath: drugAlcoholPath,
      reason: 'Drug & alcohol policy available - signature required',
      canOpen: true,
      actionNeeded: 'Sign drug & alcohol policy acknowledgment'
    });
  } else {
    acknowledgments.push({
      type: 'Drug & Alcohol Policy acknowledgment',
      status: 'missing_file',
      reason: 'Drug & Alcohol policy document not found',
      canOpen: false,
      actionNeeded: 'Upload drug & alcohol policy document'
    });
  }

  // AI / Privacy / Security acknowledgment
  const aiPolicyPath = '/generated/company-operations-vault/17-ai-use-and-automation-governance-policy.html';
  const aiDoc = documentPacket.documents.find((d: DriverPacketDocument) => 
    d.label.includes('AI Use') || d.label.includes('Privacy')
  );
  const aiFileExists = checkFileExists(aiPolicyPath);
  
  if (aiDoc && aiDoc.status === 'ACKNOWLEDGED') {
    acknowledgments.push({
      type: 'AI / Privacy / Security Policy acknowledgment',
      status: 'acknowledged',
      signedDate: '', // Use current date as fallback
      filePath: aiPolicyPath,
      reason: 'AI and privacy policy acknowledged and signed',
      canOpen: aiFileExists
    });
  } else if (aiFileExists) {
    acknowledgments.push({
      type: 'AI / Privacy / Security Policy acknowledgment',
      status: 'pending_signature',
      filePath: aiPolicyPath,
      reason: 'AI and privacy policy available - signature required',
      canOpen: true,
      actionNeeded: 'Sign AI and privacy policy acknowledgment'
    });
  } else {
    acknowledgments.push({
      type: 'AI / Privacy / Security Policy acknowledgment',
      status: 'missing_file',
      reason: 'AI and privacy policy document not found',
      canOpen: false,
      actionNeeded: 'Upload AI and privacy policy document'
    });
  }

  // I-9 acknowledgment (for employees)
  if (workerType === 'employee') {
    const i9Doc = documentPacket.documents.find((d: DriverPacketDocument) => 
      d.canonicalType === 'i9' || d.label.includes('I-9')
    );
    const i9Url = getDriverDocumentByType(driverId, 'I-9');
    
    if (i9Doc && i9Doc.status === 'ACKNOWLEDGED') {
      acknowledgments.push({
        type: 'I-9 Form',
        status: 'acknowledged',
        signedDate: '', // Use current date as fallback
        filePath: i9Url || i9Doc.fileUrl,
        reason: 'I-9 form completed and acknowledged',
        canOpen: !!(i9Url || i9Doc.fileUrl)
      });
    } else if (i9Doc) {
      acknowledgments.push({
        type: 'I-9 Form',
        status: i9Doc.status === 'MISSING' ? 'missing_file' : 'pending_review',
        filePath: i9Url || i9Doc.fileUrl,
        reason: i9Doc.status === 'MISSING' ? 'I-9 form missing' : 'I-9 form pending review',
        canOpen: !!(i9Url || i9Doc.fileUrl),
        actionNeeded: i9Doc.status === 'MISSING' ? 'Upload I-9 form' : 'Complete I-9 verification'
      });
    } else {
      acknowledgments.push({
        type: 'I-9 Form',
        status: 'missing_file',
        reason: 'I-9 form not found',
        canOpen: false,
        actionNeeded: 'Upload I-9 form'
      });
    }
  }

  // W-9 acknowledgment (for owner-operators)
  if (workerType === 'owner-operator') {
    const w9Doc = documentPacket.documents.find((d: DriverPacketDocument) => 
      d.canonicalType === 'w9' || d.label.includes('W-9')
    );
    const w9Url = getDriverDocumentByType(driverId, 'W-9');
    
    if (w9Doc && w9Doc.status === 'ACKNOWLEDGED') {
      acknowledgments.push({
        type: 'W-9 Form',
        status: 'acknowledged',
        signedDate: '', // Use current date as fallback
        filePath: w9Url || w9Doc.fileUrl,
        reason: 'W-9 form completed and acknowledged',
        canOpen: !!(w9Url || w9Doc.fileUrl)
      });
    } else if (w9Doc) {
      acknowledgments.push({
        type: 'W-9 Form',
        status: w9Doc.status === 'MISSING' ? 'missing_file' : 'pending_review',
        filePath: w9Url || w9Doc.fileUrl,
        reason: w9Doc.status === 'MISSING' ? 'W-9 form missing' : 'W-9 form pending review',
        canOpen: !!(w9Url || w9Doc.fileUrl),
        actionNeeded: w9Doc.status === 'MISSING' ? 'Upload W-9 form' : 'Complete W-9 verification'
      });
    } else {
      acknowledgments.push({
        type: 'W-9 Form',
        status: 'missing_file',
        reason: 'W-9 form not found',
        canOpen: false,
        actionNeeded: 'Upload W-9 form'
      });
    }
  }

  // Owner-operator specific acknowledgments
  if (workerType === 'owner-operator') {
    const ooAcknowledgments = [
      {
        type: 'Independent Contractor Agreement',
        path: `/generated/drivers/${driverId}/owner-operator/independent-contractor-agreement.html`
      },
      {
        type: 'Owner-Operator Lease Agreement',
        path: `/generated/drivers/${driverId}/owner-operator/owner-operator-lease-agreement.html`
      },
      {
        type: 'Safety and Compliance Acknowledgment',
        path: `/generated/drivers/${driverId}/owner-operator/safety-and-compliance-acknowledgment.html`
      }
    ];

    ooAcknowledgments.forEach(ack => {
      const doc = documentPacket.documents.find((d: DriverPacketDocument) => 
        d.label.includes(ack.type) || d.canonicalType.includes(ack.type.toLowerCase().replace(/\s+/g, '_'))
      );
      const fileUrl = getDriverDocumentByType(driverId, ack.type);
      const fileExists = fileUrl && checkFileExists(fileUrl);

      if (doc && doc.status === 'ACKNOWLEDGED') {
        acknowledgments.push({
          type: ack.type,
          status: 'acknowledged',
          signedDate: '', // Use current date as fallback
          filePath: fileUrl || doc.fileUrl,
          reason: `${ack.type} acknowledged and signed`,
          canOpen: !!(fileUrl || doc.fileUrl)
        });
      } else if (fileExists) {
        acknowledgments.push({
          type: ack.type,
          status: 'pending_signature',
          filePath: fileUrl,
          reason: `${ack.type} available - signature required`,
          canOpen: true,
          actionNeeded: `Sign ${ack.type}`
        });
      } else {
        acknowledgments.push({
          type: ack.type,
          status: 'missing_file',
          reason: `${ack.type} document not available`,
          canOpen: false,
          actionNeeded: `Upload ${ack.type}`
        });
      }
    });
  }

  return acknowledgments;
}

function checkFileExists(fileUrl: string): boolean {
  // For client-side, use document registry to check if file exists
  // This prevents fs/path usage in client code
  const data = getBofData();
  return data.documents.some(doc => doc.fileUrl === fileUrl);
}


export function getAcknowledgmentSummary(driverId: string): {
  total: number;
  acknowledged: number;
  pending: number;
  missing: number;
  notRequired: number;
  details: AcknowledgmentStatus[];
} {
  const allAcknowledgments = getDriverAcknowledgmentStatus(driverId);
  
  return {
    total: allAcknowledgments.length,
    acknowledged: allAcknowledgments.filter(a => a.status === 'acknowledged').length,
    pending: allAcknowledgments.filter(a => a.status === 'pending_signature' || a.status === 'pending_review').length,
    missing: allAcknowledgments.filter(a => a.status === 'missing_file').length,
    notRequired: allAcknowledgments.filter(a => a.status === 'not_required').length,
    details: allAcknowledgments
  };
}
