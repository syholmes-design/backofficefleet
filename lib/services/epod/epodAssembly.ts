import type { DeliveryStage } from "@/lib/services/epod/deliveryLifecycle";
import type { DeliveryDisposition } from "@/lib/services/epod/recipientAcknowledgment";

export type EpodPhotoSlot = {
  role: "LOADED_TRAILER" | "EMPTY_TRAILER";
  evidenceId: string | null;
  capturedAt: string | null;
  missing: boolean;
};

export type EpodAcknowledgment = {
  evidenceId: string;
  name: string;
  title: string;
  facility: string;
  disposition: DeliveryDisposition;
  exceptions: string;
  refusalReason: string;
  statement: string;
  channel: "TABLET";
  authority: "SELF_DECLARED";
  receivedAt: string;
  actorId: string;
};

export type EpodView = {
  loadId: string;
  loadNumber: string;
  carrierName: string;
  driverName: string | null;
  truckNumber: string | null;
  trailerNumber: string | null;
  pickupFacility: string;
  deliveryFacility: string;
  pickupAuthorizationId: string | null;
  stage: DeliveryStage;
  operatorVerification: "UNVERIFIED" | "VERIFIED";
  settlementHold: boolean;
  loadedTrailer: EpodPhotoSlot;
  emptyTrailer: EpodPhotoSlot;
  acknowledgment: EpodAcknowledgment | null;
  gps: { connected: false; label: "GPS evidence not connected" };
  rfid: { connected: false; label: "RFID evidence not connected" };
  generatedEvidenceId: string | null;
  generatedAt: string | null;
  offlineSync: false;
};

export function assembleEpod(input: {
  loadId: string;
  loadNumber: string;
  carrierName: string;
  driverName: string | null;
  truckNumber: string | null;
  trailerNumber: string | null;
  pickupFacility: string;
  deliveryFacility: string;
  pickupAuthorizationId: string | null;
  stage: DeliveryStage;
  proofStatus: string | null;
  settlementStatus: string | null;
  loaded: { evidenceId: string; capturedAt: string } | null;
  empty: { evidenceId: string; capturedAt: string } | null;
  acknowledgment: EpodAcknowledgment | null;
  generatedEvidenceId: string | null;
  generatedAt: string | null;
}): EpodView {
  return {
    loadId: input.loadId,
    loadNumber: input.loadNumber,
    carrierName: input.carrierName || "Carrier name is not on the fleet record",
    driverName: input.driverName,
    truckNumber: input.truckNumber,
    trailerNumber: input.trailerNumber,
    pickupFacility: input.pickupFacility,
    deliveryFacility: input.deliveryFacility,
    pickupAuthorizationId: input.pickupAuthorizationId,
    stage: input.stage,
    operatorVerification: input.proofStatus === "VERIFIED" ? "VERIFIED" : "UNVERIFIED",
    settlementHold: input.settlementStatus === "HELD",
    loadedTrailer: input.loaded
      ? { role: "LOADED_TRAILER", evidenceId: input.loaded.evidenceId, capturedAt: input.loaded.capturedAt, missing: false }
      : { role: "LOADED_TRAILER", evidenceId: null, capturedAt: null, missing: true },
    emptyTrailer: input.empty
      ? { role: "EMPTY_TRAILER", evidenceId: input.empty.evidenceId, capturedAt: input.empty.capturedAt, missing: false }
      : { role: "EMPTY_TRAILER", evidenceId: null, capturedAt: null, missing: true },
    acknowledgment: input.acknowledgment,
    gps: { connected: false, label: "GPS evidence not connected" },
    rfid: { connected: false, label: "RFID evidence not connected" },
    generatedEvidenceId: input.generatedEvidenceId,
    generatedAt: input.generatedAt,
    offlineSync: false,
  };
}

export function assertEpodReady(view: EpodView) {
  const missing: string[] = [];
  if (view.loadedTrailer.missing) missing.push("loaded-trailer photograph");
  if (view.emptyTrailer.missing) missing.push("empty-trailer photograph");
  if (!view.acknowledgment) missing.push("recipient signature");
  if (!view.driverName) missing.push("assigned driver");
  if (!view.truckNumber) missing.push("assigned truck");
  if (missing.length > 0) {
    throw Object.assign(new Error(`Electronic POD is incomplete: ${missing.join(", ")}.`), { statusCode: 422 });
  }
  if (view.stage !== "ACCEPTED" && view.stage !== "ACCEPTED_WITH_EXCEPTIONS" && view.stage !== "REFUSED" && view.stage !== "POD_GENERATED") {
    throw Object.assign(new Error("Recipient acknowledgment is required before POD generation."), { statusCode: 409 });
  }
}
