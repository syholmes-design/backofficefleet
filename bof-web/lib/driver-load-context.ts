import { getBofData } from './load-bof-data';

function checkFileExists(fileUrl: string): boolean {
  // For client-side, use document registry to check if file exists
  // This prevents fs/path usage in client code
  const data = getBofData();
  return data.documents.some(doc => doc.fileUrl === fileUrl);
}

export interface LoadContext {
  loadId: string;
  route: string;
  customer: string;
  status: string;
  pickupDate?: string;
  deliveryDate?: string;
  equipment?: string;
  proofStatus: string;
  settlementStatus: string;
  dispatchLink: string;
}

export interface DriverLoadContext {
  activeLoad?: LoadContext;
  recentLoads: LoadContext[];
  hasActiveLoad: boolean;
}

export function getDriverLoadContext(driverId: string): DriverLoadContext {
  const data = getBofData();
  const driverLoads = data.loads.filter(load => load.driverId === driverId);
  
  // Sort by date (most recent first)
  const sortedLoads = driverLoads.sort((a, b) => {
    const dateA = new Date(a.pickupAt || '');
    const dateB = new Date(b.pickupAt || '');
    return dateB.getTime() - dateA.getTime();
  });

  // Find active load (not delivered)
  const activeLoad = sortedLoads.find(load => load.status !== 'Delivered');
  
  // Get recent loads (last 2-3)
  const recentLoads = sortedLoads.slice(0, 3).map(load => ({
    loadId: load.id,
    route: `${load.origin} -> ${load.destination}`,
    customer: load.customerName || 'Customer',
    status: load.status,
    pickupDate: load.pickupAt,
    deliveryDate: load.deliveryAt,
    equipment: load.assetId,
    proofStatus: load.podStatus || 'pending',
    settlementStatus: load.settlementStatus || 'pending',
    dispatchLink: getDispatchLink(load.id)
  }));

  return {
    activeLoad: recentLoads.find(load => load.loadId === activeLoad?.id),
    recentLoads,
    hasActiveLoad: !!activeLoad
  };
}

function getDispatchLink(loadId: string): string {
  // Try different possible routes - check what actually exists
  const possibleRoutes = [
    `/loads/${loadId}`,
    `/dispatch?load=${loadId}`,
    `/dispatch`,
    `/loads`
  ];
  
  // For now, return the most specific route
  return possibleRoutes[0];
}

export interface LoadProofItem {
  type: string;
  status: 'available' | 'required_missing' | 'not_required' | 'required_if_applicable';
  fileUrl?: string;
  reason: string;
  canOpen: boolean;
}

export function getLoadProofItems(loadId: string): LoadProofItem[] {
  const data = getBofData();
  const load = data.loads.find(l => l.id === loadId);
  
  if (!load) {
    return [];
  }

  const proofItems: LoadProofItem[] = [];

  // BOL - Check actual file existence based on audit
  const bolUrl = `/generated/loads/${loadId}/bol.html`;
  const bolExists = checkFileExists(bolUrl);
  proofItems.push({
    type: 'Bill of Lading (BOL)',
    status: bolExists ? 'available' : 'required_missing',
    fileUrl: bolExists ? bolUrl : undefined,
    reason: bolExists ? 'Proof document exists and accessible' : 'Proof document required for load completion but file missing',
    canOpen: bolExists
  });

  // Signed BOL / POD - Check actual file existence based on audit
  const podUrl = `/generated/loads/${loadId}/pod.html`;
  const podExists = checkFileExists(podUrl);
  proofItems.push({
    type: 'Signed BOL / POD',
    status: podExists ? 'available' : 'required_missing',
    fileUrl: podExists ? podUrl : undefined,
    reason: podExists ? 'Proof document exists and accessible' : 'Proof document required for load completion but file missing',
    canOpen: podExists
  });

  // Delivery Photo
  proofItems.push({
    type: 'Delivery Photo',
    status: 'required_missing', // Always required for proof
    fileUrl: undefined, // Would check actual file existence
    reason: 'Delivery photo required for load completion',
    canOpen: false
  });

  // Seal Photo (conditional)
  const requiresSeal = Boolean(load.sealNumber);
  proofItems.push({
    type: 'Seal Photo',
    status: requiresSeal ? 'required_missing' : 'not_required',
    fileUrl: requiresSeal ? undefined : undefined,
    reason: requiresSeal ? 'Seal photo required for sealed loads' : 'Seal photo not required for this load',
    canOpen: false
  });

  // Cargo Photo (conditional)
  const requiresCargoPhoto = true;
  proofItems.push({
    type: 'Cargo Photo',
    status: requiresCargoPhoto ? 'required_missing' : 'not_required',
    fileUrl: requiresCargoPhoto ? undefined : undefined,
    reason: requiresCargoPhoto ? 'Cargo photo required for this load type' : 'Cargo photo not required for this load',
    canOpen: false
  });

  // Lumper Receipt (conditional)
  const hasLumper = Number(load.lumperAmount ?? 0) > 0;
  proofItems.push({
    type: 'Lumper Receipt',
    status: hasLumper ? 'required_missing' : 'not_required',
    fileUrl: hasLumper ? undefined : undefined,
    reason: hasLumper ? 'Lumper receipt required when lumper services used' : 'Lumper receipt not required (no lumper used)',
    canOpen: false
  });

  // Damage/Claim Photos (conditional)
  const hasDamage = String(load.claimStatus ?? "").toLowerCase() !== "none";
  proofItems.push({
    type: 'Damage/Claim Photos',
    status: hasDamage ? 'required_missing' : 'not_required',
    fileUrl: hasDamage ? undefined : undefined,
    reason: hasDamage ? 'Damage photos required when damage reported' : 'Damage photos not required (no damage reported)',
    canOpen: false
  });

  return proofItems;
}
