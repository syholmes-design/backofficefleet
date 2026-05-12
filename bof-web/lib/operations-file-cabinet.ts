export type OperationsFileCabinetItem = {
  id: string;
  title: string;
  category:
    | "Driver Qualification Files"
    | "Secondary Driver Documents"
    | "Dispatch & Load Operations"
    | "Safety / Claims / Insurance"
    | "HR / Talent / Performance"
    | "Policies & SOPs"
    | "Finance / Settlements / Back Office"
    | "Training & Knowledge Base"
    | "Contracts / Customer / Legal";
  type:
    | "driver-file"
    | "template"
    | "policy"
    | "checklist"
    | "form"
    | "video"
    | "article"
    | "sop"
    | "contract";
  audience: Array<
    | "driver"
    | "manager"
    | "dispatcher"
    | "hr"
    | "finance"
    | "safety"
    | "customer"
    | "legal"
    | "owner"
    | "vendor"
    | "dispatch"
    | "maintenance"
    | "procurement"
    | "it"
    | "admin"
    | "compliance"
    | "billing"
  >;
  status: "available" | "available_route" | "template" | "needs_review" | "external_resource" | "coming_soon";
  description: string;
  href?: string;
  source?: "generated" | "template" | "external" | "demo";
};

export const OPERATIONS_FILE_CABINET_REGISTRY: OperationsFileCabinetItem[] = [
  // Driver Qualification Files
  {
    id: "driver-cdl",
    title: "Commercial Driver License (CDL)",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "available",
    description: "Driver CDL verification and compliance tracking",
    href: "/drivers",
    source: "generated"
  },
  {
    id: "driver-medical",
    title: "Medical Card",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "available",
    description: "DOT medical certificate and physical examination records",
    href: "/drivers",
    source: "generated"
  },
  {
    id: "driver-mvr",
    title: "Motor Vehicle Record (MVR)",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "available",
    description: "Annual driving record review and monitoring",
    href: "/drivers",
    source: "generated"
  },
  {
    id: "driver-clearinghouse",
    title: "FMCSA Clearinghouse",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "available",
    description: "Drug and alcohol clearinghouse compliance tracking",
    href: "/drivers",
    source: "generated"
  },
  {
    id: "driver-i9",
    title: "I-9 Employment Eligibility",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr"],
    status: "available",
    description: "Employment eligibility verification documentation",
    href: "/drivers",
    source: "generated"
  },
  {
    id: "driver-w9",
    title: "W-9 for Owner-Operators",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "finance"],
    status: "available",
    description: "Taxpayer identification for contractor payments",
    href: "/drivers",
    source: "generated"
  },
  {
    id: "driver-application",
    title: "Driver Application",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "coming_soon",
    description: "Standard driver employment application form",
    source: "demo"
  },
  {
    id: "driver-road-test",
    title: "Road Test Certificate",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr", "safety"],
    status: "template",
    description: "Comprehensive road test scoring and evaluation",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "driver-employment-verification",
    title: "Employment Verification",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "template",
    description: "Employment verification and prior work history documentation",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "driver-annual-review",
    title: "Annual Review",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "coming_soon",
    description: "Annual driver performance and compliance review",
    source: "demo"
  },
  {
    id: "driver-emergency-contacts",
    title: "Emergency Contacts",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "dispatcher"],
    status: "available",
    description: "Emergency contact information and notification procedures",
    href: "/emergency-contacts",
    source: "generated"
  },
  {
    id: "driver-profile",
    title: "Driver Profile",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr"],
    status: "available",
    description: "Complete driver profile and documentation access",
    href: "/drivers",
    source: "generated"
  },
  {
    id: "driver-bank-info",
    title: "Bank / Direct Deposit",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "finance"],
    status: "available",
    description: "Bank account information for direct deposit payments",
    href: "/drivers",
    source: "generated"
  },
  {
    id: "driver-benefits",
    title: "Benefits Enrollment",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "coming_soon",
    description: "Employee benefits enrollment and management",
    source: "demo"
  },
  {
    id: "driver-withholding",
    title: "Family Support Withholding Summary",
    category: "Driver Qualification Files",
    type: "policy",
    audience: ["driver", "manager", "hr", "finance"],
    status: "available",
    description: "Family support withholding and deduction documentation",
    href: "/generated/company-operations-vault/04-payroll-compensation-and-deductions-policy.html",
    source: "generated"
  },
  {
    id: "driver-policy-acknowledgment",
    title: "Safety Policy Acknowledgment",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr", "safety"],
    status: "template",
    description: "Safety policy acknowledgment and compliance documentation",
    href: "/documents/template-packs",
    source: "template"
  },

  // Secondary Driver Documents
  {
    id: "driver-coaching-notes",
    title: "Coaching Notes",
    category: "Secondary Driver Documents",
    type: "driver-file",
    audience: ["driver", "manager", "safety"],
    status: "available",
    description: "Driver coaching documentation and follow-up records",
    href: "/safety",
    source: "generated"
  },
  {
    id: "driver-safety-scorecards",
    title: "Safety Scorecards",
    category: "Secondary Driver Documents",
    type: "driver-file",
    audience: ["driver", "manager", "safety"],
    status: "available",
    description: "Monthly safety performance metrics and trends",
    href: "/safety",
    source: "generated"
  },
  {
    id: "driver-incident-history",
    title: "Incident History",
    category: "Secondary Driver Documents",
    type: "driver-file",
    audience: ["driver", "manager", "safety"],
    status: "available",
    description: "Complete incident and violation history tracking",
    href: "/safety",
    source: "generated"
  },
  {
    id: "driver-training-completions",
    title: "Training Completion Records",
    category: "Secondary Driver Documents",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "coming_soon",
    description: "Training course completion certificates and records",
    source: "demo"
  },
  {
    id: "driver-performance-reviews",
    title: "Performance Reviews",
    category: "Secondary Driver Documents",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "coming_soon",
    description: "Annual performance evaluation forms and documentation",
    source: "demo"
  },
  {
    id: "driver-disciplinary-notices",
    title: "Disciplinary Notices",
    category: "Secondary Driver Documents",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "coming_soon",
    description: "Disciplinary action notices and documentation",
    source: "demo"
  },
  {
    id: "driver-corrective-action",
    title: "Corrective Action Plans",
    category: "Secondary Driver Documents",
    type: "form",
    audience: ["driver", "manager", "hr", "safety"],
    status: "coming_soon",
    description: "Performance improvement and corrective action plans",
    source: "demo"
  },
  {
    id: "driver-communication-logs",
    title: "Driver Communication Logs",
    category: "Secondary Driver Documents",
    type: "form",
    audience: ["driver", "manager", "dispatcher"],
    status: "coming_soon",
    description: "Driver communication and interaction documentation logs",
    source: "demo"
  },

  // Dispatch & Load Operations
  {
    id: "dispatch-load-intake",
    title: "Load Intake Form",
    category: "Dispatch & Load Operations",
    type: "form",
    audience: ["dispatcher", "manager"],
    status: "template",
    description: "Standard load booking and information collection form",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "dispatch-pretrip-planning",
    title: "Pre-Trip Planning Checklist",
    category: "Dispatch & Load Operations",
    type: "checklist",
    audience: ["dispatcher", "driver", "safety"],
    status: "template",
    description: "Comprehensive pre-trip planning and route preparation checklist",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "dispatch-pretrip-inspection",
    title: "Pre-Trip Inspection Checklist",
    category: "Dispatch & Load Operations",
    type: "checklist",
    audience: ["dispatcher", "driver", "safety"],
    status: "available",
    description: "Vehicle inspection and safety check before departure",
    href: "/evidence",
    source: "generated"
  },
  {
    id: "dispatch-route-readiness",
    title: "Route / Dispatch Readiness Checklist",
    category: "Dispatch & Load Operations",
    type: "checklist",
    audience: ["dispatcher", "driver", "manager"],
    status: "template",
    description: "Route planning and dispatch readiness verification checklist",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "dispatch-cargo-photo",
    title: "Cargo Photo Checklist",
    category: "Dispatch & Load Operations",
    type: "checklist",
    audience: ["dispatcher", "driver", "safety"],
    status: "template",
    description: "Required cargo photography documentation and damage prevention",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-seal-verification",
    title: "Seal Verification Checklist",
    category: "Dispatch & Load Operations",
    type: "checklist",
    audience: ["dispatcher", "driver", "safety"],
    status: "template",
    description: "Trailer seal verification and security procedures",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-rate-confirmation",
    title: "Rate Confirmation Template",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "manager", "customer", "finance"],
    status: "template",
    description: "Standard rate confirmation and pricing agreement template",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-bol",
    title: "BOL Template",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "driver", "customer", "finance"],
    status: "template",
    description: "Standard bill of lading document template",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-pod",
    title: "POD Template",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "driver", "customer", "finance"],
    status: "template",
    description: "Proof of delivery form with signature capture",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-posttrip-protocol",
    title: "Post-Trip Closeout Protocol",
    category: "Dispatch & Load Operations",
    type: "sop",
    audience: ["dispatcher", "driver", "manager"],
    status: "available",
    description: "Standard post-trip documentation and closeout procedures",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-lumper-receipt",
    title: "Lumper Receipt Form",
    category: "Dispatch & Load Operations",
    type: "form",
    audience: ["dispatcher", "driver", "manager", "finance"],
    status: "template",
    description: "Lumper service receipt and reimbursement documentation",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-detention",
    title: "Detention Form",
    category: "Dispatch & Load Operations",
    type: "form",
    audience: ["dispatcher", "driver", "manager", "finance"],
    status: "available",
    description: "Detention time tracking and charge documentation",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-accessorial",
    title: "Accessorial Approval Form",
    category: "Dispatch & Load Operations",
    type: "form",
    audience: ["dispatcher", "manager", "finance"],
    status: "available",
    description: "Accessorial charges approval and documentation form",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-work-order",
    title: "Work Order Template",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "manager", "customer"],
    status: "template",
    description: "Service work order and operational scope template",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-schedule",
    title: "Schedule Template",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "manager", "customer"],
    status: "template",
    description: "Service schedule and delivery timeline template",
    href: "/loads",
    source: "generated"
  },

  // Safety / Claims / Insurance
  {
    id: "safety-accident-report",
    title: "Accident Report Form",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety", "legal"],
    status: "template",
    description: "Comprehensive accident reporting and documentation form",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "safety-incident-response",
    title: "Incident Response Checklist",
    category: "Safety / Claims / Insurance",
    type: "checklist",
    audience: ["driver", "manager", "safety", "legal"],
    status: "available",
    description: "Step-by-step incident response and documentation checklist",
    href: "/safety",
    source: "generated"
  },
  {
    id: "claims-cargo-intake",
    title: "Cargo Claim Intake Form",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["manager", "safety", "customer", "legal"],
    status: "template",
    description: "Standard cargo damage claim intake and documentation",
    href: "/loads",
    source: "generated"
  },
  {
    id: "claims-insurance-claim",
    title: "Insurance Claim Form",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["manager", "safety", "legal"],
    status: "template",
    description: "Insurance claim submission and documentation form",
    href: "/loads",
    source: "generated"
  },
  {
    id: "claims-police-report",
    title: "Police Report Request Form",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety", "legal"],
    status: "coming_soon",
    description: "Police incident report request and documentation template",
    source: "demo"
  },
  {
    id: "claims-driver-statement",
    title: "Driver Accident Statement",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety", "legal"],
    status: "template",
    description: "Driver statement form for accident and incident reporting",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "claims-witness-statement",
    title: "Witness Statement Form",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety", "legal"],
    status: "coming_soon",
    description: "Witness statement collection and documentation form",
    source: "demo"
  },
  {
    id: "claims-photo-evidence",
    title: "Photo Evidence Checklist",
    category: "Safety / Claims / Insurance",
    type: "checklist",
    audience: ["driver", "manager", "safety", "legal"],
    status: "available",
    description: "Required photo documentation for claims and incidents",
    href: "/safety",
    source: "generated"
  },
  {
    id: "claims-preservation-letter",
    title: "Preservation of Evidence Letter",
    category: "Safety / Claims / Insurance",
    type: "template",
    audience: ["manager", "safety", "legal"],
    status: "coming_soon",
    description: "Evidence preservation and legal hold documentation",
    source: "demo"
  },
  {
    id: "claims-demand-letter",
    title: "Demand Letter to Potential Defendant",
    category: "Safety / Claims / Insurance",
    type: "template",
    audience: ["manager", "legal", "customer"],
    status: "template",
    description: "Collection and demand letter templates for claims",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "claims-insurance-notice",
    title: "Insurance Notice Letter",
    category: "Safety / Claims / Insurance",
    type: "template",
    audience: ["manager", "safety", "legal"],
    status: "template",
    description: "Insurance notification and claim reporting documentation",
    href: "/loads",
    source: "generated"
  },
  {
    id: "claims-escalation-sop",
    title: "Claims Escalation SOP",
    category: "Safety / Claims / Insurance",
    type: "sop",
    audience: ["manager", "safety", "legal", "finance"],
    status: "available",
    description: "Standard operating procedures for claims escalation and resolution",
    href: "/generated/company-operations-vault/07-insurance-risk-and-claims-sop.html",
    source: "generated"
  },
  {
    id: "safety-evidence-photos",
    title: "Safety Evidence Photos",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety"],
    status: "available",
    description: "Individual safety evidence photos and documentation",
    href: "/evidence",
    source: "generated"
  },

  // HR / Talent / Performance
  {
    id: "hr-recruiting-protocol",
    title: "Recruiting Protocol",
    category: "HR / Talent / Performance",
    type: "sop",
    audience: ["manager", "hr"],
    status: "coming_soon",
    description: "Standard driver recruiting and hiring procedures",
    source: "demo"
  },
  {
    id: "hr-interview-scorecard",
    title: "Interview Scorecard",
    category: "HR / Talent / Performance",
    type: "form",
    audience: ["manager", "hr"],
    status: "coming_soon",
    description: "Structured interview evaluation and scoring form",
    source: "demo"
  },
  {
    id: "hr-onboarding-checklist",
    title: "HR Onboarding and Offboarding Checklist",
    category: "HR / Talent / Performance",
    type: "checklist",
    audience: ["driver", "manager", "hr"],
    status: "available",
    description: "Comprehensive new driver onboarding and employee offboarding procedures",
    href: "/generated/company-operations-vault/03-hr-onboarding-and-offboarding-checklist.html",
    source: "generated"
  },
  {
    id: "hr-onboarding-videos",
    title: "Onboarding Video Links",
    category: "HR / Talent / Performance",
    type: "video",
    audience: ["driver", "manager", "hr"],
    status: "external_resource",
    description: "External onboarding video training resources and links",
    source: "external"
  },
  {
    id: "hr-training-completion",
    title: "Training Completion Logs",
    category: "HR / Talent / Performance",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "coming_soon",
    description: "Training course completion tracking and certification logs",
    source: "demo"
  },
  {
    id: "hr-employee-handbook",
    title: "Employee Handbook",
    category: "HR / Talent / Performance",
    type: "policy",
    audience: ["driver", "manager", "hr", "owner"],
    status: "available",
    description: "Complete employee policies and procedures handbook",
    href: "/generated/company-operations-vault/01-employee-handbook-template.html",
    source: "generated"
  },
  {
    id: "hr-performance-review",
    title: "Performance Review Form",
    category: "HR / Talent / Performance",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "coming_soon",
    description: "Annual performance evaluation forms and documentation",
    source: "demo"
  },
  {
    id: "hr-performance-improvement",
    title: "Performance Improvement Plan",
    category: "HR / Talent / Performance",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "coming_soon",
    description: "Structured performance improvement plan template",
    source: "demo"
  },
  {
    id: "hr-coaching-template",
    title: "Coaching Template",
    category: "HR / Talent / Performance",
    type: "form",
    audience: ["manager", "hr", "safety"],
    status: "available",
    description: "Driver coaching documentation and action plan template",
    href: "/safety",
    source: "generated"
  },
  {
    id: "hr-termination-checklist",
    title: "Termination/Offboarding Checklist",
    category: "HR / Talent / Performance",
    type: "checklist",
    audience: ["manager", "hr"],
    status: "available",
    description: "Driver termination and offboarding procedures",
    href: "/generated/company-operations-vault/03-hr-onboarding-and-offboarding-checklist.html",
    source: "generated"
  },

  // Policies & SOPs
  {
    id: "policy-operations-sop",
    title: "Operations SOP",
    category: "Policies & SOPs",
    type: "sop",
    audience: ["manager", "dispatcher", "driver", "owner"],
    status: "coming_soon",
    description: "Core fleet operations standard operating procedures",
    source: "demo"
  },
  {
    id: "policy-dispatch-sop",
    title: "Dispatch SOP",
    category: "Policies & SOPs",
    type: "sop",
    audience: ["dispatcher", "manager", "owner"],
    status: "coming_soon",
    description: "Dispatch department standard operating procedures",
    source: "demo"
  },
  {
    id: "policy-safety-sop",
    title: "Safety Compliance Governance Policy",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["driver", "manager", "safety", "owner"],
    status: "available",
    description: "Comprehensive safety policies, compliance procedures, and governance framework",
    href: "/generated/company-operations-vault/10-safety-compliance-governance-policy.html",
    source: "generated"
  },
  {
    id: "policy-claims-sop",
    title: "Insurance, Risk and Claims SOP",
    category: "Policies & SOPs",
    type: "sop",
    audience: ["manager", "safety", "legal", "finance"],
    status: "available",
    description: "Standard operating procedures for insurance claims processing, risk assessment, and claim resolution",
    href: "/generated/company-operations-vault/07-insurance-risk-and-claims-sop.html",
    source: "generated"
  },
  {
    id: "policy-payroll-sop",
    title: "Payroll, Compensation and Deductions Policy",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["driver", "manager", "hr", "finance"],
    status: "available",
    description: "Comprehensive payroll policy covering compensation structures, pay schedules, and deduction types",
    href: "/generated/company-operations-vault/04-payroll-compensation-and-deductions-policy.html",
    source: "generated"
  },
  {
    id: "policy-accounting-sop",
    title: "Accounting, Finance Close, AP, and AR SOP",
    category: "Policies & SOPs",
    type: "sop",
    audience: ["manager", "finance", "dispatch"],
    status: "available",
    description: "Standard operating procedures for accounting close, accounts payable/receivable management, and financial reporting",
    href: "/generated/company-operations-vault/05-accounting-finance-close-ap-ar-sop.html",
    source: "generated"
  },
  {
    id: "policy-factoring-receivables",
    title: "Factoring and Receivables Policy",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["manager", "finance", "dispatch"],
    status: "available",
    description: "Policy governing factoring arrangements, receivables management, and collection procedures",
    href: "/generated/company-operations-vault/06-factoring-and-receivables-policy.html",
    source: "generated"
  },
  {
    id: "policy-vendor-procurement",
    title: "Vendor, Maintenance and Purchasing Policy",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["manager", "maintenance", "procurement"],
    status: "available",
    description: "Policy governing vendor relationships, maintenance procedures, and purchasing workflows",
    href: "/generated/company-operations-vault/08-vendor-maintenance-and-purchasing-policy.html",
    source: "generated"
  },
  {
    id: "policy-code-of-conduct",
    title: "Code of Conduct and Workplace Policies",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["driver", "manager", "hr", "owner"],
    status: "available",
    description: "Company code of conduct, workplace policies, and behavioral standards",
    href: "/generated/company-operations-vault/02-code-of-conduct-and-workplace-policies.html",
    source: "generated"
  },
  {
    id: "policy-drug-alcohol",
    title: "Drug and Alcohol Testing Policy",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["driver", "manager", "hr", "safety"],
    status: "coming_soon",
    description: "Drug and alcohol testing and compliance policy",
    source: "demo"
  },
  {
    id: "policy-it-security",
    title: "Information Security Governance Policy",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["manager", "it", "admin"],
    status: "available",
    description: "Enterprise-grade information security governance policy establishing comprehensive security management framework",
    href: "/generated/company-operations-vault/11-information-security-governance-policy.html",
    source: "generated"
  },
  {
    id: "policy-ai-usage",
    title: "AI Use and Automation Governance Policy",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["driver", "manager", "it", "admin"],
    status: "available",
    description: "Enterprise-grade AI use and automation governance policy establishing framework for responsible AI deployment",
    href: "/generated/company-operations-vault/17-ai-use-and-automation-governance-policy.html",
    source: "generated"
  },
  {
    id: "policy-privacy-security",
    title: "Privacy and Employee Data Handling Policy",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["driver", "manager", "hr", "it"],
    status: "available",
    description: "Enterprise-grade privacy and employee data handling policy for protecting personal information",
    href: "/generated/company-operations-vault/15-privacy-and-employee-data-handling-policy.html",
    source: "generated"
  },
  {
    id: "policy-records-retention",
    title: "Tax and Regulatory Audit Readiness Policy",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["manager", "finance", "compliance"],
    status: "available",
    description: "Tax and regulatory audit readiness policy for maintaining audit-ready records and documentation",
    href: "/generated/company-operations-vault/19-tax-and-regulatory-audit-readiness-policy.html",
    source: "generated"
  },

  // Finance / Settlements / Back Office
  {
    id: "finance-settlement-review",
    title: "Settlement Review Form",
    category: "Finance / Settlements / Back Office",
    type: "form",
    audience: ["manager", "finance", "driver"],
    status: "available",
    description: "Settlement review and approval documentation",
    href: "/settlements",
    source: "generated"
  },
  {
    id: "finance-payroll-adjustment",
    title: "Payroll Adjustment Request",
    category: "Finance / Settlements / Back Office",
    type: "form",
    audience: ["manager", "finance", "driver"],
    status: "coming_soon",
    description: "Payroll correction and adjustment request form",
    source: "demo"
  },
  {
    id: "finance-reimbursement",
    title: "Reimbursement Request",
    category: "Finance / Settlements / Back Office",
    type: "form",
    audience: ["driver", "manager", "finance"],
    status: "coming_soon",
    description: "Expense reimbursement request and approval form",
    source: "demo"
  },
  {
    id: "finance-fuel-advance",
    title: "Fuel Advance Policy",
    category: "Finance / Settlements / Back Office",
    type: "policy",
    audience: ["driver", "manager", "finance", "dispatcher"],
    status: "coming_soon",
    description: "Fuel advance request and repayment policy",
    source: "demo"
  },
  {
    id: "finance-deduction-authorization",
    title: "Deduction Authorization",
    category: "Finance / Settlements / Back Office",
    type: "form",
    audience: ["driver", "manager", "finance"],
    status: "available",
    description: "Payroll deduction authorization and management documentation",
    href: "/generated/company-operations-vault/04-payroll-compensation-and-deductions-policy.html",
    source: "generated"
  },
  {
    id: "finance-factoring-packet",
    title: "Factoring Packet",
    category: "Finance / Settlements / Back Office",
    type: "template",
    audience: ["manager", "finance", "customer"],
    status: "available",
    description: "Complete factoring documentation packet",
    href: "/documents",
    source: "generated"
  },
  {
    id: "finance-invoice-template",
    title: "Invoice Template",
    category: "Finance / Settlements / Back Office",
    type: "template",
    audience: ["manager", "finance", "customer"],
    status: "template",
    description: "Standard customer invoice template",
    href: "/loads",
    source: "generated"
  },
  {
    id: "finance-receivables-sop",
    title: "Cash Flow Management and Receivables Acceleration Policy",
    category: "Finance / Settlements / Back Office",
    type: "policy",
    audience: ["manager", "finance", "dispatch"],
    status: "available",
    description: "Cash flow management and receivables acceleration policy for optimizing financial operations",
    href: "/generated/company-operations-vault/21-cash-flow-management-and-receivables-acceleration-policy.html",
    source: "generated"
  },
  {
    id: "finance-ap-ar-checklist",
    title: "AP/AR Checklist",
    category: "Finance / Settlements / Back Office",
    type: "checklist",
    audience: ["manager", "finance", "billing"],
    status: "available",
    description: "Accounts payable and receivable management procedures and checklist",
    href: "/generated/company-operations-vault/05-accounting-finance-close-ap-ar-sop.html",
    source: "generated"
  },

  // Training & Knowledge Base
  {
    id: "training-onboarding-videos",
    title: "Onboarding Videos",
    category: "Training & Knowledge Base",
    type: "video",
    audience: ["driver", "manager", "hr"],
    status: "external_resource",
    description: "New driver onboarding video training series",
    source: "external"
  },
  {
    id: "training-safety-videos",
    title: "Safety Training Videos",
    category: "Training & Knowledge Base",
    type: "video",
    audience: ["driver", "manager", "safety"],
    status: "external_resource",
    description: "Safety procedures and compliance video training",
    source: "external"
  },
  {
    id: "training-dispatch-videos",
    title: "Dispatch Training Videos",
    category: "Training & Knowledge Base",
    type: "video",
    audience: ["dispatcher", "manager"],
    status: "external_resource",
    description: "Dispatch operations and system training videos",
    source: "external"
  },
  {
    id: "training-blog-articles",
    title: "Blog Articles",
    category: "Training & Knowledge Base",
    type: "article",
    audience: ["driver", "manager", "hr"],
    status: "external_resource",
    description: "Industry blog articles and knowledge resources",
    source: "external"
  },
  {
    id: "training-sop-walkthroughs",
    title: "SOP Walkthroughs",
    category: "Training & Knowledge Base",
    type: "article",
    audience: ["manager", "driver", "hr"],
    status: "coming_soon",
    description: "Step-by-step SOP walkthroughs and implementation guides",
    source: "demo"
  },
  {
    id: "training-safety-links",
    title: "CVSA Vehicle Inspection Training Resources",
    category: "Training & Knowledge Base",
    type: "article",
    audience: ["driver", "manager", "safety"],
    status: "external_resource",
    description: "CVSA vehicle inspection training resources and reference materials",
    href: "/safety",
    source: "external"
  },
  {
    id: "training-dispatch-links",
    title: "Dispatch Training Links",
    category: "Training & Knowledge Base",
    type: "article",
    audience: ["dispatcher", "manager"],
    status: "external_resource",
    description: "External dispatch operations and system training resources",
    source: "external"
  },
  {
    id: "training-claims-handling",
    title: "Claims Handling Training",
    category: "Training & Knowledge Base",
    type: "article",
    audience: ["manager", "safety", "legal"],
    status: "external_resource",
    description: "External claims handling and processing training resources",
    source: "external"
  },
  {
    id: "training-ai-security",
    title: "AI/Data Security Training",
    category: "Training & Knowledge Base",
    type: "article",
    audience: ["manager", "it", "admin"],
    status: "available",
    description: "AI governance and data security training requirements and resources",
    href: "/generated/company-operations-vault/17-ai-use-and-automation-governance-policy.html",
    source: "generated"
  },
  {
    id: "training-manager-playbooks",
    title: "Manager Playbooks",
    category: "Training & Knowledge Base",
    type: "article",
    audience: ["manager", "owner"],
    status: "coming_soon",
    description: "Management decision-making and procedure playbooks",
    source: "demo"
  },

  // Contracts / Customer / Legal
  {
    id: "contract-master-agreement",
    title: "Master Agreement",
    category: "Contracts / Customer / Legal",
    type: "contract",
    audience: ["manager", "customer", "legal", "owner"],
    status: "template",
    description: "Master agreement reference template for customer relationships",
    href: "/loads",
    source: "generated"
  },
  {
    id: "contract-schedule",
    title: "Schedule Template",
    category: "Contracts / Customer / Legal",
    type: "template",
    audience: ["manager", "customer", "dispatcher"],
    status: "template",
    description: "Service schedule and delivery timeline template",
    href: "/loads",
    source: "generated"
  },
  {
    id: "contract-work-order",
    title: "Work Order Template",
    category: "Contracts / Customer / Legal",
    type: "template",
    audience: ["manager", "customer", "dispatcher"],
    status: "template",
    description: "Standard work order and service agreement template",
    href: "/loads",
    source: "generated"
  },
  {
    id: "contract-customer-onboarding",
    title: "Customer Onboarding Packet",
    category: "Contracts / Customer / Legal",
    type: "template",
    audience: ["manager", "customer", "legal"],
    status: "template",
    description: "Complete customer onboarding documentation packet",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "contract-carrier-packet",
    title: "Carrier Packet",
    category: "Contracts / Customer / Legal",
    type: "template",
    audience: ["manager", "customer", "legal"],
    status: "template",
    description: "Carrier qualification and agreement packet",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "contract-vendor-agreement",
    title: "Vendor Agreement",
    category: "Contracts / Customer / Legal",
    type: "contract",
    audience: ["manager", "vendor", "legal"],
    status: "template",
    description: "Standard vendor services agreement template",
    href: "/scripts/templates/owner-operator-lease-template.html",
    source: "template"
  },
  {
    id: "contract-demand-letter",
    title: "Demand Letter Templates",
    category: "Contracts / Customer / Legal",
    type: "template",
    audience: ["manager", "legal", "customer"],
    status: "template",
    description: "Collection and demand letter templates",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "contract-legal-hold",
    title: "Legal Hold Notice",
    category: "Contracts / Customer / Legal",
    type: "template",
    audience: ["manager", "legal", "customer"],
    status: "coming_soon",
    description: "Legal hold and document preservation notice template",
    source: "demo"
  },
  {
    id: "contract-document-preservation",
    title: "Document Preservation Notice",
    category: "Contracts / Customer / Legal",
    type: "template",
    audience: ["manager", "legal", "customer"],
    status: "coming_soon",
    description: "Document preservation and retention notice template",
    source: "demo"
  }
];

export type OperationsFileCabinetCategory = OperationsFileCabinetItem["category"];
export type OperationsFileCabinetType = OperationsFileCabinetItem["type"];
export type OperationsFileCabinetAudience = OperationsFileCabinetItem["audience"][number];
export type OperationsFileCabinetStatus = OperationsFileCabinetItem["status"];

export function getOperationsFileCabinetItems(): OperationsFileCabinetItem[] {
  return OPERATIONS_FILE_CABINET_REGISTRY;
}

export function getOperationsFileCabinetItemsByCategory(category: OperationsFileCabinetCategory): OperationsFileCabinetItem[] {
  return OPERATIONS_FILE_CABINET_REGISTRY.filter(item => item.category === category);
}

export function getOperationsFileCabinetItemsByType(type: OperationsFileCabinetType): OperationsFileCabinetItem[] {
  return OPERATIONS_FILE_CABINET_REGISTRY.filter(item => item.type === type);
}

export function getOperationsFileCabinetItemsByAudience(audience: OperationsFileCabinetAudience): OperationsFileCabinetItem[] {
  return OPERATIONS_FILE_CABINET_REGISTRY.filter(item => item.audience.includes(audience));
}

export function getOperationsFileCabinetItemsByStatus(status: OperationsFileCabinetStatus): OperationsFileCabinetItem[] {
  return OPERATIONS_FILE_CABINET_REGISTRY.filter(item => item.status === status);
}

export function getOperationsFileCabinetCategories(): OperationsFileCabinetCategory[] {
  const categories = new Set<OperationsFileCabinetCategory>();
  OPERATIONS_FILE_CABINET_REGISTRY.forEach(item => categories.add(item.category));
  return Array.from(categories);
}

export function getOperationsFileCabinetTypes(): OperationsFileCabinetType[] {
  const types = new Set<OperationsFileCabinetType>();
  OPERATIONS_FILE_CABINET_REGISTRY.forEach(item => types.add(item.type));
  return Array.from(types);
}

export function getOperationsFileCabinetAudiences(): OperationsFileCabinetAudience[] {
  const audiences = new Set<OperationsFileCabinetAudience>();
  OPERATIONS_FILE_CABINET_REGISTRY.forEach(item => item.audience.forEach(audience => audiences.add(audience)));
  return Array.from(audiences);
}

export function getOperationsFileCabinetStatuses(): OperationsFileCabinetStatus[] {
  const statuses = new Set<OperationsFileCabinetStatus>();
  OPERATIONS_FILE_CABINET_REGISTRY.forEach(item => statuses.add(item.status));
  return Array.from(statuses);
}
