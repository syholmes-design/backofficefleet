import type { BofData } from "@/lib/load-bof-data";
import type {
  ComplianceRequirement,
  Facility,
  LoadRequirement,
} from "@/lib/load-requirements-intake-types";

type FacilityAddressBookEntry = {
  address: string;
  zip: string;
  facilityRules: string;
};

const FACILITY_ADDRESS_BOOK: Record<string, FacilityAddressBookEntry> = {
  "acme distribution": {
    address: "4100 Industrial Pkwy",
    zip: "44115",
    facilityRules: "Check in at dispatch window. Dock assignment via gate tablet.",
  },
  "blueline retail": {
    address: "982 Commerce Blvd",
    zip: "46241",
    facilityRules: "Retail inbound audit at arrival. SKU count validation required.",
  },
  "cleveland receiver": {
    address: "1881 Lakeshore Way",
    zip: "38118",
    facilityRules: "Receiver live unload. Detention authorization required after 2 hours.",
  },
  "delta retail dc": {
    address: "744 Southport Dr",
    zip: "30336",
    facilityRules: "Appointments are tight; late arrivals must call gate ops.",
  },
  "lakeside grocery": {
    address: "2210 Westgate Loop",
    zip: "75212",
    facilityRules: "Food-grade PPE at dock. Seal check prior to unload.",
  },
  "metro fulfillment": {
    address: "3375 Fulton Market Rd",
    zip: "60609",
    facilityRules: "Photo proof required for damaged pallets before unload.",
  },
  "midwest foods": {
    address: "875 Supply Chain Ln",
    zip: "37210",
    facilityRules: "Temperature logs required at check-in for reefer loads.",
  },
  "northstar paper": {
    address: "1600 Mill Works Ct",
    zip: "60632",
    facilityRules: "Bind and secure palletized paper rolls before departure.",
  },
  "prime consumer": {
    address: "3020 River Logistics Dr",
    zip: "30318",
    facilityRules: "Carrier must provide POD with receiver printed name.",
  },
  "rapid parts": {
    address: "522 Foundry St",
    zip: "46225",
    facilityRules: "Piece-count reconciliation is mandatory for all line items.",
  },
  "south hub dc": {
    address: "640 Distribution Ave",
    zip: "38116",
    facilityRules: "Night gate processing enabled. Use kiosk lane 2.",
  },
  "union crossdock": {
    address: "95 Crossdock Center Dr",
    zip: "44113",
    facilityRules: "Crossdock transfer only. No overnight trailer storage.",
  },
};

export type FacilityMatch = {
  key: string;
  facilityName: string;
  city: string;
  state: string;
  address?: string;
  zip?: string;
  facilityRules?: string;
  appointmentRequired: boolean;
  shipperName?: string;
};

export type RouteMemory = {
  key: string;
  label: string;
  originFacilityName: string;
  destinationFacilityName: string;
  defaultLoadPatch: Partial<LoadRequirement>;
  defaultCompliancePatch: Partial<ComplianceRequirement>;
};

export type LoadIntakeIntelligence = {
  facilities: FacilityMatch[];
  /** Destination endpoints seen in demo load history (for delivery autocomplete). */
  destinationFacilities: FacilityMatch[];
  routeMemories: RouteMemory[];
};

function normalizeKey(v: string): string {
  return v.trim().toLowerCase();
}

function parseFacilityLane(raw: string): { facilityName: string; city: string; state: string } | null {
  if (!raw) return null;
  const parts = raw.split(" - ");
  if (parts.length < 2) return null;
  const facilityName = parts[0].trim();
  const cityState = parts[1].split(",").map((x) => x.trim());
  if (cityState.length < 2) return null;
  return {
    facilityName,
    city: cityState[0],
    state: cityState[1].slice(0, 2).toUpperCase(),
  };
}

function summarizeInsurance(patch: Partial<ComplianceRequirement>): string {
  return [
    patch.insuranceRequirementType,
    patch.certificateRequired ? "COI required" : "COI not required",
    patch.additionalInsuredRequired ? "Additional insured required" : null,
    patch.facilityEndorsementRequired ? "Facility endorsement required" : null,
    patch.cargoCoverageLevel ? `Coverage ${patch.cargoCoverageLevel}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function summarizeBol(patch: Partial<ComplianceRequirement>): string {
  return [
    patch.bolRequirementType,
    patch.signedBolRequired ? "Signed BOL required" : "Unsigned BOL accepted",
    patch.palletCountRequired ? "Pallet count required" : null,
    patch.pieceCountRequired ? "Piece count required" : null,
    patch.sealNotationRequired ? "Seal notation required" : null,
    patch.bolSpecialInstructions || null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function summarizePod(patch: Partial<ComplianceRequirement>): string {
  return [
    patch.podRequirementType,
    patch.signedPodRequired ? "Signed POD required" : "No signature required",
    patch.receiverPrintedNameRequired ? "Receiver printed name required" : null,
    patch.deliveryPhotoRequired ? "Delivery photo required" : null,
    patch.emptyTrailerPhotoRequired ? "Empty trailer photo required" : null,
    patch.sealVerificationRequired ? "Seal verification required" : null,
    patch.gpsTimestampRequired ? "GPS timestamp required" : null,
    patch.podSpecialInstructions || null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function routeDefaultsFromLoad(load: (BofData["loads"])[number]): RouteMemory["defaultCompliancePatch"] {
  const strict = Boolean(load.dispatchExceptionFlag) || String(load.sealStatus || "").toUpperCase() === "MISMATCH";
  const sealVerification = Boolean(load.pickupSeal || load.deliverySeal);
  const deliveryPhotoRequired = String(load.podStatus || "").toLowerCase() !== "verified";
  const insuranceRequirementType: ComplianceRequirement["insuranceRequirementType"] = strict
    ? "Enhanced COI + waiver"
    : "Standard COI";
  const podRequirementType: ComplianceRequirement["podRequirementType"] = strict
    ? "Strict POD + GPS/receiver validation"
    : "POD + photo evidence";

  const patch: Partial<ComplianceRequirement> = {
    insuranceRequirementType,
    cargoCoverageLevel: load.revenue >= 2500 ? "$500k" : "$250k",
    certificateRequired: true,
    additionalInsuredRequired: strict,
    facilityEndorsementRequired: strict,
    bolRequirementType: strict ? "Dual-signature BOL" : "Standard shipper BOL",
    signedBolRequired: true,
    palletCountRequired: true,
    pieceCountRequired: true,
    sealNotationRequired: sealVerification,
    bolSpecialInstructions: sealVerification
      ? "Record pickup and delivery seal IDs on BOL."
      : "Record BOL reference and receiver handling notes.",
    podRequirementType,
    signedPodRequired: true,
    receiverPrintedNameRequired: true,
    deliveryPhotoRequired,
    emptyTrailerPhotoRequired: false,
    sealVerificationRequired: sealVerification,
    gpsTimestampRequired: true,
    podSpecialInstructions: deliveryPhotoRequired
      ? "Capture dock and delivered condition photos at POD closeout."
      : "POD must include receiver sign-off and timestamp.",
  };
  patch.insurance_requirements = summarizeInsurance(patch);
  patch.bol_instructions = summarizeBol(patch);
  patch.pod_requirements = summarizePod(patch);
  return patch;
}

export function buildLoadIntakeIntelligence(data: BofData): LoadIntakeIntelligence {
  const facilitiesByKey = new Map<string, FacilityMatch>();
  const destinationsByKey = new Map<string, FacilityMatch>();
  const routes = new Map<string, RouteMemory>();

  for (const load of data.loads ?? []) {
    const origin = parseFacilityLane(load.origin || "");
    const destination = parseFacilityLane(load.destination || "");
    if (!origin || !destination) continue;

    const originKey = `${normalizeKey(origin.facilityName)}|${origin.city}|${origin.state}`;
    if (!facilitiesByKey.has(originKey)) {
      const book = FACILITY_ADDRESS_BOOK[normalizeKey(origin.facilityName)];
      facilitiesByKey.set(originKey, {
        key: originKey,
        facilityName: origin.facilityName,
        city: origin.city,
        state: origin.state,
        address: book?.address,
        zip: book?.zip,
        facilityRules: book?.facilityRules,
        appointmentRequired: true,
        shipperName: origin.facilityName,
      });
    }

    const destKey = `${normalizeKey(destination.facilityName)}|${destination.city}|${destination.state}`;
    if (!destinationsByKey.has(destKey)) {
      const destBook = FACILITY_ADDRESS_BOOK[normalizeKey(destination.facilityName)];
      destinationsByKey.set(destKey, {
        key: destKey,
        facilityName: destination.facilityName,
        city: destination.city,
        state: destination.state,
        address: destBook?.address,
        zip: destBook?.zip,
        facilityRules: destBook?.facilityRules,
        appointmentRequired: true,
        shipperName: destination.facilityName,
      });
    }

    const routeKey = `${originKey}=>${normalizeKey(destination.facilityName)}|${destination.city}|${destination.state}`;
    if (!routes.has(routeKey)) {
      const compliancePatch = routeDefaultsFromLoad(load);
      const destRow = destinationsByKey.get(destKey);
      routes.set(routeKey, {
        key: routeKey,
        label: `${origin.facilityName} (${origin.city}, ${origin.state}) → ${destination.facilityName} (${destination.city}, ${destination.state})`,
        originFacilityName: origin.facilityName,
        destinationFacilityName: destination.facilityName,
        defaultLoadPatch: {
          destination_facility_name: destination.facilityName,
          destination_address: destRow?.address ?? "",
          destination_city: destination.city,
          destination_state: destination.state,
          destination_zip: destRow?.zip ?? "",
          route_memory_key: routeKey,
        },
        defaultCompliancePatch: compliancePatch,
      });
    }
  }

  return {
    facilities: [...facilitiesByKey.values()].sort((a, b) =>
      a.facilityName.localeCompare(b.facilityName)
    ),
    destinationFacilities: [...destinationsByKey.values()].sort((a, b) =>
      a.facilityName.localeCompare(b.facilityName)
    ),
    routeMemories: [...routes.values()].sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export function findFacilityByName(
  facilities: FacilityMatch[],
  facilityName: string
): FacilityMatch | null {
  const q = normalizeKey(facilityName);
  if (!q) return null;
  return facilities.find((f) => normalizeKey(f.facilityName) === q) ?? null;
}

export function routesForOriginFacility(
  routeMemories: RouteMemory[],
  facilityName: string
): RouteMemory[] {
  const q = normalizeKey(facilityName);
  if (!q) return [];
  return routeMemories.filter((r) => normalizeKey(r.originFacilityName) === q);
}

export function applyFacilityMatch(base: Facility, match: FacilityMatch): Facility {
  return {
    ...base,
    facility_name: match.facilityName,
    address: match.address || base.address,
    city: match.city,
    state: match.state,
    zip: match.zip || base.zip,
    facility_rules: match.facilityRules || base.facility_rules,
    appointment_required: match.appointmentRequired,
  };
}

/** Substring match across BOF-known facility rows (demo + address book). */
export function searchBofLocationMatches(
  query: string,
  candidates: FacilityMatch[],
  limit = 8
): FacilityMatch[] {
  const q = normalizeKey(query);
  if (!q || q.length < 2) return [];
  return candidates
    .filter((c) => {
      const hay = [
        c.facilityName,
        c.city,
        c.state,
        c.address ?? "",
        c.zip ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .slice(0, limit);
}
