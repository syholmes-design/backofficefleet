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
    description: 'Centralized standards for Company Operations Vault document naming, version control, access protocols, and retention schedules. Defines document categories, numbering conventions, approval workflows, and integration with BOF business systems.',
    tags: ['standards', 'governance', 'documentation'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '01-employee-handbook-template',
    title: 'Employee Handbook Template',
    category: 'HR & Employment Operations',
    businessFunction: 'HR Management & Employee Relations',
    ownerTeam: 'HR / Admin',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Drivers', 'Employees', 'Admin', 'HR'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: '9 of 12 drivers acknowledged; 3 missing',
    filePath: '01-employee-handbook-template.html',
    description: 'Comprehensive employee handbook template covering company policies, workplace conduct, benefits information, and acknowledgment requirements. Includes sections on employment policies, code of conduct, benefits eligibility, and employee rights.',
    tags: ['hr', 'handbook', 'policies', 'employment'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '02-code-of-conduct-and-workplace-policies',
    title: 'Code of Conduct and Workplace Policies',
    category: 'HR & Employment Operations',
    businessFunction: 'HR Management & Compliance',
    ownerTeam: 'HR / Admin',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Drivers', 'Employees', 'Admin', 'HR'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: '10 of 12 drivers acknowledged; 2 missing',
    filePath: '02-code-of-conduct-and-workplace-policies.html',
    description: 'Company code of conduct, workplace policies, and behavioral standards. Covers professional conduct, anti-harassment policies, workplace safety, disciplinary procedures, and employee rights.',
    tags: ['hr', 'conduct', 'workplace', 'compliance'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '03-hr-onboarding-and-offboarding-checklist',
    title: 'HR Onboarding and Offboarding Checklist',
    category: 'HR & Employment Operations',
    businessFunction: 'HR Management & Operations',
    ownerTeam: 'HR / Admin',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Drivers', 'Employees', 'Admin', 'HR'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: '11 of 12 drivers acknowledged; 1 missing',
    filePath: '03-hr-onboarding-and-offboarding-checklist.html',
    description: 'Comprehensive checklist for new driver onboarding and employee offboarding processes. Includes document requirements, training completion, equipment issuance, system access, and compliance verification steps.',
    tags: ['hr', 'onboarding', 'offboarding', 'checklist'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '04-payroll-compensation-and-deductions-policy',
    title: 'Payroll, Compensation, and Deductions Policy',
    category: 'Payroll & Compensation',
    businessFunction: 'Payroll Management & Finance',
    ownerTeam: 'Payroll / Finance',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Drivers', 'Employees', 'Payroll', 'Finance', 'Dispatch'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: '12 of 12 drivers acknowledged; 0 missing',
    filePath: '04-payroll-compensation-and-deductions-policy.html',
    description: 'Comprehensive payroll policy covering compensation structures, pay schedules, deduction types, tax withholding, benefits administration, and payroll processing procedures. Includes Phase 5 family support withholding summaries.',
    tags: ['payroll', 'compensation', 'deductions', 'hr'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '05-accounting-finance-close-ap-ar-sop',
    title: 'Accounting, Finance Close, AP, and AR SOP',
    category: 'Accounting & Finance',
    businessFunction: 'Finance & Accounting',
    ownerTeam: 'Finance / AR',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Finance', 'Dispatch', 'Billing', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '05-accounting-finance-close-ap-ar-sop.html',
    description: 'Standard operating procedures for accounting close, accounts payable/receivable management, financial reporting, and billing operations. Includes month-end closing procedures, reconciliation processes, and audit requirements.',
    tags: ['accounting', 'finance', 'sop', 'procedures'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '06-factoring-and-receivables-policy',
    title: 'Factoring and Receivables Policy',
    category: 'Factoring & Receivables',
    businessFunction: 'Finance & Credit',
    ownerTeam: 'Finance / AR',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Finance', 'Dispatch', 'Billing'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '06-factoring-and-receivables-policy.html',
    description: 'Policy governing factoring arrangements, receivables management, credit limits, and collection procedures. Includes factoring company selection, advance rates, and recourse options.',
    tags: ['factoring', 'receivables', 'finance', 'credit'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '07-insurance-risk-and-claims-sop',
    title: 'Insurance, Risk, and Claims SOP',
    category: 'Insurance, Claims & Risk',
    businessFunction: 'Risk Management & Insurance',
    ownerTeam: 'Risk / Safety',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Dispatch', 'Safety', 'Claims', 'Finance'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '07-insurance-risk-and-claims-sop.html',
    description: 'Standard operating procedures for insurance claims processing, risk assessment, damage documentation, and claim resolution. Includes claim intake forms, evidence requirements, and settlement procedures.',
    tags: ['insurance', 'claims', 'risk', 'sop'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '08-vendor-maintenance-and-purchasing-policy',
    title: 'Vendor, Maintenance, and Purchasing Policy',
    category: 'Vendor, Maintenance & Purchasing',
    businessFunction: 'Procurement & Maintenance',
    ownerTeam: 'Maintenance / Procurement',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Maintenance', 'Procurement', 'Dispatch'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '08-vendor-maintenance-and-purchasing-policy.html',
    description: 'Policy governing vendor relationships, maintenance procedures, purchasing workflows, and equipment standards. Includes vendor qualification, purchase order processing, and maintenance scheduling.',
    tags: ['vendor', 'maintenance', 'purchasing', 'procurement'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '09-mission-vision-and-operating-principles',
    title: 'Mission, Vision, and Operating Principles',
    category: 'Mission, Vision & Operating Principles',
    businessFunction: 'Executive Management',
    ownerTeam: 'Executive',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['All Staff', 'Drivers', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '09-mission-vision-and-operating-principles.html',
    description: 'Company mission statement, vision for the future, and core operating principles that guide business decisions and driver relationships. Includes values, safety commitments, and service standards.',
    tags: ['mission', 'vision', 'principles', 'values'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
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
    status: 'Active',
    lastReviewed: '2025-11-01',
    nextReviewDue: '2026-05-01',
    appliesTo: ['All Staff', 'IT', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '11-information-security-governance-policy.html',
    description: 'Enterprise-grade information security governance policy establishing comprehensive security management framework, risk assessment procedures, incident response protocols, and regulatory compliance requirements. Includes detailed security controls, BOF system integration, and continuous monitoring.',
    tags: ['security', 'governance', 'it', 'policy', 'risk-management'],
    effectiveDate: '2025-11-01',
    reviewDate: '2025-11-01',
    version: '2.0'
  },
  {
    id: '12-acceptable-use-of-company-systems-policy',
    title: 'Acceptable Use of Company Systems Policy',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Information Security & IT Operations',
    status: 'Active',
    lastReviewed: '2025-11-01',
    nextReviewDue: '2026-05-01',
    appliesTo: ['All Staff', 'Drivers', 'Contractors'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: '8 of 12 drivers acknowledged; 4 missing',
    filePath: '12-acceptable-use-of-company-systems-policy.html',
    description: 'Enterprise-grade acceptable use policy establishing comprehensive guidelines for appropriate use of BOF information technology resources, including acceptable and prohibited use, security requirements, monitoring and enforcement, and policy compliance procedures.',
    tags: ['security', 'acceptable-use', 'systems', 'policy', 'compliance'],
    effectiveDate: '2025-11-01',
    reviewDate: '2025-11-01',
    version: '2.0'
  },
  {
    id: '13-information-classification-policy',
    title: 'Information Classification Policy',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Information Security & Data Protection',
    status: 'Active',
    lastReviewed: '2025-11-01',
    nextReviewDue: '2026-05-01',
    appliesTo: ['All Staff', 'IT', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '13-information-classification-policy.html',
    description: 'Enterprise-grade information classification policy establishing comprehensive framework for classifying BOF information assets, including detailed classification levels, criteria, labeling requirements, access controls, data handling procedures, and BOF-specific examples.',
    tags: ['classification', 'security', 'data-protection', 'policy', 'governance'],
    effectiveDate: '2025-11-01',
    reviewDate: '2025-11-01',
    version: '2.0'
  },
  {
    id: '14-data-protection-and-secure-handling-standard',
    title: 'Data Protection and Secure Handling Standard',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Information Security & Data Protection',
    status: 'Active',
    lastReviewed: '2025-11-01',
    nextReviewDue: '2026-05-01',
    appliesTo: ['All Staff', 'IT', 'Admin'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '14-data-protection-and-secure-handling-standard.html',
    description: 'Enterprise-grade data protection standard establishing comprehensive requirements for protecting BOF data assets throughout their lifecycle, including data classification, technical protection requirements, lifecycle management, incident response, compliance requirements, and BOF system integration.',
    tags: ['data-protection', 'security', 'privacy', 'handling', 'compliance'],
    effectiveDate: '2025-11-01',
    reviewDate: '2025-11-01',
    version: '2.0'
  },
  {
    id: '15-privacy-and-employee-data-handling-policy',
    title: 'Privacy and Employee Data Handling Policy',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Human Resources & Data Protection',
    status: 'Active',
    lastReviewed: '2025-11-01',
    nextReviewDue: '2026-11-01',
    appliesTo: ['All Staff', 'Drivers', 'HR'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '15-privacy-and-employee-data-handling-policy.html',
    description: 'Enterprise-grade privacy and employee data handling policy establishing comprehensive framework for protecting employee and customer personal information, including privacy principles, data categories, employee rights, security controls, privacy by design, and regulatory compliance.',
    tags: ['privacy', 'data-handling', 'employee-data', 'policy', 'gdpr', 'compliance'],
    effectiveDate: '2025-11-01',
    reviewDate: '2025-11-01',
    version: '2.0'
  },
  {
    id: '16-vendor-security-assessment-policy',
    title: 'Vendor Security Assessment Policy',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Procurement & Information Security',
    status: 'Active',
    lastReviewed: '2025-11-01',
    nextReviewDue: '2026-11-01',
    appliesTo: ['Procurement', 'IT', 'Admin', 'Vendors'],
    acknowledgmentRequired: false,
    acknowledgmentSummary: undefined,
    filePath: '16-vendor-security-assessment-policy.html',
    description: 'Enterprise-grade vendor security assessment policy establishing comprehensive framework for evaluating and managing third-party vendor security risks, including assessment methodology, security requirements, risk management, contractual requirements, ongoing monitoring, and BOF system integration.',
    tags: ['vendor', 'security', 'assessment', 'policy', 'risk-management', 'compliance'],
    effectiveDate: '2025-11-01',
    reviewDate: '2025-11-01',
    version: '2.0'
  },
  {
    id: '17-ai-use-and-automation-governance-policy',
    title: 'AI Use and Automation Governance Policy',
    category: 'IT, Security, Privacy & AI Governance',
    businessFunction: 'IT & Security Management',
    ownerTeam: 'Information Security & Innovation',
    status: 'Active',
    lastReviewed: '2025-11-01',
    nextReviewDue: '2026-02-01',
    appliesTo: ['All Staff', 'IT', 'Admin', 'Drivers'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: '6 of 12 drivers acknowledged; 6 missing',
    filePath: '17-ai-use-and-automation-governance-policy.html',
    description: 'Enterprise-grade AI use and automation governance policy establishing comprehensive framework for responsible AI deployment and automation management, including AI governance principles, approved applications, prohibited uses, human oversight, security controls, and BOF system integration.',
    tags: ['ai', 'automation', 'governance', 'policy', 'ethics', 'compliance'],
    effectiveDate: '2025-11-01',
    reviewDate: '2025-11-01',
    version: '2.0'
  },
  {
    id: '18-driver-worker-classification-and-owner-operator-engagement-policy',
    title: 'Driver Worker Classification and Owner-Operator Engagement Policy',
    category: 'HR & Employment Operations',
    businessFunction: 'HR, Payroll, Compliance, Dispatch',
    ownerTeam: 'HR / Payroll / Compliance',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Drivers', 'Owner-Operators', 'Dispatch', 'HR', 'Payroll', 'Compliance'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: '12 of 12 drivers acknowledged; 0 missing',
    filePath: '18-driver-worker-classification-and-owner-operator-engagement-policy.html',
    description: 'Driver Worker Classification and Owner-Operator Engagement Policy establishes standardized procedures for properly classifying drivers as employees, independent contractors, owner-operators, or third-party/leased drivers. This policy ensures compliance with labor regulations, proper tax treatment, and appropriate operational controls while maintaining flexibility for different driver engagement models.',
    tags: ['worker classification', 'owner-operator', 'independent contractor', 'employee driver', 'payroll', 'compliance', 'onboarding', 'FMCSA'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '19-tax-and-regulatory-audit-readiness-policy',
    title: 'Tax and Regulatory Audit Readiness Policy',
    category: 'Accounting & Finance',
    businessFunction: 'Finance, Compliance, Operations',
    ownerTeam: 'Finance / Compliance / Admin',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Finance', 'Dispatch', 'Safety', 'Payroll', 'Admin'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: '8 of 12 drivers acknowledged; 4 missing',
    filePath: '19-tax-and-regulatory-audit-readiness-policy.html',
    description: 'Tax and Regulatory Audit Readiness Policy establishes procedures for maintaining audit-ready records, organizing operational documentation, and ensuring compliance with tax and regulatory requirements. This policy covers load records, trip miles, fuel costs, tolls, receipts, asset schedules, invoices, settlements, proof bundles, and document retention controls.',
    tags: ['audit readiness', 'tax compliance', 'regulatory compliance', 'documentation', 'retention', 'finance', 'operations'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '20-fuel-mileage-and-excise-tax-support-checklist',
    title: 'Fuel, Mileage, and Excise Tax Support Checklist',
    category: 'Accounting & Finance',
    businessFunction: 'Finance, Compliance, Dispatch',
    ownerTeam: 'Finance / Compliance',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Finance', 'Dispatch', 'Safety', 'Admin'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: '10 of 12 drivers acknowledged; 2 missing',
    filePath: '20-fuel-mileage-and-excise-tax-support-checklist.html',
    description: 'Fuel, Mileage, and Excise Tax Support Checklist provides standardized procedures for documenting fuel purchases, mileage tracking, and excise tax compliance requirements. This checklist ensures proper record-keeping for IFTA reporting, fuel tax calculations, and audit support while maintaining compliance with federal and state regulations.',
    tags: ['fuel documentation', 'mileage tracking', 'excise tax', 'IFTA', 'compliance', 'audit support'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
    version: '1.0'
  },
  {
    id: '21-cash-flow-management-and-receivables-acceleration-policy',
    title: 'Cash Flow Management and Receivables Acceleration Policy',
    category: 'Factoring & Receivables',
    businessFunction: 'Finance, AR, Dispatch',
    ownerTeam: 'Finance / AR',
    status: 'Active',
    lastReviewed: '2025-10-15',
    nextReviewDue: '2026-01-15',
    appliesTo: ['Finance', 'Dispatch', 'Billing', 'Admin'],
    acknowledgmentRequired: true,
    acknowledgmentSummary: '9 of 12 drivers acknowledged; 3 missing',
    filePath: '21-cash-flow-management-and-receivables-acceleration-policy.html',
    description: 'Cash Flow Management and Receivables Acceleration Policy establishes procedures for optimizing cash flow timing, managing receivables, and accelerating invoice processing. This policy covers factoring utilization, billing workflows, proof completion requirements, and cash flow forecasting while maintaining compliance with accounting standards.',
    tags: ['cash flow', 'receivables', 'factoring', 'billing', 'invoice processing', 'financial management'],
    effectiveDate: '2025-10-15',
    reviewDate: '2025-10-15',
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
