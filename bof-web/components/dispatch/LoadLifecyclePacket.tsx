"use client";

import { useMemo } from "react";
import { FileText, Package, Truck, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import type { Load } from "@/types/dispatch";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getCanonicalLoadEvidenceForLoad } from "@/lib/canonical-load-evidence";
import { LoadDocumentsLibraryEnhanced } from "./LoadDocumentsLibraryEnhanced";
import { DocumentationReadinessPanel } from "./DocumentationReadinessPanel";
import { RfidPodStatusCard } from "./RfidPodStatusCard";

type Props = {
  load: Load;
};

type LifecycleItem = {
  title: string;
  status: "ready" | "missing" | "not_required" | "conditional";
  audience: string[];
  action: string;
};

type LifecycleGroup = {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  audience: string[];
  items: LifecycleItem[];
};

function getLifecycleStage(load: Load): string {
  if (load.exception_flag) return "Exception Review";
  if (load.status === "Planned" || load.status === "Assigned" || load.status === "Dispatched") return "Pre-trip / Dispatch Release";
  if (load.status === "In Transit") return "In Route";
  if (load.status === "Delivered") {
    if (load.proof_status === "Complete") return "Settlement / Billing";
    return "Delivery / POD";
  }
  return "Dispatch review";
}

function getAudienceForDocumentType(docType: string): string[] {
  const audiences: Record<string, string[]> = {
    "rate_confirmation": ["Fleet owner", "Dispatcher", "Billing"],
    "bol": ["Driver", "Dispatcher", "Billing"],
    "pod": ["Dispatcher", "Billing", "Fleet owner"],
    "seal_pickup_photo": ["Dispatcher", "Driver"],
    "seal_delivery_photo": ["Dispatcher", "Driver"],
    "cargo_pickup_photo": ["Driver", "Dispatcher"],
    "rfid_geo_proof": ["Dispatcher", "Fleet owner"],
    "lumper_receipt": ["Billing", "Dispatcher"],
    "claim_photo": ["Claims", "Insurance"],
    "insurance_packet": ["Insurance", "Claims", "Fleet owner"]
  };
  return audiences[docType] || ["Dispatcher"];
}

function getActionForDocumentType(docType: string): string {
  const actions: Record<string, string> = {
    "rate_confirmation": "Open rate confirmation",
    "bol": "Open BOL",
    "pod": "Open POD",
    "seal_pickup_photo": "View seal pickup photo",
    "seal_delivery_photo": "View seal delivery photo",
    "cargo_pickup_photo": "View cargo photo",
    "rfid_geo_proof": "View RFID proof",
    "lumper_receipt": "View lumper receipt",
    "claim_photo": "Open claim packet",
    "insurance_packet": "Open insurance notification"
  };
  return actions[docType] || "Open document";
}

export function LoadLifecyclePacket({ load }: Props) {
  const { data } = useBofDemoData();
  const evidence = useMemo(() => getCanonicalLoadEvidenceForLoad(data, load.load_id), [data, load.load_id]);
  
  const lifecycleGroups: LifecycleGroup[] = useMemo(() => {
    const groups: LifecycleGroup[] = [];

    // 1. Pre-trip / Dispatch Release
    const preTripItems: LifecycleItem[] = [];
    
    // Rate Confirmation
    const rateConf = evidence.find(e => e.evidenceType === "rate_confirmation");
    preTripItems.push({
      title: "Rate Confirmation",
      status: rateConf?.status === "available" ? "ready" : "missing",
      audience: getAudienceForDocumentType("rate_confirmation"),
      action: getActionForDocumentType("rate_confirmation")
    });
    
    // Work Order (not in canonical evidence, conditional)
    preTripItems.push({
      title: "Work Order / Dispatch Sheet",
      status: "conditional",
      audience: ["Dispatcher", "Driver"],
      action: "Open work order"
    });
    
    // BOL
    const bol = evidence.find(e => e.evidenceType === "bol");
    preTripItems.push({
      title: "BOL / Pickup Paperwork",
      status: bol?.status === "available" ? "ready" : "missing",
      audience: getAudienceForDocumentType("bol"),
      action: getActionForDocumentType("bol")
    });
    
    // Seal pickup
    const sealPickup = evidence.find(e => e.evidenceType === "seal_pickup_photo");
    preTripItems.push({
      title: "Seal Pickup Photo",
      status: sealPickup?.status === "available" ? "ready" : "conditional",
      audience: getAudienceForDocumentType("seal_pickup_photo"),
      action: getActionForDocumentType("seal_pickup_photo")
    });

    groups.push({
      id: "pretrip",
      label: "Pre-trip / Dispatch Release",
      icon: <Package className="h-4 w-4" />,
      description: "Documents and proof required before dispatch",
      audience: ["Dispatcher", "Driver", "Billing"],
      items: preTripItems
    });

    // 2. In Route / Trip Control
    const inRouteItems: LifecycleItem[] = [];
    
    // RFID/Geo proof
    const rfid = evidence.find(e => e.evidenceType === "rfid_geo_proof");
    if (rfid) {
      inRouteItems.push({
        title: "RFID / Geo Proof",
        status: rfid.status === "available" ? "ready" : "conditional",
        audience: getAudienceForDocumentType("rfid_geo_proof"),
        action: getActionForDocumentType("rfid_geo_proof")
      });
    }
    
    // Cargo photos
    const cargoPhoto = evidence.find(e => e.evidenceType === "cargo_pickup_photo");
    if (cargoPhoto) {
      inRouteItems.push({
        title: "Cargo Condition Photo",
        status: cargoPhoto.status === "available" ? "ready" : "conditional",
        audience: getAudienceForDocumentType("cargo_pickup_photo"),
        action: getActionForDocumentType("cargo_pickup_photo")
      });
    }

    if (inRouteItems.length > 0) {
      groups.push({
        id: "inroute",
        label: "In Route / Trip Control",
        icon: <Truck className="h-4 w-4" />,
        description: "Tracking and proof during transit",
        audience: ["Dispatcher", "Fleet owner"],
        items: inRouteItems
      });
    }

    // 3. Delivery / POD Protocol
    const deliveryItems: LifecycleItem[] = [];
    
    // POD
    const pod = evidence.find(e => e.evidenceType === "pod");
    deliveryItems.push({
      title: "POD",
      status: pod?.status === "available" ? "ready" : 
             load.proof_status === "Complete" ? "ready" : "missing",
      audience: getAudienceForDocumentType("pod"),
      action: getActionForDocumentType("pod")
    });
    
    // Seal delivery
    const sealDelivery = evidence.find(e => e.evidenceType === "seal_delivery_photo");
    deliveryItems.push({
      title: "Seal Delivery Photo",
      status: sealDelivery?.status === "available" ? "ready" : 
             load.seal_status === "Match" ? "ready" : "missing",
      audience: getAudienceForDocumentType("seal_delivery_photo"),
      action: getActionForDocumentType("seal_delivery_photo")
    });
    
    // Empty trailer proof
    const emptyTrailer = evidence.find(e => e.evidenceType === "cargo_delivery_photo");
    if (emptyTrailer) {
      deliveryItems.push({
        title: "Empty Trailer Proof",
        status: emptyTrailer.status === "available" ? "ready" : "conditional",
        audience: ["Dispatcher", "Driver"],
        action: "View empty-trailer proof"
      });
    }
    
    // Lumper receipt
    const lumper = evidence.find(e => e.evidenceType === "lumper_receipt");
    if (lumper) {
      deliveryItems.push({
        title: "Lumper Receipt",
        status: lumper.status === "available" ? "ready" : "conditional",
        audience: getAudienceForDocumentType("lumper_receipt"),
        action: getActionForDocumentType("lumper_receipt")
      });
    }

    groups.push({
      id: "delivery",
      label: "Delivery / POD Protocol",
      icon: <CheckCircle className="h-4 w-4" />,
      description: "Proof of delivery and completion",
      audience: ["Dispatcher", "Billing", "Driver"],
      items: deliveryItems
    });

    // 4. Settlement / Billing / Factoring
    const settlementItems: LifecycleItem[] = [];
    
    // Invoice (conditional - not in canonical evidence)
    settlementItems.push({
      title: "Invoice",
      status: "conditional",
      audience: ["Billing", "Fleet owner"],
      action: "Open invoice"
    });
    
    // Insurance packet (conditional)
    const insurance = evidence.find(e => e.evidenceType === "insurance_packet");
    if (insurance) {
      settlementItems.push({
        title: "Insurance Notification",
        status: insurance.status === "available" ? "ready" : "conditional",
        audience: getAudienceForDocumentType("insurance_packet"),
        action: getActionForDocumentType("insurance_packet")
      });
    }

    groups.push({
      id: "settlement",
      label: "Settlement / Billing / Factoring",
      icon: <FileText className="h-4 w-4" />,
      description: "Financial documents for payment processing",
      audience: ["Billing", "Fleet owner", "Factoring"],
      items: settlementItems
    });

    // 5. Claims / Insurance / Legal (only if triggered)
    if (load.exception_flag || load.insurance_claim_needed) {
      const claimsItems: LifecycleItem[] = [];
      
      // Claim packet
      const claimPacket = evidence.find(e => e.evidenceType === "claim_photo");
      if (claimPacket) {
        claimsItems.push({
          title: "Claim Packet",
          status: claimPacket.status === "available" ? "ready" : "missing",
          audience: getAudienceForDocumentType("claim_photo"),
          action: getActionForDocumentType("claim_photo")
        });
      }
      
      // Insurance notification
      const insuranceClaim = evidence.find(e => e.evidenceType === "insurance_packet");
      if (insuranceClaim) {
        claimsItems.push({
          title: "Insurance Notification",
          status: insuranceClaim.status === "available" ? "ready" : "missing",
          audience: getAudienceForDocumentType("insurance_packet"),
          action: getActionForDocumentType("insurance_packet")
        });
      }

      if (claimsItems.length > 0) {
        groups.push({
          id: "claims",
          label: "Claims / Insurance / Legal",
          icon: <AlertTriangle className="h-4 w-4" />,
          description: "Exception handling and claim documentation",
          audience: ["Claims", "Insurance", "Legal"],
          items: claimsItems
        });
      }
    }

    return groups;
  }, [load, evidence]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "text-emerald-400 bg-emerald-950/40 border-emerald-700/50";
      case "missing": return "text-red-400 bg-red-950/40 border-red-700/50";
      case "conditional": return "text-amber-400 bg-amber-950/40 border-amber-700/50";
      case "not_required": return "text-slate-400 bg-slate-950/40 border-slate-700/50";
      default: return "text-slate-400 bg-slate-950/40 border-slate-700/50";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ready": return "Ready";
      case "missing": return "Missing required";
      case "conditional": return "Not required for this trip";
      case "not_required": return "Not required";
      default: return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Shield className="h-4 w-4 text-teal-500" />
          Shipment Lifecycle Packet
        </h3>
        <p className="mb-4 text-xs text-slate-400">
          Documents and proof organized by shipment lifecycle stage. Current stage: <span className="text-teal-400">{getLifecycleStage(load)}</span>
        </p>
        
        {lifecycleGroups.map((group) => (
          <div key={group.id} className="mb-6 last:mb-0">
            <div className="mb-3 flex items-center gap-2">
              {group.icon}
              <h4 className="text-sm font-semibold text-white">{group.label}</h4>
            </div>
            <p className="mb-3 text-xs text-slate-500">{group.description}</p>
            
            <div className="space-y-2">
              {group.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/40 p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{item.title}</span>
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.audience.map((audience, i) => (
                        <span key={i} className="inline-flex rounded px-1 py-0.5 text-[8px] font-medium bg-blue-950 text-blue-100">
                          {audience}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4">
                    <a
                      href={`/loads/${load.load_id}`}
                      className="text-xs font-medium text-teal-300 hover:text-teal-200"
                    >
                      {item.action}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Include existing components for comprehensive view */}
      <div className="space-y-4">
        <DocumentationReadinessPanel load={load} />
        <RfidPodStatusCard loadId={load.load_id} />
        <LoadDocumentsLibraryEnhanced load={load} />
      </div>
    </div>
  );
}
