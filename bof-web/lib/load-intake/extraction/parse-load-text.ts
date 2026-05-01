import type { LoadIntakeRecord } from "@/lib/load-requirements-intake-types";

type Parsed = {
  fields: Partial<LoadIntakeRecord>;
  warnings: string[];
  fieldConfidence: Record<string, number>;
  confidence: number;
};

function pick(patterns: RegExp[], text: string): string | undefined {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

function assign(
  out: Partial<LoadIntakeRecord>,
  conf: Record<string, number>,
  key: keyof LoadIntakeRecord,
  value: string | undefined,
  confidence: number
) {
  if (!value) return;
  out[key] = value;
  conf[String(key)] = confidence;
}

export function parseLoadText(text: string): Parsed {
  const fields: Partial<LoadIntakeRecord> = {};
  const warnings: string[] = [];
  const fieldConfidence: Record<string, number> = {};
  const src = text.replace(/\r/g, "\n");

  assign(fields, fieldConfidence, "loadId", pick([/\bLoad(?:\s+Number|\s*#)?[:\s]+([A-Z0-9-]+)/i], src), 0.78);
  assign(fields, fieldConfidence, "poNumber", pick([/\bPO(?:\s+Number|\s*#)?[:\s]+([A-Z0-9-]+)/i], src), 0.82);
  assign(
    fields,
    fieldConfidence,
    "rateConfirmationNumber",
    pick([/\bRate\s*Confirmation(?:\s+Number|\s*#)?[:\s]+([A-Z0-9-]+)/i, /\bRC(?:\s*#)?[:\s]+([A-Z0-9-]+)/i], src),
    0.82
  );
  assign(fields, fieldConfidence, "bolNumber", pick([/\bBOL(?:\s+Number|\s*#)?[:\s]+([A-Z0-9-]+)/i], src), 0.82);

  assign(fields, fieldConfidence, "customerName", pick([/\bCustomer[:\s]+([^\n]+)/i, /\bBroker[:\s]+([^\n]+)/i], src), 0.7);
  assign(fields, fieldConfidence, "brokerName", pick([/\bBroker(?:age)?[:\s]+([^\n]+)/i], src), 0.72);
  assign(fields, fieldConfidence, "shipperName", pick([/\bShipper[:\s]+([^\n]+)/i], src), 0.75);
  assign(fields, fieldConfidence, "consigneeName", pick([/\bConsignee[:\s]+([^\n]+)/i], src), 0.75);

  assign(fields, fieldConfidence, "pickupFacilityName", pick([/\bPickup(?:\s+Facility)?[:\s]+([^\n]+)/i], src), 0.7);
  assign(fields, fieldConfidence, "deliveryFacilityName", pick([/\bDelivery(?:\s+Facility)?[:\s]+([^\n]+)/i], src), 0.7);
  assign(
    fields,
    fieldConfidence,
    "pickupAddress1",
    pick([/\bPickup Address[:\s]+([^\n]+)/i, /\bOrigin Address[:\s]+([^\n]+)/i], src),
    0.72
  );
  assign(
    fields,
    fieldConfidence,
    "deliveryAddress1",
    pick([/\bDelivery Address[:\s]+([^\n]+)/i, /\bDestination Address[:\s]+([^\n]+)/i], src),
    0.72
  );

  assign(fields, fieldConfidence, "pickupCity", pick([/\bPickup City[:\s]+([A-Za-z .'-]+)/i], src), 0.66);
  assign(fields, fieldConfidence, "pickupState", pick([/\bPickup State[:\s]+([A-Za-z]{2})/i], src), 0.66);
  assign(fields, fieldConfidence, "pickupZip", pick([/\bPickup ZIP[:\s]+(\d{5}(?:-\d{4})?)/i], src), 0.66);
  assign(fields, fieldConfidence, "deliveryCity", pick([/\bDelivery City[:\s]+([A-Za-z .'-]+)/i], src), 0.66);
  assign(fields, fieldConfidence, "deliveryState", pick([/\bDelivery State[:\s]+([A-Za-z]{2})/i], src), 0.66);
  assign(fields, fieldConfidence, "deliveryZip", pick([/\bDelivery ZIP[:\s]+(\d{5}(?:-\d{4})?)/i], src), 0.66);

  assign(
    fields,
    fieldConfidence,
    "pickupAppointmentDate",
    pick([/\bPickup Date[:\s]+([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})/i], src),
    0.72
  );
  assign(
    fields,
    fieldConfidence,
    "pickupAppointmentTime",
    pick([/\bPickup Time[:\s]+([0-9]{1,2}:[0-9]{2}(?:\s?[AP]M)?)/i], src),
    0.68
  );
  assign(
    fields,
    fieldConfidence,
    "deliveryAppointmentDate",
    pick([/\bDelivery Date[:\s]+([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})/i], src),
    0.72
  );
  assign(
    fields,
    fieldConfidence,
    "deliveryAppointmentTime",
    pick([/\bDelivery Time[:\s]+([0-9]{1,2}:[0-9]{2}(?:\s?[AP]M)?)/i], src),
    0.68
  );

  assign(fields, fieldConfidence, "commodity", pick([/\bCommodity[:\s]+([^\n]+)/i], src), 0.72);
  assign(fields, fieldConfidence, "weight", pick([/\bWeight[:\s]+([0-9,]+(?:\.\d+)?)/i], src), 0.74);
  assign(fields, fieldConfidence, "equipmentType", pick([/\bEquipment(?:\s+Type)?[:\s]+([^\n]+)/i], src), 0.72);
  assign(fields, fieldConfidence, "rate", pick([/\b(?:Rate|Linehaul|Total Rate)[:\s$]+([0-9,]+(?:\.\d+)?)/i], src), 0.78);
  assign(fields, fieldConfidence, "sealNumber", pick([/\bSeal(?:\s+Number|\s*#)?[:\s]+([A-Z0-9-]+)/i], src), 0.68);
  assign(fields, fieldConfidence, "lumperInstructions", pick([/\bLumper(?: Instructions)?[:\s]+([^\n]+)/i], src), 0.66);
  assign(fields, fieldConfidence, "detentionTerms", pick([/\bDetention(?: Terms)?[:\s]+([^\n]+)/i], src), 0.66);
  assign(fields, fieldConfidence, "cargoInsuranceMinimum", pick([/\bCargo Insurance(?: Minimum)?[:\s$]+([^\n]+)/i], src), 0.66);
  assign(fields, fieldConfidence, "specialInstructions", pick([/\bSpecial Instructions?[:\s]+([^\n]+)/i], src), 0.66);

  if (fields.sealNumber) {
    fields.sealRequired = true;
    fieldConfidence.sealRequired = 0.7;
  }
  if (fields.cargoInsuranceMinimum) {
    fields.insuranceRequired = true;
    fieldConfidence.insuranceRequired = 0.68;
  }

  const requiredKeys: Array<keyof LoadIntakeRecord> = [
    "customerName",
    "pickupFacilityName",
    "deliveryFacilityName",
    "commodity",
    "weight",
    "equipmentType",
    "rate",
  ];
  for (const key of requiredKeys) {
    if (!fields[key]) warnings.push(`Missing field: ${key}`);
  }
  const confidenceValues = Object.values(fieldConfidence);
  const confidence = confidenceValues.length
    ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
    : 0;

  return { fields, warnings, fieldConfidence, confidence };
}

