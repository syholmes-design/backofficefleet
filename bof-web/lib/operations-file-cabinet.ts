export type OperationsFileCabinetItem = {
  id: string;
  title: string;
  cabinet:
    | "Driver Qualification Files"
    | "Secondary Driver Documents"
    | "Dispatch & Load Operations"
    | "Contracts / Customer / Legal"
    | "Safety / Claims / Insurance"
    | "HR / Talent / Performance"
    | "Policies & SOPs"
    | "Finance / Settlements / Back Office"
    | "Training & Knowledge Base";
  section:
    | "Blank Templates"
    | "Completed Demo Samples"
    | "Company Policies & SOPs"
    | "BOF Dispatch Templates"
    | "Claims Forms"
    | "Legal / Contracts"
    | "External Resources"
    | "Needs Review / Coming Later"
    | "Related Policies / Acknowledgments"
    | "Finance Templates"
    | "Policy-Based Training";
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
    | "contract"
    | "training"
    | "external_resource";
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
  sourceAuthenticity: "official_template" | "generated_from_template" | "external_resource" | "coming_soon";
  documentOwner: "employer" | "platform" | "external";
  employerName: string;
  isBlankTemplate?: boolean;
  isCompletedSample?: boolean;
  tags?: string[];
  sampleHref?: string;
  templateHref?: string;
};

export const OPERATIONS_FILE_CABINET_REGISTRY: OperationsFileCabinetItem[] = [
  // Driver Qualification Files - Blank Templates
  {
    id: "driver-cdl-template",
    title: "CDL Verification Template",
    cabinet: "Driver Qualification Files",
    section: "Blank Templates",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "template",
    description: "Blank CDL verification template for new driver qualification",
    href: "/generated/templates/driver-docs/cdl-template.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["qualification", "license", "compliance"]
  },
  {
    id: "driver-medical-template",
    title: "Medical Card Template",
    cabinet: "Driver Qualification Files",
    section: "Blank Templates",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "template",
    description: "Blank medical card template for DOT physical examination",
    href: "/generated/templates/driver-docs/medical-card-template.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["medical", "dot", "physical"]
  },
  {
    id: "driver-mvr-template",
    title: "MVR Template",
    cabinet: "Driver Qualification Files",
    section: "Blank Templates",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "template",
    description: "Blank motor vehicle record template for driving history review",
    href: "/generated/templates/driver-docs/mvr-template.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["driving", "record", "mvr"]
  },
  {
    id: "driver-clearinghouse-template",
    title: "FMCSA Compliance Template",
    cabinet: "Driver Qualification Files",
    section: "Blank Templates",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "template",
    description: "Blank FMCSA clearinghouse compliance template",
    href: "/generated/templates/driver-docs/fmcsa-compliance-template.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["fmcsa", "clearinghouse", "drug", "alcohol"]
  },
  {
    id: "driver-i9-template",
    title: "I-9 Template",
    cabinet: "Driver Qualification Files",
    section: "Blank Templates",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "template",
    description: "Blank I-9 employment eligibility verification template",
    href: "/generated/templates/driver-docs/i9-template.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["employment", "eligibility", "i9"]
  },
  {
    id: "driver-w9-template",
    title: "W-9 Template",
    cabinet: "Driver Qualification Files",
    section: "Blank Templates",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "finance"],
    status: "template",
    description: "Blank W-9 tax form template for owner-operators",
    href: "/generated/templates/driver-docs/w9-template.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["tax", "w9", "contractor"]
  },
  {
    id: "driver-emergency-contact-template",
    title: "Emergency Contact Template",
    cabinet: "Driver Qualification Files",
    section: "Blank Templates",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr", "safety"],
    status: "template",
    description: "Blank emergency contact information template",
    href: "/generated/templates/driver-docs/emergency-contact-template.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["emergency", "contact", "medical"]
  },
  {
    id: "driver-bank-info-template",
    title: "Bank Information Template",
    cabinet: "Driver Qualification Files",
    section: "Blank Templates",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "finance"],
    status: "template",
    description: "Blank bank information template for direct deposit",
    href: "/generated/templates/driver-docs/bank-information-template.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["banking", "direct", "deposit"]
  },
  {
    id: "driver-road-test-template",
    title: "Road Test Certificate Template",
    cabinet: "Driver Qualification Files",
    section: "Blank Templates",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr", "safety"],
    status: "template",
    description: "Blank road test evaluation and certification template",
    href: "/generated/templates/driver-docs/road-test-certificate-template.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["road", "test", "evaluation"]
  },
  {
    id: "driver-employment-verification-template",
    title: "Employment Verification Template",
    cabinet: "Driver Qualification Files",
    section: "Blank Templates",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "template",
    description: "Blank employment verification and history template",
    href: "/generated/templates/driver-docs/employment-verification-template.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["employment", "verification", "history"]
  },
  {
    id: "driver-safety-policy-template",
    title: "Safety Policy Acknowledgment Template",
    cabinet: "Driver Qualification Files",
    section: "Blank Templates",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr", "safety"],
    status: "template",
    description: "Blank safety policy acknowledgment and certification template",
    href: "/generated/templates/driver-docs/safety-policy-acknowledgment-template.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["safety", "policy", "acknowledgment"]
  },
  // Driver Qualification Files - Completed Demo Samples
  {
    id: "driver-cdl-sample-john-carter",
    title: "CDL Completed Sample — John Carter",
    cabinet: "Driver Qualification Files",
    section: "Completed Demo Samples",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "available",
    description: "Completed CDL verification sample for demonstration purposes",
    href: "/generated/drivers/DRV-001/cdl.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    templateHref: "/generated/templates/driver-docs/cdl-template.html",
    tags: ["sample", "completed", "demo"]
  },
  {
    id: "driver-medical-sample-john-carter",
    title: "Medical Card Completed Sample — John Carter",
    cabinet: "Driver Qualification Files",
    section: "Completed Demo Samples",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "available",
    description: "Completed medical card sample for demonstration purposes",
    href: "/generated/drivers/DRV-001/medical-card.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    templateHref: "/generated/templates/driver-docs/medical-card-template.html",
    tags: ["sample", "completed", "demo"]
  },
  {
    id: "driver-mvr-sample-john-carter",
    title: "MVR Completed Sample — John Carter",
    cabinet: "Driver Qualification Files",
    section: "Completed Demo Samples",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "available",
    description: "Completed MVR sample for demonstration purposes",
    href: "/generated/drivers/DRV-001/mvr.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    templateHref: "/generated/templates/driver-docs/mvr-template.html",
    tags: ["sample", "completed", "demo"]
  },
  {
    id: "driver-clearinghouse-sample-john-carter",
    title: "FMCSA Completed Sample — John Carter",
    cabinet: "Driver Qualification Files",
    section: "Completed Demo Samples",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "available",
    description: "Completed FMCSA clearinghouse sample for demonstration purposes",
    href: "/generated/drivers/DRV-001/fmcsa-compliance.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    templateHref: "/generated/templates/driver-docs/fmcsa-compliance-template.html",
    tags: ["sample", "completed", "demo"]
  },
  {
    id: "driver-w9-sample-john-carter",
    title: "W-9 Completed Sample — John Carter",
    cabinet: "Driver Qualification Files",
    section: "Completed Demo Samples",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "finance"],
    status: "available",
    description: "Completed W-9 sample for demonstration purposes",
    href: "/generated/drivers/DRV-001/w9.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    templateHref: "/generated/templates/driver-docs/w9-template.html",
    tags: ["sample", "completed", "demo"]
  },
  {
    id: "driver-application",
    title: "Driver Application",
    cabinet: "Driver Qualification Files",
    section: "Needs Review / Coming Later",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "needs_review",
    description: "Standard driver employment application form",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["application", "employment", "coming"]
  },
  {
    id: "driver-road-test-sample-john-carter",
    title: "Road Test Completed Sample — John Carter",
    cabinet: "Driver Qualification Files",
    section: "Completed Demo Samples",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr", "safety"],
    status: "available",
    description: "Completed road test sample for demonstration purposes",
    href: "/generated/drivers/DRV-001/road-test-certificate.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    templateHref: "/generated/templates/driver-docs/road-test-certificate-template.html",
    tags: ["sample", "completed", "demo"]
  },
  {
    id: "driver-employment-verification-sample-john-carter",
    title: "Employment Verification Completed Sample — John Carter",
    cabinet: "Driver Qualification Files",
    section: "Completed Demo Samples",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "available",
    description: "Completed employment verification sample for demonstration purposes",
    href: "/generated/drivers/DRV-001/employment_verification.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    templateHref: "/generated/templates/driver-docs/employment-verification-template.html",
    tags: ["sample", "completed", "demo"]
  },
  {
    id: "driver-annual-review",
    title: "Annual Review",
    cabinet: "Driver Qualification Files",
    section: "Needs Review / Coming Later",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "needs_review",
    description: "Annual driver performance and compliance review",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["annual", "review", "performance"]
  },
  {
    id: "driver-emergency-contacts-sample-john-carter",
    title: "Emergency Contacts Completed Sample — John Carter",
    cabinet: "Driver Qualification Files",
    section: "Completed Demo Samples",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "dispatcher"],
    status: "available",
    description: "Completed emergency contacts sample for demonstration purposes",
    href: "/generated/drivers/DRV-001/emergency-contact.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    templateHref: "/generated/templates/driver-docs/emergency-contact-template.html",
    tags: ["sample", "completed", "demo"]
  },
  {
    id: "driver-profile",
    title: "Driver Profile",
    cabinet: "Driver Qualification Files",
    section: "Needs Review / Coming Later",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "hr"],
    status: "needs_review",
    description: "Complete driver profile and documentation access",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["profile", "dashboard", "coming"]
  },
  {
    id: "driver-bank-info-sample-john-carter",
    title: "Bank Information Completed Sample — John Carter",
    cabinet: "Driver Qualification Files",
    section: "Completed Demo Samples",
    category: "Driver Qualification Files",
    type: "driver-file",
    audience: ["driver", "manager", "finance"],
    status: "available",
    description: "Completed bank information sample for demonstration purposes",
    href: "/generated/drivers/DRV-001/bank-information.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    templateHref: "/generated/templates/driver-docs/bank-information-template.html",
    tags: ["sample", "completed", "demo"]
  },
  {
    id: "driver-benefits",
    title: "Benefits Enrollment",
    cabinet: "Driver Qualification Files",
    section: "Needs Review / Coming Later",
    category: "Driver Qualification Files",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "needs_review",
    description: "Employee benefits enrollment and management",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["benefits", "enrollment", "coming"]
  },

  // Secondary Driver Documents
  {
    id: "driver-coaching-notes",
    title: "Coaching Notes",
    cabinet: "Secondary Driver Documents",
    section: "Needs Review / Coming Later",
    category: "Secondary Driver Documents",
    type: "driver-file",
    audience: ["driver", "manager", "safety"],
    status: "needs_review",
    description: "Driver coaching documentation and follow-up records",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["coaching", "documentation", "coming"]
  },
  {
    id: "driver-safety-scorecards",
    title: "Safety Scorecards",
    cabinet: "Secondary Driver Documents",
    section: "Needs Review / Coming Later",
    category: "Secondary Driver Documents",
    type: "driver-file",
    audience: ["driver", "manager", "safety"],
    status: "needs_review",
    description: "Monthly safety performance metrics and trends",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["safety", "performance", "coming"]
  },
  {
    id: "driver-incident-history-john-carter",
    title: "Incident History — John Carter Sample",
    cabinet: "Secondary Driver Documents",
    section: "Completed Demo Samples",
    category: "Secondary Driver Documents",
    type: "driver-file",
    audience: ["driver", "manager", "safety"],
    status: "available",
    description: "Complete incident and violation history tracking sample",
    href: "/generated/drivers/DRV-001/incident-report.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    tags: ["sample", "incident", "history"]
  },
  {
    id: "driver-training-completions",
    title: "Training Completion Records",
    cabinet: "Secondary Driver Documents",
    section: "Needs Review / Coming Later",
    category: "Secondary Driver Documents",
    type: "driver-file",
    audience: ["driver", "manager", "hr", "safety"],
    status: "needs_review",
    description: "Training course completion certificates and records",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["training", "completion", "coming"]
  },
  {
    id: "driver-performance-reviews",
    title: "Performance Reviews",
    cabinet: "Secondary Driver Documents",
    section: "Needs Review / Coming Later",
    category: "Secondary Driver Documents",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "needs_review",
    description: "Annual performance evaluation forms and documentation",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["performance", "review", "coming"]
  },
  {
    id: "driver-disciplinary-notices",
    title: "Disciplinary Notices",
    cabinet: "Secondary Driver Documents",
    section: "Needs Review / Coming Later",
    category: "Secondary Driver Documents",
    type: "form",
    audience: ["driver", "manager", "hr"],
    status: "needs_review",
    description: "Disciplinary action notices and documentation",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["disciplinary", "notices", "coming"]
  },
  {
    id: "driver-corrective-action",
    title: "Corrective Action Plans",
    cabinet: "Secondary Driver Documents",
    section: "Needs Review / Coming Later",
    category: "Secondary Driver Documents",
    type: "form",
    audience: ["driver", "manager", "hr", "safety"],
    status: "needs_review",
    description: "Performance improvement and corrective action plans",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["corrective", "action", "coming"]
  },
  {
    id: "driver-communication-logs",
    title: "Driver Communication Logs",
    cabinet: "Secondary Driver Documents",
    section: "Needs Review / Coming Later",
    category: "Secondary Driver Documents",
    type: "form",
    audience: ["driver", "manager", "dispatcher"],
    status: "needs_review",
    description: "Driver communication and interaction documentation logs",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["communication", "logs", "coming"]
  },

  // Dispatch & Load Operations
  {
    id: "dispatch-load-intake",
    title: "Load Tender / Order Sheet",
    cabinet: "Dispatch & Load Operations",
    section: "BOF Dispatch Templates",
    category: "Dispatch & Load Operations",
    type: "form",
    audience: ["dispatcher", "manager"],
    status: "available",
    description: "Standard load booking and information collection form",
    href: "/documents/template-packs/load-tender-order-sheet.html",
    sourceAuthenticity: "official_template",
    documentOwner: "platform",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["load", "intake", "booking"]
  },
  {
    id: "dispatch-pretrip-planning",
    title: "Pre-Trip Planning Checklist",
    cabinet: "Dispatch & Load Operations",
    section: "Needs Review / Coming Later",
    category: "Dispatch & Load Operations",
    type: "checklist",
    audience: ["dispatcher", "driver", "safety"],
    status: "needs_review",
    description: "Comprehensive pre-trip planning and route preparation checklist",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["pretrip", "planning", "coming"]
  },
  {
    id: "dispatch-vehicle-inspection",
    title: "Vehicle Inspection Checklist",
    cabinet: "Dispatch & Load Operations",
    section: "Needs Review / Coming Later",
    category: "Dispatch & Load Operations",
    type: "checklist",
    audience: ["dispatcher", "driver", "safety"],
    status: "needs_review",
    description: "Vehicle inspection and safety check before departure",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["vehicle", "inspection", "coming"]
  },
  {
    id: "dispatch-route-readiness",
    title: "Route / Dispatch Readiness Checklist",
    cabinet: "Dispatch & Load Operations",
    section: "Completed Demo Samples",
    category: "Dispatch & Load Operations",
    type: "checklist",
    audience: ["dispatcher", "driver", "manager"],
    status: "available",
    description: "Comprehensive pre-trip planning and route assessment checklist sample",
    href: "/generated/loads/L001/pretrip-planning.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    tags: ["sample", "pretrip", "planning"]
  },
  {
    id: "dispatch-rate-confirmation",
    title: "Rate Confirmation",
    cabinet: "Dispatch & Load Operations",
    section: "BOF Dispatch Templates",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "manager", "customer"],
    status: "available",
    description: "Rate confirmation and pricing agreement documentation",
    href: "/documents/template-packs/rate-confirmation.html",
    sourceAuthenticity: "official_template",
    documentOwner: "platform",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["rate", "confirmation", "pricing"]
  },
  {
    id: "dispatch-bill-of-lading",
    title: "Bill of Lading",
    cabinet: "Dispatch & Load Operations",
    section: "BOF Dispatch Templates",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "driver", "customer"],
    status: "available",
    description: "Standard bill of lading for freight documentation",
    href: "/documents/template-packs/bill-of-lading.html",
    sourceAuthenticity: "official_template",
    documentOwner: "platform",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["bill", "lading", "freight"]
  },
  {
    id: "dispatch-proof-delivery",
    title: "Proof of Delivery",
    cabinet: "Dispatch & Load Operations",
    section: "BOF Dispatch Templates",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "driver", "customer"],
    status: "available",
    description: "Proof of delivery documentation and signature collection",
    href: "/documents/template-packs/proof-of-delivery.html",
    sourceAuthenticity: "official_template",
    documentOwner: "platform",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["proof", "delivery", "signature"]
  },
  {
    id: "dispatch-work-order-sample",
    title: "Work Order — L001 Sample",
    cabinet: "Dispatch & Load Operations",
    section: "Completed Demo Samples",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "driver", "customer"],
    status: "available",
    description: "Work order sample for specialized services and requirements",
    href: "/generated/loads/L001/work-order.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    tags: ["sample", "work", "order"]
  },
  {
    id: "dispatch-insurance-notice-sample",
    title: "Insurance Notice — L001 Sample",
    cabinet: "Dispatch & Load Operations",
    section: "Completed Demo Samples",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "customer", "legal"],
    status: "available",
    description: "Insurance coverage and claims notice sample",
    href: "/generated/loads/L001/insurance-notification.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    tags: ["sample", "insurance", "notice"]
  },
  {
    id: "dispatch-invoice-sample",
    title: "Invoice — L001 Sample",
    cabinet: "Dispatch & Load Operations",
    section: "Completed Demo Samples",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "finance", "customer"],
    status: "available",
    description: "Standard invoice sample for billing and settlements",
    href: "/generated/loads/L001/invoice.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    tags: ["sample", "invoice", "billing"]
  },
  {
    id: "dispatch-claim-intake",
    title: "Claim Intake Form",
    cabinet: "Dispatch & Load Operations",
    section: "BOF Dispatch Templates",
    category: "Dispatch & Load Operations",
    type: "form",
    audience: ["dispatcher", "safety", "legal"],
    status: "available",
    description: "Initial claim reporting and information collection form",
    href: "/documents/template-packs/claim-intake-form.html",
    sourceAuthenticity: "official_template",
    documentOwner: "platform",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["claim", "intake", "reporting"]
  },
  {
    id: "dispatch-master-agreement-sample",
    title: "Master Agreement — L001 Sample",
    cabinet: "Dispatch & Load Operations",
    section: "Completed Demo Samples",
    category: "Dispatch & Load Operations",
    type: "contract",
    audience: ["dispatcher", "manager", "customer", "legal"],
    status: "available",
    description: "Master service agreement sample for customer relationships",
    href: "/generated/loads/L001/master-agreement-reference.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    tags: ["sample", "master", "agreement"]
  },
  {
    id: "dispatch-schedule",
    title: "Schedule Template",
    cabinet: "Dispatch & Load Operations",
    section: "Needs Review / Coming Later",
    category: "Dispatch & Load Operations",
    type: "template",
    audience: ["dispatcher", "manager", "customer"],
    status: "needs_review",
    description: "Service schedule and delivery timeline template",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["schedule", "delivery", "coming"]
  },

  // Safety / Claims / Insurance
  {
    id: "safety-accident-report",
    title: "Accident Report Form",
    cabinet: "Safety / Claims / Insurance",
    section: "Claims Forms",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety", "legal"],
    status: "needs_review",
    description: "Comprehensive accident reporting and documentation form",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["accident", "report", "coming"]
  },
  {
    id: "safety-incident-response",
    title: "Incident Response Checklist",
    cabinet: "Safety / Claims / Insurance",
    section: "Needs Review / Coming Later",
    category: "Safety / Claims / Insurance",
    type: "checklist",
    audience: ["driver", "manager", "safety", "legal"],
    status: "needs_review",
    description: "Step-by-step incident response and documentation checklist",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["incident", "response", "coming"]
  },
  {
    id: "claims-intake-safety",
    title: "Claim Intake Form",
    cabinet: "Safety / Claims / Insurance",
    section: "Claims Forms",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["manager", "safety", "customer", "legal"],
    status: "available",
    description: "Standard cargo damage claim intake and documentation",
    href: "/documents/template-packs/claim-intake-form.html",
    sourceAuthenticity: "official_template",
    documentOwner: "platform",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["claim", "intake", "cargo"]
  },
  {
    id: "claims-insurance-claim",
    title: "Insurance Claim Form",
    cabinet: "Safety / Claims / Insurance",
    section: "Needs Review / Coming Later",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["manager", "safety", "legal"],
    status: "needs_review",
    description: "Insurance claim submission and documentation form",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["insurance", "claim", "coming"]
  },
  {
    id: "claims-police-report",
    title: "Police Report Request Form",
    cabinet: "Safety / Claims / Insurance",
    section: "Needs Review / Coming Later",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety", "legal"],
    status: "needs_review",
    description: "Police incident report request and documentation template",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["police", "report", "coming"]
  },
  {
    id: "safety-driver-statement",
    title: "Driver Statement Form",
    cabinet: "Safety / Claims / Insurance",
    section: "Claims Forms",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety", "legal"],
    status: "needs_review",
    description: "Driver statement form for accident and incident reporting",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["driver", "statement", "coming"]
  },
  {
    id: "claims-witness-statement",
    title: "Witness Statement Form",
    cabinet: "Safety / Claims / Insurance",
    section: "Needs Review / Coming Later",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety", "legal"],
    status: "needs_review",
    description: "Witness statement collection and documentation form",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["witness", "statement", "coming"]
  },
  {
    id: "claims-damage-estimate",
    title: "Damage Estimate Form",
    cabinet: "Safety / Claims / Insurance",
    section: "Needs Review / Coming Later",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["manager", "safety", "customer"],
    status: "needs_review",
    description: "Damage assessment and cost estimate documentation form",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["damage", "estimate", "coming"]
  },
  {
    id: "claims-photo-documentation",
    title: "Photo Documentation Checklist",
    cabinet: "Safety / Claims / Insurance",
    section: "Needs Review / Coming Later",
    category: "Safety / Claims / Insurance",
    type: "checklist",
    audience: ["driver", "manager", "safety"],
    status: "needs_review",
    description: "Photo documentation and evidence collection checklist for claims",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["photo", "documentation", "coming"]
  },
  {
    id: "claims-claim-packet",
    title: "Claim Packet Template",
    cabinet: "Safety / Claims / Insurance",
    section: "Needs Review / Coming Later",
    category: "Safety / Claims / Insurance",
    type: "template",
    audience: ["manager", "safety", "customer", "legal"],
    status: "needs_review",
    description: "Complete claim packet template with all required documentation",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["claim", "packet", "coming"]
  },
  {
    id: "claims-collection-demand",
    title: "Collection & Demand Letter Templates",
    cabinet: "Safety / Claims / Insurance",
    section: "Needs Review / Coming Later",
    category: "Safety / Claims / Insurance",
    type: "template",
    audience: ["manager", "legal", "customer"],
    status: "needs_review",
    description: "Collection and demand letter templates for claims",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["collection", "demand", "coming"]
  },
  {
    id: "claims-insurance-notice",
    title: "Insurance Notice Letter",
    cabinet: "Safety / Claims / Insurance",
    section: "Claims Forms",
    category: "Safety / Claims / Insurance",
    type: "template",
    audience: ["manager", "safety", "legal"],
    status: "available",
    description: "Insurance notification and claim reporting documentation",
    href: "/generated/loads/L001/insurance-notification.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isCompletedSample: true,
    tags: ["insurance", "notice", "sample"]
  },
  {
    id: "claims-escalation-sop",
    title: "Delta Advanced Trucking, Inc. Insurance, Risk and Claims SOP",
    cabinet: "Safety / Claims / Insurance",
    section: "Company Policies & SOPs",
    category: "Safety / Claims / Insurance",
    type: "sop",
    audience: ["manager", "safety", "legal", "finance"],
    status: "available",
    description: "Standard operating procedures for claims escalation and resolution",
    href: "/generated/company-operations-vault/07-insurance-risk-and-claims-sop.html",
    sourceAuthenticity: "generated_from_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["claims", "escalation", "sop"]
  },
  {
    id: "safety-evidence-photos",
    title: "Safety Evidence Photos",
    cabinet: "Safety / Claims / Insurance",
    section: "Needs Review / Coming Later",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety"],
    status: "needs_review",
    description: "Individual safety evidence photos and documentation",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["evidence", "photos", "coming"]
  },
  {
    id: "claims-settlement-agreement",
    title: "Settlement Agreement Template",
    cabinet: "Safety / Claims / Insurance",
    section: "Needs Review / Coming Later",
    category: "Safety / Claims / Insurance",
    type: "contract",
    audience: ["manager", "safety", "customer", "legal"],
    status: "needs_review",
    description: "Claim settlement agreement and release template",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["settlement", "agreement", "coming"]
  },
  {
    id: "contract-document-preservation",
    title: "Document Preservation Notice",
    cabinet: "Contracts / Customer / Legal",
    section: "Legal / Contracts",
    category: "Contracts / Customer / Legal",
    type: "template",
    audience: ["manager", "legal", "hr"],
    status: "needs_review",
    description: "Document preservation and retention notice template",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["document", "preservation", "coming"]
  },

  // HR / Talent / Performance Cabinet - Add missing cabinet
  {
    id: "hr-employee-handbook",
    title: "Employee Handbook",
    cabinet: "HR / Talent / Performance",
    section: "Company Policies & SOPs",
    category: "HR / Talent / Performance",
    type: "policy",
    audience: ["driver", "manager", "hr"],
    status: "needs_review",
    description: "Comprehensive employee handbook and company policies",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["handbook", "policy", "coming"]
  },
  {
    id: "hr-performance-review",
    title: "Performance Review Template",
    cabinet: "HR / Talent / Performance",
    section: "Needs Review / Coming Later",
    category: "HR / Talent / Performance",
    type: "form",
    audience: ["manager", "hr", "driver"],
    status: "needs_review",
    description: "Employee performance evaluation and review template",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["performance", "review", "coming"]
  },

  // Policies & SOPs Cabinet - Add missing cabinet
  {
    id: "policy-code-of-conduct",
    title: "Code of Conduct Policy",
    cabinet: "Policies & SOPs",
    section: "Company Policies & SOPs",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["driver", "manager", "hr", "safety"],
    status: "needs_review",
    description: "Company code of conduct and ethical guidelines",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["conduct", "ethics", "policy"]
  },
  {
    id: "policy-information-security",
    title: "Information Security Policy",
    cabinet: "Policies & SOPs",
    section: "Company Policies & SOPs",
    category: "Policies & SOPs",
    type: "policy",
    audience: ["manager", "hr", "admin"],
    status: "needs_review",
    description: "Information security and data protection policies",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["security", "data", "policy"]
  },

  // Finance / Settlements / Back Office Cabinet - Add missing cabinet
  {
    id: "finance-invoice-template",
    title: "Invoice Template",
    cabinet: "Finance / Settlements / Back Office",
    section: "Needs Review / Coming Later",
    category: "Finance / Settlements / Back Office",
    type: "template",
    audience: ["manager", "finance", "customer"],
    status: "needs_review",
    description: "Standard invoice template for billing and settlements",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["invoice", "billing", "finance"]
  },
  {
    id: "finance-expense-report",
    title: "Expense Report Form",
    cabinet: "Finance / Settlements / Back Office",
    section: "Needs Review / Coming Later",
    category: "Finance / Settlements / Back Office",
    type: "form",
    audience: ["driver", "manager", "finance"],
    status: "needs_review",
    description: "Employee expense reporting and reimbursement form",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["expense", "reimbursement", "finance"]
  },

  // Training & Knowledge Base Cabinet - Add missing cabinet
  {
    id: "training-safety-program",
    title: "Safety Training Program",
    cabinet: "Training & Knowledge Base",
    section: "Needs Review / Coming Later",
    category: "Training & Knowledge Base",
    type: "training",
    audience: ["driver", "manager", "safety"],
    status: "needs_review",
    description: "Comprehensive safety training program and materials",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["training", "safety", "program"]
  },
  {
    id: "training-compliance-courses",
    title: "Compliance Training Courses",
    cabinet: "Training & Knowledge Base",
    section: "External Resources",
    category: "Training & Knowledge Base",
    type: "external_resource",
    audience: ["driver", "manager", "hr"],
    status: "needs_review",
    description: "External compliance training resources and courses",
    sourceAuthenticity: "external_resource",
    documentOwner: "external",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["training", "compliance", "external"]
  },

  // Add missing Claims Forms section
  {
    id: "claims-accident-report",
    title: "Accident Report Form",
    cabinet: "Safety / Claims / Insurance",
    section: "Claims Forms",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety", "legal"],
    status: "needs_review",
    description: "Comprehensive accident reporting and documentation form",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["accident", "report", "claims"]
  },
  {
    id: "claims-damage-report",
    title: "Cargo Damage Report Form",
    cabinet: "Safety / Claims / Insurance",
    section: "Claims Forms",
    category: "Safety / Claims / Insurance",
    type: "form",
    audience: ["driver", "manager", "safety", "customer"],
    status: "needs_review",
    description: "Cargo damage assessment and reporting form",
    sourceAuthenticity: "coming_soon",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["damage", "cargo", "claims"]
  },

  // Add missing External Resources section items
  {
    id: "external-fmcsa-regulations",
    title: "FMCSA Regulations Portal",
    cabinet: "Safety / Claims / Insurance",
    section: "External Resources",
    category: "Safety / Claims / Insurance",
    type: "external_resource",
    audience: ["driver", "manager", "safety", "compliance"],
    status: "available",
    description: "Link to FMCSA regulations and compliance resources",
    href: "https://www.fmcsa.dot.gov",
    sourceAuthenticity: "external_resource",
    documentOwner: "external",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["fmcsa", "regulations", "external"]
  },
  {
    id: "external-dot-resources",
    title: "DOT Resource Center",
    cabinet: "Training & Knowledge Base",
    section: "External Resources",
    category: "Training & Knowledge Base",
    type: "external_resource",
    audience: ["driver", "manager", "safety"],
    status: "available",
    description: "Department of Transportation training and resource center",
    href: "https://www.transportation.gov",
    sourceAuthenticity: "external_resource",
    documentOwner: "external",
    employerName: "Delta Advanced Trucking, Inc.",
    tags: ["dot", "training", "external"]
  },

  // Accounting Templates - Finance / Settlements / Back Office
  {
    id: "driver-settlement-statement",
    title: "Driver Settlement Statement",
    cabinet: "Finance / Settlements / Back Office",
    section: "Blank Templates",
    category: "Finance / Settlements / Back Office",
    type: "template",
    audience: ["driver", "manager", "finance", "dispatcher"],
    status: "template",
    description: "Multi-section settlement statement with earnings, deductions, and YTD totals",
    href: "/documents/accounting-templates/driver-settlement-statement.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["settlement", "statement", "accounting", "template"]
  },
  {
    id: "fuel-card-reconciliation-worksheet",
    title: "Fuel Card Reconciliation Worksheet",
    cabinet: "Finance / Settlements / Back Office",
    section: "Blank Templates",
    category: "Finance / Settlements / Back Office",
    type: "template",
    audience: ["driver", "manager", "finance", "dispatcher"],
    status: "template",
    description: "Weekly fuel reconciliation with 14-column table and exception escalation matrix",
    href: "/documents/accounting-templates/fuel-card-reconciliation-worksheet.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["fuel", "reconciliation", "accounting", "template"]
  },
  {
    id: "fleet-asset-register",
    title: "Fleet Asset Register",
    cabinet: "Finance / Settlements / Back Office",
    section: "Blank Templates",
    category: "Finance / Settlements / Back Office",
    type: "template",
    audience: ["manager", "finance", "maintenance", "admin"],
    status: "template",
    description: "23-column scrollable asset register with fleet summary and capitalization policy",
    href: "/documents/accounting-templates/fleet-asset-register.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["fleet", "assets", "register", "accounting", "template"]
  },
  {
    id: "ifta-quarterly-mileage-fuel-log",
    title: "IFTA Quarterly Mileage & Fuel Log",
    cabinet: "Finance / Settlements / Back Office",
    section: "Blank Templates",
    category: "Finance / Settlements / Back Office",
    type: "template",
    audience: ["driver", "manager", "finance", "dispatcher"],
    status: "template",
    description: "Quarterly IFTA reporting with all 58 jurisdictions and filing deadline reminders",
    href: "/documents/accounting-templates/ifta-quarterly-mileage-fuel-log.html",
    sourceAuthenticity: "official_template",
    documentOwner: "employer",
    employerName: "Delta Advanced Trucking, Inc.",
    isBlankTemplate: true,
    tags: ["ifta", "mileage", "fuel", "quarterly", "compliance", "template"]
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
