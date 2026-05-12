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
  >;
  status: "available" | "template" | "needs_review" | "coming_soon";
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
    status: "template",
    description: "Standard driver employment application form",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "driver-road-test",
    title: "Road Test Evaluation",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr", "safety"],
    status: "template",
    description: "Comprehensive road test scoring and evaluation",
    href: "/documents/template-packs",
    source: "template"
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
    id: "driver-bank-info",
    title: "Direct Deposit Information",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "finance"],
    status: "available",
    description: "Bank account information for direct deposit payments",
    href: "/drivers",
    source: "generated"
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
    status: "template",
    description: "Annual performance evaluation forms and documentation",
    href: "/documents/template-packs",
    source: "template"
  },

  // Dispatch & Load Operations
  {
    id: "dispatch-load-intake",
    title: "Load Intake Form",
    category: "Dispatch & Load Operations",
    type: "form",
    audience: ["dispatcher", "manager"],
    status: "available",
    description: "Standard load booking and information collection form",
    href: "/dispatch/intake",
    source: "generated"
  },
  {
    id: "dispatch-rate-confirmation",
    title: "Rate Confirmation Template",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "manager", "customer", "finance"],
    status: "available",
    description: "Standard rate confirmation and pricing agreement template",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-bol-template",
    title: "Bill of Lading Template",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "driver", "customer", "finance"],
    status: "available",
    description: "Standard bill of lading document template",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-pod-template",
    title: "Proof of Delivery Template",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "driver", "customer", "finance"],
    status: "available",
    description: "Proof of delivery form with signature capture",
    href: "/loads",
    source: "generated"
  },
  {
    id: "dispatch-pretrip-checklist",
    title: "Pre-Trip Planning Checklist",
    category: "Dispatch & Load Operations",
    type: "checklist",
    audience: ["dispatcher", "driver", "safety"],
    status: "template",
    description: "Comprehensive pre-trip planning and safety checklist",
    href: "/pretrip",
    source: "template"
  },
  {
    id: "dispatch-posttrip-protocol",
    title: "Post-Trip Closeout Protocol",
    category: "Dispatch & Load Operations",
    type: "sop",
    audience: ["dispatcher", "driver", "manager"],
    status: "coming_soon",
    description: "Standard post-trip documentation and closeout procedures",
    source: "demo"
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
    id: "dispatch-cargo-photo-checklist",
    title: "Cargo Photo Checklist",
    category: "Dispatch & Load Operations",
    type: "checklist",
    audience: ["dispatcher", "driver", "safety"],
    status: "template",
    description: "Required cargo photography documentation checklist",
    href: "/safety",
    source: "generated"
  },
  {
    id: "dispatch-detention-form",
    title: "Detention Time Form",
    category: "Dispatch & Load Operations",
    type: "form",
    audience: ["dispatcher", "driver", "manager", "finance"],
    status: "template",
    description: "Detention time tracking and charge documentation",
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
    status: "template",
    description: "Step-by-step incident response and documentation checklist",
    href: "/safety",
    source: "template"
  },
  {
    id: "claims-cargo-intake",
    title: "Cargo Claim Intake Form",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["manager", "safety", "customer", "legal"],
    status: "template",
    description: "Standard cargo damage claim intake and documentation",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "claims-insurance-claim",
    title: "Insurance Claim Form",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["manager", "safety", "legal"],
    status: "template",
    description: "Insurance claim submission and documentation form",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "claims-police-report",
    title: "Police Report Form",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety", "legal"],
    status: "template",
    description: "Police incident report documentation template",
    href: "/documents/template-packs",
    source: "template"
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
    status: "template",
    description: "Structured interview evaluation and scoring form",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "hr-onboarding-checklist",
    title: "Onboarding Checklist",
    category: "HR / Talent / Performance",
    type: "checklist",
    audience: ["driver", "manager", "hr"],
    status: "template",
    description: "Comprehensive new driver onboarding procedures",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "hr-employee-handbook",
    title: "Employee Handbook",
    category: "HR / Talent / Performance",
    type: "policy",
    audience: ["driver", "manager", "hr", "owner"],
    status: "coming_soon",
    description: "Complete employee policies and procedures handbook",
    source: "demo"
  },
  {
    id: "hr-performance-improvement",
    title: "Performance Improvement Plan",
    category: "HR / Talent / Performance",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "template",
    description: "Structured performance improvement plan template",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "hr-coaching-template",
    title: "Coaching Template",
    category: "HR / Talent / Performance",
    type: "form",
    audience: ["manager", "hr", "safety"],
    status: "template",
    description: "Driver coaching documentation and action plan template",
    href: "/safety",
    source: "template"
  },
  {
    id: "hr-termination-checklist",
    title: "Termination/Offboarding Checklist",
    category: "HR / Talent / Performance",
    type: "checklist",
    audience: ["manager", "hr"],
    status: "coming_soon",
    description: "Driver termination and offboarding procedures",
    source: "demo"
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
    title: "Safety SOP",
    category: "Policies & SOPs",
    type: "sop",
    audience: ["driver", "manager", "safety", "owner"],
    status: "coming_soon",
    description: "Safety department standard operating procedures",
    source: "demo"
  },
  {
    id: "policy-claims-sop",
    title: "Claims SOP",
    category: "Policies & SOPs",
    type: "sop",
    audience: ["manager", "safety", "legal", "owner"],
    status: "coming_soon",
    description: "Claims handling standard operating procedures",
    source: "demo"
  },
  {
    id: "policy-payroll-sop",
    title: "Payroll/Settlement SOP",
    category: "Policies & SOPs",
    type: "sop",
    audience: ["manager", "finance", "owner"],
    status: "coming_soon",
    description: "Payroll and settlement processing procedures",
    source: "demo"
  },
  {
    id: "policy-code-of-conduct",
    title: "Code of Conduct",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["driver", "manager", "hr", "owner"],
    status: "coming_soon",
    description: "Company code of conduct and professional behavior standards",
    source: "demo"
  },
  {
    id: "policy-drug-alcohol",
    title: "Drug and Alcohol Policy",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["driver", "manager", "hr", "safety", "owner"],
    status: "coming_soon",
    description: "Drug and alcohol testing and compliance policy",
    source: "demo"
  },
  {
    id: "policy-records-retention",
    title: "Records Retention Policy",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["manager", "hr", "legal", "owner"],
    status: "coming_soon",
    description: "Document retention and destruction policy",
    source: "demo"
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
    status: "template",
    description: "Payroll correction and adjustment request form",
    href: "/documents/template-packs",
    source: "template"
  },
  {
    id: "finance-reimbursement",
    title: "Reimbursement Request",
    category: "Finance / Settlements / Back Office",
    type: "form",
    audience: ["driver", "manager", "finance"],
    status: "template",
    description: "Expense reimbursement request and approval form",
    href: "/documents/template-packs",
    source: "template"
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
    status: "available",
    description: "Standard customer invoice template",
    href: "/documents",
    source: "generated"
  },

  // Training & Knowledge Base
  {
    id: "training-onboarding-videos",
    title: "Onboarding Video Library",
    category: "Training & Knowledge Base",
    type: "video",
    audience: ["driver", "manager", "hr"],
    status: "coming_soon",
    description: "New driver onboarding video training series",
    source: "demo"
  },
  {
    id: "training-safety-videos",
    title: "Safety Training Videos",
    category: "Training & Knowledge Base",
    type: "video",
    audience: ["driver", "manager", "safety"],
    status: "coming_soon",
    description: "Safety procedures and compliance video training",
    source: "demo"
  },
  {
    id: "training-dispatch-videos",
    title: "Dispatch Training Videos",
    category: "Training & Knowledge Base",
    type: "video",
    audience: ["dispatcher", "manager"],
    status: "coming_soon",
    description: "Dispatch operations and system training videos",
    source: "demo"
  },
  {
    id: "training-safety-links",
    title: "Safety Training Links",
    category: "Training & Knowledge Base",
    type: "article",
    audience: ["driver", "manager", "safety"],
    status: "available",
    description: "External safety training resources and links",
    href: "/safety",
    source: "external"
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
    id: "contract-msa",
    title: "Master Services Agreement",
    category: "Contracts / Customer / Legal",
    type: "contract",
    audience: ["manager", "customer", "legal", "owner"],
    status: "template",
    description: "Standard master services agreement template",
    href: "/documents/template-packs",
    source: "template"
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
    id: "contract-work-order",
    title: "Work Order Template",
    category: "Contracts / Customer / Legal",
    type: "template",
    audience: ["manager", "customer", "dispatcher"],
    status: "available",
    description: "Standard work order and service agreement template",
    href: "/loads",
    source: "generated"
  },
  {
    id: "contract-rate-terms",
    title: "Rate Confirmation Terms",
    category: "Contracts / Customer / Legal",
    type: "contract",
    audience: ["manager", "customer", "dispatcher", "finance"],
    status: "available",
    description: "Rate confirmation terms and conditions template",
    href: "/loads",
    source: "generated"
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
    href: "/documents/template-packs",
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
