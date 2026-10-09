export interface CompanyOperationsVaultDocument {
  id: string;
  title: string;
  category: 'HR & Employment Operations' | 'Payroll & Compensation' | 'Accounting & Finance' | 'Factoring & Receivables' | 'Insurance, Claims & Risk' | 'Vendor, Maintenance & Purchasing' | 'Safety & Compliance Governance' | 'Mission, Vision & Operating Principles' | 'Vault Administration' | 'IT, Security, Privacy & AI Governance';
  businessFunction: string;
  ownerTeam: string;
  status: 'Active' | 'Draft' | 'Needs Review' | 'Review Due Soon' | 'Archived';
  lastReviewed: string;
  nextReviewDue: string;
  appliesTo: string[];
  acknowledgmentRequired: boolean;
  acknowledgmentSummary?: string;
  filePath: string;
  description: string;
  tags: string[];
  effectiveDate: string;
  reviewDate: string;
  version: string;
}

export interface CompanyOperationsVaultSummary {
  totalDocuments: number;
  activePolicies: number;
  acknowledgmentsRequired: number;
  acknowledgmentsMissing: number;
  reviewsDueSoon: number;
  businessFunctionsCovered: string[];
}

export const COMPANY_OPERATIONS_VAULT_DOCUMENTS: CompanyOperationsVaultDocument[] = [
  {
    id: '00-company-operations-vault-index-and-naming-standards',
    title: 'Company Operations Vault Index and Naming Standards',
    category: 'Vault Administration',
    businessFunction: 'Document Management & Governance',
    ownerTeam: 'Admin',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Admin', 'HR', 'Payroll', 'Finance', 'Compliance'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '00-company-operations-vault-index-and-naming-standards.html',
    description: 'Current index of the Company Operations Vault. Lists recovered BOF documents and SOURCE NOT RECOVERED placeholders. Historical/impostor files are not current.',
    tags: ['standards', 'governance', 'documentation'],
    effectiveDate: '2026-09-20',
    reviewDate: '2026-09-22',
    version: '2.2'
  },
  {
    id: '01-employee-handbook-template',
    title: 'Employee Handbook',
    category: 'HR & Employment Operations',
    businessFunction: 'HR Management & Employee Relations',
    ownerTeam: 'HR / Admin',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['Drivers', 'Employees', 'Admin', 'HR'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '01-employee-handbook-template.html',
    description: 'SOURCE NOT RECOVERED. Teal generated handbook removed from the current surface. Placeholder identity only.',
    tags: ['hr', 'handbook', 'policies', 'employment', 'source-not-recovered'],
    effectiveDate: '',
    reviewDate: '',
    version: '1.0'
  },
  {
    id: '02-code-of-conduct-and-workplace-policies',
    title: 'Code of Conduct and Workplace Policies',
    category: 'HR & Employment Operations',
    businessFunction: 'HR Management & Compliance',
    ownerTeam: 'HR / Admin',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['Drivers', 'Employees', 'Admin', 'HR'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '02-code-of-conduct-and-workplace-policies.html',
    description: 'SOURCE NOT RECOVERED. Teal generated code of conduct removed from the current surface.',
    tags: ['hr', 'conduct', 'workplace', 'source-not-recovered'],
    effectiveDate: '',
    reviewDate: '',
    version: '1.0'
  },
  {
    id: '03-hr-onboarding-and-offboarding-checklist',
    title: 'HR Onboarding and Offboarding Checklist',
    category: 'HR & Employment Operations',
    businessFunction: 'HR Management & Operations',
    ownerTeam: 'HR / Admin',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['Drivers', 'Employees', 'Admin', 'HR'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '03-hr-onboarding-and-offboarding-checklist.html',
    description: 'SOURCE NOT RECOVERED. Distinct from BOF-ONB-CHK-001. Teal generated body removed from the current surface.',
    tags: ['hr', 'onboarding', 'offboarding', 'source-not-recovered'],
    effectiveDate: '',
    reviewDate: '',
    version: '1.0'
  },
  {
    id: '04-payroll-compensation-and-deductions-policy',
    title: 'Payroll, Compensation, and Deductions Policy',
    category: 'Payroll & Compensation',
    businessFunction: 'Payroll Management & Finance',
    ownerTeam: 'Payroll / Finance',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['Drivers', 'Employees', 'Payroll', 'Finance', 'Dispatch'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '04-payroll-compensation-and-deductions-policy.html',
    description: 'Recovered from source-assets HR-PAY-001 DOCX. Teal generated presentation removed. Not BOF-approved.',
    tags: ['payroll', 'compensation', 'deductions', 'HR-PAY-001'],
    effectiveDate: '2026-01-01',
    reviewDate: '',
    version: '1.0'
  },
  {
    id: '05-accounting-finance-close-ap-ar-sop',
    title: 'Accounting, Finance Close, AP, and AR SOP',
    category: 'Accounting & Finance',
    businessFunction: 'Finance & Accounting',
    ownerTeam: 'Finance / AR',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['Finance', 'Dispatch', 'Billing', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '05-accounting-finance-close-ap-ar-sop.html',
    description: 'SOURCE NOT RECOVERED. Teal generated close SOP removed from the current surface.',
    tags: ['accounting', 'finance', 'sop', 'source-not-recovered'],
    effectiveDate: '',
    reviewDate: '',
    version: '1.0'
  },
  {
    id: '06-factoring-and-receivables-policy',
    title: 'Factoring and Receivables Policy',
    category: 'Factoring & Receivables',
    businessFunction: 'Finance & Credit',
    ownerTeam: 'Finance / AR',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['Finance', 'Dispatch', 'Billing'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '06-factoring-and-receivables-policy.html',
    description: 'SOURCE NOT RECOVERED. Teal generated factoring policy removed. Factoring notice forms are not this policy.',
    tags: ['factoring', 'receivables', 'source-not-recovered'],
    effectiveDate: '',
    reviewDate: '',
    version: '1.0'
  },
  {
    id: '08-vendor-maintenance-and-purchasing-policy',
    title: 'Vendor, Maintenance, and Purchasing Policy',
    category: 'Vendor, Maintenance & Purchasing',
    businessFunction: 'Procurement & Maintenance',
    ownerTeam: 'Maintenance / Procurement',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['Maintenance', 'Procurement', 'Dispatch'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '08-vendor-maintenance-and-purchasing-policy.html',
    description: 'SOURCE NOT RECOVERED. Teal generated vendor/maintenance policy removed from the current surface.',
    tags: ['vendor', 'maintenance', 'purchasing', 'source-not-recovered'],
    effectiveDate: '',
    reviewDate: '',
    version: '1.0'
  },
  {
    id: '09-mission-vision-and-operating-principles',
    title: 'Mission, Vision, and Operating Principles',
    category: 'Mission, Vision & Operating Principles',
    businessFunction: 'Executive Management',
    ownerTeam: 'Executive',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['All Staff', 'Drivers', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '09-mission-vision-and-operating-principles.html',
    description: 'SOURCE NOT RECOVERED. Teal generated mission/vision page removed from the current surface.',
    tags: ['mission', 'vision', 'source-not-recovered'],
    effectiveDate: '',
    reviewDate: '',
    version: '1.0'
  },
  {
    id: '10-safety-compliance-governance-policy',
    title: 'Safety and Compliance Governance Policy',
    category: 'Safety & Compliance Governance',
    businessFunction: 'Safety & Compliance',
    ownerTeam: 'Safety / Compliance',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Drivers', 'Dispatch', 'Safety', 'Admin'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: '11 of 12 drivers acknowledged; 1 missing',
    filePath: '10-safety-compliance-governance-policy.html',
    description: 'Comprehensive safety policies, compliance procedures, and governance framework. Includes driver safety standards, incident reporting, regulatory compliance, and audit procedures.',
    tags: ['safety', 'compliance', 'governance', 'policy'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '11-information-security-governance-policy',
    title: 'Information Security Governance Policy',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Information Security',
    status: 'Needs Review',
    lastReviewed: '2025-12-12',
    nextReviewDue: '',
    appliesTo: ['All Staff', 'IT', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '11-information-security-governance-policy.html',
    description: 'Recovered DAT-IT-003 umbrella controls for company, driver, customer, and operating information. Not the quarantined BOF-SEC-001 impostor.',
    tags: ['security', 'governance', 'it', 'policy', 'DAT-IT-003'],
    effectiveDate: '2025-12-12',
    reviewDate: '2025-12-12',
    version: '2.0'
  },
  {
    id: '12-acceptable-use-of-company-systems-policy',
    title: 'Acceptable Use of Company Systems Policy',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Information Security & IT Operations',
    status: 'Needs Review',
    lastReviewed: '2025-12-12',
    nextReviewDue: '',
    appliesTo: ['All Staff', 'Drivers', 'Contractors'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: undefined,
    filePath: '12-acceptable-use-of-company-systems-policy.html',
    description: 'Recovered DAT-IT-001 expected use of company systems, records, devices, and account access. Not the quarantined BOF-AUP-002 impostor.',
    tags: ['security', 'acceptable-use', 'systems', 'policy', 'DAT-IT-001'],
    effectiveDate: '2025-12-12',
    reviewDate: '2025-12-12',
    version: '2.0'
  },
  {
    id: '13-information-classification-policy',
    title: 'Information Classification Policy',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Information Security & Data Protection',
    status: 'Needs Review',
    lastReviewed: '2025-12-12',
    nextReviewDue: '',
    appliesTo: ['All Staff', 'IT', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '13-information-classification-policy.html',
    description: 'Recovered DAT-IT-004 classification of operational, driver, customer, and vendor data. Not the quarantined BOF-ICP-003 impostor.',
    tags: ['classification', 'security', 'data-protection', 'policy', 'DAT-IT-004'],
    effectiveDate: '2025-12-12',
    reviewDate: '2025-12-12',
    version: '2.0'
  },
  {
    id: '14-data-protection-and-secure-handling-standard',
    title: 'Data Protection and Secure Handling Standard',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Information Security & Data Protection',
    status: 'Needs Review',
    lastReviewed: '2025-12-12',
    nextReviewDue: '',
    appliesTo: ['All Staff', 'IT', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '14-data-protection-and-secure-handling-standard.html',
    description: 'Recovered DAT-IT-004-S restricted protection standard. Not the quarantined BOF-DPS-004 impostor.',
    tags: ['data-protection', 'security', 'privacy', 'handling', 'DAT-IT-004-S'],
    effectiveDate: '2025-12-12',
    reviewDate: '2025-12-12',
    version: '2.0'
  },
  {
    id: '15-privacy-and-employee-data-handling-policy',
    title: 'Privacy and Employee Data Handling Policy',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Human Resources & Data Protection',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['All Staff', 'Drivers', 'HR'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '15-privacy-and-employee-data-handling-policy.html',
    description: 'EXTERNAL COMPLIANCE GAP — REVIEW REQUIRED. Recovered BOF operating-record privacy constraints only. Not a GDPR/CCPA/privacy-law manual. Impostor BOF-PRV-005 quarantined.',
    tags: ['privacy', 'data-handling', 'employee-data', 'policy'],
    effectiveDate: '',
    reviewDate: '',
    version: '1.0'
  },
  {
    id: '16-vendor-security-assessment-policy',
    title: 'Vendor Security Assessment Policy',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Procurement & Information Security',
    status: 'Needs Review',
    lastReviewed: '2025-12-12',
    nextReviewDue: '',
    appliesTo: ['Procurement', 'IT', 'Admin', 'Vendors'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '16-vendor-security-assessment-policy.html',
    description: 'Recovered DAT-IT-014 vendor and third-party access review. Not the quarantined BOF-VSA-006 impostor.',
    tags: ['vendor', 'security', 'assessment', 'policy', 'DAT-IT-014'],
    effectiveDate: '2025-12-12',
    reviewDate: '2025-12-12',
    version: '2.0'
  },
  {
    id: '17-ai-use-and-automation-governance-policy',
    title: 'AI Use and Automation Governance Policy',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Information Security & Innovation',
    status: 'Needs Review',
    lastReviewed: '2025-12-12',
    nextReviewDue: '',
    appliesTo: ['All Staff', 'IT', 'Admin', 'Drivers'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: undefined,
    filePath: '17-ai-use-and-automation-governance-policy.html',
    description: 'Recovered DAT-IT-008 AI-assisted work under human operating control. Not the quarantined BOF-AIG-007 impostor.',
    tags: ['ai', 'automation', 'governance', 'policy', 'DAT-IT-008'],
    effectiveDate: '2025-12-12',
    reviewDate: '2025-12-12',
    version: '2.0'
  },
  {
    id: '18-driver-worker-classification-and-owner-operator-engagement-policy',
    title: 'Driver Worker Classification and Owner-Operator Engagement Policy',
    category: 'HR & Employment Operations',
    businessFunction: 'HR, Payroll, Compliance, Dispatch',
    ownerTeam: 'HR / Payroll / Compliance',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['Drivers', 'Owner-Operators', 'Dispatch', 'HR', 'Payroll', 'Compliance'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '18-driver-worker-classification-and-owner-operator-engagement-policy.html',
    description: 'SOURCE NOT RECOVERED. Teal generated classification policy removed. Lease templates are not this policy.',
    tags: ['worker classification', 'source-not-recovered'],
    effectiveDate: '',
    reviewDate: '',
    version: '1.0'
  },
  {
    id: '19-tax-and-regulatory-audit-readiness-policy',
    title: 'Tax and Regulatory Audit Readiness Policy',
    category: 'Accounting & Finance',
    businessFunction: 'Finance, Compliance, Operations',
    ownerTeam: 'Finance / Compliance / Admin',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['Finance', 'Dispatch', 'Safety', 'Payroll', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '19-tax-and-regulatory-audit-readiness-policy.html',
    description: 'SOURCE NOT RECOVERED. Teal generated tax-audit policy removed from the current surface.',
    tags: ['audit readiness', 'source-not-recovered'],
    effectiveDate: '',
    reviewDate: '',
    version: '1.0'
  },
  {
    id: '20-fuel-mileage-and-excise-tax-support-checklist',
    title: 'Fuel, Mileage, and Excise Tax Support Checklist',
    category: 'Accounting & Finance',
    businessFunction: 'Finance, Compliance, Dispatch',
    ownerTeam: 'Finance / Compliance',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['Finance', 'Dispatch', 'Safety', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '20-fuel-mileage-and-excise-tax-support-checklist.html',
    description: 'SOURCE NOT RECOVERED. Teal generated IFTA/excise checklist removed. Do not treat as tax authority.',
    tags: ['fuel documentation', 'source-not-recovered'],
    effectiveDate: '',
    reviewDate: '',
    version: '1.0'
  },
  {
    id: '21-cash-flow-management-and-receivables-acceleration-policy',
    title: 'Cash Flow Management and Receivables Acceleration Policy',
    category: 'Factoring & Receivables',
    businessFunction: 'Finance, AR, Dispatch',
    ownerTeam: 'Finance / AR',
    status: 'Needs Review',
    lastReviewed: '',
    nextReviewDue: '',
    appliesTo: ['Finance', 'Dispatch', 'Billing', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '21-cash-flow-management-and-receivables-acceleration-policy.html',
    description: 'SOURCE NOT RECOVERED. Teal generated cash-flow policy removed from the current surface.',
    tags: ['cash flow', 'source-not-recovered'],
    effectiveDate: '',
    reviewDate: '',
    version: '1.0'
  }
];

export function getCompanyOperationsVaultSummary(): CompanyOperationsVaultSummary {
  const totalDocuments = COMPANY_OPERATIONS_VAULT_DOCUMENTS.length;
  const activePolicies = COMPANY_OPERATIONS_VAULT_DOCUMENTS.filter(doc => doc.status === 'Active').length;
  const acknowledgmentsRequired = COMPANY_OPERATIONS_VAULT_DOCUMENTS.filter(doc => doc.acknowledgmentRequired).length;
  const acknowledgmentsMissing = COMPANY_OPERATIONS_VAULT_DOCUMENTS
    .filter(doc => doc.acknowledgmentRequired)
    .reduce((total, doc) => {
      const missingCount = doc.acknowledgmentSummary?.match(/(\d+) of (\d+) drivers acknowledged; (\d+) missing/)?.[2] || 0;
      return total + (missingCount as number);
    }, 0);

  const reviewsDueSoon = COMPANY_OPERATIONS_VAULT_DOCUMENTS.filter(doc => doc.status === 'Review Due Soon').length;
  
  const businessFunctionsCovered = Array.from(new Set(
    COMPANY_OPERATIONS_VAULT_DOCUMENTS.map(doc => doc.businessFunction)
  ));

  return {
    totalDocuments,
    activePolicies,
    acknowledgmentsRequired,
    acknowledgmentsMissing,
    reviewsDueSoon,
    businessFunctionsCovered
  };
}
