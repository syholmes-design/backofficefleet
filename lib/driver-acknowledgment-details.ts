import { getBofData } from './load-bof-data';

export interface AcknowledgmentDetail {
  type: string;
  status: 'acknowledged' | 'pending' | 'missing' | 'not_required';
  dueDate?: string;
  filePath?: string;
  applicableToWorkerType: 'all' | 'employee' | 'owner-operator';
}

export function getDriverAcknowledgmentDetails(driverId: string): AcknowledgmentDetail[] {
  const data = getBofData();
  const driver = data.drivers.find(d => d.id === driverId);
  const driverDocuments = data.documents.filter(doc => doc.driverId === driverId);
  
  if (!driver) return [];
  
  // Determine worker type
  const isOwnerOperator = ['DRV-006', 'DRV-010', 'DRV-012'].includes(driverId);
  const workerType = isOwnerOperator ? 'owner-operator' : 'employee';
  
  const acknowledgments: AcknowledgmentDetail[] = [];
  
  // Employee Handbook / Code of Conduct
  if (workerType === 'employee') {
    acknowledgments.push({
      type: 'Employee Handbook / Code of Conduct',
      status: 'acknowledged', // Assume acknowledged for demo
      filePath: `/generated/drivers/${driverId}/hr-payroll/employee-handbook-acknowledgment.html`,
      applicableToWorkerType: 'employee'
    });
  } else {
    acknowledgments.push({
      type: 'Employee Handbook / Code of Conduct',
      status: 'not_required',
      applicableToWorkerType: 'employee'
    });
  }
  
  // Acceptable Use Policy
  acknowledgments.push({
    type: 'Acceptable Use Policy',
    status: 'acknowledged', // Assume acknowledged for demo
    filePath: '/generated/company-operations-vault/12-acceptable-use-of-company-systems-policy.html',
    applicableToWorkerType: 'all'
  });
  
  // Safety and Compliance Policy
  acknowledgments.push({
    type: 'Safety and Compliance Policy',
    status: 'acknowledged', // Assume acknowledged for demo
    filePath: '/generated/company-operations-vault/10-safety-compliance-governance-policy.html',
    applicableToWorkerType: 'all'
  });
  
  // AI Use and Automation Governance Policy
  acknowledgments.push({
    type: 'AI Use and Automation Governance Policy',
    status: 'acknowledged', // Assume acknowledged for demo
    filePath: '/generated/company-operations-vault/17-ai-use-and-automation-governance-policy.html',
    applicableToWorkerType: 'all'
  });
  
  // I-9 and W-9 acknowledgments based on actual document status
  const i9Doc = driverDocuments.find(doc => doc.type === 'I-9');
  if (i9Doc) {
    acknowledgments.push({
      type: 'I-9 Form',
      status: i9Doc.status === 'Acknowledged' ? 'acknowledged' : 'pending',
      filePath: i9Doc.fileUrl,
      applicableToWorkerType: 'all'
    });
  }
  
  const w9Doc = driverDocuments.find(doc => doc.type === 'W-9');
  if (w9Doc) {
    acknowledgments.push({
      type: 'W-9 Form',
      status: w9Doc.status === 'Acknowledged' ? 'acknowledged' : 'pending',
      filePath: w9Doc.fileUrl,
      applicableToWorkerType: 'all'
    });
  }
  
  // Owner-operator specific acknowledgments
  if (workerType === 'owner-operator') {
    acknowledgments.push({
      type: 'Independent Contractor Agreement',
      status: 'acknowledged',
      filePath: `/generated/drivers/${driverId}/owner-operator/independent-contractor-agreement.html`,
      applicableToWorkerType: 'owner-operator'
    });
    
    acknowledgments.push({
      type: 'Owner-Operator Lease Agreement',
      status: 'acknowledged',
      filePath: `/generated/drivers/${driverId}/owner-operator/owner-operator-lease-agreement.html`,
      applicableToWorkerType: 'owner-operator'
    });
    
    acknowledgments.push({
      type: 'Safety and Compliance Acknowledgment',
      status: 'acknowledged',
      filePath: `/generated/drivers/${driverId}/owner-operator/safety-and-compliance-acknowledgment.html`,
      applicableToWorkerType: 'owner-operator'
    });
  }
  
  return acknowledgments;
}

export function getPendingAcknowledgments(driverId: string): AcknowledgmentDetail[] {
  const allAcknowledgments = getDriverAcknowledgmentDetails(driverId);
  return allAcknowledgments.filter(ack => ack.status === 'pending' || ack.status === 'missing');
}

export function getAcknowledgmentSummary(driverId: string): {
  total: number;
  pending: number;
  acknowledged: number;
  notRequired: number;
  details: AcknowledgmentDetail[];
} {
  const allAcknowledgments = getDriverAcknowledgmentDetails(driverId);
  
  return {
    total: allAcknowledgments.length,
    pending: allAcknowledgments.filter(ack => ack.status === 'pending').length,
    acknowledged: allAcknowledgments.filter(ack => ack.status === 'acknowledged').length,
    notRequired: allAcknowledgments.filter(ack => ack.status === 'not_required').length,
    details: allAcknowledgments
  };
}
