
export type QuestionType = 'single_choice' | 'multiple_choice' | 'short_text' | 'number' | 'yes_no' | 'scale_1_5';

export type QuestionOption = {
  value: string;
  label: string;
};

export type Question = {
  id: string;
  type: QuestionType;
  question: string;
  options?: QuestionOption[];
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
};

export type Section = {
  id: string;
  title: string;
  description: string;
  estimatedQuestions: number;
  required: boolean;
  questions: Question[];
};

export type AssessmentTrack = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  route: string;
  sections: Section[];
  recommendedModules: string[];
  scoreType: string;
};

export type AssessmentAnswer = {
  questionId: string;
  value: string | string[] | number | boolean | null;
};

export type AssessmentResult = {
  trackId: string;
  score: number;
  scoreCategory: 'Strong' | 'Needs Attention' | 'High Risk';
  completedSections: string[];
  skippedSections: string[];
  riskAreas: string[];
  recommendedModules: string[];
  answers: AssessmentAnswer[];
};

// Assessment Track Definitions
export const ASSESSMENT_TRACKS: AssessmentTrack[] = [
  // Track 1: For-Hire Carrier Assessment
  {
    id: 'for-hire-carriers',
    title: 'For-Hire Carrier',
    description: 'For trucking companies hauling freight for brokers, shippers, or customers. Assess dispatch, documents, driver readiness, HR/payroll, owner-operator workflows, settlements, factoring, receivables, profitability, cash flow, audit readiness, and customer proof.',
    ctaLabel: 'Start For-Hire Assessment',
    route: '/assessment/for-hire-carriers',
    scoreType: 'For-Hire Back Office Readiness Score',
    recommendedModules: [
      'Command Center',
      'Dispatch / Loads',
      'Drivers',
      'Documents',
      'Company Operations Vault',
      'Fleet Financials',
      'Settlements',
      'Portals'
    ],
    sections: [
      {
        id: 'fleet-profile',
        title: 'Fleet Profile',
        description: 'Basic information about your fleet operations',
        estimatedQuestions: 6,
        required: true,
        questions: [
          {
            id: 'truck-count',
            type: 'number',
            question: 'How many trucks do you operate?',
            required: true,
            min: 1,
            max: 1000
          },
          {
            id: 'driver-count',
            type: 'number',
            question: 'How many drivers do you have?',
            required: true,
            min: 1,
            max: 2000
          },
          {
            id: 'driver-mix',
            type: 'single_choice',
            question: 'What is your mix of employee drivers vs owner-operators?',
            required: true,
            options: [
              { value: 'all-employee', label: '100% Employee Drivers' },
              { value: 'mostly-employee', label: 'Mostly Employee Drivers (75%+)' },
              { value: 'mixed', label: 'Mixed (50/50)' },
              { value: 'mostly-owner-operator', label: 'Mostly Owner-Operators (75%+)' },
              { value: 'all-owner-operator', label: '100% Owner-Operators' }
            ]
          },
          {
            id: 'operating-lanes',
            type: 'short_text',
            question: 'What are your primary operating lanes/states?',
            required: true,
            placeholder: 'e.g., Midwest to Southeast, Texas to California'
          },
          {
            id: 'freight-type',
            type: 'single_choice',
            question: 'What is your main freight type?',
            required: true,
            options: [
              { value: 'dry-van', label: 'Dry Van' },
              { value: 'reefer', label: 'Refrigerated' },
              { value: 'flatbed', label: 'Flatbed' },
              { value: 'tanker', label: 'Tanker' },
              { value: 'specialized', label: 'Specialized/Heavy Haul' },
              { value: 'mixed', label: 'Mixed Freight' }
            ]
          },
          {
            id: 'current-systems',
            type: 'multiple_choice',
            question: 'What systems do you currently use?',
            required: true,
            options: [
              { value: 'tms', label: 'Transportation Management System (TMS)' },
              { value: 'eld', label: 'Electronic Logging Device (ELD)' },
              { value: 'quickbooks', label: 'QuickBooks/Accounting Software' },
              { value: 'factoring-portal', label: 'Factoring Portal' },
              { value: 'spreadsheets', label: 'Spreadsheets' },
              { value: 'email', label: 'Email/Communication' },
              { value: 'paper-files', label: 'Paper Files' }
            ]
          }
        ]
      },
      {
        id: 'dispatch-operations',
        title: 'Dispatch & Load Execution',
        description: 'How you manage dispatch and track loads',
        estimatedQuestions: 5,
        required: true,
        questions: [
          {
            id: 'load-entry-tracking',
            type: 'single_choice',
            question: 'How are loads entered and tracked?',
            required: true,
            options: [
              { value: 'tms-automated', label: 'TMS with automated tracking' },
              { value: 'tms-manual', label: 'TMS with manual updates' },
              { value: 'spreadsheets', label: 'Spreadsheets' },
              { value: 'email-phone', label: 'Email and phone calls' },
              { value: 'paper-whiteboard', label: 'Paper forms/whiteboard' }
            ]
          },
          {
            id: 'driver-eligibility',
            type: 'yes_no',
            question: 'Do dispatchers know driver eligibility before assignment?',
            required: true
          },
          {
            id: 'load-delays',
            type: 'scale_1_5',
            question: 'How often are loads delayed by missing documents or unclear instructions?',
            required: true
          },
          {
            id: 'proof-bundle',
            type: 'yes_no',
            question: 'Do you have a consistent proof bundle for every delivered load?',
            required: true
          },
          {
            id: 'document-tracking',
            type: 'multiple_choice',
            question: 'How do you track BOL, POD, seal photos, cargo photos, lumper receipts, claims, and exceptions?',
            required: true,
            options: [
              { value: 'tms-integrated', label: 'Integrated in TMS' },
              { value: 'mobile-app', label: 'Mobile app' },
              { value: 'email-attachments', label: 'Email attachments' },
              { value: 'paper-files', label: 'Paper files' },
              { value: 'no-systematic-tracking', label: 'No systematic tracking' }
            ]
          }
        ]
      },
      {
        id: 'driver-readiness',
        title: 'Driver Readiness & Worker Type',
        description: 'Driver qualification and document management',
        estimatedQuestions: 5,
        required: true,
        questions: [
          {
            id: 'mixed-workforce',
            type: 'yes_no',
            question: 'Do you manage both company drivers and owner-operators?',
            required: true
          },
          {
            id: 'different-requirements',
            type: 'yes_no',
            question: 'Do employee drivers and owner-operators have different document requirements?',
            required: true
          },
          {
            id: 'document-tracking',
            type: 'single_choice',
            question: 'How do you track CDL, medical card, MVR, I-9, W-9, emergency contacts, policy acknowledgments, and owner-operator packets?',
            required: true,
            options: [
              { value: 'centralized-system', label: 'Centralized digital system' },
              { value: 'multiple-systems', label: 'Multiple disconnected systems' },
              { value: 'paper-files', label: 'Paper files only' },
              { value: 'spreadsheets', label: 'Spreadsheets' },
              { value: 'no-systematic-tracking', label: 'No systematic tracking' }
            ]
          },
          {
            id: 'readiness-visibility',
            type: 'yes_no',
            question: 'Do you know why each driver is ready, blocked, or needs review?',
            required: true
          },
          {
            id: 'document-separation',
            type: 'yes_no',
            question: 'Are employee-only forms separated from owner-operator documents?',
            required: true
          }
        ]
      },
      {
        id: 'hr-payroll',
        title: 'HR / Payroll / Settlements',
        description: 'Payroll processing and settlement methods',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'pay-calculation',
            type: 'single_choice',
            question: 'How do you calculate driver pay or owner-operator settlements?',
            required: true,
            options: [
              { value: 'automated-software', label: 'Automated software' },
              { value: 'spreadsheets', label: 'Spreadsheets with formulas' },
              { value: 'manual-calculations', label: 'Manual calculations' },
              { value: 'external-payroll', label: 'External payroll service' }
            ]
          },
          {
            id: 'settlement-methods',
            type: 'multiple_choice',
            question: 'What settlement methods do you support?',
            required: true,
            options: [
              { value: 'cents-per-mile', label: 'Cents per mile' },
              { value: 'percentage-load', label: 'Percentage of load' },
              { value: 'flat-trip', label: 'Flat trip rate' },
              { value: 'hybrid', label: 'Hybrid methods' }
            ]
          },
          {
            id: 'deductions-tracking',
            type: 'multiple_choice',
            question: 'Do you track deductions, reimbursements, advances, chargebacks, and family support withholding?',
            required: true,
            options: [
              { value: 'all-deductions', label: 'All of these' },
              { value: 'some-deductions', label: 'Some of these' },
              { value: 'basic-deductions', label: 'Basic deductions only' },
              { value: 'no-deductions', label: 'No deductions tracking' }
            ]
          },
          {
            id: 'settlement-delays',
            type: 'scale_1_5',
            question: 'How often are settlements delayed by missing load proof or document issues?',
            required: true
          }
        ]
      },
      {
        id: 'fleet-financials',
        title: 'Fleet Financials & Cash Flow',
        description: 'Financial visibility and cash flow management',
        estimatedQuestions: 5,
        required: true,
        questions: [
          {
            id: 'load-profitability',
            type: 'yes_no',
            question: 'Do you know profit by load?',
            required: true
          },
          {
            id: 'cost-modeling',
            type: 'multiple_choice',
            question: 'Can you model which costs for profitability analysis?',
            required: true,
            options: [
              { value: 'fuel-mpg', label: 'Fuel price and MPG' },
              { value: 'factoring-fees', label: 'Factoring fees' },
              { value: 'maintenance-reserves', label: 'Maintenance reserves' },
              { value: 'insurance', label: 'Insurance costs' },
              { value: 'truck-debt', label: 'Truck debt/leases' },
              { value: 'overhead', label: 'Overhead costs' }
            ]
          },
          {
            id: 'invoice-readiness',
            type: 'yes_no',
            question: 'Do you know which loads are ready to invoice?',
            required: true
          },
          {
            id: 'cash-delays',
            type: 'scale_1_5',
            question: 'How much cash is delayed by missing PODs, billing holds, or factoring review?',
            required: true
          },
          {
            id: 'cash-forecasting',
            type: 'single_choice',
            question: 'Can you forecast cash for the next periods?',
            required: true,
            options: [
              { value: '7-14-30-days', label: '7, 14, and 30 days' },
              { value: '14-30-days', label: '14 and 30 days' },
              { value: '30-days-only', label: '30 days only' },
              { value: 'no-forecasting', label: 'No cash forecasting' }
            ]
          }
        ]
      },
      {
        id: 'factoring-receivables',
        title: 'Factoring & Receivables',
        description: 'Invoice factoring and receivables management',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'use-factoring',
            type: 'yes_no',
            question: 'Do you factor invoices?',
            required: true
          },
          {
            id: 'factoring-tracking',
            type: 'multiple_choice',
            question: 'Do you track advance rates, reserve holdbacks, factoring fees, and reserve release timing?',
            required: true,
            options: [
              { value: 'all-tracked', label: 'All of these tracked' },
              { value: 'some-tracked', label: 'Some tracked' },
              { value: 'basic-tracking', label: 'Basic tracking only' },
              { value: 'no-tracking', label: 'No systematic tracking' }
            ]
          },
          {
            id: 'proof-blocking',
            type: 'yes_no',
            question: 'Can proof status block invoice readiness?',
            required: true
          },
          {
            id: 'invoice-status',
            type: 'multiple_choice',
            question: 'Can you see which loads should be invoiced, factored, held, or reviewed?',
            required: true,
            options: [
              { value: 'all-statuses', label: 'All statuses visible' },
              { value: 'most-statuses', label: 'Most statuses visible' },
              { value: 'basic-statuses', label: 'Basic statuses only' },
              { value: 'limited-visibility', label: 'Limited visibility' }
            ]
          }
        ]
      },
      {
        id: 'tax-audit',
        title: 'Tax / Regulatory Audit Readiness',
        description: 'Fuel tax and regulatory compliance preparation',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'record-support',
            type: 'multiple_choice',
            question: 'Can you support which records by load?',
            required: true,
            options: [
              { value: 'fuel-mileage', label: 'Fuel and mileage records' },
              { value: 'toll-receipts', label: 'Toll receipts' },
              { value: 'asset-records', label: 'Asset records' },
              { value: 'invoices', label: 'Invoices' },
              { value: 'settlements', label: 'Settlements' },
              { value: 'pods', label: 'PODs' }
            ]
          },
          {
            id: 'record-comparison',
            type: 'yes_no',
            question: 'Can you compare your records against a later state or regulatory assessment?',
            required: true
          },
          {
            id: 'issue-identification',
            type: 'yes_no',
            question: 'Can you identify missing fuel receipts, mileage gaps, or proof issues before period close?',
            required: true
          },
          {
            id: 'checklist-usage',
            type: 'yes_no',
            question: 'Do you have a fuel/mileage/excise tax support checklist?',
            required: true
          }
        ]
      },
      {
        id: 'customer-visibility',
        title: 'Customer Visibility',
        description: 'Customer portal and communication',
        estimatedQuestions: 3,
        required: true,
        questions: [
          {
            id: 'customer-access',
            type: 'yes_no',
            question: 'Do customers have controlled access to shipment status?',
            required: true
          },
          {
            id: 'customer-documents',
            type: 'multiple_choice',
            question: 'What can customers see?',
            required: true,
            options: [
              { value: 'shipment-status', label: 'Shipment status' },
              { value: 'pods-bols', label: 'PODs and BOLs' },
              { value: 'delivery-photos', label: 'Delivery photos' },
              { value: 'exception-status', label: 'Exception status' },
              { value: 'invoice-readiness', label: 'Invoice readiness' }
            ]
          },
          {
            id: 'communication-time',
            type: 'scale_1_5',
            question: 'How much time does your team spend answering "where is my load?" or "send me the POD" requests?',
            required: true
          }
        ]
      }
    ]
  },
  // Track 2: Private Fleet Assessment
  {
    id: 'private-fleets',
    title: 'Private Fleet',
    description: 'For companies operating trucks to move their own goods, equipment, or materials. Assess internal delivery operations, driver readiness, asset utilization, maintenance, proof of service, safety, compliance, cost allocation, and policy controls.',
    ctaLabel: 'Start Private Fleet Assessment',
    route: '/assessment/private-fleets',
    scoreType: 'Private Fleet Operations Readiness Score',
    recommendedModules: [
      'Command Center',
      'Drivers',
      'Assets / Maintenance',
      'Documents',
      'Company Operations Vault',
      'Portals',
      'Fleet Financials cost allocation view'
    ],
    sections: [
      {
        id: 'fleet-profile',
        title: 'Fleet Profile',
        description: 'Basic information about your private fleet',
        estimatedQuestions: 5,
        required: true,
        questions: [
          {
            id: 'vehicle-count',
            type: 'number',
            question: 'How many vehicles/trucks do you operate?',
            required: true,
            min: 1,
            max: 500
          },
          {
            id: 'driver-count',
            type: 'number',
            question: 'How many drivers/operators do you have?',
            required: true,
            min: 1,
            max: 1000
          },
          {
            id: 'departments-served',
            type: 'short_text',
            question: 'What internal departments/locations do you serve?',
            required: true,
            placeholder: 'e.g., Manufacturing, Distribution, Retail stores, Construction sites'
          },
          {
            id: 'delivery-routes',
            type: 'short_text',
            question: 'What are your typical delivery/service routes?',
            required: true,
            placeholder: 'e.g., Local deliveries, Regional routes, Interplant transfers'
          },
          {
            id: 'current-systems',
            type: 'multiple_choice',
            question: 'What systems do you currently use?',
            required: true,
            options: [
              { value: 'fleet-management', label: 'Fleet management software' },
              { value: 'dispatch-software', label: 'Dispatch software' },
              { value: 'eld', label: 'Electronic Logging Device (ELD)' },
              { value: 'spreadsheets', label: 'Spreadsheets' },
              { value: 'email-phone', label: 'Email and phone' },
              { value: 'paper-files', label: 'Paper files' }
            ]
          }
        ]
      },
      {
        id: 'internal-dispatch',
        title: 'Internal Dispatch & Service Execution',
        description: 'How you manage internal deliveries and work orders',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'work-order-assignment',
            type: 'single_choice',
            question: 'How are internal deliveries, work orders, or service routes assigned?',
            required: true,
            options: [
              { value: 'automated-system', label: 'Automated system' },
              { value: 'dispatch-software', label: 'Dispatch software' },
              { value: 'spreadsheets', label: 'Spreadsheets' },
              { value: 'email-phone', label: 'Email and phone calls' },
              { value: 'paper-whiteboard', label: 'Paper forms/whiteboard' }
            ]
          },
          {
            id: 'readiness-visibility',
            type: 'yes_no',
            question: 'Do managers know driver and vehicle readiness before dispatch?',
            required: true
          },
          {
            id: 'proof-tracking',
            type: 'yes_no',
            question: 'Do you track proof of service or delivery completion?',
            required: true
          },
          {
            id: 'exception-handling',
            type: 'single_choice',
            question: 'How do you handle exceptions, delays, failed deliveries, or damage?',
            required: true,
            options: [
              { value: 'formal-process', label: 'Formal exception process' },
              { value: 'informal-process', label: 'Informal process' },
              { value: 'case-by-case', label: 'Case by case basis' },
              { value: 'no-process', label: 'No defined process' }
            ]
          }
        ]
      },
      {
        id: 'driver-compliance',
        title: 'Driver Readiness & Compliance',
        description: 'Driver qualification and safety compliance',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'document-tracking',
            type: 'single_choice',
            question: 'How do you track CDL, medical card, MVR, safety acknowledgments, and policy compliance?',
            required: true,
            options: [
              { value: 'centralized-system', label: 'Centralized digital system' },
              { value: 'multiple-systems', label: 'Multiple disconnected systems' },
              { value: 'paper-files', label: 'Paper files only' },
              { value: 'spreadsheets', label: 'Spreadsheets' },
              { value: 'no-systematic-tracking', label: 'No systematic tracking' }
            ]
          },
          {
            id: 'readiness-visibility',
            type: 'yes_no',
            question: 'Can you quickly tell which drivers are ready or need review?',
            required: true
          },
          {
            id: 'expiration-tracking',
            type: 'yes_no',
            question: 'Are expiring documents visible before they create risk?',
            required: true
          },
          {
            id: 'safety-training',
            type: 'yes_no',
            question: 'Do you track safety training and acknowledgments?',
            required: true
          }
        ]
      },
      {
        id: 'assets-maintenance',
        title: 'Asset Utilization & Maintenance',
        description: 'Vehicle utilization and maintenance management',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'utilization-tracking',
            type: 'yes_no',
            question: 'Do you track vehicle utilization by department, route, or location?',
            required: true
          },
          {
            id: 'maintenance-tracking',
            type: 'yes_no',
            question: 'Do you track maintenance issues and downtime?',
            required: true
          },
          {
            id: 'cost-identification',
            type: 'yes_no',
            question: 'Can you identify vehicles creating avoidable cost or reliability problems?',
            required: true
          },
          {
            id: 'maintenance-scheduling',
            type: 'single_choice',
            question: 'How do you schedule preventive maintenance?',
            required: true,
            options: [
              { value: 'automated-system', label: 'Automated scheduling system' },
              { value: 'manual-tracking', label: 'Manual tracking and scheduling' },
              { value: 'reactive-only', label: 'Reactive maintenance only' },
              { value: 'no-scheduling', label: 'No systematic scheduling' }
            ]
          }
        ]
      },
      {
        id: 'cost-allocation',
        title: 'Cost Allocation & Budget Visibility',
        description: 'Cost tracking and budget management',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'cost-tracking',
            type: 'yes_no',
            question: 'Do you track operating cost by route, location, department, or vehicle?',
            required: true
          },
          {
            id: 'cost-breakdown',
            type: 'multiple_choice',
            question: 'What costs do you know by unit or route?',
            required: true,
            options: [
              { value: 'fuel', label: 'Fuel costs' },
              { value: 'maintenance', label: 'Maintenance costs' },
              { value: 'insurance', label: 'Insurance costs' },
              { value: 'asset-costs', label: 'Asset depreciation/leases' },
              { value: 'driver-costs', label: 'Driver labor costs' }
            ]
          },
          {
            id: 'budget-reporting',
            type: 'yes_no',
            question: 'Do you need internal cost reporting for finance or leadership?',
            required: true
          },
          {
            id: 'cost-visibility',
            type: 'scale_1_5',
            question: 'How would you rate your current cost visibility?',
            required: true
          }
        ]
      },
      {
        id: 'policy-controls',
        title: 'Policy Controls & Document Governance',
        description: 'Policy management and document control',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'policy-storage',
            type: 'single_choice',
            question: 'Where do you store safety policies, vehicle-use policies, maintenance SOPs, insurance records, and training acknowledgments?',
            required: true,
            options: [
              { value: 'centralized-vault', label: 'Centralized document vault' },
              { value: 'shared-drive', label: 'Shared network drive' },
              { value: 'paper-files', label: 'Paper files only' },
              { value: 'no-central-storage', label: 'No central storage' }
            ]
          },
          {
            id: 'policy-management',
            type: 'yes_no',
            question: 'Do policies have owners, review dates, and acknowledgment status?',
            required: true
          },
          {
            id: 'document-access',
            type: 'yes_no',
            question: 'Is access to sensitive documents controlled?',
            required: true
          },
          {
            id: 'version-control',
            type: 'yes_no',
            question: 'Do you track document versions and updates?',
            required: true
          }
        ]
      },
      {
        id: 'audit-trails',
        title: 'Audit Trails & Proof of Service',
        description: 'Record keeping and audit support',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'service-records',
            type: 'yes_no',
            question: 'Can you produce records showing who drove, what vehicle was used, where it went, what was delivered or serviced, and what proof exists?',
            required: true
          },
          {
            id: 'records-retention',
            type: 'yes_no',
            question: 'Do you need better records retention and internal audit support?',
            required: true
          },
          {
            id: 'record-completeness',
            type: 'scale_1_5',
            question: 'How complete are your service records?',
            required: true
          },
          {
            id: 'audit-preparation',
            type: 'yes_no',
            question: 'Are you prepared for internal audits or reviews?',
            required: true
          }
        ]
      },
      // Optional advanced sections for Private Fleet
      {
        id: 'workforce-records',
        title: 'Workforce Records',
        description: 'Advanced workforce management',
        estimatedQuestions: 3,
        required: false,
        questions: [
          {
            id: 'hr-integration',
            type: 'yes_no',
            question: 'Is your fleet data integrated with HR systems?',
            required: false
          },
          {
            id: 'performance-tracking',
            type: 'yes_no',
            question: 'Do you track driver performance metrics?',
            required: false
          },
          {
            id: 'training-records',
            type: 'yes_no',
            question: 'Do you maintain comprehensive training records?',
            required: false
          }
        ]
      },
      {
        id: 'audit-support',
        title: 'Audit Support',
        description: 'Advanced audit and compliance support',
        estimatedQuestions: 3,
        required: false,
        questions: [
          {
            id: 'external-audits',
            type: 'yes_no',
            question: 'Do you undergo external audits?',
            required: false
          },
          {
            id: 'compliance-reporting',
            type: 'yes_no',
            question: 'Do you generate compliance reports?',
            required: false
          },
          {
            id: 'audit-documentation',
            type: 'yes_no',
            question: 'Do you maintain audit documentation?',
            required: false
          }
        ]
      },
      {
        id: 'cost-visibility',
        title: 'Cost Visibility Deep Dive',
        description: 'Detailed cost analysis capabilities',
        estimatedQuestions: 3,
        required: false,
        questions: [
          {
            id: 'cost-analysis',
            type: 'yes_no',
            question: 'Do you perform cost analysis by route or customer?',
            required: false
          },
          {
            id: 'profitability-analysis',
            type: 'yes_no',
            question: 'Do you analyze service profitability?',
            required: false
          },
          {
            id: 'cost-optimization',
            type: 'yes_no',
            question: 'Do you use cost data for optimization?',
            required: false
          }
        ]
      }
    ]
  },
  // Track 3: Government Fleet Assessment
  {
    id: 'government-fleets',
    title: 'Government Fleet',
    description: 'For public-sector departments and agencies managing vehicles, drivers, work orders, maintenance records, accountability, audit trails, fuel/mileage support, records retention, and public-service fleet readiness.',
    ctaLabel: 'Start Government Fleet Assessment',
    route: '/assessment/government-fleets',
    scoreType: 'Government Fleet Readiness Score',
    recommendedModules: [
      'Company Operations Vault',
      'Drivers',
      'Documents',
      'Command Center',
      'Assets/Maintenance',
      'Fleet Financials cost/budget view',
      'Manager Portal'
    ],
    sections: [
      {
        id: 'agency-profile',
        title: 'Agency / Department Profile',
        description: 'Basic information about your government fleet',
        estimatedQuestions: 5,
        required: true,
        questions: [
          {
            id: 'agency-type',
            type: 'single_choice',
            question: 'What type of agency or department are you?',
            required: true,
            options: [
              { value: 'public-works', label: 'Public Works' },
              { value: 'utilities', label: 'Utilities' },
              { value: 'emergency-services', label: 'Emergency Services' },
              { value: 'transportation', label: 'Transportation/Transit' },
              { value: 'inspection', label: 'Inspection/Regulatory' },
              { value: 'maintenance', label: 'Maintenance/Facilities' },
              { value: 'other', label: 'Other' }
            ]
          },
          {
            id: 'vehicle-count',
            type: 'number',
            question: 'How many vehicles do you manage?',
            required: true,
            min: 1,
            max: 1000
          },
          {
            id: 'driver-count',
            type: 'number',
            question: 'How many drivers/operators do you have?',
            required: true,
            min: 1,
            max: 500
          },
          {
            id: 'departments-served',
            type: 'short_text',
            question: 'What departments do you serve?',
            required: true,
            placeholder: 'e.g., Public works, parks, utilities, administration'
          },
          {
            id: 'mission-type',
            type: 'multiple_choice',
            question: 'What is your primary mission type?',
            required: true,
            options: [
              { value: 'public-works', label: 'Public works services' },
              { value: 'utilities', label: 'Utility services' },
              { value: 'emergency-support', label: 'Emergency support' },
              { value: 'inspection', label: 'Inspection services' },
              { value: 'maintenance', label: 'Maintenance services' },
              { value: 'transportation', label: 'Transportation services' }
            ]
          }
        ]
      },
      {
        id: 'fleet-readiness',
        title: 'Fleet Readiness & Dispatch / Work Orders',
        description: 'Vehicle readiness and work order management',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'vehicle-assignment',
            type: 'single_choice',
            question: 'How are vehicles and operators assigned?',
            required: true,
            options: [
              { value: 'automated-system', label: 'Automated system' },
              { value: 'dispatch-software', label: 'Dispatch software' },
              { value: 'work-order-system', label: 'Work order system' },
              { value: 'manual-process', label: 'Manual process' },
              { value: 'no-systematic-process', label: 'No systematic process' }
            ]
          },
          {
            id: 'readiness-visibility',
            type: 'yes_no',
            question: 'Do supervisors know readiness before assignment?',
            required: true
          },
          {
            id: 'work-order-documentation',
            type: 'yes_no',
            question: 'Are work orders, routes, or service tasks documented?',
            required: true
          },
          {
            id: 'incident-escalation',
            type: 'yes_no',
            question: 'How are exceptions or incidents escalated?',
            required: true
          }
        ]
      },
      {
        id: 'operator-compliance',
        title: 'Driver / Operator Compliance',
        description: 'Operator qualification and compliance',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'compliance-tracking',
            type: 'single_choice',
            question: 'How do you track licenses, certifications, medical requirements, training, and safety acknowledgments?',
            required: true,
            options: [
              { value: 'centralized-system', label: 'Centralized digital system' },
              { value: 'hr-system', label: 'HR system' },
              { value: 'paper-files', label: 'Paper files only' },
              { value: 'spreadsheets', label: 'Spreadsheets' },
              { value: 'no-systematic-tracking', label: 'No systematic tracking' }
            ]
          },
          {
            id: 'readiness-visibility',
            type: 'yes_no',
            question: 'Can supervisors quickly see who is ready, expired, or needs review?',
            required: true
          },
          {
            id: 'certification-tracking',
            type: 'yes_no',
            question: 'Do you track specialized certifications or endorsements?',
            required: true
          },
          {
            id: 'training-compliance',
            type: 'yes_no',
            question: 'Do you track mandatory training completion?',
            required: true
          }
        ]
      },
      {
        id: 'asset-accountability',
        title: 'Asset Accountability & Maintenance Records',
        description: 'Vehicle tracking and maintenance documentation',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'asset-tracking',
            type: 'yes_no',
            question: 'Can you track which vehicle was used, by whom, for what work, and when?',
            required: true
          },
          {
            id: 'maintenance-records',
            type: 'yes_no',
            question: 'Are maintenance records complete and easy to retrieve?',
            required: true
          },
          {
            id: 'downtime-tracking',
            type: 'yes_no',
            question: 'Do you track downtime, inspection status, and repair history?',
            required: true
          },
          {
            id: 'asset-utilization',
            type: 'yes_no',
            question: 'Do you track vehicle utilization by department or program?',
            required: true
          }
        ]
      },
      {
        id: 'records-retention',
        title: 'Records Retention & Audit Trails',
        description: 'Record keeping and audit preparation',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'audit-records',
            type: 'yes_no',
            question: 'Can you produce records for internal audit, public records requests, or grant/procurement review?',
            required: true
          },
          {
            id: 'retention-policies',
            type: 'yes_no',
            question: 'Are retention policies documented and followed?',
            required: true
          },
          {
            id: 'document-control',
            type: 'yes_no',
            question: 'Do documents have owners, status, review dates, and access controls?',
            required: true
          },
          {
            id: 'public-requests',
            type: 'scale_1_5',
            question: 'How often do you receive public records requests?',
            required: true
          }
        ]
      },
      {
        id: 'fuel-mileage',
        title: 'Fuel / Mileage / Regulatory Support',
        description: 'Fuel tracking and regulatory compliance',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'fuel-tracking',
            type: 'multiple_choice',
            question: 'Do you track mileage, fuel, receipts, asset assignments, and usage by department or program?',
            required: true,
            options: [
              { value: 'fuel-cards', label: 'Fuel card data' },
              { value: 'mileage-logs', label: 'Mileage logs' },
              { value: 'fuel-receipts', label: 'Fuel receipts' },
              { value: 'asset-assignments', label: 'Asset assignments' },
              { value: 'department-usage', label: 'Department usage' }
            ]
          },
          {
            id: 'record-reconciliation',
            type: 'yes_no',
            question: 'Can you reconcile fuel/mileage records for review?',
            required: true
          },
          {
            id: 'audit-support',
            type: 'yes_no',
            question: 'Do you need support for audit-ready fuel and asset records?',
            required: true
          },
          {
            id: 'regulatory-reporting',
            type: 'yes_no',
            question: 'Do you generate regulatory reports?',
            required: true
          }
        ]
      },
      {
        id: 'policy-governance',
        title: 'Policy / Governance Controls',
        description: 'Policy management and governance',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'policy-storage',
            type: 'single_choice',
            question: 'Where do you store vehicle-use policies, safety policies, procurement documentation, vendor records, insurance files, privacy/security policies, and AI/tool usage rules?',
            required: true,
            options: [
              { value: 'centralized-vault', label: 'Centralized document vault' },
              { value: 'intranet', label: 'Agency intranet' },
              { value: 'shared-drive', label: 'Shared network drive' },
              { value: 'paper-files', label: 'Paper files only' },
              { value: 'no-central-storage', label: 'No central storage' }
            ]
          },
          {
            id: 'acknowledgment-tracking',
            type: 'yes_no',
            question: 'Can you track acknowledgments and review dates?',
            required: true
          },
          {
            id: 'policy-ownership',
            type: 'yes_no',
            question: 'Do policies have clear ownership and review schedules?',
            required: true
          },
          {
            id: 'compliance-monitoring',
            type: 'yes_no',
            question: 'Do you monitor policy compliance?',
            required: true
          }
        ]
      },
      {
        id: 'budget-visibility',
        title: 'Budget / Cost Visibility',
        description: 'Cost tracking and budget management',
        estimatedQuestions: 4,
        required: true,
        questions: [
          {
            id: 'cost-tracking',
            type: 'yes_no',
            question: 'Do you need cost by department, vehicle, route, program, or grant?',
            required: true
          },
          {
            id: 'cost-identification',
            type: 'yes_no',
            question: 'Can you identify high-cost vehicles or operating patterns?',
            required: true
          },
          {
            id: 'budget-reporting',
            type: 'yes_no',
            question: 'Do you generate budget reports for leadership?',
            required: true
          },
          {
            id: 'cost-optimization',
            type: 'scale_1_5',
            question: 'How would you rate your cost optimization capabilities?',
            required: true
          }
        ]
      },
      // Optional advanced sections for Government Fleet
      {
        id: 'procurement-vendor',
        title: 'Procurement / Vendor Documentation',
        description: 'Procurement and vendor management',
        estimatedQuestions: 3,
        required: false,
        questions: [
          {
            id: 'procurement-records',
            type: 'yes_no',
            question: 'Do you maintain procurement documentation?',
            required: false
          },
          {
            id: 'vendor-management',
            type: 'yes_no',
            question: 'Do you track vendor performance and compliance?',
            required: false
          },
          {
            id: 'contract-management',
            type: 'yes_no',
            question: 'Do you manage contracts and agreements?',
            required: false
          }
        ]
      },
      {
        id: 'audit-support',
        title: 'Audit Support Deep Dive',
        description: 'Advanced audit capabilities',
        estimatedQuestions: 3,
        required: false,
        questions: [
          {
            id: 'external-audits',
            type: 'yes_no',
            question: 'Do you undergo external audits?',
            required: false
          },
          {
            id: 'audit-preparation',
            type: 'yes_no',
            question: 'Are you prepared for audits?',
            required: false
          },
          {
            id: 'audit-documentation',
            type: 'yes_no',
            question: 'Do you maintain comprehensive audit documentation?',
            required: false
          }
        ]
      },
      {
        id: 'internal-visibility',
        title: 'Internal Service Visibility',
        description: 'Internal service tracking and reporting',
        estimatedQuestions: 3,
        required: false,
        questions: [
          {
            id: 'service-tracking',
            type: 'yes_no',
            question: 'Do you track service completion metrics?',
            required: false
          },
          {
            id: 'performance-reporting',
            type: 'yes_no',
            question: 'Do you report service performance?',
            required: false
          },
          {
            id: 'internal-dashboard',
            type: 'yes_no',
            question: 'Do you have internal service dashboards?',
            required: false
          }
        ]
      }
    ]
  },
  // Track 4: BOF Vault / Driver Document Readiness Assessment
  {
    id: 'bof-vault',
    title: 'BOF Vault',
    description: 'For drivers, owner-operators, and fleets focused on document readiness. Assess CDL, medical card, MVR, I-9/W-9 separation, emergency contacts, owner-operator packets, templates, uploads, and policy acknowledgments.',
    ctaLabel: 'Start BOF Vault Assessment',
    route: '/assessment/bof-vault',
    scoreType: 'BOF Vault Document Readiness Score',
    recommendedModules: [
      'BOF Vault',
      'Driver Documents',
      'Owner-Operator Packets',
      'Company Operations Vault',
      'Driver Portal'
    ],
    sections: [
      {
        id: 'driver-profile',
        title: 'Driver / Fleet Profile',
        description: 'Basic information about your operation',
        estimatedQuestions: 3,
        required: true,
        questions: [
          {
            id: 'operation-type',
            type: 'single_choice',
            question: 'What type of operation are you?',
            required: true,
            options: [
              { value: 'individual-driver', label: 'Individual driver' },
              { value: 'owner-operator', label: 'Owner-operator' },
              { value: 'small-fleet', label: 'Small fleet (1-10 trucks)' },
              { value: 'fleet-admin', label: 'Fleet administrator' }
            ]
          },
          {
            id: 'driver-count',
            type: 'number',
            question: 'How many drivers do you manage (if applicable)?',
            required: false,
            min: 1,
            max: 50
          },
          {
            id: 'driver-types',
            type: 'multiple_choice',
            question: 'Do you manage company drivers, owner-operators, or both?',
            required: true,
            options: [
              { value: 'company-drivers', label: 'Company drivers' },
              { value: 'owner-operators', label: 'Owner-operators' },
              { value: 'mixed', label: 'Both company drivers and owner-operators' }
            ]
          }
        ]
      },
      {
        id: 'core-documents',
        title: 'Core Driver Documents',
        description: 'Essential driver qualification documents',
        estimatedQuestions: 3,
        required: true,
        questions: [
          {
            id: 'current-documents',
            type: 'yes_no',
            question: 'Do you have current CDL, medical card, and MVR records?',
            required: true
          },
          {
            id: 'expiration-tracking',
            type: 'yes_no',
            question: 'Are expiration dates tracked?',
            required: true
          },
          {
            id: 'document-storage',
            type: 'single_choice',
            question: 'Are documents stored in one place?',
            required: true,
            options: [
              { value: 'centralized-digital', label: 'Centralized digital storage' },
              { value: 'multiple-locations', label: 'Multiple digital locations' },
              { value: 'paper-files', label: 'Paper files only' },
              { value: 'no-systematic-storage', label: 'No systematic storage' }
            ]
          }
        ]
      },
      {
        id: 'employment-documents',
        title: 'Employment vs Owner-Operator Documents',
        description: 'Worker classification document separation',
        estimatedQuestions: 3,
        required: true,
        questions: [
          {
            id: 'document-separation',
            type: 'yes_no',
            question: 'Do you separate I-9/W-4 employee forms from W-9/contractor forms?',
            required: true
          },
          {
            id: 'owner-operator-documents',
            type: 'multiple_choice',
            question: 'Do owner-operators have which documents?',
            required: true,
            options: [
              { value: 'contractor-agreement', label: 'Contractor agreement' },
              { value: 'lease-agreement', label: 'Lease agreement' },
              { value: 'insurance-verification', label: 'Insurance verification' },
              { value: 'equipment-schedule', label: 'Equipment schedule' },
              { value: 'settlement-authorization', label: 'Settlement authorization' }
            ]
          },
          {
            id: 'classification-compliance',
            type: 'yes_no',
            question: 'Are you confident in your worker classification documentation?',
            required: true
          }
        ]
      },
      {
        id: 'emergency-contacts',
        title: 'Emergency Contacts & Profile Data',
        description: 'Driver contact and profile information',
        estimatedQuestions: 3,
        required: true,
        questions: [
          {
            id: 'emergency-contacts',
            type: 'yes_no',
            question: 'Do you have primary and secondary emergency contacts?',
            required: true
          },
          {
            id: 'profile-current',
            type: 'yes_no',
            question: 'Are driver addresses, phone numbers, and payment info current?',
            required: true
          },
          {
            id: 'data-protection',
            type: 'yes_no',
            question: 'Are sensitive fields masked where needed?',
            required: true
          }
        ]
      },
      {
        id: 'policy-acknowledgments',
        title: 'Policy Acknowledgments',
        description: 'Policy acknowledgment tracking',
        estimatedQuestions: 3,
        required: true,
        questions: [
          {
            id: 'acknowledgment-tracking',
            type: 'multiple_choice',
            question: 'Do drivers acknowledge which policies?',
            required: true,
            options: [
              { value: 'handbook', label: 'Employee handbook' },
              { value: 'safety', label: 'Safety policies' },
              { value: 'acceptable-use', label: 'Acceptable use policies' },
              { value: 'ai-tool-use', label: 'AI/tool usage policies' },
              { value: 'owner-operator', label: 'Owner-operator policies' }
            ]
          },
          {
            id: 'missing-acknowledgments',
            type: 'yes_no',
            question: 'Can you see who is missing acknowledgments?',
            required: true
          },
          {
            id: 'acknowledgment-reminders',
            type: 'yes_no',
            question: 'Do you send acknowledgment reminders?',
            required: true
          }
        ]
      },
      {
        id: 'templates-uploads',
        title: 'Templates / Autofill / Uploads',
        description: 'Document generation and upload workflows',
        estimatedQuestions: 3,
        required: true,
        questions: [
          {
            id: 'form-generation',
            type: 'yes_no',
            question: 'Do you need forms generated from driver profile data?',
            required: true
          },
          {
            id: 'upload-workflows',
            type: 'yes_no',
            question: 'Do you need upload review and autofill workflows?',
            required: true
          },
          {
            id: 'driver-vault',
            type: 'yes_no',
            question: 'Do you need a driver-controlled document vault?',
            required: true
          }
        ]
      },
      {
        id: 'readiness-score',
        title: 'Readiness Score',
        description: 'Document readiness assessment',
        estimatedQuestions: 3,
        required: true,
        questions: [
          {
            id: 'missing-documents',
            type: 'number',
            question: 'How many required documents are missing?',
            required: true,
            min: 0,
            max: 50
          },
          {
            id: 'expiring-documents',
            type: 'multiple_choice',
            question: 'How many documents expire in the next periods?',
            required: true,
            options: [
              { value: '30-days', label: 'Next 30 days' },
              { value: '60-days', label: 'Next 60 days' },
              { value: '90-days', label: 'Next 90 days' },
              { value: 'none', label: 'None expiring' }
            ]
          },
          {
            id: 'organization-needs',
            type: 'yes_no',
            question: 'Do you need BOF to organize and generate missing packets?',
            required: true
          }
        ]
      },
      // Optional sections for BOF Vault
      {
        id: 'dispatch-operations',
        title: 'Dispatch & Operations',
        description: 'Basic dispatch and operations',
        estimatedQuestions: 2,
        required: false,
        questions: [
          {
            id: 'dispatch-needs',
            type: 'yes_no',
            question: 'Do you need dispatch capabilities?',
            required: false
          },
          {
            id: 'load-tracking',
            type: 'yes_no',
            question: 'Do you need load tracking?',
            required: false
          }
        ]
      },
      {
        id: 'company-vault',
        title: 'Company Operations Vault / Policies',
        description: 'Company policy and document management',
        estimatedQuestions: 2,
        required: false,
        questions: [
          {
            id: 'policy-management',
            type: 'yes_no',
            question: 'Do you need company policy management?',
            required: false
          },
          {
            id: 'document-governance',
            type: 'yes_no',
            question: 'Do you need document governance?',
            required: false
          }
        ]
      }
    ]
  }
];

// Helper functions
export function getAssessmentTrack(trackId: string): AssessmentTrack | undefined {
  return ASSESSMENT_TRACKS.find(track => track.id === trackId);
}

export function getDefaultSectionsForTrack(trackId: string): Section[] {
  const track = getAssessmentTrack(trackId);
  return track?.sections.filter(section => section.required) || [];
}

export function getSelectedQuestions(trackId: string, selectedSectionIds: string[]): Question[] {
  const track = getAssessmentTrack(trackId);
  if (!track) return [];
  
  return track.sections
    .filter(section => selectedSectionIds.includes(section.id))
    .flatMap(section => section.questions);
}

export function calculateAssessmentScore(
  trackId: string, 
  answers: AssessmentAnswer[], 
  selectedSectionIds: string[]
): { score: number; scoreCategory: 'Strong' | 'Needs Attention' | 'High Risk' } {
  const questions = getSelectedQuestions(trackId, selectedSectionIds);
  if (questions.length === 0) return { score: 0, scoreCategory: 'High Risk' };
  
  let totalScore = 0;
  let answeredQuestions = 0;
  
  questions.forEach(question => {
    const answer = answers.find(a => a.questionId === question.id);
    if (answer !== undefined) {
      answeredQuestions++;
      
      // Simple scoring logic - can be enhanced
      if (question.type === 'yes_no') {
        totalScore += answer.value === true ? 100 : 50;
      } else if (question.type === 'scale_1_5') {
        const score = Number(answer.value);
        totalScore += (score / 5) * 100;
      } else if (question.type === 'single_choice' || question.type === 'multiple_choice') {
        // For demo purposes, assume most choices are good
        totalScore += 75;
      } else {
        // Text/number questions - assume neutral for demo
        totalScore += 70;
      }
    }
  });
  
  const averageScore = answeredQuestions > 0 ? totalScore / answeredQuestions : 0;
  
  let scoreCategory: 'Strong' | 'Needs Attention' | 'High Risk';
  if (averageScore >= 80) {
    scoreCategory = 'Strong';
  } else if (averageScore >= 60) {
    scoreCategory = 'Needs Attention';
  } else {
    scoreCategory = 'High Risk';
  }
  
  return { score: Math.round(averageScore), scoreCategory };
}

export function getSkippedSections(trackId: string, selectedSectionIds: string[]): Section[] {
  const track = getAssessmentTrack(trackId);
  if (!track) return [];
  
  return track.sections.filter(section => 
    !section.required && !selectedSectionIds.includes(section.id)
  );
}

export function getRecommendedModules(
  trackId: string
): string[] {
  const track = getAssessmentTrack(trackId);
  if (!track) return [];
  
  // For demo purposes, return base recommended modules
  // In real implementation, this would be based on answers
  return track.recommendedModules;
}

export function getRiskAreas(
  trackId: string
): string[] {
  // For demo purposes, return some sample risk areas
  // In real implementation, this would analyze actual answers
  const track = getAssessmentTrack(trackId);
  if (!track) return [];
  
  const riskAreas: string[] = [];
  
  // Sample risk area logic based on track
  if (trackId === 'for-hire-carriers') {
    riskAreas.push('Document Management', 'Cash Flow Visibility');
  } else if (trackId === 'private-fleets') {
    riskAreas.push('Cost Tracking', 'Maintenance Scheduling');
  } else if (trackId === 'government-fleets') {
    riskAreas.push('Record Retention', 'Audit Preparation');
  } else if (trackId === 'bof-vault') {
    riskAreas.push('Document Expiration', 'Missing Acknowledgments');
  }
  
  return riskAreas.slice(0, 3); // Return top 3 risk areas
}
