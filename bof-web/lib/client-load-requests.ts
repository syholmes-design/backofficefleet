import type { BofData } from "@/lib/load-bof-data";
import type { LoadIntakeRecord } from "@/lib/load-requirements-intake-types";

export type ClientLoadRequestStatus =
  | "submitted"
  | "needs_review"
  | "approved"
  | "converted_to_load"
  | "rejected";

export type ClientLoadRequest = {
  requestId: string;
  sourceType: "client_manual";
  submittedAt: string;
  status: ClientLoadRequestStatus;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  pickupFacilityName: string;
  pickupAddress1: string;
  pickupAddress2?: string;
  pickupCity: string;
  pickupState: string;
  pickupZip?: string;
  pickupDate: string;
  pickupTime?: string;
  pickupInstructions?: string;
  deliveryFacilityName: string;
  deliveryAddress1: string;
  deliveryAddress2?: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip?: string;
  deliveryDate: string;
  deliveryTime?: string;
  deliveryInstructions?: string;
  commodity: string;
  weight?: number;
  palletCount?: number;
  equipmentType: string;
  temperatureRequirement?: string;
  hazmatFlag?: boolean;
  highValueFlag?: boolean;
  specialHandlingInstructions?: string;
  poNumber?: string;
  bolNumber?: string;
  rateConfirmationNumber?: string;
  quotedRate?: number;
  paymentTerms?: string;
  sealRequired?: boolean;
  sealNumber?: string;
  cargoPhotoRequired?: boolean;
  insuranceRequired?: boolean;
  cargoInsuranceMinimum?: string;
  specialInsuranceNotes?: string;
  warnings: string[];
  missingRequiredFields: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  convertedLoadId?: string;
};

export function getClientLoadRequests(data: BofData): ClientLoadRequest[] {
  const extended = data as BofData & { clientLoadRequests?: ClientLoadRequest[] };
  return [...(extended.clientLoadRequests ?? [])];
}

export function setClientLoadRequests(data: BofData, requests: ClientLoadRequest[]): BofData {
  const extended = data as BofData & { clientLoadRequests?: ClientLoadRequest[] };
  extended.clientLoadRequests = requests;
  return extended;
}

export function validateClientLoadRequestDraft(
  request: Partial<ClientLoadRequest>
): { missingRequiredFields: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];
  const required: Array<keyof ClientLoadRequest> = [
    "companyName",
    "pickupAddress1",
    "pickupCity",
    "pickupState",
    "deliveryAddress1",
    "deliveryCity",
    "deliveryState",
    "pickupDate",
    "deliveryDate",
    "commodity",
    "equipmentType",
  ];
  for (const key of required) {
    if (!String(request[key] ?? "").trim()) missing.push(String(key));
  }
  if (!String(request.contactEmail || "").trim() && !String(request.contactPhone || "").trim()) {
    missing.push("contactEmailOrPhone");
  }
  if (!request.pickupTime) warnings.push("Missing pickup time");
  if (!request.deliveryTime) warnings.push("Missing delivery time");
  if (!(Number(request.weight) > 0)) warnings.push("Missing weight");
  if (!(Number(request.quotedRate) > 0)) warnings.push("Missing rate");
  if (request.sealRequired && !String(request.sealNumber || "").trim()) {
    warnings.push("Seal required but no seal number");
  }
  if (request.insuranceRequired && !String(request.cargoInsuranceMinimum || "").trim()) {
    warnings.push("Insurance required but no cargo insurance minimum");
  }
  if (request.pickupDate && request.deliveryDate) {
    const p = new Date(request.pickupDate).getTime();
    const d = new Date(request.deliveryDate).getTime();
    if (Number.isFinite(p) && Number.isFinite(d) && d < p) warnings.push("Delivery date before pickup date");
  }
  return { missingRequiredFields: missing, warnings };
}

export function clientRequestToIntakeRecord(request: ClientLoadRequest): Partial<LoadIntakeRecord> {
  return {
    sourceType: "client_manual",
    customerName: request.companyName,
    shipperName: request.companyName,
    pickupFacilityName: request.pickupFacilityName,
    pickupAddress1: request.pickupAddress1,
    pickupCity: request.pickupCity,
    pickupState: request.pickupState,
    pickupZip: request.pickupZip,
    pickupAppointmentDate: request.pickupDate,
    pickupAppointmentTime: request.pickupTime,
    deliveryFacilityName: request.deliveryFacilityName,
    deliveryAddress1: request.deliveryAddress1,
    deliveryCity: request.deliveryCity,
    deliveryState: request.deliveryState,
    deliveryZip: request.deliveryZip,
    deliveryAppointmentDate: request.deliveryDate,
    deliveryAppointmentTime: request.deliveryTime,
    commodity: request.commodity,
    weight: request.weight,
    equipmentType: request.equipmentType,
    rate: request.quotedRate,
    poNumber: request.poNumber,
    bolNumber: request.bolNumber,
    rateConfirmationNumber: request.rateConfirmationNumber,
    sealRequired: request.sealRequired,
    sealNumber: request.sealNumber,
    lumperInstructions: request.pickupInstructions,
    detentionTerms: request.paymentTerms,
    insuranceRequired: request.insuranceRequired,
    cargoInsuranceMinimum: request.cargoInsuranceMinimum,
    specialInstructions: request.specialHandlingInstructions || request.deliveryInstructions,
  };
}

