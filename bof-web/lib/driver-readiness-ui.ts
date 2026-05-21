import type { BofData } from '@/lib/load-bof-data';
import { getDriverById } from '@/lib/driver-queries';
import { getDriverPaySettlementMethod, isOwnerOperator, type WorkerType } from '@/lib/driver-pay-settlement-methods';
import { getDriverReviewExplanation } from '@/lib/driver-review-explanation';
import { getDriverDispatchEligibility } from '@/lib/driver-dispatch-eligibility';
import { getOrderedDocumentsForDriver } from '@/lib/driver-queries';

export interface DriverReadinessSummary {
  status: 'ready' | 'needs_review' | 'blocked';
  primaryReason: string;
  businessImpact: string;
  requiredFix: string;
  ownerTeam: string;
  relatedDocument?: string;
  dueDate?: string | undefined;
  fixAction?: {
    label: string;
    href?: string;
  };
}

export interface DriverDocumentGroup {
  category: string;
  documents: {
    type: string;
    status: string;
    expirationDate?: string;
    lastUpdated: string;
    classification: string;
    reason?: string;
    action?: {
      label: string;
      href?: string;
    };
  }[];
}

export interface DriverPolicyAcknowledgment {
  policyName: string;
  status: 'acknowledged' | 'missing' | 'pending_review' | 'not_required';
  acknowledgedDate?: string;
  dueDate?: string;
  action?: {
    label: string;
    href?: string;
  };
}

export interface DriverSettlementSummary {
  workerType: WorkerType;
  settlementMethod?: string;
  settlementTerms?: string;
  passThroughItems?: {
    fuelSurcharge: number;
    accessorial: number;
    reimbursements: number;
  };
  deductions?: {
    payrollDeductions?: number;
    settlementDeductions?: number;
    chargebacks?: number;
    familySupport?: number;
  };
  status: 'complete' | 'needs_review' | 'pending';
}

export interface OwnerOperatorPacketStatus {
  driverId: string;
  isOwnerOperator: boolean;
  packetStatus: 'complete' | 'needs_review' | 'pending' | 'not_applicable';
  requiredDocuments: {
    documentName: string;
    status: 'complete' | 'missing' | 'needs_review';
    lastUpdated?: string;
  }[];
}

export function getDriverWorkerType(driverId: string, data: BofData): WorkerType {
  const method = getDriverPaySettlementMethod(driverId, data);
  return method.workerType;
}

function issuePriority(issue: ReturnType<typeof getDriverReviewExplanation>["issues"][number]): number {
  if (issue.id.startsWith("money-at-risk:")) return 0;
  if (issue.severity === "critical") return 1;
  if (issue.severity === "high") return 2;
  if (issue.severity === "warning") return 3;
  return 4;
}

export function getDriverReadinessSummary(driverId: string, data: BofData): DriverReadinessSummary {
  const driver = getDriverById(data, driverId);
  if (!driver) {
    return {
      status: 'blocked',
      primaryReason: 'Driver not found',
      businessImpact: 'Unable to assess driver readiness',
      requiredFix: 'Verify driver exists in system',
      ownerTeam: 'System Administration',
    };
  }

  const review = getDriverReviewExplanation(data, driverId);
  const eligibility = getDriverDispatchEligibility(data, driverId);
  const openIssues = review.issues
    .filter(issue => !issue.resolved)
    .sort((a, b) => issuePriority(a) - issuePriority(b));
  
  // Determine primary issue and status
  const primaryIssue = openIssues.length > 0 ? openIssues[0] : null;
  const status = eligibility.status;
  
  let primaryReason = '';
  let businessImpact = '';
  let requiredFix = '';
  let ownerTeam = '';
  let relatedDocument = '';
  let fixAction;

  if (primaryIssue) {
    primaryReason = primaryIssue.title;
    businessImpact = primaryIssue.whyItMatters || 'May affect dispatch eligibility and compliance';
    requiredFix = primaryIssue.recommendedFix || 'Review and resolve issue';
    ownerTeam = primaryIssue.category === 'dispatch' ? 'Dispatch Team' : 
                 primaryIssue.category === 'credentials' ? 'Compliance Team' :
                 primaryIssue.category === 'documents' ? 'HR/Admin Team' :
                 'Operations Team';
    
    relatedDocument = primaryIssue.actionHref ? primaryIssue.actionHref : '';
    
    fixAction = primaryIssue.actionHref ? {
      label: primaryIssue.actionLabel || 'Open Document',
      href: primaryIssue.actionHref
    } : undefined;
  } else if (status === 'ready') {
    primaryReason = 'All required documents current and valid';
    businessImpact = 'Driver is ready for dispatch';
    requiredFix = 'No action required';
    ownerTeam = 'Operations Team';
  } else {
    primaryReason = review.headline || 'Review required';
    businessImpact = review.recommendedNextStepText || 'May affect dispatch eligibility';
    requiredFix = review.recommendedFix || 'Review driver file';
    ownerTeam = 'Operations Team';
  }

  return {
    status,
    primaryReason,
    businessImpact,
    requiredFix,
    ownerTeam,
    relatedDocument,
    fixAction
  };
}

export function getDriverReviewReasons(driverId: string, data: BofData): string[] {
  const review = getDriverReviewExplanation(data, driverId);
  const openIssues = review.issues.filter(issue => !issue.resolved);
  
  return openIssues.map(issue => `${issue.title} — ${issue.recommendedFix}`);
}

export function getDriverFixActions(driverId: string, data: BofData): Array<{label: string; href?: string}> {
  const review = getDriverReviewExplanation(data, driverId);
  const openIssues = review.issues.filter(issue => !issue.resolved);
  
  return openIssues.map(issue => ({
    label: issue.actionLabel || 'Open Document',
    href: issue.actionHref
  }));
}

export function getDriverDocumentGroups(driverId: string, data: BofData): DriverDocumentGroup[] {
  const documents = getOrderedDocumentsForDriver(data, driverId);
  const workerType = getDriverWorkerType(driverId, data);
  
  // Group documents by business function
  const groups: DriverDocumentGroup[] = [];
  
  // Driver Qualification (all drivers)
  const qualificationDocs = documents.filter(doc => 
    ['CDL', 'Medical Card', 'MVR', 'FMCSA'].includes(doc.type)
  );
  
  if (qualificationDocs.length > 0) {
    groups.push({
      category: 'Driver Qualification',
      documents: qualificationDocs.map(doc => ({
        type: doc.type,
        status: doc.status,
        expirationDate: doc.expirationDate,
        lastUpdated: doc.issueDate || new Date().toISOString().split('T')[0],
        classification: 'Required for all drivers',
        reason: doc.status === 'EXPIRED' ? 'Document expired' : 
                doc.status === 'EXPIRING_SOON' ? 'Document expiring soon' :
                doc.status === 'MISSING' ? 'Document missing' : undefined,
        action: doc.fileUrl ? {
          label: 'Open Document',
          href: doc.fileUrl
        } : {
          label: 'Upload Document',
          href: `/drivers/${driverId}/vault`
        }
      }))
    });
  }
  
  // Contacts (all drivers)
  const contactDocs = documents.filter(doc => 
    ['Emergency Contact', 'Secondary Emergency Contact'].includes(doc.type)
  );
  
  if (contactDocs.length > 0) {
    groups.push({
      category: 'Contacts',
      documents: contactDocs.map(doc => ({
        type: doc.type,
        status: doc.status,
        lastUpdated: doc.issueDate || new Date().toISOString().split('T')[0],
        classification: 'Required for all drivers',
        reason: doc.status === 'MISSING' ? 'Contact information missing' : undefined,
        action: doc.fileUrl ? {
          label: 'View Contact',
          href: doc.fileUrl
        } : {
          label: 'Add Contact',
          href: `/drivers/${driverId}/profile`
        }
      }))
    });
  }
  
  // Employee/HR documents (employee drivers only)
  if (workerType === 'Employee Driver') {
    const hrDocs = documents.filter(doc => 
      ['I-9', 'W-4', 'Benefits Enrollment', 'Life Insurance Election'].includes(doc.type)
    );
    
    if (hrDocs.length > 0) {
      groups.push({
        category: 'Employment / HR',
        documents: hrDocs.map(doc => ({
          type: doc.type,
          status: doc.status,
          lastUpdated: doc.issueDate || new Date().toISOString().split('T')[0],
          classification: 'Employee driver only',
          reason: doc.status === 'MISSING' ? 'HR document missing' : undefined,
          action: doc.fileUrl ? {
            label: 'Open Document',
            href: doc.fileUrl
          } : {
            label: 'Upload Document',
            href: `/drivers/${driverId}/hr`
          }
        }))
      });
    }
    
    // Payroll documents
    const payrollDocs = documents.filter(doc => 
      ['Direct Deposit', 'Bank Info', 'Garnishment Summary', 'FSA Election'].includes(doc.type)
    );
    
    if (payrollDocs.length > 0) {
      groups.push({
        category: 'Payroll',
        documents: payrollDocs.map(doc => ({
          type: doc.type,
          status: doc.status,
          lastUpdated: doc.issueDate || new Date().toISOString().split('T')[0],
          classification: 'Employee driver only',
          reason: doc.status === 'MISSING' ? 'Payroll document missing' : undefined,
          action: doc.fileUrl ? {
            label: 'Open Document',
            href: doc.fileUrl
          } : {
            label: 'Update Payroll',
            href: `/drivers/${driverId}/bank-info`
          }
        }))
      });
    }
  }
  
  // Owner-Operator documents (owner-operators only)
  if (workerType === 'Independent Contractor / Owner-Operator') {
    const ooDocs = documents.filter(doc => 
      ['Independent Contractor Agreement', 'Owner-Operator Lease Agreement', 'Certificate of Insurance', 
       'Occupational Accident Coverage', 'Equipment Schedule', 'Maintenance Responsibility',
       'Fuel/Toll/Advance/Chargeback Policy', 'Settlement Authorization'].includes(doc.type)
    );
    
    if (ooDocs.length > 0) {
      groups.push({
        category: 'Owner-Operator Packet',
        documents: ooDocs.map(doc => ({
          type: doc.type,
          status: doc.status,
          lastUpdated: doc.issueDate || new Date().toISOString().split('T')[0],
          classification: 'Owner-operator only',
          reason: doc.status === 'MISSING' ? 'Owner-operator document missing' : 
                  doc.status === 'NEEDS_REVIEW' ? 'Document needs review' : undefined,
          action: doc.fileUrl ? {
            label: 'Review Document',
            href: doc.fileUrl
          } : {
            label: 'Upload Document',
            href: `/drivers/${driverId}/vault`
          }
        }))
      });
    }
  }
  
  return groups;
}

export function getDriverPolicyAcknowledgments(driverId: string, data: BofData): DriverPolicyAcknowledgment[] {
  const documents = getOrderedDocumentsForDriver(data, driverId);
  const workerType = getDriverWorkerType(driverId, data);
  
  // Define required policies based on worker type
  const allDriverPolicies = [
    'Employee Handbook',
    'Code of Conduct',
    'Safety and Compliance Governance',
    'Acceptable Use Policy'
  ];
  
  const employeeOnlyPolicies = [
    'Payroll Policy'
  ];
  
  const ownerOperatorOnlyPolicies = [
    'Fuel/Toll/Advance/Chargeback Policy',
    'Settlement Authorization'
  ];
  
  const acknowledgments: DriverPolicyAcknowledgment[] = [];
  
  // Add policies applicable to all drivers
  allDriverPolicies.forEach(policyName => {
    const doc = documents.find(d => d.type === policyName);
    acknowledgments.push({
      policyName,
      status: doc ? (doc.status === 'COMPLETE' ? 'acknowledged' : 'missing') : 'missing',
      acknowledgedDate: doc?.issueDate,
      action: {
        label: 'Acknowledge Policy',
        href: `/drivers/${driverId}/vault`
      }
    });
  });
  
  // Add employee-only policies
  if (workerType === 'Employee Driver') {
    employeeOnlyPolicies.forEach(policyName => {
      const doc = documents.find(d => d.type === policyName);
      acknowledgments.push({
        policyName,
        status: doc ? (doc.status === 'COMPLETE' ? 'acknowledged' : 'missing') : 'not_required',
        acknowledgedDate: doc?.issueDate,
        action: doc ? {
          label: 'View Acknowledgment',
          href: doc.fileUrl
        } : {
          label: 'Not Required',
          href: undefined
        }
      });
    });
  }
  
  // Add owner-operator only policies
  if (workerType === 'Independent Contractor / Owner-Operator') {
    ownerOperatorOnlyPolicies.forEach(policyName => {
      const doc = documents.find(d => d.type === policyName);
      acknowledgments.push({
        policyName,
        status: doc ? (doc.status === 'COMPLETE' ? 'acknowledged' : 'missing') : 'not_required',
        acknowledgedDate: doc?.issueDate,
        action: doc ? {
          label: 'View Acknowledgment',
          href: doc.fileUrl
        } : {
          label: 'Not Required',
          href: undefined
        }
      });
    });
  }
  
  return acknowledgments;
}

export function getDriverSettlementSummary(driverId: string, data: BofData): DriverSettlementSummary {
  const method = getDriverPaySettlementMethod(driverId, data);
  
  if (method.workerType === 'Employee Driver') {
    return {
      workerType: method.workerType,
      settlementMethod: method.settlementMethod,
      settlementTerms: `${method.settlementMethod}, plus approved reimbursements, subject to payroll deductions.`,
      passThroughItems: {
        fuelSurcharge: 0,
        accessorial: 0,
        reimbursements: method.employeeReimbursements || 0
      },
      deductions: {
        payrollDeductions: method.employeeDeductions || 0,
        familySupport: method.familySupportWithholding || 0
      },
      status: 'complete'
    };
  } else {
    return {
      workerType: method.workerType,
      settlementMethod: method.settlementMethod,
      settlementTerms: `${method.settlementMethod}, plus fuel surcharge and approved accessorial pass-through, subject to settlement review and authorized deductions/chargebacks.`,
      passThroughItems: {
        fuelSurcharge: 0, // Would be calculated from actual loads
        accessorial: 0, // Would be calculated from actual loads
        reimbursements: method.ownerOperatorReimbursements || 0
      },
      deductions: {
        settlementDeductions: method.ownerOperatorDeductions || 0,
        chargebacks: method.chargebacks || 0
      },
      status: 'complete'
    };
  }
}

export function getOwnerOperatorPacketStatus(driverId: string, data: BofData): OwnerOperatorPacketStatus {
  const isOO = isOwnerOperator(driverId);
  const documents = getOrderedDocumentsForDriver(data, driverId);
  
  if (!isOO) {
    return {
      driverId,
      isOwnerOperator: false,
      packetStatus: 'not_applicable',
      requiredDocuments: []
    };
  }
  
  const requiredDocs = [
    'Independent Contractor Agreement',
    'Owner-Operator Lease Agreement', 
    'Certificate of Insurance',
    'Occupational Accident Coverage',
    'Equipment Schedule',
    'Maintenance Responsibility',
    'Fuel/Toll/Advance/Chargeback Policy',
    'Settlement Authorization',
    'Safety and Compliance Acknowledgment',
    'Worker Classification Review Summary',
    'W-9'
  ];
  
  const requiredDocuments = requiredDocs.map(docName => {
    const doc = documents.find(d => d.type === docName);
    return {
      documentName: docName,
      status: (() => {
        if (!doc) return 'missing';
        if (doc.status === 'COMPLETE') return 'complete';
        if (doc.status === 'NEEDS_REVIEW') return 'needs_review';
        return 'missing';
      })() as 'complete' | 'needs_review' | 'missing',
      lastUpdated: doc?.issueDate || new Date().toISOString().split('T')[0]
    };
  });
  
  // Calculate packet status
  const needsReviewCount = requiredDocuments.filter(doc => doc.status === 'needs_review').length;
  const missingCount = requiredDocuments.filter(doc => doc.status === 'missing').length;
  
  let packetStatus: OwnerOperatorPacketStatus['packetStatus'] = 'complete';
  if (missingCount > 0) packetStatus = 'pending';
  else if (needsReviewCount > 0) packetStatus = 'needs_review';
  
  return {
    driverId,
    isOwnerOperator: true,
    packetStatus,
    requiredDocuments
  };
}
