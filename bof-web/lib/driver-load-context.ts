import { getBofData } from './load-bof-data';
import { buildLoadPacketRegistry, type LoadPacketItem } from './load-artifact-registry';

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

  const canonicalActiveLoadIds: Record<string, string> = {
    "DRV-008": "L008",
    "DRV-009": "L009",
  };

  // Find active load. Canonical exception loads can remain driver-facing after delivery
  // when BOF is still managing claim review or pre-trip release work.
  const canonicalActiveLoad = canonicalActiveLoadIds[driverId]
    ? sortedLoads.find(load => load.id === canonicalActiveLoadIds[driverId])
    : undefined;
  const activeLoad = sortedLoads.find(load => load.status !== 'Delivered') ?? canonicalActiveLoad;
  
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

function proofStatus(item?: LoadPacketItem): LoadProofItem["status"] {
  if (!item || item.status === "missing") return "required_missing";
  if (item.status === "not_applicable") return "not_required";
  if (item.status === "ready") return "available";
  return "required_if_applicable";
}

function proofItem(
  registry: NonNullable<ReturnType<typeof buildLoadPacketRegistry>>,
  key: string,
  type: string,
  fallbackReason: string
): LoadProofItem {
  const item = registry.packetItemsByKey[key];
  const status = proofStatus(item);
  return {
    type,
    status,
    fileUrl: item?.canonicalUrl ?? (item?.status === "ready" ? item.actionUrl : undefined),
    reason: item?.description ?? item?.sourceLabel ?? fallbackReason,
    canOpen: Boolean(item?.actionUrl && status === "available"),
  };
}

export function getLoadProofItems(loadId: string): LoadProofItem[] {
  const data = getBofData();
  const load = data.loads.find(l => l.id === loadId);
  
  if (!load) {
    return [];
  }

  const registry = buildLoadPacketRegistry(data, loadId);
  if (!registry) return [];

  if (loadId === "L009") {
    return [
      proofItem(registry, "work_order", "Pre-trip work order", "Maintenance work order required before dispatch release."),
      proofItem(registry, "rate_confirmation", "Rate confirmation", "Rate confirmation must be reviewed before trip release."),
      proofItem(registry, "bol", "Bill of Lading (BOL)", "BOL required for load release and pickup."),
      proofItem(registry, "cargo_photo", "Pre-trip cargo photo", "Pre-trip cargo condition photo required before dispatch."),
      proofItem(registry, "seal_pickup_photo", "Pickup seal proof", "Pickup seal photo required before dispatch."),
      proofItem(registry, "rfid_geo", "RFID / yard proof", "RFID yard proof required to clear the pre-trip exception."),
    ];
  }

  if (loadId === "L008") {
    return [
      proofItem(registry, "bol", "Bill of Lading (BOL)", "BOL required for claim review."),
      proofItem(registry, "pod", "Signed BOL / POD", "POD required for delivered loads."),
      proofItem(registry, "cargo_photo", "Cargo condition photo", "Cargo condition photo required for the claim file."),
      proofItem(registry, "delivery_empty_trailer", "Delivery / Empty Trailer Proof", "Delivery photo required for load completion."),
      proofItem(registry, "seal_delivery_photo", "Delivery seal proof", "Delivery seal proof required for claim review."),
      proofItem(registry, "damage_photo_packet", "Damage / claim evidence", "Damage photos required for the open claim review."),
      proofItem(registry, "claim_packet", "Claim packet", "Claim packet required for safety and cargo-damage escalation."),
    ];
  }

  return [
    proofItem(registry, "bol", "Bill of Lading (BOL)", "BOL required for load completion."),
    proofItem(registry, "pod", "Signed BOL / POD", "POD required for delivered loads."),
    proofItem(registry, "delivery_empty_trailer", "Delivery / Empty Trailer Proof", "Delivery photo required for load completion."),
    proofItem(registry, "seal_delivery_photo", "Delivery Seal Photo", "Seal photo required for sealed loads."),
    proofItem(registry, "cargo_photo", "Cargo Photo", "Cargo condition photo required for load proof."),
    proofItem(registry, "lumper_receipt", "QR Lumper Closeout", "QR dock authorization, empty-trailer proof, and payment support required when lumper services are used."),
    proofItem(registry, "damage_photo_packet", "Damage / Claim Photos", "Damage photos required when damage is reported."),
  ];
}
