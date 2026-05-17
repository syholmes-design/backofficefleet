import type { LoadV2 } from "@/lib/dispatch-v2-demo-data";
import type { PreTripChecklistState } from "@/components/dispatch-v2/types";

export interface DriverCommunicationPayload {
  loadId: string;
  driverId: string;
  driverName: string;
  timestamp: string;
  pickupAddress: string;
  appointmentTime: string;
  sealRequirements: string;
  ppeRequirements: string;
  specialInstructions: string;
  trackingLink: string;
  checklistState: PreTripChecklistState;
  dispatcherNotes: string;
}

export function sendPreTripInstructions(
  loadId: string, 
  driverId: string, 
  checklistState: PreTripChecklistState
): DriverCommunicationPayload {
  // Find the load in demo data (in real implementation, this would come from the calling component)
  const loads: LoadV2[] = [
    {
      id: "L-501", driver: "John Carter", driverId: "DRV-001", customer: "Peachtree Foods",
      consignee: "Dallas Distribution Center", origin: "Cleveland, OH", destination: "Dallas, TX",
      originFull: "1234 Industrial Blvd, Cleveland, OH 44115", destFull: "5678 Logistics Way, Dallas, TX 75201",
      commodity: "Frozen Foods", weight: "26,024 lbs", pallets: 19, pieces: 456, miles: 240,
      revenue: 2065, driverPay: 560, status: "DELIVERED", pickupDate: "Jul 1, 2026", deliveryDate: "Jul 2, 2026",
      pickupWindow: "08:00 - 10:00", deliveryWindow: "14:00 - 16:00", truck: "T-102", trailer: "TRL-2854",
      dispatcher: "Tina Brooks", broker: "BlueLine Logistics", brokerMC: "MC-782104", bol: "BOL-501-9935",
      rc: "RC-501-204", po: "PO-84000", sealPickup: "SEAL-83921", sealDelivery: "SEAL-83920",
      sealStatus: "MISMATCH", proofStatus: "COMPLETE", podStatus: "RECEIVED", linehaul: 1640,
      fuel: 240, detention: 0, accessorial: 120, lumper: 315, settlementHold: "NO",
      pickupAddr: "1234 Industrial Blvd, Cleveland, OH 44115", deliveryAddr: "5678 Logistics Way, Dallas, TX 75201"
    }
  ];

  const load = loads.find(l => l.id === loadId);
  
  if (!load) {
    throw new Error(`Load ${loadId} not found`);
  }

  const payload: DriverCommunicationPayload = {
    loadId: load.id,
    driverId: load.driverId,
    driverName: load.driver,
    timestamp: new Date().toISOString(),
    pickupAddress: load.pickupAddr || "See dispatch packet",
    appointmentTime: `${load.pickupDate} (${load.pickupWindow})`,
    sealRequirements: load.sealPickup || "See dispatch packet",
    ppeRequirements: checklistState.ppeConfirmed ? "PPE Confirmed" : "PPE Required",
    specialInstructions: load.commodity === "Frozen Foods" ? "Maintain temperature control" : "Standard freight procedures",
    trackingLink: checklistState.trackingActivated ? "MacroPoint tracking activated" : "Tracking pending",
    checklistState,
    dispatcherNotes: `Pre-trip compliance verified. All ${Object.values(checklistState).filter(Boolean).length}/8 requirements completed.`
  };

  // Demo-safe behavior: log to console and return payload
  console.info('🚛 DRIVER COMMUNICATION PAYLOAD:', payload);
  
  // In a real implementation, this would send SMS, email, or push notification
  // For demo purposes, we just log and return the structured payload
  
  return payload;
}
