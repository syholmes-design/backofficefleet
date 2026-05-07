import type { BofData } from '@/lib/load-bof-data';

export interface PortalCard {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  icon?: string;
}

export interface DriverPortalProfile {
  driverId: string;
  name: string;
  workerType: 'Employee Driver' | 'Independent Contractor / Owner-Operator';
  readinessStatus: string;
  currentLoadId?: string;
  currentLoadStatus?: string;
  documentStatusSummary: string;
  settlementStatusSummary: string;
  pendingAcknowledgments: number;
}

export interface CustomerPortalProfile {
  customerId: string;
  customerName: string;
  activeLoads: number;
  deliveredThisWeek: number;
  documentsAvailable: number;
  exceptionsClaims: number;
  invoicesReady: number;
}

export interface PortalVisibility {
  role: 'manager' | 'driver' | 'customer';
  allowedSections: string[];
  restrictedSections: string[];
}

export const PORTAL_CARDS: PortalCard[] = [
  {
    id: 'manager',
    title: 'Manager Portal',
    description: 'Run dispatch, compliance, documents, payroll, settlements, finance, risk, and back-office operations from one command layer.',
    cta: 'Open Manager Portal',
    href: '/portals/manager',
    icon: 'shield-check'
  },
  {
    id: 'driver',
    title: 'Driver Portal',
    description: 'Give drivers and owner-operators one place to manage documents, assigned loads, proof uploads, settlements, and policy acknowledgments.',
    cta: 'Open Driver Portal',
    href: '/portals/driver',
    icon: 'user-check'
  },
  {
    id: 'customer',
    title: 'Customer Portal',
    description: 'Give customers, brokers, and shippers controlled visibility into load status, delivery proof, exceptions, claims, documents, and invoice readiness.',
    cta: 'Open Customer Portal',
    href: '/portals/customer',
    icon: 'eye-check'
  }
];

export const DEMO_DRIVER_PROFILES: DriverPortalProfile[] = [
  {
    driverId: 'DRV-006',
    name: 'Marcus Chen',
    workerType: 'Independent Contractor / Owner-Operator',
    readinessStatus: 'Ready',
    currentLoadId: 'L006',
    currentLoadStatus: 'In Transit',
    documentStatusSummary: 'All documents current',
    settlementStatusSummary: 'Last settlement: Oct 1-15, 2025',
    pendingAcknowledgments: 2
  },
  {
    driverId: 'DRV-009',
    name: 'Emma Brown',
    workerType: 'Employee Driver',
    readinessStatus: 'Ready',
    currentLoadId: 'L009',
    currentLoadStatus: 'Pre-Trip',
    documentStatusSummary: 'Medical card expiring soon',
    settlementStatusSummary: 'Last settlement: Oct 1-15, 2025',
    pendingAcknowledgments: 1
  },
  {
    driverId: 'DRV-002',
    name: 'Maria Lopez',
    workerType: 'Employee Driver',
    readinessStatus: 'Ready',
    currentLoadId: 'L002',
    currentLoadStatus: 'Available',
    documentStatusSummary: 'All documents current',
    settlementStatusSummary: 'Last settlement: Oct 1-15, 2025',
    pendingAcknowledgments: 1
  }
];

export const DEMO_CUSTOMER_PROFILE: CustomerPortalProfile = {
  customerId: 'CUST-001',
  customerName: 'Apex Foods',
  activeLoads: 4,
  deliveredThisWeek: 12,
  documentsAvailable: 8,
  exceptionsClaims: 1,
  invoicesReady: 3
};

export const PORTAL_VISIBILITY: Record<string, PortalVisibility> = {
  manager: {
    role: 'manager',
    allowedSections: [
      'command-center',
      'dashboard',
      'drivers',
      'dispatch',
      'loads',
      'documents',
      'company-operations-vault',
      'settlements',
      'safety',
      'fleet-financials'
    ],
    restrictedSections: []
  },
  driver: {
    role: 'driver',
    allowedSections: [
      'my-documents',
      'my-loads',
      'proof-upload',
      'my-settlements',
      'policy-acknowledgments',
      'owner-operator-packet'
    ],
    restrictedSections: [
      'payroll',
      'hr-admin',
      'compliance-admin',
      'fleet-financials',
      'company-operations-vault'
    ]
  },
  customer: {
    role: 'customer',
    allowedSections: [
      'active-shipments',
      'delivery-proof',
      'exceptions-claims',
      'invoice-status'
    ],
    restrictedSections: [
      'driver-hr',
      'driver-payroll',
      'internal-compliance',
      'dispatch-operations',
      'settlements',
      'company-documents'
    ]
  }
};

export function getPortalCards(): PortalCard[] {
  return PORTAL_CARDS;
}

export function getDriverPortalProfiles(): DriverPortalProfile[] {
  return DEMO_DRIVER_PROFILES;
}

export function getDriverPortalProfile(driverId: string): DriverPortalProfile | undefined {
  return DEMO_DRIVER_PROFILES.find(profile => profile.driverId === driverId);
}

export function getCustomerPortalProfile(): CustomerPortalProfile {
  return DEMO_CUSTOMER_PROFILE;
}

export function getPortalVisibility(role: string): PortalVisibility | undefined {
  return PORTAL_VISIBILITY[role];
}

export function getManagerInsights(data: BofData) {
  const criticalAlerts = data.loads.filter(load => 
    load.status === 'Emergency' || load.status === 'Critical'
  ).length;
  
  const blockedDispatchItems = data.loads.filter(load => 
    load.status === 'Blocked' || load.status === 'Pending Review'
  ).length;
  
  const expiringDocuments = data.documents.filter(doc => 
    doc.status === 'Expiring Soon' || doc.status === 'Expired'
  ).length;
  
  const settlementReviewItems = data.settlements.filter(settlement => 
    settlement.status === 'Pending Review' || settlement.status === 'Disputed'
  ).length;
  
  const openClaims = data.loads.filter(load => 
    load.dispatchExceptionFlag || load.sealStatus === 'Mismatch'
  ).length;
  
  const documentsNeedingAcknowledgment = data.documents.filter(doc => 
    (doc.type === 'I-9' || doc.type === 'W-9') && doc.status !== 'Acknowledged'
  ).length;

  return {
    criticalAlerts,
    blockedDispatchItems,
    expiringDocuments,
    settlementReviewItems,
    openClaims,
    documentsNeedingAcknowledgment
  };
}

export function getCustomerVisibleLoads(data: BofData) {
  return data.loads.map(load => ({
    loadId: load.id,
    pickup: load.origin,
    delivery: load.destination,
    status: load.status,
    eta: 'N/A', // Not available in current data structure
    deliveredDate: load.status === 'Delivered' ? 'Delivered' : 'N/A',
    carrierStatus: 'BOF Fleet',
    proofStatus: load.podStatus,
    invoiceStatus: 'Ready' // Demo status
  }));
}
