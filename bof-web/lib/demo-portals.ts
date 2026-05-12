import type { BofData } from '@/lib/load-bof-data';
import { getBofData } from '@/lib/load-bof-data';
import { getDriverReadinessSummary } from '@/lib/driver-readiness-ui';
import { getDriverDocumentStatus } from '@/lib/driver-document-status';
import { getAcknowledgmentSummary } from '@/lib/driver-acknowledgment-status';

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

// Owner-operator driver IDs
const OWNER_OPERATOR_DRIVERS = ['DRV-006', 'DRV-010', 'DRV-012'];

// Generate driver portal profiles from canonical driver data
function generateDriverPortalProfiles(): DriverPortalProfile[] {
  const data = getBofData();
  const profiles: DriverPortalProfile[] = [];
  
  for (const driver of data.drivers) {
    // Determine worker type
    const workerType = OWNER_OPERATOR_DRIVERS.includes(driver.id) 
      ? 'Independent Contractor / Owner-Operator' 
      : 'Employee Driver';
    
    // Find current load assignment
    const currentLoad = data.loads.find(load => load.driverId === driver.id && load.status !== 'Delivered');
    
    // Find recent settlement
    const driverSettlements = data.settlements.filter(settlement => settlement.driverId === driver.id);
    const latestSettlement = driverSettlements.sort((a, b) => 
      new Date(b.settlementId).getTime() - new Date(a.settlementId).getTime()
    )[0];
    
    // Use canonical readiness calculation
    const readinessSummary = getDriverReadinessSummary(driver.id, data);
    const documentStatus = getDriverDocumentStatus(driver.id);
    const acknowledgmentSummary = getAcknowledgmentSummary(driver.id);
    
    // Calculate document status from canonical data
    const allDocuments = documentStatus.flatMap(group => group.documents);
    const expiringDocuments = allDocuments.filter(doc => 
      doc.status === 'expiring_soon' || doc.status === 'expired'
    );
    const missingDocuments = allDocuments.filter(doc => doc.status === 'missing');
    
    const documentStatusSummary = missingDocuments.length > 0 
      ? `${missingDocuments.length} document(s) missing`
      : expiringDocuments.length > 0 
        ? `${expiringDocuments.length} document(s) expiring soon`
        : 'All documents current';
    
    // Calculate pending acknowledgments from canonical data
    const pendingAcknowledgments = acknowledgmentSummary.pending;
    
    profiles.push({
      driverId: driver.id,
      name: driver.name,
      workerType,
      readinessStatus: readinessSummary.status === 'ready' ? 'Ready' : 'Needs Attention',
      currentLoadId: currentLoad?.id,
      currentLoadStatus: currentLoad?.status,
      documentStatusSummary,
      settlementStatusSummary: latestSettlement 
        ? `Last settlement: ${latestSettlement.settlementId}`
        : 'No settlements yet',
      pendingAcknowledgments
    });
  }
  
  return profiles.sort((a, b) => a.driverId.localeCompare(b.driverId));
}

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
  return generateDriverPortalProfiles();
}

export function getDriverPortalProfile(driverId: string): DriverPortalProfile | undefined {
  return generateDriverPortalProfiles().find((profile: DriverPortalProfile) => profile.driverId === driverId);
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

  // Cash flow and audit readiness metrics for Phase 7C
  const billingBlockers = data.loads.filter(load => 
    load.status === 'Delivered' && load.podStatus !== 'Complete'
  ).length;

  const auditReadinessScore = 85; // Demo score - would be calculated from actual data

  return {
    criticalAlerts,
    blockedDispatchItems,
    expiringDocuments,
    settlementReviewItems,
    openClaims,
    documentsNeedingAcknowledgment,
    billingBlockers,
    auditReadinessScore
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
